import React, { useState, useEffect } from "react";
import type { Route } from "./+types/home";
import { ThemeProvider, useTheme } from "../components/ThemeContext";
import { AuthProvider, useAuth } from "../components/AuthContext";
import { LoginPage } from "../components/LoginPage";
import { ProfileSetup } from "../components/ProfileSetup";
import { Sidebar } from "../components/Sidebar";
import { Header } from "../components/Header";
import { DashboardView } from "../components/DashboardView";
import { TimetableView } from "../components/TimetableView";
import { TasksView } from "../components/TasksView";
import { AttendanceView } from "../components/AttendanceView";
import { NotesView } from "../components/NotesView";
import { ProfileView } from "../components/ProfileView";
import { dbService } from "../services/firebaseService";
import type { StudentProfile } from "../services/firebaseService";
import { AdminDashboard } from "../components/AdminDashboard";


export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Student Maker " },
    { name: "description", content: "" },
  ];
}

// Inner layout that utilizes ThemeContext values
const DashboardLayout: React.FC = () => {
  const { currentView, setCurrentView } = useTheme();
  const { profile: authProfile, reloadProfile: reloadAuthProfile, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  const [profile, setProfile] = useState<StudentProfile | null>(null);

  // Load profile details and refresh connection status
  const reloadProfile = async () => {
    try {
      const data = await dbService.getProfile();
      setProfile(data);
      setIsFirebaseConnected(dbService.isUsingFirebase());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    reloadProfile();
  }, []);

  if (!profile) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Loading Student Maker Portal...</p>
        </div>
      </div>
    );
  }

  // Render the selected view panel
  const renderActiveView = () => {
    const viewStyle = "w-full animate-in fade-in slide-in-from-bottom-3 duration-300 fill-mode-both";
    switch (currentView) {
      case "dashboard":
        return <div className={viewStyle}><DashboardView onNavigateToView={setCurrentView} profile={profile} /></div>;
      case "timetable":
        return <div className={viewStyle}><TimetableView /></div>;
      case "tasks":
        return <div className={viewStyle}><TasksView /></div>;
      case "attendance":
        return <div className={viewStyle}><AttendanceView /></div>;
      case "notes":
        return <div className={viewStyle}><NotesView /></div>;
      case "profile":
        return <div className={viewStyle}><ProfileView profile={profile} onProfileUpdated={reloadProfile} /></div>;
      default:
        return <div className={viewStyle}><DashboardView onNavigateToView={setCurrentView} profile={profile} /></div>;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#eef2ff] dark:bg-gray-950 font-sans antialiased text-gray-900 dark:text-gray-100 transition-colors duration-200">
      
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} profile={profile} avatarUrl={user?.photoURL || profile.avatarUrl} />

      
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 h-full relative">
        
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          profileName={profile.name}
          profileRole={profile.role}
          avatarUrl={user?.photoURL || profile.avatarUrl}
          isFirebaseConnected={isFirebaseConnected}
        />

        
        <main className="flex-1 min-h-0 relative">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
};

// Auth-gated portal root
const AuthGatedApp: React.FC = () => {
  const { user, loading, isProfileComplete } = useAuth();
  const { portalMode } = useTheme();

  useEffect(() => {
    if (!user || !isProfileComplete) return;

    const unsubs = dbService.subscribeRealtimeNotifications((title, body) => {
      dbService.triggerLocalNotification(title, body);
    });

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [user?.uid, isProfileComplete]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Not logged in → show login page
  if (!user) {
    return <LoginPage />;
  }

  // Logged in but profile not complete → show setup
  if (!isProfileComplete) {
    return <ProfileSetup />;
  }

  // Fully authenticated → show portal
  if (portalMode === "admin") {
    return <AdminDashboard />;
  }
  return <DashboardLayout />;
};

export default function Home() {
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          console.log("Notification permission status:", permission);
        });
      }
    }
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthGatedApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
