import React from "react";
import { useTheme } from "./ThemeContext";
import {
  User,
  X,
  Sun,
  Moon,
  ShieldCheck
} from "lucide-react";
import {
  HomeIcon,
  CalendarIcon,
  CheckIcon,
  UsersIcon,
  ItineraryIcon,
  MagicStarIcon
} from "./CustomIcons";

import studentLogo from "../../icons/Student.png";

import type { StudentProfile } from "../services/firebaseService";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  profile: StudentProfile;
  avatarUrl?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, profile, avatarUrl }) => {
  const { currentView, setCurrentView, theme, toggleTheme, setPortalMode } = useTheme();

  const navGroups = [
    {
      items: [
        { id: "dashboard" as const, label: "Home", icon: HomeIcon, accent: "from-blue-500 to-indigo-600" },
      ]
    },
    {
      label: "Academic",
      items: [
        { id: "timetable" as const, label: "Timetable", icon: CalendarIcon, accent: "from-violet-500 to-purple-600" },
        { id: "attendance" as const, label: "Attendance", icon: UsersIcon, accent: "from-teal-500 to-cyan-600" },
        { id: "tasks" as const, label: "Assignments", icon: CheckIcon, accent: "from-orange-500 to-amber-600" },
        { id: "notes" as const, label: "Notes", icon: ItineraryIcon, accent: "from-rose-500 to-pink-600" },
        { id: "profile" as const, label: "Profile", icon: User, accent: "from-green-500 to-emerald-600" },
      ]
    },
  ];

  
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-950/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-slate-50 dark:bg-[#0a0f1e] border-r border-slate-200 dark:border-white/5 transition-all duration-300 ease-in-out lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="absolute top-0 left-0 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 right-0 w-32 h-32 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex items-center justify-center h-20 px-5 border-b border-slate-200 dark:border-white/10 shrink-0">
          <div className="flex items-center justify-center h-16 w-full">
            <img
              src={studentLogo}
              alt="Student Logo"
              className={`h-46 w-auto object-contain transition-all duration-300 ${theme === "dark"
                ? "invert mix-blend-screen"
                : "mix-blend-multiply"
                }`}
            />
          </div>
          <button
            className="absolute right-4 p-1.5 rounded-lg text-slate-400 dark:text-white/40 hover:text-slate-600 hover:bg-slate-200/50 dark:hover:text-white dark:hover:bg-white/10 lg:hidden transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="relative flex-1 px-3 py-5 space-y-5 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-white/30 px-3 mb-2">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentView(item.id);
                        setIsOpen(false);
                      }}
                      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium tracking-wide transition-all duration-200 group ${isActive
                        ? "bg-slate-200/50 dark:bg-white/10 text-slate-900 dark:text-white border border-slate-200/60 dark:border-white/10 shadow-inner"
                        : "text-slate-500 dark:text-white/50 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/5"
                        }`}
                    >
                      
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${isActive
                        ? `bg-gradient-to-br ${item.accent} shadow-md`
                        : "bg-slate-200/30 dark:bg-white/5 group-hover:bg-slate-200/60 group-hover:dark:bg-white/10"
                        }`}>
                        <Icon
                          className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-500 dark:text-white/50 group-hover:text-slate-700 dark:group-hover:text-white/80"}`}
                        />
                      </div>
                      <span>{item.label}</span>
                      {isActive && (
                        <div className="ml-auto w-1 h-1 rounded-full bg-blue-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        
        <div className="relative px-4 py-4 border-t border-slate-200 dark:border-white/10 space-y-3">
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-200/30 hover:bg-slate-200/60 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-bold text-slate-500 dark:text-white/50 hover:text-slate-800 dark:hover:text-white transition-all"
              title="Toggle Theme"
            >
              {theme === "light" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
              <span>Theme</span>
            </button>
             <button
              onClick={() => {
                const pin = prompt("Enter Admin PIN:");
                if (pin === "1212") {
                  setPortalMode("admin");
                } else if (pin !== null) {
                  alert("Incorrect PIN!");
                }
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-200/30 hover:bg-rose-500/10 dark:bg-white/5 dark:hover:bg-blue-600/20 border border-slate-200 dark:border-white/10 hover:border-rose-500/30 dark:hover:border-blue-500/40 rounded-xl text-[10px] font-bold text-slate-500 dark:text-white/50 hover:text-rose-600 dark:hover:text-blue-400 transition-all"
              title="Switch to Admin Portal"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>

          
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-200/30 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200 dark:border-gray-800">
                {(avatarUrl || profile.avatarUrl) ? (
                  <img
                    src={avatarUrl || profile.avatarUrl}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <span className="font-extrabold text-[10px] text-white">
                      {profile.name ? profile.name.split(" ").map(n => n[0]).join("").toUpperCase() : "SM"}
                    </span>
                  </div>
                )}
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 ${theme === "dark" ? "border-[#0a0f1e]" : "border-slate-50"
                }`} />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{profile.name || "Student"}</p>
              <p className="text-[10px] text-slate-400 dark:text-white/40 font-medium truncate">{profile.role || "Scholar"}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
