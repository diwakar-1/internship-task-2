import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, deleteDoc, onSnapshot, query, where } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import type { Auth, User } from "firebase/auth";

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface StudentProfile {
  name: string;
  role: string;
  avatarUrl: string;
  bio: string;
  email?: string;
  enrollmentYear?: string;
  semester?: string;
  department?: string;
  firebaseConfig?: FirebaseConfig | null;
}

export interface TimetableClass {
  id: string;
  name: string;
  professor: string;
  room: string;
  day: string; // Monday, Tuesday, etc.
  startTime: string; // "09:00"
  endTime: string; // "10:30"
  color: string; // Tailwind class background
  semester?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  dueDate: string; // YYYY-MM-DD
  priority: "high" | "medium" | "low";
  status: "todo" | "in-progress" | "completed";
  category: string;
  attachments?: Array<{ name: string; type: string; size: string; content?: string }>;
  submissions?: Array<{ name: string; type: string; size: string; content: string; submittedAt: string; studentName?: string; studentId?: string }>;
  semester?: string;
  isShared?: boolean;
}

export interface AttendanceRecord {
  courseId: string; // Course name
  presentCount: number;
  absentCount: number;
  excusedCount: number;
  cancelledCount: number;
  logs: Array<{
    id: string;
    date: string; // YYYY-MM-DD
    status: "present" | "absent" | "excused" | "cancelled";
    note?: string;
  }>;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  category: string;
  updatedAt: string;
  attachments?: Array<{ name: string; type: string; size: string; dataUrl?: string }>;
  semester?: string;
  isShared?: boolean;
}

export interface NoticeItem {
  id: string;
  title: string;
  description: string;
  date: string;
  type: "critical" | "warning" | "info";
  semester?: string;
  isShared?: boolean;
}

export interface StudentListItem {
  id: string;
  name: string;
  avatarUrl: string;
  semester?: string;
}

const DEFAULT_PROFILE: StudentProfile = {
  name: "",
  role: "",
  avatarUrl: "",
  bio: "",
  firebaseConfig: {
    apiKey: "AIzaSyCeBXeRm6xLofNDdUBMUBtwlkSvEuR3dIE",
    authDomain: "campussync-4a55d.firebaseapp.com",
    projectId: "campussync-4a55d",
    storageBucket: "campussync-4a55d.firebasestorage.app",
    messagingSenderId: "877739038979",
    appId: "1:877739038979:web:05e4e8e428fb7920053136"
  },
};

const DEFAULT_CLASSES: TimetableClass[] = [];

const DEFAULT_TASKS: TaskItem[] = [];

const DEFAULT_ATTENDANCE: AttendanceRecord[] = [];

const DEFAULT_NOTES: NoteItem[] = [];

const DEFAULT_NOTICES: NoticeItem[] = [];

const DEFAULT_STUDENT_LIST: StudentListItem[] = [];

class IndexedDBService {
  private dbName = "StudentMakerDB";
  private dbVersion = 1;
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;
    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === "undefined" || !window.indexedDB) {
        reject(new Error("IndexedDB is not supported in this environment"));
        return;
      }
      const request = indexedDB.open(this.dbName, this.dbVersion);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("large_files")) {
          db.createObjectStore("large_files");
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return this.dbPromise;
  }

  public async setItem(key: string, value: any): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction("large_files", "readwrite");
        const store = tx.objectStore("large_files");
        const request = store.put(value, key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.warn("Failed to write to IndexedDB:", e);
    }
  }

  public async getItem(key: string): Promise<any> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction("large_files", "readonly");
        const store = tx.objectStore("large_files");
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.warn("Failed to read from IndexedDB:", e);
      return null;
    }
  }

  public async removeItem(key: string): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction("large_files", "readwrite");
        const store = tx.objectStore("large_files");
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.warn("Failed to remove from IndexedDB:", e);
    }
  }
}

class StorageService {
  private db: any = null;
  private isFirebaseConnected = false;
  private userId = "student_default_user";
  private activeConfig: FirebaseConfig | null = null;
  private indexedDB = new IndexedDBService();
  private firebaseAuth: Auth | null = null;

  constructor() {
    this.initFirebase();
  }

  public setUserId(uid: string) {
    this.userId = uid;
  }

  public getUserId(): string {
    return this.userId;
  }

  public getAuth(): Auth | null {
    return this.firebaseAuth;
  }

  public initFirebase(): boolean {
    try {
      const config = DEFAULT_PROFILE.firebaseConfig;
      if (config && config.apiKey && config.projectId) {
        let app;
        if (getApps().length === 0) {
          app = initializeApp(config);
        } else {
          app = getApp();
        }
        this.db = getFirestore(app);
        this.firebaseAuth = getAuth(app);
        this.isFirebaseConnected = true;
        this.activeConfig = config;
        console.log("Firebase initialized successfully in backend mode!");
        return true;
      }
    } catch (e) {
      console.warn("Failed to initialize Firebase, falling back to LocalStorage:", e);
    }
    this.db = null;
    this.firebaseAuth = null;
    this.isFirebaseConnected = false;
    this.activeConfig = null;
    return false;
  }

  
  public getActiveConfig(): FirebaseConfig | null {
    return this.activeConfig;
  }

  public isUsingFirebase(): boolean {
    return this.isFirebaseConnected;
  }

  // Resolves IndexedDB refs for task attachments/submissions
  private async resolveTaskIndexedDBRefs(task: TaskItem): Promise<TaskItem> {
    const resolvedAttachments = task.attachments ? await Promise.all(task.attachments.map(async (attach) => {
      if (attach.content && attach.content.startsWith("indexeddb:")) {
        const fileKey = attach.content.replace("indexeddb:", "");
        try {
          const content = await this.indexedDB.getItem(fileKey);
          if (content) {
            return { ...attach, content };
          }
        } catch (err) {
          console.warn("Failed to load attachment from IndexedDB:", err);
        }
      }
      return attach;
    })) : undefined;

    const resolvedSubmissions = task.submissions ? await Promise.all(task.submissions.map(async (sub) => {
      if (sub.content && sub.content.startsWith("indexeddb:")) {
        const fileKey = sub.content.replace("indexeddb:", "");
        try {
          const content = await this.indexedDB.getItem(fileKey);
          if (content) {
            return { ...sub, content };
          }
        } catch (err) {
          console.warn("Failed to load submission from IndexedDB:", err);
        }
      }
      return sub;
    })) : undefined;

    return {
      ...task,
      ...(resolvedAttachments && { attachments: resolvedAttachments }),
      ...(resolvedSubmissions && { submissions: resolvedSubmissions })
    };
  }

