import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "./ThemeContext";
import { dbService } from "../services/firebaseService";
import type { TimetableClass, TaskItem, NoticeItem, StudentListItem, AttendanceRecord, NoteItem } from "../services/firebaseService";
import adminLogo from "../../icons/Admin.png";
import {
  HomeIcon,
  CalendarIcon,
  CheckIcon,
  UsersIcon,
  ItineraryIcon,
  MagicStarIcon,
  PlusIcon,
  RefreshIcon,
  ArrowDownIcon,
  LocationMarkIcon,
  StarIcon,
  LogoutIcon,
  MenuIcon
} from "./CustomIcons";
import {
  Search,
  Bell,
  Settings,
  Sliders,
  Trash2,
  CheckCircle2,
  X,
  FileText,
  AlertTriangle,
  UserCheck,
  Sun,
  Moon,
  Upload,
  ChevronDown
} from "lucide-react";

type AdminSubView = "overview" | "attendance" | "notes" | "notices" | "timetable" | "tasks";

export const AdminDashboard: React.FC = () => {
  const { theme, toggleTheme, portalMode, setPortalMode } = useTheme();
  const [activeSubView, setActiveSubView] = useState<AdminSubView>("overview");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [adminSelectedSemester, setAdminSelectedSemester] = useState<string>("1");



  // Data State
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [allStudentAttendance, setAllStudentAttendance] = useState<Record<string, AttendanceRecord[]>>({});
  const [classes, setClasses] = useState<TimetableClass[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [notes, setNotes] = useState<any[]>([]);

  // Attendance Form State
  const [selectedCourse, setSelectedCourse] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [attendanceStatus, setAttendanceStatus] = useState<Record<string, "present" | "absent" | "excused" | "cancelled">>({});
  const [attendanceNotes, setAttendanceNotes] = useState<Record<string, string>>({});
  const [attendanceMsg, setAttendanceMsg] = useState("");

  // Notice Form State
  const [newNoticeTitle, setNewNoticeTitle] = useState("");
  const [newNoticeDesc, setNewNoticeDesc] = useState("");
  const [newNoticeType, setNewNoticeType] = useState<"critical" | "warning" | "info">("info");
  const [noticeMsg, setNoticeMsg] = useState("");

  // Notes Form State
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteCategory, setNewNoteCategory] = useState("");
  const [newNoteFile, setNewNoteFile] = useState<{ name: string; type: string; size: string; dataUrl: string } | null>(null);
  const noteFileInputRef = useRef<HTMLInputElement>(null);
  const [noteMsg, setNoteMsg] = useState("");

  // Timetable Form State
  const [classTitle, setClassTitle] = useState("");
  const [classProf, setClassProf] = useState("");
  const [classRoom, setClassRoom] = useState("");
  const [classDay, setClassDay] = useState("Monday");
  const [classStart, setClassStart] = useState("09:00");
  const [classEnd, setClassEnd] = useState("10:30");
  const [classColor, setClassColor] = useState("bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/30");
  const [classMsg, setClassMsg] = useState("");

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskCategory, setTaskCategory] = useState("General");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskMsg, setTaskMsg] = useState("");
  const [taskAttachment, setTaskAttachment] = useState<{ name: string; type: string; size: string; content?: string } | null>(null);

  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);

  // Compute overall dynamic attendance rate for stats card
  const getOverallAttendanceRate = () => {
    let totalLogs = 0;
    let totalPresent = 0;
    const semesterStudentIds = students
      .filter(st => st.semester === adminSelectedSemester)
      .map(st => st.id);

      
    semesterStudentIds.forEach((studentId) => {
      const records = allStudentAttendance[studentId] || [];
      records.forEach((rec) => {
        totalLogs += rec.presentCount + rec.absentCount;
        totalPresent += rec.presentCount;
      });
    });
    return totalLogs > 0 ? Math.round((totalPresent / totalLogs) * 1000) / 10 : null;
  };

  const overallAdminRate = getOverallAttendanceRate();
  const graphY = overallAdminRate !== null ? 70 - ((overallAdminRate / 100) * 58) : 70;

  const getClassAttendanceStats = () => {
    const courseStats: Record<string, { totalPresent: number; totalLogs: number }> = {};
    const semesterStudentIds = students
      .filter(st => st.semester === adminSelectedSemester)
      .map(st => st.id);

    semesterStudentIds.forEach((studentId) => {
      const records = allStudentAttendance[studentId] || [];
      records.forEach((rec) => {
        const course = rec.courseId;
        if (!courseStats[course]) {
          courseStats[course] = { totalPresent: 0, totalLogs: 0 };
        }
        courseStats[course].totalPresent += rec.presentCount;
        courseStats[course].totalLogs += (rec.presentCount + rec.absentCount);
      });
    });

    const statsList = Object.entries(courseStats)
      .map(([name, data]) => {
        const rate = data.totalLogs > 0 ? Math.round((data.totalPresent / data.totalLogs) * 100) : 0;
        return { name, rate, totalLogs: data.totalLogs };
      })
      .filter(stat => stat.totalLogs > 0);

    const sortedDesc = [...statsList].sort((a, b) => b.rate - a.rate || a.name.localeCompare(b.name));
    const sortedAsc = [...statsList].sort((a, b) => a.rate - b.rate || a.name.localeCompare(b.name));

    const topClass = sortedDesc.length > 0
      ? sortedDesc[0]
      : null;

    const attentionRequired = sortedAsc.length > 0
      ? sortedAsc[0]
      : null;

    return { topClass, attentionRequired };
  };

  const { topClass, attentionRequired } = getClassAttendanceStats();

  const reloadData = async () => {
    try {
      const roster = await dbService.getStudentList();
      setStudents(roster);

      const clsList = await dbService.getClasses(adminSelectedSemester);
      setClasses(clsList);
      if (clsList.length > 0) {
        if (!selectedCourse || !clsList.some(c => c.name === selectedCourse)) {
          setSelectedCourse(clsList[0].name);
        }
      } else {
        setSelectedCourse("");
      }

      const tList = await dbService.getSharedTasksWithSubmissions(adminSelectedSemester, roster);
      setTasks(tList);

      const nList = await dbService.getNotices(adminSelectedSemester);
      setNotices(nList);

      const noteList = await dbService.getSharedNotes(adminSelectedSemester);
      setNotes(noteList);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const unsubStudents = dbService.subscribeStudentList(setStudents);
    const unsubClasses = dbService.subscribeClasses((clsList) => {
      setClasses(clsList);
      if (clsList.length > 0) {
        if (!selectedCourse || !clsList.some(c => c.name === selectedCourse)) {
          setSelectedCourse(clsList[0].name);
        }
      } else {
        setSelectedCourse("");
      }
    }, adminSelectedSemester);
    const unsubTasks = dbService.subscribeTasks(async () => {
      const roster = await dbService.getStudentList();
      const tList = await dbService.getSharedTasksWithSubmissions(adminSelectedSemester, roster);
      setTasks(tList);
    }, adminSelectedSemester);
    const unsubNotices = dbService.subscribeNotices(setNotices, adminSelectedSemester);
    const unsubNotes = dbService.subscribeNotes(setNotes, adminSelectedSemester);

    if (!unsubStudents || !unsubClasses || !unsubTasks || !unsubNotices || !unsubNotes) {
      reloadData();
    }

    return () => {
      if (unsubStudents) unsubStudents();
      if (unsubClasses) unsubClasses();
      if (unsubTasks) unsubTasks();
      if (unsubNotices) unsubNotices();
      if (unsubNotes) unsubNotes();
    };
  }, [selectedCourse, adminSelectedSemester]);

  // Subscribe to all students' attendance in realtime
  useEffect(() => {
    let active = true;
    const unsubscribes: Array<() => void> = [];

    if (students.length > 0) {
      students.forEach((st) => {
        const unsub = dbService.subscribeAttendanceForUser(st.id, (records) => {
          if (active) {
            setAllStudentAttendance((prev) => ({ ...prev, [st.id]: records }));
          }
        });

        if (unsub) {
          unsubscribes.push(unsub);
        } else {
          // fallback
          dbService.getAttendanceForUser(st.id).then((records) => {
            if (active) {
              setAllStudentAttendance((prev) => ({ ...prev, [st.id]: records }));
            }
          });
        }
      });
    }

    return () => {
      active = false;
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [students]);

  // Set up Admin Notifications
  useEffect(() => {
    const fetchAdminNotifications = async () => {
      try {
        const notifs: string[] = [];
        const taskList = await dbService.getTasks();
        const pendingReviews = taskList.filter(t => t.submissions && t.submissions.length > 0);
        if (pendingReviews.length > 0) {
          notifs.push(`${pendingReviews.length} assignment(s) have submissions pending review.`);
        }

        const classList = await dbService.getClasses();
        if (classList.length > 0) {
          notifs.push(`${classList.length} active classes scheduled in the timetable.`);
        }

        const noticeList = await dbService.getNotices();
        if (noticeList.length > 0) {
          notifs.push(`${noticeList.length} global notices to students.`);
        }

        if (notifs.length === 0) {
          notifs.push("No alerts today.");
        }
        setNotifications(notifs);
      } catch (e) {
        console.error(e);
      }
    };
    fetchAdminNotifications();
  }, [tasks, classes, notices]);

  // Initialize attendance default checks when course, date, students, or their attendance records update
  useEffect(() => {
    if (selectedCourse && students.length > 0) {
      const defaults: Record<string, "present" | "absent" | "excused" | "cancelled"> = {};
      const noteDefaults: Record<string, string> = {};

      const filteredStudents = students.filter(st => st.semester === adminSelectedSemester);

      filteredStudents.forEach((st) => {
        const records = allStudentAttendance[st.id] || [];
        const currentRec = records.find(r => r.courseId === selectedCourse);
        const todayLog = currentRec?.logs.find((l: any) => l.date === attendanceDate);
        if (todayLog) {
          defaults[st.id] = todayLog.status;
          noteDefaults[st.id] = todayLog.note || "";
        } else {
          defaults[st.id] = "present";
          noteDefaults[st.id] = "";
        }
      });

      setAttendanceStatus(prev => ({ ...prev, ...defaults }));
      setAttendanceNotes(prev => ({ ...prev, ...noteDefaults }));
    }
  }, [selectedCourse, attendanceDate, students, allStudentAttendance, adminSelectedSemester]);

  // Attendance Submission
  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      const filteredStudents = students.filter(st => st.semester === adminSelectedSemester);
      for (const st of filteredStudents) {
        const status = attendanceStatus[st.id] || "present";
        const note = attendanceNotes[st.id] || "";
        await dbService.markStudentAttendance(selectedCourse, st.id, attendanceDate, status, note);
      }
      setAttendanceMsg("Attendance successfully registered for all students!");
      setTimeout(() => setAttendanceMsg(""), 3500);
      reloadData();
    } catch (err) {
      console.error(err);
      setAttendanceMsg("Error submitting attendance. Please try again.");
    }
  };

  // Notice Creation
  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeTitle || !newNoticeDesc) return;
    try {
      const notice: NoticeItem = {
        id: `notice_${Date.now()}`,
        title: newNoticeTitle,
        description: newNoticeDesc,
        date: "Today",
        type: newNoticeType,
        semester: adminSelectedSemester
      };
      await dbService.saveNotice(notice);
      setNewNoticeTitle("");
      setNewNoticeDesc("");
      setNoticeMsg("Notice broadcasted successfully!");
      setTimeout(() => setNoticeMsg(""), 3500);
      reloadData();
    } catch (err) {
      console.error(err);
      setNoticeMsg("Error publishing notice.");
    }
  };

  const handleDeleteNotice = async (id: string) => {
    try {
      await dbService.deleteNotice(id);
      reloadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Note File Change Handler
  const handleNoteFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setNewNoteFile(null);
      return;
    }
    const file = files[0];

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      alert("Only PDF files are allowed for notes.");
      e.target.value = "";
      setNewNoteFile(null);
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      alert("Please upload PDF files under 25MB.");
      e.target.value = "";
      setNewNoteFile(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const sizeStr = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(file.size / 1024).toFixed(1)} KB`;
      setNewNoteFile({
        name: file.name,
        type: file.type,
        size: sizeStr,
        dataUrl
      });
    };
    reader.readAsDataURL(file);
  };


  const handleUploadNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle || !newNoteFile) {
      alert("Please specify a note title and select a PDF file.");
      return;
    }
    try {
      const note: NoteItem = {
        id: `note_${Date.now()}`,
        title: newNoteTitle,
        content: `Attached PDF: ${newNoteFile.name}`,
        category: newNoteCategory || "General",
        updatedAt: new Date().toISOString(),
        semester: adminSelectedSemester,
        attachments: [
          {
            name: newNoteFile.name,
            type: newNoteFile.type,
            size: newNoteFile.size,
            dataUrl: newNoteFile.dataUrl
          }
        ]
      };
      await dbService.saveSharedNote(note);
      setNewNoteTitle("");
      setNewNoteCategory("");
      setNewNoteFile(null);
      if (noteFileInputRef.current) {
        noteFileInputRef.current.value = "";
      }
      setNoteMsg("Shared note published successfully!");
      setTimeout(() => setNoteMsg(""), 3500);
      reloadData();
    } catch (err) {
      console.error(err);
      setNoteMsg("Error uploading note.");
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await dbService.deleteSharedNote(id);
      reloadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classTitle || !classProf) return;
    try {
      const newClass: TimetableClass = {
        id: `class_${Date.now()}`,
        name: classTitle,
        professor: classProf,
        room: classRoom || "Online",
        day: classDay,
        startTime: classStart,
        endTime: classEnd,
        color: classColor,
        semester: adminSelectedSemester
      };
      await dbService.saveClass(newClass);
      setClassTitle("");
      setClassProf("");
      setClassRoom("");
      setClassMsg("Lecture scheduled!");
      setTimeout(() => setClassMsg(""), 3500);
      reloadData();
    } catch (err) {
      console.error(err);
      setClassMsg("Error scheduling lecture.");
    }
  };

  const handleDeleteClass = async (id: string) => {
    try {
      await dbService.deleteClass(id);
      reloadData();
    } catch (err) {
      console.error(err);
    }
  };


  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle || !taskDueDate) return;
    try {
      const newTask: TaskItem = {
        id: `task_${Date.now()}`,
        title: taskTitle,
        description: taskDesc,
        dueDate: taskDueDate,
        priority: "medium",
        category: taskCategory,
        status: "todo",
        semester: adminSelectedSemester,
        attachments: taskAttachment ? [taskAttachment] : []
      };
      await dbService.saveSharedTask(newTask);
      setTaskTitle("");
      setTaskDueDate("");
      setTaskDesc("");
      setTaskAttachment(null);
      setTaskMsg("Assignment assigned to students!");
      setTimeout(() => setTaskMsg(""), 3500);
      reloadData();
    } catch (err) {
      console.error(err);
      setTaskMsg("Error assigning assignment");
    }
  };

  const handleTaskAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setTaskAttachment(null);
      return;
    }
    const file = files[0];

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      alert("Only PDF files are allowed for assignment.");
      e.target.value = "";
      setTaskAttachment(null);
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      alert("Please upload PDF files under 25MB.");
      e.target.value = "";
      setTaskAttachment(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const sizeStr = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(file.size / 1024).toFixed(1)} KB`;
      setTaskAttachment({
        name: file.name,
        type: file.type,
        size: sizeStr,
        content
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await dbService.deleteSharedTask(id);
      reloadData();
    } catch (err) {
      console.error(err);
    }
  };

  const totalNotices = notices.length;
  const totalTasks = tasks.length;
  const totalClasses = classes.length;
  const completedTasks = tasks.filter(t => t.status === "completed").length;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-[#0a0f1e] font-sans antialiased text-gray-900 dark:text-gray-100 transition-colors duration-300">

      
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-950/60 backdrop-blur-sm md:hidden transition-opacity duration-300"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      
      <aside className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-slate-50 dark:bg-[#0a0f1e] border-r border-slate-200 dark:border-white/5 transition-all duration-300 ease-in-out md:relative md:translate-x-0 ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        
        <div className="absolute top-0 left-0 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

        
        <div className="relative flex items-center justify-center h-20 px-5 border-b border-slate-200 dark:border-white/10 shrink-0">
          <div className="flex items-center justify-center h-16 w-full">
            <img
              src={adminLogo}
              alt="Admin Logo"
              className={`h-46 w-auto object-contain transition-all duration-300 ${theme === "dark"
                ? "invert mix-blend-screen"
                : "mix-blend-multiply"
                }`}
            />
          </div>
          <button
            className="absolute right-4 p-1.5 rounded-lg text-slate-400 dark:text-white/40 hover:text-slate-600 hover:bg-slate-200/50 dark:hover:text-white dark:hover:bg-white/10 md:hidden transition-colors cursor-pointer"
            onClick={() => setMobileSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="relative flex-1 px-3 py-5 space-y-5 overflow-y-auto">
          <div>
            <div className="space-y-0.5">
              <button
                onClick={() => { setActiveSubView("overview"); setMobileSidebarOpen(false); }}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium tracking-wide transition-all duration-200 group ${activeSubView === "overview"
                  ? "bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 shadow-inner"
                  : "text-slate-500 dark:text-white/50 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/5"
                  }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${activeSubView === "overview"
                  ? "bg-gradient-to-br from-rose-500 to-rose-700 shadow-md"
                  : "bg-slate-100 dark:bg-white/5 group-hover:bg-slate-200 dark:group-hover:bg-white/10"
                  }`}>
                  <HomeIcon className={`w-3.5 h-3.5 ${activeSubView === "overview" ? "text-white" : "text-slate-500 dark:text-white/50 group-hover:text-slate-700 dark:group-hover:text-white/80"}`} size={14} />
                </div>
                <span>Home</span>
                {activeSubView === "overview" && <div className="ml-auto w-1 h-1 rounded-full bg-rose-500 dark:bg-rose-400" />}
              </button>
            </div>
          </div>
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-white/30 px-3 mb-2">Academic</p>
            <div className="space-y-0.5">
              <button
                onClick={() => { setActiveSubView("attendance"); setMobileSidebarOpen(false); }}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium tracking-wide transition-all duration-200 group ${activeSubView === "attendance"
                  ? "bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 shadow-inner"
                  : "text-slate-500 dark:text-white/50 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/5"
                  }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${activeSubView === "attendance"
                  ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md"
                  : "bg-slate-100 dark:bg-white/5 group-hover:bg-slate-200 dark:group-hover:bg-white/10"
                  }`}>
                  <UsersIcon className={`w-3.5 h-3.5 ${activeSubView === "attendance" ? "text-white" : "text-slate-500 dark:text-white/50 group-hover:text-slate-700 dark:group-hover:text-white/80"}`} size={14} />
                </div>
                <span>Attendance</span>
                {activeSubView === "attendance" && <div className="ml-auto w-1 h-1 rounded-full bg-rose-500 dark:bg-rose-400" />}
              </button>

              <button
                onClick={() => { setActiveSubView("timetable"); setMobileSidebarOpen(false); }}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium tracking-wide transition-all duration-200 group ${activeSubView === "timetable"
                  ? "bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 shadow-inner"
                  : "text-slate-500 dark:text-white/50 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/5"
                  }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${activeSubView === "timetable"
                  ? "bg-gradient-to-br from-orange-500 to-amber-600 shadow-md"
                  : "bg-slate-100 dark:bg-white/5 group-hover:bg-slate-200 dark:group-hover:bg-white/10"
                  }`}>
                  <CalendarIcon className={`w-3.5 h-3.5 ${activeSubView === "timetable" ? "text-white" : "text-slate-500 dark:text-white/50 group-hover:text-slate-700 dark:group-hover:text-white/80"}`} size={14} />
                </div>
                <span>Timetable</span>
                {activeSubView === "timetable" && <div className="ml-auto w-1 h-1 rounded-full bg-rose-500 dark:bg-rose-400" />}
              </button>
            </div>
          </div>

          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-white/30 px-3 mb-2">Workspace</p>
            <div className="space-y-0.5">
              <button
                onClick={() => { setActiveSubView("tasks"); setMobileSidebarOpen(false); }}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium tracking-wide transition-all duration-200 group ${activeSubView === "tasks"
                  ? "bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 shadow-inner"
                  : "text-slate-500 dark:text-white/50 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/5"
                  }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${activeSubView === "tasks"
                  ? "bg-gradient-to-br from-violet-500 to-purple-600 shadow-md"
                  : "bg-slate-100 dark:bg-white/5 group-hover:bg-slate-200 dark:group-hover:bg-white/10"
                  }`}>
                  <CheckIcon className={`w-3.5 h-3.5 ${activeSubView === "tasks" ? "text-white" : "text-slate-500 dark:text-white/50 group-hover:text-slate-700 dark:group-hover:text-white/80"}`} size={14} />
                </div>
                <span>Assignments</span>
                {activeSubView === "tasks" && <div className="ml-auto w-1 h-1 rounded-full bg-rose-500 dark:bg-rose-400" />}
              </button>

              <button
                onClick={() => { setActiveSubView("notices"); setMobileSidebarOpen(false); }}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium tracking-wide transition-all duration-200 group ${activeSubView === "notices"
                  ? "bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 shadow-inner"
                  : "text-slate-500 dark:text-white/50 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/5"
                  }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${activeSubView === "notices"
                  ? "bg-gradient-to-br from-rose-500 to-pink-600 shadow-md"
                  : "bg-slate-100 dark:bg-white/5 group-hover:bg-slate-200 dark:group-hover:bg-white/10"
                  }`}>
                  <StarIcon className={`w-3.5 h-3.5 ${activeSubView === "notices" ? "text-white" : "text-slate-500 dark:text-white/50 group-hover:text-slate-700 dark:group-hover:text-white/80"}`} size={14} />
                </div>
                <span>Notices</span>
                {activeSubView === "notices" && <div className="ml-auto w-1 h-1 rounded-full bg-rose-500 dark:bg-rose-400" />}
              </button>

              <button
                onClick={() => { setActiveSubView("notes"); setMobileSidebarOpen(false); }}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium tracking-wide transition-all duration-200 group ${activeSubView === "notes"
                  ? "bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 shadow-inner"
                  : "text-slate-500 dark:text-white/50 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/5"
                  }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${activeSubView === "notes"
                  ? "bg-gradient-to-br from-indigo-500 to-blue-600 shadow-md"
                  : "bg-slate-100 dark:bg-white/5 group-hover:bg-slate-200 dark:group-hover:bg-white/10"
                  }`}>
                  <ItineraryIcon className={`w-3.5 h-3.5 ${activeSubView === "notes" ? "text-white" : "text-slate-500 dark:text-white/50 group-hover:text-slate-700 dark:group-hover:text-white/80"}`} size={14} />
                </div>
                <span>Notes</span>
                {activeSubView === "notes" && <div className="ml-auto w-1 h-1 rounded-full bg-rose-500 dark:bg-rose-400" />}
              </button>
            </div>
          </div>
        </nav>

        <div className="relative px-4 py-4 border-t border-slate-200 dark:border-white/10 space-y-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-bold text-slate-600 dark:text-white/50 hover:text-slate-900 dark:hover:text-white transition-all"
              title="Toggle Theme"
            >
              {theme === "light" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
              <span>Theme</span>
            </button>
            <button
              onClick={() => setPortalMode("student")}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-100 dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-500/15 border border-slate-200 dark:border-white/10 hover:border-rose-300 dark:hover:border-rose-500/30 rounded-xl text-[10px] font-bold text-slate-600 dark:text-white/50 hover:text-rose-600 dark:hover:text-rose-400 transition-all"
              title="Switch to Student Portal"
            >
              <LogoutIcon size={14} />
              <span>Student</span>
            </button>
          </div>

          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-rose-700 overflow-hidden flex items-center justify-center">
                <span className="font-extrabold text-[10px] text-white">A</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-100 dark:border-[#0a0f1e]" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Admin</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-full relative">

        <header className="flex items-center justify-between h-16 px-6 shrink-0 bg-white dark:bg-[#0d1526]/90 border-b border-slate-200 dark:border-white/5 backdrop-blur-xl sticky top-0 z-30 transition-colors duration-300">
          <div className="flex items-center gap-4 flex-1">

            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 md:hidden focus:outline-none cursor-pointer"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <div className="relative w-full max-w-md hidden sm:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/30" />
              <input
                type="text"
                placeholder="Try searching insights..."
                className="w-full pl-10 pr-4 py-2.5 rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/30 text-gray-900 dark:text-white placeholder-slate-400 dark:placeholder-white/25 font-medium transition-colors"
              />
            </div>

            {/* Semester Selector */}
            <div className="flex items-center gap-2 ml-2 shrink-0">
              <span className="text-[10px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-wider hidden md:inline">Semester:</span>
              <select
                value={adminSelectedSemester}
                onChange={(e) => setAdminSelectedSemester(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-150 dark:bg-white/5 text-xs font-bold text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30 cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem.toString()} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                    Semester {sem}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-500 dark:text-white/25 uppercase tracking-wider mr-1 hidden lg:inline">Students</span>
              <div className="flex -space-x-2">
                {students.filter(st => st.semester === adminSelectedSemester).map(st => (
                  <div
                    key={st.id}
                    className="w-8 h-8 rounded-full border-2 border-white dark:border-[#0a0f1e] overflow-hidden bg-rose-100 dark:bg-rose-900"
                    title={st.name}
                  >
                    <img src={st.avatarUrl} alt={st.name} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <button
                onClick={() => setActiveSubView("attendance")}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-white/40 hover:text-rose-500 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-500/30 transition-colors cursor-pointer"
                title="Mark Attendance"
              >
                <PlusIcon size={14} />
              </button>
            </div>

            <div className="h-5 w-[1px] bg-slate-200 dark:bg-white/10 hidden sm:block" />

            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifDropdown(!showNotifDropdown);
                  setShowProfileDropdown(false);
                }}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-white/40 hover:text-slate-800 dark:hover:text-white/70 relative transition-all duration-200 cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && notifications[0] !== "Welcome! No urgent alerts today." && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-gray-950 animate-ping" />
                )}
              </button>

              {showNotifDropdown && (
                <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 py-2 z-50 animate-in fade-in">
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <span className="font-bold text-sm text-gray-950 dark:text-white">Admin Reminders</span>
                    <span className="text-[10px] bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full font-bold">
                      {notifications.length} Active
                    </span>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {notifications.map((notif, index) => (
                      <div
                        key={index}
                        className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 border-b border-gray-50 dark:border-gray-800/30 last:border-b-0 text-xs text-gray-600 dark:text-gray-400"
                      >
                        {notif}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  setShowProfileDropdown(!showProfileDropdown);
                  setShowNotifDropdown(false);
                }}
                className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all duration-200 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-rose-700 overflow-hidden flex items-center justify-center border border-rose-600">
                  <span className="font-extrabold text-[10px] text-white">A</span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 py-2 z-50 animate-in fade-in">
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">Administrator</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => setPortalMode("student")}
                      className="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 flex items-center gap-2 cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5 text-gray-400" />
                      <span>Switch to Student Portal</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="p-6 md:p-8 space-y-6 flex-1 overflow-y-auto min-h-0">

          {activeSubView === "overview" && (
            <div className="space-y-8 animate-in fade-in duration-300">

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                <div className="lg:col-span-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[28px] p-6 relative overflow-hidden flex flex-col justify-between min-h-[220px] transition-colors duration-300">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div>
                    <span className="text-xs font-bold text-slate-500 dark:text-white/30 uppercase tracking-wider">Attendance</span>
                    <h2 className="text-sm font-extrabold text-slate-600 dark:text-white/50 mt-2">Overall Student Rate</h2>

                    <div className="flex items-baseline gap-3 mt-1.5">
                      <span className="text-4xl font-black tracking-tight text-gray-900 dark:text-white font-display">
                        {overallAdminRate !== null ? `${overallAdminRate}%` : "—"}
                      </span>
                    </div>
                  </div>

                  {overallAdminRate !== null ? (
                    <div className="w-full h-20 mt-4">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 500 80" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <path
                          d={`M0,60 C125,60 125,${graphY} 250,${graphY} C375,${graphY} 375,60 500,${graphY}`}
                          fill="none"
                          stroke="#f43f5e"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                        />
                        <path
                          d={`M0,60 C125,60 125,${graphY} 250,${graphY} C375,${graphY} 375,60 500,${graphY} L500,80 L0,80 Z`}
                          fill="url(#chartGrad)"
                        />
                        <circle cx="250" cy={graphY} r="5" fill="#f43f5e" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-full h-20 mt-4 flex items-center justify-center text-xs text-slate-400 dark:text-white/20 border border-dashed border-slate-200 dark:border-white/10 rounded-xl">
                      No attendance data recorded yet
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[24px] p-5 flex items-center justify-between transition-colors duration-300">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-white/30 uppercase tracking-wider">Top Class</span>
                      <h4 className="text-base font-extrabold text-gray-900 dark:text-white mt-1">{topClass ? topClass.name : "N/A"}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-white/40 mt-0.5">
                        {topClass ? `Average Attendance: ${topClass.rate}%` : "No attendance data"}
                      </p>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                      ✓
                    </div>
                  </div>
                  <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[24px] p-5 flex items-center justify-between transition-colors duration-300">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-white/30 uppercase tracking-wider">Attention Required</span>
                      <h4 className="text-base font-extrabold text-gray-900 dark:text-white mt-1">{attentionRequired ? attentionRequired.name : "N/A"}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-white/40 mt-0.5">
                        {attentionRequired ? `Average Attendance: ${attentionRequired.rate}%` : "No attendance data"}
                      </p>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-sm">
                      !
                    </div>
                  </div>
                  <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[24px] p-5 grid grid-cols-3 gap-2 text-center transition-colors duration-300">
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 dark:text-white/30 uppercase">Students</span>
                      <p className="text-base font-black text-gray-900 dark:text-white mt-0.5">
                        {students.filter(st => st.semester === adminSelectedSemester).length}
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 dark:text-white/30 uppercase">Assignments</span>
                      <p className="text-base font-black text-gray-900 dark:text-white mt-0.5">{totalTasks}</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 dark:text-white/30 uppercase">Notices</span>
                      <p className="text-base font-black text-gray-900 dark:text-white mt-0.5">{totalNotices}</p>
                    </div>
                  </div>
                </div>
              </div>

              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[28px] p-6 transition-colors duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">Active Notices</h3>
                    <button
                      onClick={() => setActiveSubView("notices")}
                      className="text-[10px] font-bold text-rose-400 hover:underline"
                    >
                      + Compose Notice
                    </button>
                  </div>
                  <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
                    {notices.map(nt => (
                      <div key={nt.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex justify-between gap-3 items-start">
                        <div className="space-y-0.5">
                          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${nt.type === "critical"
                            ? "bg-red-500/20 text-red-400 border border-red-500/20"
                            : nt.type === "warning"
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/20"
                              : "bg-blue-500/20 text-blue-400 border border-blue-500/20"
                            }`}>
                            {nt.type}
                          </span>
                          <h4 className="text-xs font-black text-gray-900 dark:text-white leading-tight mt-2">{nt.title}</h4>
                          <p className="text-[10px] text-slate-500 dark:text-white/40 font-medium leading-relaxed mt-0.5">{nt.description}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteNotice(nt.id)}
                          className="p-1.5 hover:bg-rose-500/10 text-white/25 hover:text-rose-400 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[28px] p-6 transition-colors duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">Assigned Tasks ({totalTasks})</h3>
                    <button
                      onClick={() => setActiveSubView("tasks")}
                      className="text-[10px] font-bold text-rose-400 hover:underline"
                    >
                      + Assign Task
                    </button>
                  </div>
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {tasks.map(tk => (
                      <div key={tk.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between gap-3">
                        <div>
                          <h4 className="text-xs font-black text-gray-900 dark:text-white leading-tight">{tk.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-bold bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-white/50 px-1.5 py-0.5 rounded">{tk.category}</span>
                            <span className="text-[10px] text-slate-500 dark:text-white/30 font-bold">Due: {tk.dueDate}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${tk.priority === "high"
                            ? "bg-red-500/20 text-red-400"
                            : tk.priority === "medium"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-green-500/20 text-green-400"
                            }`}>
                            {tk.priority}
                          </span>
                          <button
                            onClick={() => handleDeleteTask(tk.id)}
                            className="p-1.5 hover:bg-rose-500/10 text-white/25 hover:text-rose-400 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {activeSubView === "attendance" && (
            <div className="max-w-4xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[28px] p-6 animate-in fade-in duration-200 transition-colors duration-300">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10 mb-6">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 dark:text-white">Student Attendance</h3>
                  <p className="text-xs text-slate-500 dark:text-white/40 mt-0.5">Select a course and date to register attendance for students</p>
                </div>
                <UserCheck className="w-6 h-6 text-rose-500" />
              </div>

              {attendanceMsg && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-xs font-bold">
                  {attendanceMsg}
                </div>
              )}

              <form onSubmit={handleMarkAttendance} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">Class</label>
                    <select
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-[#fbfaf8] dark:bg-gray-950 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-gray-900 dark:text-white"
                      required
                    >
                      <option value="" disabled>Select Lecture</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">Date</label>
                    <input
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-[#fbfaf8] dark:bg-gray-950 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden mt-6 bg-[#faf9f7] dark:bg-gray-900/20">
                  <div className="grid grid-cols-12 bg-gray-50 dark:bg-gray-800/40 p-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                    <div className="col-span-4">Student</div>
                    <div className="col-span-5 text-center">Status</div>
                    <div className="col-span-3">Reason</div>
                  </div>

                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {students.filter(st => st.semester === adminSelectedSemester).map(st => (
                      <div key={st.id} className="grid grid-cols-12 p-3.5 items-center gap-2">
                        
                        <div className="col-span-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-rose-100">
                            <img src={st.avatarUrl} alt={st.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-900 dark:text-white leading-snug">{st.name}</p>
                            <p className="text-[9px] text-gray-400 dark:text-gray-500">{st.id === "student_default_user" ? "Logged In Student" : "Student"}</p>
                          </div>
                        </div>

                        
                        <div className="col-span-5 flex items-center justify-center gap-2">
                          {[
                            { value: "present" as const, label: "Present", color: "text-emerald-500 active:bg-emerald-500" },
                            { value: "absent" as const, label: "Absent", color: "text-red-500 active:bg-red-500" },
                            { value: "excused" as const, label: "Excused", color: "text-amber-500 active:bg-amber-500" },
                            { value: "cancelled" as const, label: "Cancelled", color: "text-gray-500 active:bg-gray-500" }
                          ].map(opt => (
                            <label
                              key={opt.value}
                              className={`flex-1 py-1.5 rounded-lg border text-[9px] font-bold text-center cursor-pointer transition-all ${(attendanceStatus[st.id] || "present") === opt.value
                                ? "bg-rose-500 text-white border-rose-500 shadow-sm"
                                : "bg-white dark:bg-gray-950 border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50"
                                }`}
                            >
                              <input
                                type="radio"
                                name={`status_${st.id}`}
                                value={opt.value}
                                checked={(attendanceStatus[st.id] || "present") === opt.value}
                                onChange={() => setAttendanceStatus(prev => ({ ...prev, [st.id]: opt.value }))}
                                className="sr-only"
                              />
                              {opt.label}
                            </label>
                          ))}
                        </div>

                        <div className="col-span-3">
                          <input
                            type="text"
                            placeholder="Reason for Absence"
                            value={attendanceNotes[st.id] || ""}
                            onChange={(e) => setAttendanceNotes(prev => ({ ...prev, [st.id]: e.target.value }))}
                            className="w-full px-3 py-1.5 rounded-xl border border-gray-150 dark:border-gray-800/80 bg-white dark:bg-gray-950 text-xs font-semibold text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500/20"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-xs shadow-md shadow-rose-500/10 transition-all hover:-translate-y-0.5"
                  >
                    Submit Student Attendance
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeSubView === "notices" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-200">

              <div className="lg:col-span-5 bg-white dark:bg-gray-900 rounded-[28px] p-6 shadow-sm border border-gray-100/50 dark:border-gray-800">
                <div className="pb-4 border-b border-gray-100 dark:border-gray-800/80 mb-6">
                  <h3 className="text-base font-extrabold text-gray-950 dark:text-white">Notice</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Post an notice for the students</p>
                </div>

                {noticeMsg && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 text-xs font-bold animate-pulse">
                    {noticeMsg}
                  </div>
                )}

                <form onSubmit={handleCreateNotice} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">Notice Title</label>
                    <input
                      type="text"
                      placeholder="Notice Title"
                      value={newNoticeTitle}
                      onChange={(e) => setNewNoticeTitle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-[#fbfaf8] dark:bg-gray-950 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-gray-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">Priority Level</label>
                    <div className="flex gap-2">
                      {[
                        { value: "critical" as const, label: "Important", activeColor: "bg-red-500 text-white border-red-500" },
                        { value: "warning" as const, label: "Warning", activeColor: "bg-amber-500 text-white border-amber-500" },
                        { value: "info" as const, label: "Information", activeColor: "bg-blue-500 text-white border-blue-500" }
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setNewNoticeType(opt.value)}
                          className={`flex-1 py-2 rounded-xl border text-[9px] font-bold text-center transition-all ${newNoticeType === opt.value
                            ? opt.activeColor
                            : "bg-[#fbfaf8] dark:bg-gray-950 border-gray-100 dark:border-gray-800 text-gray-500 hover:bg-gray-50"
                            }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">Description</label>
                    <textarea
                      placeholder="Enter the details of the notice..."
                      rows={4}
                      value={newNoticeDesc}
                      onChange={(e) => setNewNoticeDesc(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-[#fbfaf8] dark:bg-gray-950 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-gray-900 dark:text-white font-medium resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-xs shadow-md shadow-rose-500/10 transition-all"
                  >
                    Upload the Notice
                  </button>
                </form>
              </div>

              <div className="lg:col-span-7 bg-white dark:bg-gray-900 rounded-[28px] p-6 shadow-sm border border-gray-100/50 dark:border-gray-800">
                <div className="pb-4 border-b border-gray-100 dark:border-gray-800 mb-6">
                  <h3 className="text-base font-extrabold text-gray-950 dark:text-white font-display">Notice({totalNotices})</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Current active notices shown to students</p>
                </div>

                <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                  {notices.map(nt => (
                    <div
                      key={nt.id}
                      className="p-4 rounded-[20px] bg-[#faf9f7] dark:bg-gray-800/50 border border-gray-100/60 dark:border-gray-850 flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${nt.type === "critical"
                            ? "bg-red-50 dark:bg-red-950/20 text-red-600 border border-red-200/50"
                            : nt.type === "warning"
                              ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600 border border-amber-200/50"
                              : "bg-blue-50 dark:bg-blue-950/20 text-blue-600 border border-blue-200/50"
                            }`}>
                            {nt.type}
                          </span>
                          <span className="text-[9px] text-gray-400 dark:text-gray-500 font-bold">{nt.date}</span>
                        </div>
                        <h4 className="text-xs font-black text-gray-950 dark:text-white leading-snug mt-1.5">{nt.title}</h4>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed mt-0.5">{nt.description}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteNotice(nt.id)}
                        className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg shrink-0"
                        title="Delete Broadcast"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {activeSubView === "notes" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-200">

              <div className="lg:col-span-5 bg-white dark:bg-gray-900 rounded-[28px] p-6 shadow-sm border border-gray-100/50 dark:border-gray-800">
                <div className="pb-4 border-b border-gray-100 dark:border-gray-800/80 mb-6">
                  <h3 className="text-base font-extrabold text-gray-950 dark:text-white">Notes</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Upload Notes</p>
                </div>

                {noteMsg && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 text-xs font-bold">
                    {noteMsg}
                  </div>
                )}

                <form onSubmit={handleUploadNote} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">Note Title</label>
                    <input
                      type="text"
                      placeholder="Note Title"
                      value={newNoteTitle}
                      onChange={(e) => setNewNoteTitle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-[#fbfaf8] dark:bg-gray-950 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-gray-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">Subject</label>
                    <input
                      type="text"
                      placeholder="Subject"
                      value={newNoteCategory}
                      onChange={(e) => setNewNoteCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-[#fbfaf8] dark:bg-gray-950 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-gray-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">Upload Note PDF (Under 25MB)</label>
                    <input
                      type="file"
                      accept="application/pdf"
                      ref={noteFileInputRef}
                      onChange={handleNoteFileChange}
                      className="w-full px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-800 bg-[#fbfaf8] dark:bg-gray-950 text-xs focus:outline-none file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-rose-50 dark:file:bg-rose-950/30 file:text-rose-700 dark:file:text-rose-400 hover:file:bg-rose-100"
                      required
                    />
                    {newNoteFile && (
                      <p className="text-[10px] text-green-600 dark:text-green-400 mt-1 font-bold">
                        ✓ Selected: {newNoteFile.name} ({newNoteFile.size})
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-xs shadow-md shadow-rose-500/10 transition-all"
                  >
                    Upload Note
                  </button>
                </form>
              </div>

              <div className="lg:col-span-7 bg-white dark:bg-gray-900 rounded-[28px] p-6 shadow-sm border border-gray-100/50 dark:border-gray-800">
                <div className="pb-4 border-b border-gray-100 dark:border-gray-800 mb-6">
                  <h3 className="text-base font-extrabold text-gray-950 dark:text-white">Shared Notes</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Notes currently accessible by students</p>
                </div>

                <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                  {notes.map(nt => (
                    <div
                      key={nt.id}
                      className="p-4 rounded-[20px] bg-[#faf9f7] dark:bg-gray-800/50 border border-gray-100/60 dark:border-gray-850 flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1 w-full">
                        <span className="text-[8px] font-black uppercase bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 px-2 py-0.5 rounded">
                          {nt.category}
                        </span>
                        <h4 className="text-xs font-black text-gray-950 dark:text-white leading-snug mt-1.5">{nt.title}</h4>

                        {nt.attachments && nt.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {nt.attachments.map((attach: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                                <FileText className="w-3.5 h-3.5 text-blue-500" />
                                <a href={attach.dataUrl} download={attach.name} className="hover:underline">
                                  {attach.name} ({attach.size})
                                </a>
                              </div>
                            ))}
                          </div>
                        )}

                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold mt-1">Updated: {new Date(nt.updatedAt).toLocaleDateString()}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteNote(nt.id)}
                        className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg shrink-0"
                        title="Delete Note"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {activeSubView === "timetable" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-200">

              <div className="lg:col-span-5 bg-white dark:bg-gray-900 rounded-[28px] p-6 shadow-sm border border-gray-100/50 dark:border-gray-800">
                <div className="pb-4 border-b border-gray-100 dark:border-gray-800/80 mb-6">
                  <h3 className="text-base font-extrabold text-gray-950 dark:text-white">Schedule Lecture</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Add lectures to the student timetable</p>
                </div>

                {classMsg && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 text-xs font-bold">
                    {classMsg}
                  </div>
                )}

                <form onSubmit={handleAddClass} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">Lecture</label>
                    <input
                      type="text"
                      placeholder="Lecture Name"
                      value={classTitle}
                      onChange={(e) => setClassTitle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-[#fbfaf8] dark:bg-gray-950 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-gray-900 dark:text-white"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">Professor</label>
                      <input
                        type="text"
                        placeholder="Professor Name"
                        value={classProf}
                        onChange={(e) => setClassProf(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-[#fbfaf8] dark:bg-gray-950 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">Room</label>
                      <input
                        type="text"
                        placeholder="Room No"
                        value={classRoom}
                        onChange={(e) => setClassRoom(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-[#fbfaf8] dark:bg-gray-950 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">Day</label>
                      <select
                        value={classDay}
                        onChange={(e) => setClassDay(e.target.value)}
                        className="w-full px-2 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-[#fbfaf8] dark:bg-gray-950 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-gray-900 dark:text-white"
                      >
                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">Start Time</label>
                      <input
                        type="text"
                        value={classStart}
                        onChange={(e) => setClassStart(e.target.value)}
                        className="w-full px-2 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-[#fbfaf8] dark:bg-gray-950 text-xs font-bold text-center focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">End Time</label>
                      <input
                        type="text"
                        value={classEnd}
                        onChange={(e) => setClassEnd(e.target.value)}
                        className="w-full px-2 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-[#fbfaf8] dark:bg-gray-950 text-xs font-bold text-center focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">Color Badge</label>
                    <div className="flex gap-2">
                      {[
                        { value: "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/30", label: "Blue" },
                        { value: "bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/30", label: "Purple" },
                        { value: "bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900/30", label: "Green" },
                        { value: "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30", label: "Red" }
                      ].map(c => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setClassColor(c.value)}
                          className={`flex-1 py-2 rounded-xl text-[9px] font-extrabold border transition-all ${c.value} ${classColor === c.value ? "ring-2 ring-rose-500/45 scale-105" : "opacity-80"
                            }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-xs shadow-md shadow-rose-500/10 transition-all"
                  >
                    Schedule Lecture
                  </button>
                </form>
              </div>

              <div className="lg:col-span-7 bg-white dark:bg-gray-900 rounded-[28px] p-6 shadow-sm border border-gray-100/50 dark:border-gray-800">
                <div className="pb-4 border-b border-gray-100 dark:border-gray-800 mb-6">
                  <h3 className="text-base font-extrabold text-gray-950 dark:text-white">Active Schedule Session ({totalClasses})</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Classes shown in student weekly schedules</p>
                </div>

                <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                  {classes.map(c => (
                    <div
                      key={c.id}
                      className={`p-4 rounded-[20px] border flex items-center justify-between gap-4 ${c.color}`}
                    >
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-black leading-snug">{c.name}</h4>
                        <p className="text-[10px] opacity-90 font-semibold">{c.professor} • {c.room}</p>
                        <p className="text-[9px] opacity-75 font-black uppercase mt-1">
                          {c.day} • {c.startTime} - {c.endTime}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteClass(c.id)}
                        className="p-1.5 hover:bg-red-100/50 text-current/80 hover:text-red-500 rounded-lg shrink-0"
                        title="Delete Session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {activeSubView === "tasks" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-200">

              <div className="lg:col-span-5 bg-white dark:bg-gray-900 rounded-[28px] p-6 shadow-sm border border-gray-100/50 dark:border-gray-800">
                <div className="pb-4 border-b border-gray-100 dark:border-gray-800/80 mb-6">
                  <h3 className="text-base font-extrabold text-gray-950 dark:text-white">Assign Assignment</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Publish assignments to student</p>
                </div>

                {taskMsg && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 text-xs font-bold">
                    {taskMsg}
                  </div>
                )}

                <form onSubmit={handleAddTask} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">Assignment Title</label>
                    <input
                      type="text"
                      placeholder="Assignment Name"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-[#fbfaf8] dark:bg-gray-950 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-gray-900 dark:text-white"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">Due Date</label>
                      <input
                        type="date"
                        value={taskDueDate}
                        onChange={(e) => setTaskDueDate(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-[#fbfaf8] dark:bg-gray-950 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">Subject / Category</label>
                      <select
                        value={taskCategory}
                        onChange={(e) => setTaskCategory(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-[#fbfaf8] dark:bg-gray-950 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-gray-900 dark:text-white"
                        required
                      >
                        <option value="General">General</option>
                        {Array.from(new Set(classes.map(c => c.name))).map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">Attach Assignment Document (PDF only, under 25MB)</label>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleTaskAttachmentChange}
                      className="w-full px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-800 bg-[#fbfaf8] dark:bg-gray-950 text-xs focus:outline-none file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-rose-50 dark:file:bg-rose-950/30 file:text-rose-700 dark:file:text-rose-400 hover:file:bg-rose-100"
                    />
                    {taskAttachment && (
                      <p className="text-[10px] text-green-600 dark:text-green-400 mt-1 font-bold">
                        ✓ Attached: {taskAttachment.name} ({taskAttachment.size})
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-xs shadow-md shadow-rose-500/10 transition-all"
                  >
                    Upload Assignment
                  </button>
                </form>
              </div>

              <div className="lg:col-span-7 bg-white dark:bg-gray-900 rounded-[28px] p-6 shadow-sm border border-gray-100/50 dark:border-gray-800">
                <div className="pb-4 border-b border-gray-100 dark:border-gray-800 mb-6">
                  <h3 className="text-base font-extrabold text-gray-950 dark:text-white">Active Assignments ({totalTasks})</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Assignments currently uploaded</p>
                </div>

                <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                  {tasks.map(tk => (
                    <div
                      key={tk.id}
                      className="p-4 rounded-[20px] bg-[#faf9f7] dark:bg-gray-800/50 border border-gray-100/60 dark:border-gray-850 flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <span className="text-[8px] font-black uppercase bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                          {tk.category}
                        </span>
                        <h4 className="text-xs font-black text-gray-950 dark:text-white leading-snug mt-2">{tk.title}</h4>
                        {tk.description && <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed mt-0.5">{tk.description}</p>}
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold mt-1">Due: {tk.dueDate}</p>

                        {tk.attachments && tk.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <span className="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Attachment:</span>
                            {tk.attachments.map((attach, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                                <FileText className="w-3 h-3 text-blue-500" />
                                <a href={attach.content} download={attach.name} className="hover:underline">
                                  {attach.name} ({attach.size})
                                </a>
                              </div>
                            ))}
                          </div>
                        )}

                        {tk.submissions && tk.submissions.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-850">
                            <span className="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Student Submission:</span>
                            {tk.submissions.map((sub, idx) => (
                              <div key={idx} className="flex items-center justify-between gap-2 mt-1 p-1 rounded bg-[#fbfaf8] dark:bg-gray-950 border border-gray-100 dark:border-gray-800">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <FileText className="w-3.5 h-3.5 text-green-500 shrink-0" />
                                  <a href={sub.content} download={sub.name} className="text-[9px] font-bold text-blue-600 dark:text-blue-400 hover:underline truncate">
                                    {sub.name}
                                  </a>
                                  <span className="text-[8px] text-gray-400 font-semibold shrink-0">({sub.size})</span>
                                  {sub.studentName && (
                                    <span className="text-[9px] font-semibold text-gray-600 dark:text-gray-400 ml-1.5 shrink-0">
                                      - {sub.studentName}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[8px] text-gray-400 dark:text-gray-500 font-bold shrink-0">{new Date(sub.submittedAt).toLocaleDateString()}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteTask(tk.id)}
                        className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg shrink-0"
                        title="Delete Assignment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </main>
      </div>

    </div>
  );
};
