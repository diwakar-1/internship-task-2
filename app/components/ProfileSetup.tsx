import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import { GraduationCap, User, BookOpen, Building2, Calendar, ArrowRight } from "lucide-react";

export const ProfileSetup: React.FC = () => {
  const { user, completeProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(user?.displayName || "");
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState("");

  
  const handleSubmit = async () => {
    if (!name || !role) return;
    setSaving(true);
    try {
      await completeProfile({
        name,
        role,
        avatarUrl: user?.photoURL || "",
        bio,
        email: user?.email || "",
        department,
        semester,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 dark:from-[#070b18] dark:via-[#0a1029] dark:to-[#0d0f25] relative overflow-hidden">

      
      <div className="absolute top-[-100px] right-[-60px] w-[350px] h-[350px] bg-emerald-400/10 dark:bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-80px] left-[-40px] w-[300px] h-[300px] bg-blue-400/10 dark:bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg mx-4">
        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-2xl border border-white/60 dark:border-white/10 rounded-[32px] shadow-2xl shadow-blue-900/5 dark:shadow-black/20 p-8 md:p-10">

          
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="w-20 h-20 rounded-2xl object-cover border-4 border-white dark:border-gray-800 shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <User className="w-10 h-10 text-white" />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 border-3 border-white dark:border-gray-900 flex items-center justify-center">
                <GraduationCap className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
              Complete Your Profile
            </h2>
            
            <div className="flex items-center gap-2 mt-4">
              <div className={`w-8 h-1.5 rounded-full transition-all ${step >= 1 ? "bg-blue-500" : "bg-gray-200 dark:bg-gray-700"}`} />
              <div className={`w-8 h-1.5 rounded-full transition-all ${step >= 2 ? "bg-blue-500" : "bg-gray-200 dark:bg-gray-700"}`} />
            </div>
          </div>

          
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">
                  <User className="w-3.5 h-3.5" />
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  Branch
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Btech Aiml"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="CEC,CCE"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                />
              </div>

              <button
                onClick={() => {
                  if (!name || !role) return;
                  setStep(2);
                }}
                disabled={!name || !role}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/10 transition-all disabled:cursor-not-allowed mt-2"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Semester
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                  required
                >
                  <option value="">Select semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                    <option key={sem} value={sem.toString()}>Semester {sem}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself, your interests..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none"
                />
              </div>

              
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Email (from Google)</p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{user?.email || "—"}</p>
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex-[2] flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-500/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <GraduationCap className="w-4 h-4" />
                      <span>Complete Setup</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