  // Resolves IndexedDB refs for note attachments
  private async resolveNoteIndexedDBRefs(note: NoteItem): Promise<NoteItem> {
    if (note.attachments) {
      const resolvedAttachments = await Promise.all(note.attachments.map(async (attach) => {
        if (attach.dataUrl && attach.dataUrl.startsWith("indexeddb:")) {
          const fileKey = attach.dataUrl.replace("indexeddb:", "");
          try {
            const dataUrl = await this.indexedDB.getItem(fileKey);
            if (dataUrl) {
              return { ...attach, dataUrl };
            }
          } catch (err) {
            console.warn("Failed to load attachment from IndexedDB:", err);
          }
        }
        return attach;
      }));
      return { ...note, attachments: resolvedAttachments };
    }
    return note;
  }

  // Merges private task overrides with shared tasks
  private mergeTasks(privateTasks: TaskItem[], sharedTasks: TaskItem[]): TaskItem[] {
    const merged: TaskItem[] = [];
    sharedTasks.forEach(shared => {
      const override = privateTasks.find(p => p.id === shared.id);
      if (override) {
        merged.push({
          ...shared,
          status: override.status,
          submissions: override.submissions || [],
          isShared: true
        });
      } else {
        merged.push({
          ...shared,
          status: "todo",
          submissions: [],
          isShared: true
        });
      }
    });
    // Add private tasks that are not overrides
    privateTasks.forEach(p => {
      if (!sharedTasks.some(s => s.id === p.id)) {
        merged.push({ ...p, isShared: false });
      }
    });
    return merged;
  }

  // Merges private notes with shared notes
  private mergeNotes(privateNotes: NoteItem[], sharedNotes: NoteItem[]): NoteItem[] {
    const merged: NoteItem[] = [];
    sharedNotes.forEach(sn => {
      merged.push({ ...sn, isShared: true });
    });
    privateNotes.forEach(pn => {
      if (!sharedNotes.some(s => s.id === pn.id)) {
        merged.push({ ...pn, isShared: false });
      }
    });
    return merged;
  }

  // Listen to tasks in realtime
  public subscribeTasks(
    callback: (tasks: TaskItem[]) => void,
    semester?: string
  ): (() => void) | null {
    if (this.isFirebaseConnected && this.db) {
      let activeSemester = semester;
      let privateTasks: TaskItem[] = [];
      let sharedTasks: TaskItem[] = [];
      
      const triggerMerge = () => {
        const merged = this.mergeTasks(privateTasks, sharedTasks);
        callback(merged);
      };
      
      const unsubscribes: Array<() => void> = [];
      
      // 1. Subscribe to private tasks
      const privateColRef = collection(this.db, "users", this.userId, "tasks");
      const unsubPrivate = onSnapshot(privateColRef, async (querySnapshot) => {
        const tasks: TaskItem[] = [];
        querySnapshot.forEach((doc) => {
          tasks.push({ id: doc.id, ...doc.data() } as TaskItem);
        });
        privateTasks = await Promise.all(tasks.map(t => this.resolveTaskIndexedDBRefs(t)));
        triggerMerge();
      });
      unsubscribes.push(unsubPrivate);
      
      // 2. Subscribe to shared tasks
      const setupSharedSub = async () => {
        if (!activeSemester) {
          try {
            const profile = await this.getProfile();
            activeSemester = profile.semester || "";
          } catch (e) {
            console.warn("Failed to fetch profile for tasks sub:", e);
          }
        }
        
        if (activeSemester) {
          const sharedColRef = collection(this.db, "shared_tasks");
          const q = query(sharedColRef, where("semester", "==", activeSemester));
          const unsubShared = onSnapshot(q, async (querySnapshot) => {
            const tasks: TaskItem[] = [];
            querySnapshot.forEach((doc) => {
              tasks.push({ id: doc.id, ...doc.data() } as TaskItem);
            });
            sharedTasks = await Promise.all(tasks.map(t => this.resolveTaskIndexedDBRefs(t)));
            triggerMerge();
          });
          unsubscribes.push(unsubShared);
        }
      };
      
      setupSharedSub();
      
      return () => {
        unsubscribes.forEach((unsub) => unsub());
      };
    }
    
    // Fallback for LocalStorage
    this.getTasks(semester).then(callback);
    return null;
  }

  // Listen to classes in realtime
  public subscribeClasses(
    callback: (classes: TimetableClass[]) => void,
    semester?: string
  ): (() => void) | null {
    if (this.isFirebaseConnected && this.db) {
      const colRef = collection(this.db, "classes");
      
      const handleSnapshot = async (querySnapshot: any) => {
        let activeSemester = semester;
        if (!activeSemester) {
          try {
            const profile = await this.getProfile();
            activeSemester = profile.semester || "";
          } catch (e) {
            console.warn("Failed to fetch profile for classes sub:", e);
          }
        }
        
        const list: TimetableClass[] = [];
        querySnapshot.forEach((doc: any) => {
          const data = doc.data();
          if (!activeSemester || data.semester === activeSemester) {
            list.push({ id: doc.id, ...data } as TimetableClass);
          }
        });
        callback(list);
      };

      return onSnapshot(colRef, (querySnapshot) => {
        handleSnapshot(querySnapshot);
      });
    }
    
    this.getClasses(semester).then(callback);
    return null;
  }

  // Listen to notices in realtime
  public subscribeNotices(
    callback: (notices: NoticeItem[]) => void,
    semester?: string
  ): (() => void) | null {
    if (this.isFirebaseConnected && this.db) {
      const colRef = collection(this.db, "shared_notices");
      
      const handleSnapshot = async (querySnapshot: any) => {
        let activeSemester = semester;
        if (!activeSemester) {
          try {
            const profile = await this.getProfile();
            activeSemester = profile.semester || "";
          } catch (e) {
            console.warn("Failed to fetch profile for notices sub:", e);
          }
        }
        
        const list: NoticeItem[] = [];
        querySnapshot.forEach((doc: any) => {
          const data = doc.data();
          if (!activeSemester || data.semester === activeSemester) {
            list.push({ id: doc.id, ...data } as NoticeItem);
          }
        });
        callback(list);
      };

      return onSnapshot(colRef, (querySnapshot) => {
        handleSnapshot(querySnapshot);
      });
    }
    
    this.getNotices(semester).then(callback);
    return null;
  }

