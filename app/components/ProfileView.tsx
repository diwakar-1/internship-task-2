import React, { useState, useEffect, useRef } from "react";
import { dbService } from "../services/firebaseService";
import type { StudentProfile } from "../services/firebaseService";
import {
  User,
  Download,
  Upload,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { useTheme } from "./ThemeContext";

interface ProfileViewProps {
  profile: StudentProfile;
  onProfileUpdated: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ profile, onProfileUpdated }) => {
  const { portalMode } = useTheme();
  const isStudent = portalMode === "student";
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Personal Info Form States
  const [name, setName] = useState(profile.name);
  const [role, setRole] = useState(profile.role);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [bio, setBio] = useState(profile.bio);
  const [semester, setSemester] = useState(profile.semester || "");

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setAvatarUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    // Populate form states from current profile
    setName(profile.name);
    setRole(profile.role);
    setAvatarUrl(profile.avatarUrl);
    setBio(profile.bio);
    setSemester(profile.semester || "");
  }, [profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    const updatedProfile: StudentProfile = {
      ...profile,
      name,
      role,
      avatarUrl,
      bio,
      semester
    };

    await dbService.saveProfile(updatedProfile);
    onProfileUpdated();
    alert("Profile saved successfully!");
  };

  // Export Data Module
  const handleExportData = async () => {
    try {
      const data = await dbService.exportAllData();
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `studentmaker_backup_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to export database items.");
    }
  };

  // Import Data Module
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const success = await dbService.importAllData(content);
      if (success) {
        alert("Database import completed successfully! Refreshing view components...");
        onProfileUpdated();
      } else {
        alert("Invalid JSON format. Database restore aborted.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 overflow-y-auto max-h-[calc(100vh-80px)] flex items-center justify-center">

      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between w-full max-w-2xl">
        <div className="space-y-5">
          <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-800/60">
            <h3 className="text-sm font-bold text-gray-950 dark:text-white flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Personal Identity</span>
            </h3>
            <span className="text-[10px] bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/30 px-2 py-0.5 rounded-full font-bold">
              Active Profile
            </span>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            
            <div className="flex flex-col items-center gap-4 py-4 border-b border-gray-100 dark:border-gray-800/40">
              <div className="relative group w-24 h-24 rounded-2xl overflow-hidden border-4 border-white dark:border-gray-800 shadow-md">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <User className="w-10 h-10 text-white" />
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold gap-1"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload</span>
                </button>
              </div>
              <div className="text-center animate-in fade-in duration-300">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-800/80 rounded-xl text-xs font-bold transition-all"
                >
                  Change Profile Photo
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kristin Watson"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800/80 bg-gray-50 dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">Branch</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Design Manager & CS Student"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800/80 bg-gray-50 dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">Semester</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800/80 bg-gray-50 dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white font-medium"
                required
              >
                <option value="">Select Semester</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem.toString()}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">About</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800/80 bg-gray-50 dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white font-medium"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/10 transition-all"
            >
              Update Profile Details
            </button>
          </form>
        </div>
      </div>

    </div>
  );
};
