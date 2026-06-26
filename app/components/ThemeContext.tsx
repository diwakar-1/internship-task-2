import React, { createContext, useContext, useState, useEffect } from "react";

type Theme = "light" | "dark";
type View = "dashboard" | "timetable" | "tasks" | "attendance" | "notes" | "profile";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  currentView: View;
  setCurrentView: (view: View) => void;
  portalMode: "student" | "admin";
  setPortalMode: (mode: "student" | "admin") => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme") as Theme;
      if (savedTheme) return savedTheme;
    }
    return "light"; // Default to light mode
  });

  const [currentView, setCurrentView] = useState<View>("dashboard");
  const [portalMode, setPortalModeState] = useState<"student" | "admin">(() => {
    if (typeof window !== "undefined") {
      const savedMode = localStorage.getItem("portalMode") as "student" | "admin";
      if (savedMode) return savedMode;
    }
    return "student"; // Default to student portal
  });

  
  const setPortalMode = (mode: "student" | "admin") => {
    setPortalModeState(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("portalMode", mode);
    }
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, currentView, setCurrentView, portalMode, setPortalMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