  // Listen to notes in realtime
  public subscribeNotes(
    callback: (notes: NoteItem[]) => void,
    semester?: string
  ): (() => void) | null {
    if (this.isFirebaseConnected && this.db) {
      let activeSemester = semester;
      let privateNotes: NoteItem[] = [];
      let sharedNotes: NoteItem[] = [];
      
      const triggerMerge = () => {
        const merged = this.mergeNotes(privateNotes, sharedNotes);
        callback(merged);
      };
      
      const unsubscribes: Array<() => void> = [];
      
      // 1. Subscribe to private notes
      const privateColRef = collection(this.db, "users", this.userId, "notes");
      const unsubPrivate = onSnapshot(privateColRef, async (querySnapshot) => {
        const notes: NoteItem[] = [];
        querySnapshot.forEach((doc) => {
          notes.push({ id: doc.id, ...doc.data() } as NoteItem);
        });
        privateNotes = await Promise.all(notes.map(n => this.resolveNoteIndexedDBRefs(n)));
        triggerMerge();
      });
      unsubscribes.push(unsubPrivate);
      
      // 2. Subscribe to shared notes
      const setupSharedSub = async () => {
        if (!activeSemester) {
          try {
            const profile = await this.getProfile();
            activeSemester = profile.semester || "";
          } catch (e) {
            console.warn("Failed to fetch profile for notes sub:", e);
          }
        }
        
        if (activeSemester) {
          const sharedColRef = collection(this.db, "shared_notes");
          const q = query(sharedColRef, where("semester", "==", activeSemester));
          const unsubShared = onSnapshot(q, async (querySnapshot) => {
            const notes: NoteItem[] = [];
            querySnapshot.forEach((doc) => {
              notes.push({ id: doc.id, ...doc.data() } as NoteItem);
            });
            sharedNotes = await Promise.all(notes.map(n => this.resolveNoteIndexedDBRefs(n)));
            triggerMerge();
          });
          unsubscribes.push(unsubShared);
        }
      };
      
      setupSharedSub();
      
      return () => {
        unsubscribes.forEach((unsub) => unsub());
      };
    }
    
    this.getNotes(semester).then(callback);
    return null;
  }

