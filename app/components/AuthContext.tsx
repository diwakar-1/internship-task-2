import React, { createContext, useContext, useState, useEffect } from "react";
import {
  dbService,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  firebaseSignOut,
} from "../services/firebaseService";
import type { User, StudentProfile } from "../services/firebaseService";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isProfileComplete: boolean;
  profile: StudentProfile | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  completeProfile: (profileData: Partial<StudentProfile>) => Promise<void>;
  reloadProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [profile, setProfile] = useState<StudentProfile | null>(null);

  const checkProfile = async (uid: string) => {
    dbService.setUserId(uid);
    try {
      const p = await dbService.getProfile();
      if (p && p.name && p.role) {
        setProfile(p);
        setIsProfileComplete(true);
      } else {
        setProfile(null);
        setIsProfileComplete(false);
      }
    } catch {
      setProfile(null);
      setIsProfileComplete(false);
    }
  };

  useEffect(() => {
    const auth = dbService.getAuth();
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await checkProfile(firebaseUser.uid);
      } else {
        setUser(null);
        setProfile(null);
        setIsProfileComplete(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    const auth = dbService.getAuth();
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === "auth/popup-blocked") {
        alert(
          "Sign-in Popup Blocked:\n\nYour browser blocked the Google Sign-in popup. Please allow/enable popups for this site, or disable tracking protection, then try again."
        );
      } else if (error.code === "auth/unauthorized-domain") {
        alert(
          "Domain Unauthorized:\n\nPlease add this domain (student-marker.vercel.app) to your Firebase Console under 'Authentication' -> 'Settings' -> 'Authorized domains' to enable Google Sign-In."
        );
      } else if (error.code !== "auth/popup-closed-by-user") {
        alert(`Sign-in failed: ${error.message}`);
      }
    }
  };

  const signOut = async () => {
    const auth = dbService.getAuth();
    if (!auth) return;
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setProfile(null);
      setIsProfileComplete(false);
      dbService.setUserId("student_default_user");
    } catch (error) {
      console.error("Sign-out error:", error);
    }
  };

  const completeProfile = async (profileData: Partial<StudentProfile>) => {
    if (!user) return;
    dbService.setUserId(user.uid);

    const fullProfile: StudentProfile = {
      name: profileData.name || user.displayName || "Student",
      role: profileData.role || "Student",
      avatarUrl: profileData.avatarUrl || user.photoURL || "",
      bio: profileData.bio || "",
      email: profileData.email || user.email || "",
      semester: profileData.semester || "",
      department: profileData.department || "",
    };

    await dbService.saveProfile(fullProfile);
    setProfile(fullProfile);
    setIsProfileComplete(true);
  };

  const reloadProfile = async () => {
    if (user) {
      dbService.setUserId(user.uid);
      const p = await dbService.getProfile();
      setProfile(p);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isProfileComplete, profile, signIn, signOut, completeProfile, reloadProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
