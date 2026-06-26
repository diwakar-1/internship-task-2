import React, { useState, useEffect } from "react";
import { dbService } from "../services/firebaseService";
import type { TimetableClass } from "../services/firebaseService";
import { Plus, Trash2, Edit2, X, Move, Clock, MapPin, User } from "lucide-react";
import { useTheme } from "./ThemeContext";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

const COLORS = [
  { name: "Red", value: "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30" },
  { name: "Blue", value: "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/30" },
  { name: "Green", value: "bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900/30" },
  { name: "Purple", value: "bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/30" },
  { name: "Amber", value: "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/30" },
];

const getPremiumColorStyle = (colorValue: string) => {
  if (colorValue.includes("red") || colorValue.includes("rose")) {
    return "bg-gradient-to-br from-rose-50/95 to-red-50/70 dark:from-rose-950/30 dark:to-red-950/10 text-rose-600 dark:text-rose-400 border-rose-200/50 dark:border-rose-900/35 shadow-sm shadow-rose-500/5";
  }
  if (colorValue.includes("blue")) {
    return "bg-gradient-to-br from-blue-50/95 to-sky-50/70 dark:from-blue-950/30 dark:to-sky-950/10 text-blue-600 dark:text-blue-450 border-blue-200/50 dark:border-blue-900/35 shadow-sm shadow-blue-500/5";
  }
  if (colorValue.includes("green") || colorValue.includes("emerald")) {
    return "bg-gradient-to-br from-emerald-50/95 to-teal-50/70 dark:from-emerald-950/30 dark:to-teal-950/10 text-emerald-600 dark:text-emerald-450 border-emerald-200/50 dark:border-emerald-900/35 shadow-sm shadow-emerald-500/5";
  }
  if (colorValue.includes("purple") || colorValue.includes("indigo")) {
    return "bg-gradient-to-br from-indigo-50/95 to-purple-50/70 dark:from-indigo-950/30 dark:to-purple-950/10 text-indigo-600 dark:text-indigo-450 border-indigo-200/50 dark:border-indigo-900/35 shadow-sm shadow-indigo-500/5";
  }
  if (colorValue.includes("amber") || colorValue.includes("orange")) {
    return "bg-gradient-to-br from-amber-50/95 to-orange-50/70 dark:from-amber-950/30 dark:to-orange-950/10 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/35 shadow-sm shadow-amber-500/5";
  }
  return colorValue;
};