  // Listen to student list in realtime (Admin Dashboard)
  public subscribeStudentList(callback: (students: StudentListItem[]) => void): (() => void) | null {
    if (this.isFirebaseConnected && this.db) {
      const colRef = collection(this.db, "users");
      return onSnapshot(colRef, (querySnapshot) => {
        const list: StudentListItem[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            name: data.name || "Unknown Student",
            avatarUrl: data.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256",
            semester: data.semester || "",
          });
        });
        // Merge with default student list
        const mergedList = [...list];
        DEFAULT_STUDENT_LIST.forEach((defaultStudent) => {
          if (!mergedList.some((s) => s.id === defaultStudent.id)) {
            mergedList.push(defaultStudent);
          }
        });
        callback(mergedList);
      });
    }
    return null;
  }

  // Listen to attendance in realtime
  public subscribeAttendance(callback: (attendance: AttendanceRecord[]) => void): (() => void) | null {
    if (this.isFirebaseConnected && this.db) {
      const colRef = collection(this.db, "users", this.userId, "attendance");
      return onSnapshot(colRef, (querySnapshot) => {
        const list: AttendanceRecord[] = [];
        querySnapshot.forEach((doc) => {
          list.push({ courseId: doc.id, ...doc.data() } as AttendanceRecord);
        });
        callback(list);
      });
    }
    return null;
  }

  public subscribeAttendanceForUser(targetUserId: string, callback: (attendance: AttendanceRecord[]) => void): (() => void) | null {
    if (this.isFirebaseConnected && this.db) {
      const colRef = collection(this.db, "users", targetUserId, "attendance");
      return onSnapshot(colRef, (querySnapshot) => {
        const list: AttendanceRecord[] = [];
        querySnapshot.forEach((doc) => {
          list.push({ courseId: doc.id, ...doc.data() } as AttendanceRecord);
        });
        callback(list);
      });
    }
    return null;
  }

  // Get student profile
  public async getProfile(): Promise<StudentProfile> {
    if (this.isFirebaseConnected && this.db) {
      try {
        const docRef = doc(this.db, "users", this.userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return docSnap.data() as StudentProfile;
        }
      } catch (e) {
        console.warn("Error fetching profile from Firebase, fallback to LocalStorage", e);
      }
    }
    
    // LocalStorage fallback
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("student_profile");
      if (stored) {
        return JSON.parse(stored);
      }
    }
    return DEFAULT_PROFILE;
  }

  // Save student profile
  public async saveProfile(profile: StudentProfile): Promise<void> {
    if (typeof window !== "undefined") {
      localStorage.setItem("student_profile", JSON.stringify(profile));
    }

    if (this.isFirebaseConnected && this.db) {
      try {
        const docRef = doc(this.db, "users", this.userId);
        await setDoc(docRef, profile, { merge: true });
      } catch (e) {
        console.warn("Could not save profile to Firebase Firestore:", e);
      }
    }
  }

  // Get all classes
  public async getClasses(semester?: string): Promise<TimetableClass[]> {
    let activeSemester = semester;
    if (!activeSemester) {
      try {
        const profile = await this.getProfile();
        activeSemester = profile.semester || "";
      } catch (e) {
        console.warn("Failed to get profile semester in getClasses:", e);
      }
    }

    if (this.isFirebaseConnected && this.db) {
      try {
        const querySnapshot = await getDocs(collection(this.db, "classes"));
        const classes: TimetableClass[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (!activeSemester || data.semester === activeSemester) {
            classes.push({ id: doc.id, ...data } as TimetableClass);
          }
        });
        return classes;
      } catch (e) {
        console.warn("Error fetching classes from Firebase, fallback to LocalStorage", e);
      }
    }

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("student_classes");
      if (stored) {
        const list = JSON.parse(stored) as TimetableClass[];
        return activeSemester ? list.filter(c => c.semester === activeSemester) : list;
      }
      localStorage.setItem("student_classes", JSON.stringify(DEFAULT_CLASSES));
    }
    return DEFAULT_CLASSES;
  }

  // Save a class (create or update)
  public async saveClass(cls: TimetableClass): Promise<void> {
    const classes = await this.getClasses(cls.semester);
    const index = classes.findIndex((c) => c.id === cls.id);
    if (index >= 0) {
      classes[index] = cls;
    } else {
      classes.push(cls);
    }

    if (typeof window !== "undefined") {
      // Save all classes in LocalStorage but update the merged list
      const stored = localStorage.getItem("student_classes");
      let allCls: TimetableClass[] = [];
      if (stored) allCls = JSON.parse(stored);
      const idxAll = allCls.findIndex(c => c.id === cls.id);
      if (idxAll >= 0) {
        allCls[idxAll] = cls;
      } else {
        allCls.push(cls);
      }
      localStorage.setItem("student_classes", JSON.stringify(allCls));
    }

    if (this.isFirebaseConnected && this.db) {
      try {
        await setDoc(doc(this.db, "classes", cls.id), cls);
      } catch (e) {
        console.warn("Error saving class to Firebase:", e);
      }
    } else {
      this.triggerLocalNotification(
        index >= 0 ? "Class Schedule Updated" : "New Class Scheduled",
        `${cls.name} on ${cls.day} at ${cls.startTime}`
      );
    }
  }

  // Delete a class
  public async deleteClass(id: string): Promise<void> {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("student_classes");
      if (stored) {
        const allCls = JSON.parse(stored) as TimetableClass[];
        const updated = allCls.filter((c) => c.id !== id);
        localStorage.setItem("student_classes", JSON.stringify(updated));
      }
    }

    if (this.isFirebaseConnected && this.db) {
      try {
        await deleteDoc(doc(this.db, "classes", id));
      } catch (e) {
        console.warn("Error deleting class from Firebase:", e);
      }
    }
  }

  // Tasks operations
  public async getTasks(semester?: string): Promise<TaskItem[]> {
    let activeSemester = semester;
    if (!activeSemester) {
      try {
        const profile = await this.getProfile();
        activeSemester = profile.semester || "";
      } catch (e) {
        console.warn("Failed to get profile semester in getTasks:", e);
      }
    }

    let privateTasks: TaskItem[] = [];
    let sharedTasks: TaskItem[] = [];

    // 1. Fetch private tasks
    if (this.isFirebaseConnected && this.db) {
      try {
        const querySnapshot = await getDocs(collection(this.db, "users", this.userId, "tasks"));
        querySnapshot.forEach((doc) => {
          privateTasks.push({ id: doc.id, ...doc.data() } as TaskItem);
        });
      } catch (e) {
        console.warn("Error fetching private tasks from Firebase:", e);
      }
    } else if (typeof window !== "undefined") {
      const stored = localStorage.getItem("student_tasks");
      if (stored) privateTasks = JSON.parse(stored);
    }

    // 2. Fetch shared tasks
    if (activeSemester) {
      if (this.isFirebaseConnected && this.db) {
        try {
          const q = query(collection(this.db, "shared_tasks"), where("semester", "==", activeSemester));
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach((doc) => {
            sharedTasks.push({ id: doc.id, ...doc.data() } as TaskItem);
          });
        } catch (e) {
          console.warn("Error fetching shared tasks from Firebase:", e);
        }
      } else if (typeof window !== "undefined") {
        const stored = localStorage.getItem("student_shared_tasks");
        if (stored) {
          const allShared = JSON.parse(stored) as TaskItem[];
          sharedTasks = allShared.filter(t => t.semester === activeSemester);
        }
      }
    }

    // 3. Resolve IndexedDB refs
    const resolvedPrivate = await Promise.all(privateTasks.map(t => this.resolveTaskIndexedDBRefs(t)));
    const resolvedShared = await Promise.all(sharedTasks.map(t => this.resolveTaskIndexedDBRefs(t)));

    // 4. Merge
    return this.mergeTasks(resolvedPrivate, resolvedShared);
  }

  public async saveTask(task: TaskItem): Promise<void> {
    // 1. Process attachments
    const processedAttachments = task.attachments ? await Promise.all(task.attachments.map(async (attach) => {
      if (attach.content && attach.content.startsWith("data:")) {
        const fileKey = `task_attach_${task.id}_${attach.name}`;
        await this.indexedDB.setItem(fileKey, attach.content);
        return { ...attach, content: `indexeddb:${fileKey}` };
      }
      return attach;
    })) : undefined;

    // 2. Process submissions
    const processedSubmissions = task.submissions ? await Promise.all(task.submissions.map(async (sub) => {
      if (sub.content && sub.content.startsWith("data:")) {
        const fileKey = `task_sub_${task.id}_${sub.name}`;
        await this.indexedDB.setItem(fileKey, sub.content);
        return { ...sub, content: `indexeddb:${fileKey}` };
      }
      return sub;
    })) : undefined;

    const taskToSave = {
      ...task,
      ...(processedAttachments && { attachments: processedAttachments }),
      ...(processedSubmissions && { submissions: processedSubmissions })
    };

    const tasks = await this.getTasks();
    const index = tasks.findIndex((t) => t.id === task.id);
    
    // Store metadata-only tasks in memory list to avoid giant localstorage payloads
    const tasksForStorage = tasks.map(t => {
      if (t.id === task.id) return taskToSave;
      // Strip actual heavy base64 contents from other tasks if they somehow got here, to be extra safe
      const cleanAttachments = t.attachments?.map(a => a.content?.startsWith("data:") ? { ...a, content: `indexeddb:task_attach_${t.id}_${a.name}` } : a);
      const cleanSubmissions = t.submissions?.map(s => s.content?.startsWith("data:") ? { ...s, content: `indexeddb:task_sub_${t.id}_${s.name}` } : s);
      return {
        ...t,
        ...(cleanAttachments && { attachments: cleanAttachments }),
        ...(cleanSubmissions && { submissions: cleanSubmissions })
      };
    });
    if (index < 0) {
      tasksForStorage.push(taskToSave);
    }

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("student_tasks", JSON.stringify(tasksForStorage));
      } catch (e) {
        console.warn("LocalStorage quota exceeded, skipping local sync:", e);
      }
    }

    if (this.isFirebaseConnected && this.db) {
      try {
        await setDoc(doc(this.db, "users", this.userId, "tasks", task.id), taskToSave);
      } catch (e) {
        console.warn("Error saving task to Firebase:", e);
      }
    } else {
      this.triggerLocalNotification(
        index >= 0 ? "Task Updated" : "New Assignment Added",
        `"${task.title}" is due on ${task.dueDate || "N/A"}`
      );
    }
  }

  public async deleteTask(id: string): Promise<void> {
    const tasks = await this.getTasks();
    const taskToDelete = tasks.find(t => t.id === id);
    if (taskToDelete) {
      if (taskToDelete.attachments) {
        for (const attach of taskToDelete.attachments) {
          const fileKey = `task_attach_${id}_${attach.name}`;
          try {
            await this.indexedDB.removeItem(fileKey);
          } catch (e) {}
        }
      }
      if (taskToDelete.submissions) {
        for (const sub of taskToDelete.submissions) {
          const fileKey = `task_sub_${id}_${sub.name}`;
          try {
            await this.indexedDB.removeItem(fileKey);
          } catch (e) {}
        }
      }
    }

    const updated = tasks.filter((t) => t.id !== id);

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("student_tasks", JSON.stringify(updated));
      } catch (e) {
        console.warn("Error updating tasks in LocalStorage:", e);
      }
    }

    if (this.isFirebaseConnected && this.db) {
      try {
        await deleteDoc(doc(this.db, "users", this.userId, "tasks", id));
      } catch (e) {
        console.warn("Error deleting task from Firebase:", e);
      }
    }
  }

  // Attendance operations
  public async getAttendanceForUser(targetUserId: string): Promise<AttendanceRecord[]> {
    if (this.isFirebaseConnected && this.db) {
      try {
        const querySnapshot = await getDocs(collection(this.db, "users", targetUserId, "attendance"));
        const records: AttendanceRecord[] = [];
        querySnapshot.forEach((doc) => {
          records.push({ courseId: doc.id, ...doc.data() } as AttendanceRecord);
        });
        return records;
      } catch (e) {
        console.warn(`Error fetching attendance for user ${targetUserId} from Firebase:`, e);
      }
    }

    if (typeof window !== "undefined") {
      if (targetUserId === "student_default_user" || targetUserId === this.userId) {
        const stored = localStorage.getItem("student_attendance");
        if (stored) return JSON.parse(stored);
      } else {
        const key = `student_attendance_${targetUserId}`;
        const stored = localStorage.getItem(key);
        if (stored) return JSON.parse(stored);
      }
    }
    return targetUserId === "student_default_user" ? DEFAULT_ATTENDANCE : [];
  }

  public async getAttendance(): Promise<AttendanceRecord[]> {
    return this.getAttendanceForUser(this.userId);
  }

  public async saveAttendanceForUser(targetUserId: string, record: AttendanceRecord): Promise<void> {
    const records = await this.getAttendanceForUser(targetUserId);
    const index = records.findIndex((r) => r.courseId === record.courseId);
    if (index >= 0) {
      records[index] = record;
    } else {
      records.push(record);
    }

    if (typeof window !== "undefined") {
      if (targetUserId === "student_default_user" || targetUserId === this.userId) {
        localStorage.setItem("student_attendance", JSON.stringify(records));
      } else {
        const key = `student_attendance_${targetUserId}`;
        localStorage.setItem(key, JSON.stringify(records));
      }
    }

    if (this.isFirebaseConnected && this.db) {
      try {
        await setDoc(doc(this.db, "users", targetUserId, "attendance", record.courseId), record);
      } catch (e) {
        console.warn(`Error saving attendance for user ${targetUserId} to Firebase:`, e);
      }
    } else {
      if (record.logs && record.logs.length > 0) {
        const latest = record.logs[record.logs.length - 1];
        this.triggerLocalNotification(
          "Attendance Recorded",
          `Marked ${latest.status.toUpperCase()} for ${record.courseId} on ${latest.date}`
        );
      }
    }
  }

  public async saveAttendance(record: AttendanceRecord): Promise<void> {
    await this.saveAttendanceForUser(this.userId, record);
  }

  // Notes operations
  public async getNotes(semester?: string): Promise<NoteItem[]> {
    let activeSemester = semester;
    if (!activeSemester) {
      try {
        const profile = await this.getProfile();
        activeSemester = profile.semester || "";
      } catch (e) {
        console.warn("Failed to get profile semester in getNotes:", e);
      }
    }

    let privateNotes: NoteItem[] = [];
    let sharedNotes: NoteItem[] = [];

    // 1. Fetch private notes
    if (this.isFirebaseConnected && this.db) {
      try {
        const querySnapshot = await getDocs(collection(this.db, "users", this.userId, "notes"));
        querySnapshot.forEach((doc) => {
          privateNotes.push({ id: doc.id, ...doc.data() } as NoteItem);
        });
      } catch (e) {
        console.warn("Error fetching private notes from Firebase:", e);
      }
    } else if (typeof window !== "undefined") {
      const stored = localStorage.getItem("student_notes");
      if (stored) privateNotes = JSON.parse(stored);
    }

    // 2. Fetch shared notes
    if (activeSemester) {
      if (this.isFirebaseConnected && this.db) {
        try {
          const q = query(collection(this.db, "shared_notes"), where("semester", "==", activeSemester));
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach((doc) => {
            sharedNotes.push({ id: doc.id, ...doc.data() } as NoteItem);
          });
        } catch (e) {
          console.warn("Error fetching shared notes from Firebase:", e);
        }
      } else if (typeof window !== "undefined") {
        const stored = localStorage.getItem("student_shared_notes");
        if (stored) {
          const allShared = JSON.parse(stored) as NoteItem[];
          sharedNotes = allShared.filter(n => n.semester === activeSemester);
        }
      }
    }

    // 3. Resolve IndexedDB refs
    const resolvedPrivate = await Promise.all(privateNotes.map(n => this.resolveNoteIndexedDBRefs(n)));
    const resolvedShared = await Promise.all(sharedNotes.map(n => this.resolveNoteIndexedDBRefs(n)));

    // 4. Merge
    return this.mergeNotes(resolvedPrivate, resolvedShared);
  }

  public async saveNote(note: NoteItem): Promise<void> {
    // 1. Process attachments
    const processedAttachments = note.attachments ? await Promise.all(note.attachments.map(async (attach) => {
      if (attach.dataUrl && attach.dataUrl.startsWith("data:")) {
        const fileKey = `note_file_${note.id}_${attach.name}`;
        await this.indexedDB.setItem(fileKey, attach.dataUrl);
        return { ...attach, dataUrl: `indexeddb:${fileKey}` };
      }
      return attach;
    })) : undefined;

    const noteToSave = {
      ...note,
      ...(processedAttachments && { attachments: processedAttachments })
    };

    const notes = await this.getNotes();
    const index = notes.findIndex((n) => n.id === note.id);
    
    // Store metadata-only notes in localstorage to avoid giant payloads
    const notesForStorage = notes.map(n => {
      if (n.id === note.id) return noteToSave;
      const cleanAttachments = n.attachments?.map(a => a.dataUrl?.startsWith("data:") ? { ...a, dataUrl: `indexeddb:note_file_${n.id}_${a.name}` } : a);
      return {
        ...n,
        ...(cleanAttachments && { attachments: cleanAttachments })
      };
    });
    if (index < 0) {
      notesForStorage.push(noteToSave);
    }

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("student_notes", JSON.stringify(notesForStorage));
      } catch (e) {
        console.warn("LocalStorage quota exceeded, skipping local sync:", e);
      }
    }

    if (this.isFirebaseConnected && this.db) {
      try {
        await setDoc(doc(this.db, "users", this.userId, "notes", note.id), noteToSave);
      } catch (e) {
        console.warn("Error saving note to Firebase:", e);
      }
    }
  }

  public async deleteNote(id: string): Promise<void> {
    const notes = await this.getNotes();
    const noteToDelete = notes.find(n => n.id === id);
    if (noteToDelete?.attachments) {
      for (const attach of noteToDelete.attachments) {
        const fileKey = `note_file_${id}_${attach.name}`;
        try {
          await this.indexedDB.removeItem(fileKey);
        } catch (e) {
          console.warn("Failed to remove file from IndexedDB:", e);
        }
      }
    }

    const updated = notes.filter((n) => n.id !== id);

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("student_notes", JSON.stringify(updated));
      } catch (e) {
        console.warn("Error updating notes in LocalStorage:", e);
      }
    }

    if (this.isFirebaseConnected && this.db) {
      try {
        await deleteDoc(doc(this.db, "users", this.userId, "notes", id));
      } catch (e) {
        console.warn("Error deleting note from Firebase:", e);
      }
    }
  }

  // Bulk Import/Export
  public async exportAllData(): Promise<string> {
    const profile = await this.getProfile();
    const classes = await this.getClasses();
    const tasks = await this.getTasks();
    const attendance = await this.getAttendance();
    const notes = await this.getNotes();

    const data = {
      profile,
      classes,
      tasks,
      attendance,
      notes,
      exportedAt: new Date().toISOString(),
    };

    return JSON.stringify(data, null, 2);
  }

  public async importAllData(jsonData: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.profile) await this.saveProfile(parsed.profile);
      
      if (parsed.classes && Array.isArray(parsed.classes)) {
        if (typeof window !== "undefined") {
          localStorage.setItem("student_classes", JSON.stringify(parsed.classes));
        }
        if (this.isFirebaseConnected && this.db) {
          for (const cls of parsed.classes) {
            await setDoc(doc(this.db, "classes", cls.id), cls);
          }
        }
      }

      if (parsed.tasks && Array.isArray(parsed.tasks)) {
        if (typeof window !== "undefined") {
          localStorage.setItem("student_tasks", JSON.stringify(parsed.tasks));
        }
        if (this.isFirebaseConnected && this.db) {
          for (const task of parsed.tasks) {
            await setDoc(doc(this.db, "users", this.userId, "tasks", task.id), task);
          }
        }
      }

      if (parsed.attendance && Array.isArray(parsed.attendance)) {
        if (typeof window !== "undefined") {
          localStorage.setItem("student_attendance", JSON.stringify(parsed.attendance));
        }
        if (this.isFirebaseConnected && this.db) {
          for (const rec of parsed.attendance) {
            await setDoc(doc(this.db, "users", this.userId, "attendance", rec.courseId), rec);
          }
        }
      }

      if (parsed.notes && Array.isArray(parsed.notes)) {
        if (typeof window !== "undefined") {
          localStorage.setItem("student_notes", JSON.stringify(parsed.notes));
        }
        if (this.isFirebaseConnected && this.db) {
          for (const note of parsed.notes) {
            await setDoc(doc(this.db, "users", this.userId, "notes", note.id), note);
          }
        }
      }

      return true;
    } catch (e) {
      console.error("Failed to import JSON data", e);
      return false;
    }
  }

  // Notices operations
  public async getNotices(semester?: string): Promise<NoticeItem[]> {
    let activeSemester = semester;
    if (!activeSemester) {
      try {
        const profile = await this.getProfile();
        activeSemester = profile.semester || "";
      } catch (e) {
        console.warn("Failed to get profile semester in getNotices:", e);
      }
    }

    if (this.isFirebaseConnected && this.db) {
      try {
        const notices: NoticeItem[] = [];
        if (activeSemester) {
          const q = query(collection(this.db, "shared_notices"), where("semester", "==", activeSemester));
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach((doc) => {
            notices.push({ id: doc.id, ...doc.data() } as NoticeItem);
          });
        }
        return notices;
      } catch (e) {
        console.warn("Error fetching notices from Firebase, fallback to LocalStorage", e);
      }
    }

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("student_notices");
      if (stored) {
        const list = JSON.parse(stored) as NoticeItem[];
        return activeSemester ? list.filter(n => n.semester === activeSemester) : list;
      }
      localStorage.setItem("student_notices", JSON.stringify(DEFAULT_NOTICES));
    }
    return DEFAULT_NOTICES;
  }

  public async saveNotice(notice: NoticeItem): Promise<void> {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("student_notices");
      let allNotices: NoticeItem[] = [];
      if (stored) allNotices = JSON.parse(stored);
      const index = allNotices.findIndex((n) => n.id === notice.id);
      if (index >= 0) {
        allNotices[index] = notice;
      } else {
        allNotices.push(notice);
      }
      localStorage.setItem("student_notices", JSON.stringify(allNotices));
    }

    if (this.isFirebaseConnected && this.db) {
      try {
        await setDoc(doc(this.db, "shared_notices", notice.id), notice);
      } catch (e) {
        console.warn("Error saving notice to Firebase:", e);
      }
    } else {
      this.triggerLocalNotification(
        `New Notice: ${notice.title}`,
        notice.description || "Check your bulletin board for details."
      );
    }
  }

  public async deleteNotice(id: string): Promise<void> {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("student_notices");
      if (stored) {
        const allNotices = JSON.parse(stored) as NoticeItem[];
        const updated = allNotices.filter((n) => n.id !== id);
        localStorage.setItem("student_notices", JSON.stringify(updated));
      }
    }

    if (this.isFirebaseConnected && this.db) {
      try {
        await deleteDoc(doc(this.db, "shared_notices", id));
      } catch (e) {
        console.warn("Error deleting notice from Firebase:", e);
      }
    }
  }

  // Student list
  public async getStudentList(): Promise<StudentListItem[]> {
    if (this.isFirebaseConnected && this.db) {
      try {
        const colRef = collection(this.db, "users");
        const querySnapshot = await getDocs(colRef);
        const list: StudentListItem[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            name: data.name || "Unknown Student",
            avatarUrl: data.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256",
            semester: data.semester || "",
          });
        });

        // Merge with default list
        const mergedList = [...list];
        DEFAULT_STUDENT_LIST.forEach((defaultStudent) => {
          if (!mergedList.some((s) => s.id === defaultStudent.id)) {
            mergedList.push(defaultStudent);
          }
        });
        return mergedList;
      } catch (e) {
        console.warn("Error fetching student list from Firebase Firestore:", e);
      }
    }

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("student_profile");
      if (stored) {
        try {
          const localProfile = JSON.parse(stored);
          if (localProfile && localProfile.name) {
            const exists = DEFAULT_STUDENT_LIST.some((s) => s.name === localProfile.name);
            if (!exists) {
              return [
                { id: this.userId, name: localProfile.name, avatarUrl: localProfile.avatarUrl || "", semester: localProfile.semester || "" },
                ...DEFAULT_STUDENT_LIST,
              ];
            }
          }
        } catch {}
      }
    }

    return DEFAULT_STUDENT_LIST;
  }

  // Mark student attendance
  public async markStudentAttendance(
    courseId: string, 
    studentId: string, 
    date: string, 
    status: "present" | "absent" | "excused" | "cancelled", 
    note?: string
  ): Promise<void> {
    const records = await this.getAttendanceForUser(studentId);
    const index = records.findIndex((r) => r.courseId === courseId);
    
    let record: AttendanceRecord;
    if (index >= 0) {
      record = records[index];
    } else {
      record = {
        courseId,
        presentCount: 0,
        absentCount: 0,
        excusedCount: 0,
        cancelledCount: 0,
        logs: []
      };
    }

    const existingLogIndex = record.logs.findIndex((l) => l.date === date);
    
    if (existingLogIndex >= 0) {
      const oldStatus = record.logs[existingLogIndex].status;
      if (oldStatus === "present") record.presentCount--;
      else if (oldStatus === "absent") record.absentCount--;
      else if (oldStatus === "excused") record.excusedCount--;
      else if (oldStatus === "cancelled") record.cancelledCount--;
      
      record.logs[existingLogIndex].status = status;
      if (note !== undefined) record.logs[existingLogIndex].note = note;
    } else {
      record.logs.push({
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        date,
        status,
        note
      });
    }

    if (status === "present") record.presentCount++;
    else if (status === "absent") record.absentCount++;
    else if (status === "excused") record.excusedCount++;
    else if (status === "cancelled") record.cancelledCount++;

    await this.saveAttendanceForUser(studentId, record);
  }

  // Get attendance logs for a mock student
  public getMockStudentAttendanceLogs(courseId: string): Array<{ studentId: string; date: string; status: string; note?: string }> {
    if (typeof window !== "undefined") {
      const key = `admin_attendance_logs_${courseId}`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  }

  // Trigger Native Push Notification
  public triggerLocalNotification(title: string, body: string) {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        try {
          new Notification(title, {
            body: body,
            icon: "/favicon.ico"
          });
          const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav");
          audio.volume = 0.5;
          audio.play().catch(() => {});
        } catch (e) {
          console.error("Failed to trigger local notification:", e);
        }
      }
    }
  }

  // Subscribe to realtime notifications across collections
  public subscribeRealtimeNotifications(onNotify: (title: string, body: string) => void): (() => void)[] {
    const unsubscribers: (() => void)[] = [];
    if (!this.isFirebaseConnected || !this.db) return [];

    let isFirstTasks = true;
    let isFirstClasses = true;
    let isFirstNotices = true;
    let isFirstAttendance = true;

    // 1. Listen to Tasks
    try {
      const tasksRef = collection(this.db, "users", this.userId, "tasks");
      const unsubTasks = onSnapshot(tasksRef, (snapshot) => {
        if (isFirstTasks) {
          isFirstTasks = false;
          return;
        }
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const data = change.doc.data();
            onNotify(
              "New Assignment Added",
              `"${data.title}" is due on ${data.dueDate || "N/A"}`
            );
          }
        });
      });
      unsubscribers.push(unsubTasks);
    } catch (e) {
      console.warn("Realtime tasks notification subscription error:", e);
    }

    // 2. Listen to Notices
    try {
      const noticesRef = collection(this.db, "users", this.userId, "notices");
      const unsubNotices = onSnapshot(noticesRef, (snapshot) => {
        if (isFirstNotices) {
          isFirstNotices = false;
          return;
        }
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const data = change.doc.data();
            onNotify(
              `New Notice: ${data.title}`,
              data.description || "Check your bulletin board for details."
            );
          }
        });
      });
      unsubscribers.push(unsubNotices);
    } catch (e) {
      console.warn("Realtime notices notification subscription error:", e);
    }

    // 3. Listen to Classes
    try {
      const classesRef = collection(this.db, "classes");
      const unsubClasses = onSnapshot(classesRef, (snapshot) => {
        if (isFirstClasses) {
          isFirstClasses = false;
          return;
        }
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const data = change.doc.data();
            onNotify(
              "New Class Scheduled",
              `${data.name} on ${data.day} at ${data.startTime}`
            );
          } else if (change.type === "modified") {
            const data = change.doc.data();
            onNotify(
              "Class Schedule Updated",
              `${data.name} is now on ${data.day} at ${data.startTime}`
            );
          }
        });
      });
      unsubscribers.push(unsubClasses);
    } catch (e) {
      console.warn("Realtime classes notification subscription error:", e);
    }

    // 4. Listen to Attendance
    try {
      const attRef = collection(this.db, "users", this.userId, "attendance");
      const unsubAtt = onSnapshot(attRef, (snapshot) => {
        if (isFirstAttendance) {
          isFirstAttendance = false;
          return;
        }
        snapshot.docChanges().forEach((change) => {
          if (change.type === "modified" || change.type === "added") {
            const data = change.doc.data();
            if (data.logs && data.logs.length > 0) {
              const latestLog = data.logs[data.logs.length - 1];
              onNotify(
                "Attendance Recorded",
                `Marked ${latestLog.status.toUpperCase()} for ${data.courseId} on ${latestLog.date}`
              );
            }
          }
        });
      });
      unsubscribers.push(unsubAtt);
    } catch (e) {
      console.warn("Realtime attendance notification subscription error:", e);
    }

    return unsubscribers;
  }

  // Shared Tasks operations for Admin Dashboard
  public async getSharedTasks(semester: string): Promise<TaskItem[]> {
    const list: TaskItem[] = [];
    if (this.isFirebaseConnected && this.db) {
      try {
        const q = query(collection(this.db, "shared_tasks"), where("semester", "==", semester));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as TaskItem);
        });
      } catch (e) {
        console.warn("Error fetching shared tasks:", e);
      }
    } else if (typeof window !== "undefined") {
      const stored = localStorage.getItem("student_shared_tasks");
      if (stored) {
        const allShared = JSON.parse(stored) as TaskItem[];
        return allShared.filter(t => t.semester === semester);
      }
    }
    return list;
  }

  public async saveSharedTask(task: TaskItem): Promise<void> {
    const processedAttachments = task.attachments ? await Promise.all(task.attachments.map(async (attach) => {
      if (attach.content && attach.content.startsWith("data:")) {
        const fileKey = `task_attach_${task.id}_${attach.name}`;
        await this.indexedDB.setItem(fileKey, attach.content);
        return { ...attach, content: `indexeddb:${fileKey}` };
      }
      return attach;
    })) : undefined;

    const taskToSave = {
      ...task,
      ...(processedAttachments && { attachments: processedAttachments }),
    };

    if (typeof window !== "undefined") {
      let sharedTasks: TaskItem[] = [];
      const stored = localStorage.getItem("student_shared_tasks");
      if (stored) sharedTasks = JSON.parse(stored);
      const index = sharedTasks.findIndex(t => t.id === task.id);
      if (index >= 0) {
        sharedTasks[index] = taskToSave;
      } else {
        sharedTasks.push(taskToSave);
      }
      localStorage.setItem("student_shared_tasks", JSON.stringify(sharedTasks));
    }

    if (this.isFirebaseConnected && this.db) {
      try {
        await setDoc(doc(this.db, "shared_tasks", task.id), taskToSave);
      } catch (e) {
        console.warn("Error saving shared task to Firebase:", e);
      }
    }
  }

  public async deleteSharedTask(id: string): Promise<void> {
    if (typeof window !== "undefined") {
      let sharedTasks: TaskItem[] = [];
      const stored = localStorage.getItem("student_shared_tasks");
      if (stored) sharedTasks = JSON.parse(stored);
      const updated = sharedTasks.filter(t => t.id !== id);
      localStorage.setItem("student_shared_tasks", JSON.stringify(updated));
    }

    if (this.isFirebaseConnected && this.db) {
      try {
        await deleteDoc(doc(this.db, "shared_tasks", id));
      } catch (e) {
        console.warn("Error deleting shared task from Firebase:", e);
      }
    }
  }

  // Shared Notes operations for Admin Dashboard
  public async getSharedNotes(semester: string): Promise<NoteItem[]> {
    const list: NoteItem[] = [];
    if (this.isFirebaseConnected && this.db) {
      try {
        const q = query(collection(this.db, "shared_notes"), where("semester", "==", semester));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as NoteItem);
        });
      } catch (e) {
        console.warn("Error fetching shared notes:", e);
      }
    } else if (typeof window !== "undefined") {
      const stored = localStorage.getItem("student_shared_notes");
      if (stored) {
        const allShared = JSON.parse(stored) as NoteItem[];
        return allShared.filter(n => n.semester === semester);
      }
    }
    return list;
  }

  public async saveSharedNote(note: NoteItem): Promise<void> {
    const processedAttachments = note.attachments ? await Promise.all(note.attachments.map(async (attach) => {
      if (attach.dataUrl && attach.dataUrl.startsWith("data:")) {
        const fileKey = `note_file_${note.id}_${attach.name}`;
        await this.indexedDB.setItem(fileKey, attach.dataUrl);
        return { ...attach, dataUrl: `indexeddb:${fileKey}` };
      }
      return attach;
    })) : undefined;

    const noteToSave = {
      ...note,
      ...(processedAttachments && { attachments: processedAttachments })
    };

    if (typeof window !== "undefined") {
      let sharedNotes: NoteItem[] = [];
      const stored = localStorage.getItem("student_shared_notes");
      if (stored) sharedNotes = JSON.parse(stored);
      const index = sharedNotes.findIndex(n => n.id === note.id);
      if (index >= 0) {
        sharedNotes[index] = noteToSave;
      } else {
        sharedNotes.push(noteToSave);
      }
      localStorage.setItem("student_shared_notes", JSON.stringify(sharedNotes));
    }

    if (this.isFirebaseConnected && this.db) {
      try {
        await setDoc(doc(this.db, "shared_notes", note.id), noteToSave);
      } catch (e) {
        console.warn("Error saving shared note to Firebase:", e);
      }
    }
  }

  public async deleteSharedNote(id: string): Promise<void> {
    if (typeof window !== "undefined") {
      let sharedNotes: NoteItem[] = [];
      const stored = localStorage.getItem("student_shared_notes");
      if (stored) sharedNotes = JSON.parse(stored);
      const updated = sharedNotes.filter(n => n.id !== id);
      localStorage.setItem("student_shared_notes", JSON.stringify(updated));
    }

    if (this.isFirebaseConnected && this.db) {
      try {
        await deleteDoc(doc(this.db, "shared_notes", id));
      } catch (e) {
        console.warn("Error deleting shared note from Firebase:", e);
      }
    }
  }

  // Aggregates student submissions for shared assignments
  public async getSharedTasksWithSubmissions(semester: string, students: StudentListItem[]): Promise<TaskItem[]> {
    const sharedTasks = await this.getSharedTasks(semester);
    
    const tasksWithSubmissions = await Promise.all(sharedTasks.map(async (task) => {
      const allSubmissions: any[] = [];
      const filteredStudents = students.filter(st => st.semester === semester);
      
      for (const student of filteredStudents) {
        try {
          let studentTask: TaskItem | null = null;
          if (this.isFirebaseConnected && this.db) {
            const docRef = doc(this.db, "users", student.id, "tasks", task.id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              studentTask = docSnap.data() as TaskItem;
            }
          } else {
            const key = `student_tasks_${student.id}`;
            const stored = localStorage.getItem(key);
            if (stored) {
              const tasksList = JSON.parse(stored) as TaskItem[];
              studentTask = tasksList.find(t => t.id === task.id) || null;
            } else if (student.id === this.userId) {
              const storedSelf = localStorage.getItem("student_tasks");
              if (storedSelf) {
                const tasksList = JSON.parse(storedSelf) as TaskItem[];
                studentTask = tasksList.find(t => t.id === task.id) || null;
              }
            }
          }
          
          if (studentTask && studentTask.submissions && studentTask.submissions.length > 0) {
            studentTask.submissions.forEach(sub => {
              allSubmissions.push({
                ...sub,
                studentName: student.name,
                studentId: student.id
              });
            });
          }
        } catch (e) {
          console.warn(`Error getting task submissions for student ${student.id}:`, e);
        }
      }
      
      return {
        ...task,
        submissions: allSubmissions
      };
    }));
    
    return tasksWithSubmissions;
  }
}

export const dbService = new StorageService();

// Auth exports for use in AuthContext
export { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, firebaseSignOut };
export type { Auth, User };
