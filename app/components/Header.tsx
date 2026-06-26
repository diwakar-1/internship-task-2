import React, { useState, useEffect } from "react";
import { useTheme } from "./ThemeContext";
import { dbService } from "../services/firebaseService";
import type { TaskItem } from "../services/firebaseService";
import {
  Sun,
  Moon,
  Search,
  Bell,
  ChevronDown,
  Settings,
  LogOut
} from "lucide-react";
import { MenuIcon } from "./CustomIcons";
import { useAuth } from "./AuthContext";

interface HeaderProps {
  onToggleSidebar: () => void;
  profileName: string;
  profileRole?: string;
  avatarUrl: string;
  isFirebaseConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  profileName,
  profileRole,
  avatarUrl,
  isFirebaseConnected
}) => {
  const { theme, toggleTheme, setPortalMode } = useTheme();
  const { signOut } = useAuth();
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  useEffect(() => {
    const fetchReminders = async () => {
      try {
        const tasks = await dbService.getTasks();
        const pending = tasks.filter(t => t.status !== "completed");
        const alerts: string[] = [];

        
        const todayStr = new Date().toISOString().split("T")[0];
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split("T")[0];

        const urgentTasks = pending.filter(t => t.dueDate === todayStr || t.dueDate === tomorrowStr);
        urgentTasks.forEach(t => {
          alerts.push(`Task due soon: "${t.title}" (${t.priority} priority)`);
        });

        if (alerts.length === 0) {
          alerts.push("No upcoming tasks due today! Keep it up.");
          alerts.push("Don't forget to mark your attendance for today's classes.");
        }

        setNotifications(alerts);
      } catch (err) {
        console.error(err);
      }
    };
    fetchReminders();
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-white/70 dark:bg-[#0a0f1e]/90 border-b border-indigo-100/60 dark:border-indigo-900/30 backdrop-blur-xl">
      
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-gray-500 hover:bg-indigo-50 dark:hover:bg-white/10 lg:hidden focus:outline-none"
        >
          <MenuIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-700 to-blue-600 dark:from-indigo-300 dark:to-blue-400 bg-clip-text text-transparent leading-tight">
            Welcome, {profileName.split(" ")[0]}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifDropdown(!showNotifDropdown);
              setShowProfileDropdown(false);
            }}
            className="p-2 rounded-xl bg-indigo-50 dark:bg-white/5 border border-indigo-100/80 dark:border-white/10 text-indigo-500 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-white/10 transition-all duration-200 relative"
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && notifications[0] !== "No upcoming tasks due today! Keep it up." && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-950 animate-ping" />
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <span className="font-bold text-sm text-gray-950 dark:text-white">Reminders</span>
                <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold">
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
            className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-indigo-50 dark:hover:bg-white/5 border border-transparent hover:border-indigo-100 dark:hover:border-white/10 transition-all duration-200"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100 overflow-hidden flex items-center justify-center border border-blue-200 dark:border-blue-900">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-xs text-blue-600">KW</span>
              )}
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>

          {showProfileDropdown && (
            <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{profileName}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{profileRole || "CS & Design Student"}</p>
              </div>
              <div className="p-1">
                <button
                  onClick={() => signOut()}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-red-650 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 rounded-xl transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