export const TimetableView: React.FC = () => {
  const { portalMode } = useTheme();
  const isStudent = portalMode === "student";
  const [classes, setClasses] = useState<TimetableClass[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<TimetableClass | null>(null);

  const isToday = (dayName: string) => {
    const todayIndex = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    const DAYS_MAPPING = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return DAYS_MAPPING[todayIndex] === dayName;
  };

  const [name, setName] = useState("");
  const [professor, setProfessor] = useState("");
  const [room, setRoom] = useState("");
  const [day, setDay] = useState("Monday");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [color, setColor] = useState(COLORS[1].value);

  useEffect(() => {
    const unsubscribe = dbService.subscribeClasses((list) => {
      setClasses(list);
    });
    if (!unsubscribe) {
      loadClasses();
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const loadClasses = async () => {
    const list = await dbService.getClasses();
    setClasses(list);
  };

  const openAddModal = (initialDay?: string, initialHour?: number) => {
    setEditingClass(null);
    setName("");
    setProfessor("");
    setRoom("");
    setDay(initialDay || "Monday");
    
    const formattedHour = initialHour !== undefined 
      ? `${initialHour.toString().padStart(2, "0")}:00` 
      : "09:00";
    const formattedEndHour = initialHour !== undefined 
      ? `${(initialHour + 1).toString().padStart(2, "0")}:00` 
      : "10:00";
      
    setStartTime(formattedHour);
    setEndTime(formattedEndHour);
    setColor(COLORS[1].value);
    setIsModalOpen(true);
  };

  const openEditModal = (cls: TimetableClass, e: React.MouseEvent) => {
    e.stopPropagation(); // Stop trigger on grid cell click
    setEditingClass(cls);
    setName(cls.name);
    setProfessor(cls.professor);
    setRoom(cls.room);
    setDay(cls.day);
    setStartTime(cls.startTime);
    setEndTime(cls.endTime);
    setColor(cls.color);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startTime || !endTime) return;

    const newClass: TimetableClass = {
      id: editingClass ? editingClass.id : Math.random().toString(36).substr(2, 9),
      name,
      professor,
      room,
      day,
      startTime,
      endTime,
      color,
    };

    await dbService.saveClass(newClass);
    setIsModalOpen(false);
    loadClasses();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this class from your schedule?")) {
      await dbService.deleteClass(id);
      setIsModalOpen(false);
      loadClasses();
    }
  };

  // Drag and Drop implementation
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetDay: string, targetHour: number) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const matchedClass = classes.find(c => c.id === id);
    
    if (matchedClass) {
      // Calculate duration of the existing class
      const [startH, startM] = matchedClass.startTime.split(":").map(Number);
      const [endH, endM] = matchedClass.endTime.split(":").map(Number);
      const durationHours = endH - startH + (endM - startM) / 60;

      // Update start time to drop hour, keeping minutes if any
      const newStartStr = `${targetHour.toString().padStart(2, "0")}:${startM.toString().padStart(2, "0")}`;
      
      // Calculate new end time based on original duration
      const totalEndMinutes = targetHour * 60 + startM + Math.round(durationHours * 60);
      const newEndHour = Math.floor(totalEndMinutes / 60);
      const newEndMin = totalEndMinutes % 60;
      const newEndStr = `${newEndHour.toString().padStart(2, "0")}:${newEndMin.toString().padStart(2, "0")}`;

      const updatedClass: TimetableClass = {
        ...matchedClass,
        day: targetDay,
        startTime: newStartStr,
        endTime: newEndStr
      };

      await dbService.saveClass(updatedClass);
      loadClasses();
    }
  };

  // Check if a class matches a specific day and hour block
  const getClassForSlot = (day: string, hour: number) => {
    return classes.find(c => {
      if (c.day !== day) return false;
      const [startHour] = c.startTime.split(":").map(Number);
      return startHour === hour;
    });
  };

  // Calculate grid span of a class (based on duration in hours)
  const getClassDurationSpan = (cls: TimetableClass) => {
    const [startHour, startMin] = cls.startTime.split(":").map(Number);
    const [endHour, endMin] = cls.endTime.split(":").map(Number);
    const diff = (endHour - startHour) + (endMin - startMin) / 60;
    return Math.max(1, Math.round(diff));
  };

  return (
    <div className="p-6 space-y-6 max-h-[calc(100vh-80px)] overflow-y-auto">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-990 dark:text-white">Class Timetable</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isStudent ? "View your weekly class and seminar schedule" : "Drag classes to reschedule, or click slots to add new ones"}
          </p>
        </div>
        {!isStudent && (
          <button
            onClick={() => openAddModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs shadow-md shadow-blue-500/10 transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Class</span>
          </button>
        )}
      </div>

      
      <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-[32px] overflow-hidden shadow-xl shadow-indigo-900/5 dark:shadow-black/25">
        
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            
            <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-800/60 bg-gray-50/50 dark:bg-gray-900/30">
              <div className="p-4 text-xs font-bold text-gray-400 dark:text-gray-500 text-center uppercase tracking-wider border-r border-gray-100 dark:border-gray-800/40">Time</div>
              {DAYS.map((d) => {
                const today = isToday(d);
                return (
                  <div
                    key={d}
                    className={`p-4 text-xs font-bold text-center uppercase tracking-wider border-r last:border-r-0 border-gray-100 dark:border-gray-800/40 relative flex flex-col items-center justify-center gap-1 ${
                      today
                        ? "text-blue-600 dark:text-blue-400 bg-blue-500/5"
                        : "text-gray-900 dark:text-white"
                    }`}
                  >
                    <span className="relative z-10">{d}</span>
                    {today && (
                      <span className="flex items-center gap-1 text-[8px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded-full tracking-widest scale-95 shadow-sm shadow-blue-500/25">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                        <span>TODAY</span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            
            <div className="divide-y divide-gray-100 dark:divide-gray-800/40">
              {HOURS.map((hour) => {
                const hourFormatted = hour > 12 ? `${hour - 12}:00 PM` : hour === 12 ? "12:00 PM" : `${hour}:00 AM`;

                return (
                  <div key={hour} className="grid grid-cols-7 min-h-[90px]">
                    
                    <div className="p-3 text-xs font-extrabold text-gray-400 dark:text-gray-500 text-center border-r border-gray-100 dark:border-gray-800/40 flex items-center justify-center bg-gray-50/20 dark:bg-gray-900/10">
                      {hourFormatted}
                    </div>

                    
                    {DAYS.map((day) => {
                      const cls = getClassForSlot(day, hour);
                      const today = isToday(day);
                      
                      return (
                        <div
                          key={day}
                          onDragOver={isStudent ? undefined : handleDragOver}
                          onDrop={isStudent ? undefined : (e) => handleDrop(e, day, hour)}
                          onClick={isStudent ? undefined : () => !cls && openAddModal(day, hour)}
                          style={{
                            backgroundImage: "radial-gradient(circle, rgba(148, 163, 184, 0.08) 1px, transparent 1px)",
                            backgroundSize: "14px 14px"
                          }}
                          className={`p-1.5 border-r last:border-r-0 border-gray-100 dark:border-gray-800/40 relative group flex flex-col transition-colors duration-200 ${
                            today 
                              ? "bg-blue-500/[0.015] dark:bg-blue-500/[0.01]" 
                              : ""
                          } ${isStudent ? "" : "hover:bg-blue-50/10 dark:hover:bg-blue-950/5 cursor-pointer"}`}
                        >
                          {cls ? (
                            <div
                              draggable={!isStudent}
                              onDragStart={isStudent ? undefined : (e) => handleDragStart(e, cls.id)}
                              onClick={isStudent ? undefined : (e) => openEditModal(cls, e)}
                              style={{ height: `calc(${getClassDurationSpan(cls)} * 100% - 10px)` }}
                              className={`p-3.5 rounded-2xl border ${getPremiumColorStyle(cls.color)} flex flex-col justify-between absolute inset-x-2.5 top-1.5 z-10 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-lg ${isStudent ? "" : "cursor-grab active:cursor-grabbing group/card"} overflow-hidden`}
                            >
                              <div className="overflow-hidden space-y-1">
                                <div className="flex justify-between items-start gap-1">
                                  <h4 className="text-[11px] font-black tracking-tight leading-tight line-clamp-2 uppercase">{cls.name}</h4>
                                  {!isStudent && <Move className="w-3 h-3 opacity-0 group-hover/card:opacity-60 text-current shrink-0 mt-0.5 ml-1 transition-opacity duration-200" />}
                                </div>
                                <p className="text-[9px] font-bold opacity-80 flex items-center gap-1">
                                  <User className="w-2.5 h-2.5 text-current opacity-70" />
                                  <span className="truncate">{cls.professor || "No Professor"}</span>
                                </p>
                              </div>

                              <div className="flex justify-between items-center mt-3 pt-1.5 border-t border-current/10 text-[9px] font-extrabold opacity-80">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-2.5 h-2.5 text-current opacity-70" />
                                  {cls.room || "TBA"}
                                </span>
                                <span className="flex items-center gap-1 font-mono">
                                  <Clock className="w-2.5 h-2.5 text-current opacity-70" />
                                  {cls.startTime} - {cls.endTime}
                                </span>
                              </div>
                            </div>
                          ) : (
                            !isStudent && (
                              <div className="flex-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="p-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-blue-500">
                                  <Plus className="w-3.5 h-3.5" />
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </div>

      
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl w-full max-w-md shadow-2xl p-6 relative overflow-hidden animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-gray-950 dark:text-white mb-4">
              {editingClass ? "Edit Class Details" : "Schedule New Class"}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">Class / Event Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Advanced UX Design"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800/80 bg-gray-50 dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">Professor / Organizer</label>
                  <input 
                    type="text" 
                    value={professor} 
                    onChange={(e) => setProfessor(e.target.value)}
                    placeholder="e.g. Prof. Watson"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800/80 bg-gray-50 dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">Room / Link</label>
                  <input 
                    type="text" 
                    value={room} 
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="e.g. Lab 404 / Zoom"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800/80 bg-gray-50 dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">Day</label>
                  <select 
                    value={day} 
                    onChange={(e) => setDay(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800/80 bg-gray-50 dark:bg-gray-950 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white font-bold"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">Start Time</label>
                  <input 
                    type="time" 
                    value={startTime} 
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800/80 bg-gray-50 dark:bg-gray-950 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">End Time</label>
                  <input 
                    type="time" 
                    value={endTime} 
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800/80 bg-gray-50 dark:bg-gray-950 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">Color Badge</label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setColor(c.value)}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-extrabold border transition-all ${c.value} ${
                        color === c.value 
                          ? "ring-2 ring-blue-500 dark:ring-blue-400 scale-105" 
                          : "opacity-70 hover:opacity-100"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800/60">
                {editingClass && (
                  <button
                    type="button"
                    onClick={() => handleDelete(editingClass.id)}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-xl font-bold text-xs transition-all shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                )}
                
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10"
                >
                  <Plus className="w-4 h-4" />
                  <span>{editingClass ? "Save Changes" : "Create Event"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
