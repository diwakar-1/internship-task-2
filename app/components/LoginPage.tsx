import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import campusLogo from "../../icons/Student.png";

export const LoginPage: React.FC = () => {
  const { signIn, signInAsGuest } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signIn();
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 dark:from-[#070b18] dark:via-[#0a1029] dark:to-[#0d0f25] relative overflow-hidden">

      
      <div className="absolute top-[-120px] left-[-80px] w-[400px] h-[400px] bg-blue-400/15 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-60px] w-[350px] h-[350px] bg-indigo-400/15 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[200px] h-[200px] bg-rose-300/10 dark:bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />

      
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-2xl border border-white/60 dark:border-white/10 rounded-[32px] shadow-2xl shadow-blue-900/5 dark:shadow-black/20 p-8 md:p-10">

          
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20 flex items-center justify-center mb-5 overflow-hidden">
              <img
                src={campusLogo}
                alt="Student Maker"
                className="w-16 h-16 object-contain invert mix-blend-screen"
              />
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              STUDENT MAKER
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 font-medium text-center max-w-[260px] leading-relaxed">
              Student Dashboard
            </p>
          </div>

          
          <div className="flex items-center gap-3 mb-7">
            <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-gray-200 dark:via-white/10 to-transparent" />
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Sign in to continue</span>
            <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-gray-200 dark:via-white/10 to-transparent" />
          </div>
          <button
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white dark:bg-white/10 hover:bg-gray-50 dark:hover:bg-white/15 border border-gray-200 dark:border-white/15 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSigningIn ? (
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            <span className="text-sm font-bold text-gray-700 dark:text-white/80 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
              {isSigningIn ? "Signing in..." : "Continue with Google"}
            </span>
          </button>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-gray-200 dark:via-white/10 to-transparent" />
            <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">or</span>
            <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-gray-200 dark:via-white/10 to-transparent" />
          </div>

          <button
            onClick={signInAsGuest}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30 border border-indigo-100/50 dark:border-indigo-900/30 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 text-sm font-bold text-indigo-600 dark:text-indigo-400"
          >
            Continue in Offline Mode
          </button>
        </div>
      </div>
    </div>
  );
};
