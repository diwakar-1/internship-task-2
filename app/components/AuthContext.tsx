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
  signInAsGuest: () => Promise<void>;
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

    // Check if guest is authenticated
    const isGuest = typeof window !== "undefined" && localStorage.getItem("guest_authenticated") === "true";
    if (isGuest) {
      dbService.setUserId("student_default_user");
      dbService.getProfile().then((p) => {
        const guestUser = {
          uid: "student_default_user",
          displayName: p.name || "Guest Student",
          email: p.email || "guest@studentmaker.com",
          photoURL: p.avatarUrl || ""
        } as User;
        setUser(guestUser);
        if (p && p.name && p.role) {
          setProfile(p);
          setIsProfileComplete(true);
        } else {
          setProfile(null);
          setIsProfileComplete(false);
        }
        setLoading(false);
      });
      return;
    }

    // Capture the result of a redirect sign-in flow (if any)
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log("Successfully signed in via redirect:", result.user.email);
        }
      })
      .catch((error) => {
        console.error("Redirect sign-in error:", error);
        if (error.code === "auth/unauthorized-domain") {
          alert(
            "Domain Unauthorized:\n\nPlease add this domain (student-marker.vercel.app) to your Firebase Console under 'Authentication' -> 'Settings' -> 'Authorized domains' to enable Google Sign-In."
          );
        } else {
          alert(`Redirect Sign-in failed: ${error.message}`);
        }
      });

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
      console.warn("Sign-in with popup failed, checking fallback:", error.code, error.message);
      if (error.code === "auth/popup-blocked") {
        try {
          await signInWithRedirect(auth, provider);
        } catch (redirectError: any) {
          console.error("Sign-in with redirect failed:", redirectError);
          if (redirectError.code === "auth/unauthorized-domain") {
            alert(
              "Domain Unauthorized:\n\nPlease add this domain (student-marker.vercel.app) to your Firebase Console under 'Authentication' -> 'Settings' -> 'Authorized domains' to enable Google Sign-In."
            );
          } else {
            alert(`Sign-in failed: ${redirectError.message}`);
          }
        }
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
    if (typeof window !== "undefined") {
      localStorage.removeItem("guest_authenticated");
    }
    const auth = dbService.getAuth();
    if (!auth) {
      setUser(null);
      setProfile(null);
      setIsProfileComplete(false);
      dbService.setUserId("student_default_user");
      return;
    }
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Sign-out error:", error);
    }
    setUser(null);
    setProfile(null);
    setIsProfileComplete(false);
    dbService.setUserId("student_default_user");
  };

  const signInAsGuest = async () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("guest_authenticated", "true");
    }
    dbService.setUserId("student_default_user");
    const p = await dbService.getProfile();
    const guestUser = {
      uid: "student_default_user",
      displayName: p.name || "Guest Student",
      email: p.email || "guest@studentmaker.com",
      photoURL: p.avatarUrl || ""
    } as User;
    
    setUser(guestUser);
    
    if (p && p.name && p.role) {
      setProfile(p);
      setIsProfileComplete(true);
    } else {
      setProfile(null);
      setIsProfileComplete(false);
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
      enrollmentYear: profileData.enrollmentYear || "",
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
    <AuthContext.Provider value={{ user, loading, isProfileComplete, profile, signIn, signOut, completeProfile, reloadProfile, signInAsGuest }}>
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
