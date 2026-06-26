import React, { useState, useEffect } from "react";
import { dbService } from "../services/firebaseService";
import type { AttendanceRecord } from "../services/firebaseService";
import { 
  Check, 
  X, 
  Minus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  BookOpen, 
  Calendar,
  Sparkles,
  Info,
  Download
} from "lucide-react";
import { useTheme } from "./ThemeContext";

export const AttendanceView: React.FC = () => {
  const { portalMode } = useTheme();
  const isStudent = portalMode === "student";
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  
  // Custom log logging form
  const [newLogDate, setNewLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [newLogStatus, setNewLogStatus] = useState<"present" | "absent" | "excused" | "cancelled">("present");
  const [newLogNote, setNewLogNote] = useState("");
  const [newCourseName, setNewCourseName] = useState("");

  useEffect(() => {
    const unsub = dbService.subscribeAttendance((data) => {
      setRecords(data);
      setSelectedCourse((prev) => {
        if (!prev && data.length > 0) return data[0].courseId;
        if (prev && !data.some((d) => d.courseId === prev)) return data.length > 0 ? data[0].courseId : null;
        return prev;
      });
    });

    if (!unsub) {
      loadAttendance();
    }

    return () => {
      if (unsub) unsub();
    };
  }, []);

  const loadAttendance = async () => {
    const data = await dbService.getAttendance();
    setRecords(data);
    setSelectedCourse((prev) => {
      if (!prev && data.length > 0) return data[0].courseId;
      if (prev && !data.some((d) => d.courseId === prev)) return data.length > 0 ? data[0].courseId : null;
      return prev;
    });
  };

  const handleQuickLog = async (courseId: string, status: "present" | "absent" | "excused" | "cancelled") => {
    const rec = records.find(r => r.courseId === courseId);
    if (!rec) return;

    const newLogItem = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split("T")[0],
      status,
      note: "Quick logged from Dashboard"
    };

    const updatedLogs = [newLogItem, ...rec.logs];
    
    // Recalculate counts
    let presentCount = rec.presentCount;
    let absentCount = rec.absentCount;
    let excusedCount = rec.excusedCount;
    let cancelledCount = rec.cancelledCount;

    if (status === "present") presentCount++;
    if (status === "absent") absentCount++;
    if (status === "excused") excusedCount++;
    if (status === "cancelled") cancelledCount++;

    const updatedRecord: AttendanceRecord = {
      courseId,
      presentCount,
      absentCount,
      excusedCount,
      cancelledCount,
      logs: updatedLogs
    };

    await dbService.saveAttendance(updatedRecord);
    loadAttendance();
  };

  const handleAddCustomLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    const rec = records.find(r => r.courseId === selectedCourse);
    if (!rec) return;

    const newLogItem = {
      id: Math.random().toString(36).substr(2, 9),
      date: newLogDate,
      status: newLogStatus,
      note: newLogNote
    };

    const updatedLogs = [newLogItem, ...rec.logs];
    
    // Recompute counts based on all logs
    let presentCount = 0;
    let absentCount = 0;
    let excusedCount = 0;
    let cancelledCount = 0;

    updatedLogs.forEach(l => {
      if (l.status === "present") presentCount++;
      if (l.status === "absent") absentCount++;
      if (l.status === "excused") excusedCount++;
      if (l.status === "cancelled") cancelledCount++;
    });

    const updatedRecord: AttendanceRecord = {
      courseId: selectedCourse,
      presentCount,
      absentCount,
      excusedCount,
      cancelledCount,
      logs: updatedLogs
    };

    await dbService.saveAttendance(updatedRecord);
    
    // Reset Form
    setNewLogDate(new Date().toISOString().split("T")[0]);
    setNewLogStatus("present");
    setNewLogNote("");
    
    loadAttendance();
  };

  const handleDeleteLog = async (courseId: string, logId: string) => {
    const rec = records.find(r => r.courseId === courseId);
    if (!rec) return;

    const updatedLogs = rec.logs.filter(l => l.id !== logId);
    
    // Recompute counts
    let presentCount = 0;
    let absentCount = 0;
    let excusedCount = 0;
    let cancelledCount = 0;

    updatedLogs.forEach(l => {
      if (l.status === "present") presentCount++;
      if (l.status === "absent") absentCount++;
      if (l.status === "excused") excusedCount++;
      if (l.status === "cancelled") cancelledCount++;
    });

    const updatedRecord: AttendanceRecord = {
      courseId,
      presentCount,
      absentCount,
      excusedCount,
      cancelledCount,
      logs: updatedLogs
    };

    await dbService.saveAttendance(updatedRecord);
    loadAttendance();
  };

  const handleAddNewCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName) return;

    // Check if course already exists
    if (records.some(r => r.courseId.toLowerCase() === newCourseName.toLowerCase())) {
      alert("This course already exists!");
      return;
    }

    const newRec: AttendanceRecord = {
      courseId: newCourseName,
      presentCount: 0,
      absentCount: 0,
      excusedCount: 0,
      cancelledCount: 0,
      logs: []
    };

    await dbService.saveAttendance(newRec);
    setNewCourseName("");
    setSelectedCourse(newCourseName);
    loadAttendance();
  };

  // Metrics
  const activeRecord = records.find(r => r.courseId === selectedCourse);

  const totalClassesLogCount = records.reduce((acc, r) => acc + r.presentCount + r.absentCount, 0);
  const totalClassesAttended = records.reduce((acc, r) => acc + r.presentCount, 0);
  const overallRate = totalClassesLogCount > 0 ? Math.round((totalClassesAttended / totalClassesLogCount) * 100) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 overflow-y-auto max-h-[calc(100vh-80px)]">
      
      
      <div className="lg:col-span-2 space-y-6">
        
        
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 rounded-3xl p-6 shadow-sm flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-gray-950 dark:text-white">Attendance Analytics</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Track and maintain a target of 75% attendance</p>
          </div>

          <div className="flex gap-6 items-center">
            
            <div className="text-right">
              <span className="text-3xl font-black text-blue-600 dark:text-blue-400">{overallRate}%</span>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 font-extrabold uppercase tracking-wide">Overall Attendance</p>
            </div>
            
            <div className="w-[1px] h-12 bg-gray-100 dark:bg-gray-800" />

            <div className="text-right">
              <span className="text-3xl font-black text-gray-950 dark:text-white">{totalClassesAttended}</span>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 font-extrabold uppercase tracking-wide">Total Attended</p>
            </div>
          </div>
        </div>

        
        {!isStudent && (
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-950 dark:text-white mb-3">Register New Course</h3>
            <form onSubmit={handleAddNewCourse} className="flex gap-2">
              <input 
                type="text" 
                placeholder="e.g. Advanced Machine Learning" 
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                className="flex-1 px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-800/80 bg-gray-50 dark:bg-gray-950 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white font-medium"
                required
              />
              <button 
                type="submit"
                className="px-4 py-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/10 transition-all shrink-0"
              >
                Add Course
              </button>
            </form>
          </div>
        )}

        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {records.map((rec) => {
            const total = rec.presentCount + rec.absentCount;
            const rate = total > 0 ? Math.round((rec.presentCount / total) * 100) : 0;
            const isBelowThreshold = rate < 75;
            const isActive = selectedCourse === rec.courseId;

            return (
              <div 
                key={rec.courseId}
                onClick={() => setSelectedCourse(rec.courseId)}
                className={`bg-white dark:bg-gray-900 border rounded-3xl p-5 shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col justify-between ${
                  isActive 
                    ? "ring-2 ring-blue-500 dark:ring-blue-400 border-transparent" 
                    : "border-gray-100 dark:border-gray-800/80"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-sm font-bold text-gray-950 dark:text-white leading-snug line-clamp-1">{rec.courseId}</h4>
                    {isBelowThreshold && total > 0 ? (
                      <span className="flex items-center gap-1 text-[9px] font-extrabold bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-900/30 animate-pulse">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        <span>Low</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[9px] font-extrabold bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full border border-green-200 dark:border-green-900/30">
                        <CheckCircle className="w-2.5 h-2.5" />
                        <span>OK</span>
                      </span>
                    )}
                  </div>
                  
                  
                  <div className="flex items-baseline gap-1 mt-4">
                    <span className={`text-3xl font-black ${isBelowThreshold && total > 0 ? "text-orange-500" : "text-gray-950 dark:text-white"}`}>{rate}%</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Attendance</span>
                  </div>
                  
                  
                  <div className="w-full h-1.5 bg-gray-50 dark:bg-gray-800 rounded-full overflow-hidden mt-2 border border-gray-100/50 dark:border-gray-800/20">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isBelowThreshold && total > 0 ? "bg-orange-500" : "bg-blue-600 dark:bg-blue-500"
                      }`}
                      style={{ width: `${rate}%` }}
                    />
                  </div>

                  
                  <div className="grid grid-cols-4 gap-2 mt-4 text-center border-t border-gray-50 dark:border-gray-800/40 pt-3 text-[10px] font-bold text-gray-500 dark:text-gray-400">
                    <div>
                      <p className="text-gray-950 dark:text-white font-black">{rec.presentCount}</p>
                      <p className="text-[8px] text-gray-400 uppercase font-extrabold tracking-wide mt-0.5">Present</p>
                    </div>
                    <div>
                      <p className="text-gray-950 dark:text-white font-black">{rec.absentCount}</p>
                      <p className="text-[8px] text-gray-400 uppercase font-extrabold tracking-wide mt-0.5">Absent</p>
                    </div>
                    <div>
                      <p className="text-gray-950 dark:text-white font-black">{rec.excusedCount}</p>
                      <p className="text-[8px] text-gray-400 uppercase font-extrabold tracking-wide mt-0.5">Excused</p>
                    </div>
                    <div>
                      <p className="text-gray-950 dark:text-white font-black">{rec.cancelledCount}</p>
                      <p className="text-[8px] text-gray-400 uppercase font-extrabold tracking-wide mt-0.5">Cancel</p>
                    </div>
                  </div>
                </div>

                
                {!isStudent && (
                  <div className="flex gap-1.5 mt-4 pt-3 border-t border-gray-50 dark:border-gray-800/40" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => handleQuickLog(rec.courseId, "present")}
                      className="flex-1 py-1.5 bg-green-50 hover:bg-green-100 dark:bg-green-950/20 dark:hover:bg-green-950/40 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900/30 rounded-xl text-[10px] font-bold transition-all flex justify-center items-center gap-0.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Present</span>
                    </button>
                    <button
                      onClick={() => handleQuickLog(rec.courseId, "absent")}
                      className="flex-1 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-xl text-[10px] font-bold transition-all flex justify-center items-center gap-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Absent</span>
                    </button>
                  </div>
                )}

              </div>
            );
          })}
        </div>

      </div>

      
      <div className="space-y-6 lg:col-span-1">
        
        {activeRecord ? (
          <>
            
            {!isStudent && (
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 rounded-3xl p-6 shadow-sm space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-950 dark:text-white leading-snug">Log Attendance Details</h3>
                  <p className="text-[10px] text-gray-400 font-semibold tracking-wide mt-0.5 uppercase">{activeRecord.courseId}</p>
                </div>

                <form onSubmit={handleAddCustomLog} className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Class Date</label>
                    <input 
                      type="date" 
                      value={newLogDate} 
                      onChange={(e) => setNewLogDate(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-800/80 bg-gray-50 dark:bg-gray-950 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Attendance Status</label>
                    <select 
                      value={newLogStatus} 
                      onChange={(e) => setNewLogStatus(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-100 dark:border-gray-800/80 bg-gray-50 dark:bg-gray-950 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white font-bold"
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="excused">Excused</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Log Note (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Doctor appointment, Sync cancelled" 
                      value={newLogNote} 
                      onChange={(e) => setNewLogNote(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-800/80 bg-gray-50 dark:bg-gray-950 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white font-medium"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/10 transition-all"
                  >
                    Save Log Entry
                  </button>
                </form>
              </div>
            )}

            
            <div className={`bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 rounded-3xl p-6 shadow-sm flex flex-col ${isStudent ? 'max-h-[500px] flex-1' : 'max-h-[350px]'} overflow-hidden`}>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-gray-950 dark:text-white">Attendance History</h3>
                <button
                  onClick={() => {
                    const csvHeader = "Date,Course,Status,Note\n";
                    const csvRows = records.flatMap(rec => 
                      rec.logs.map(log => 
                        `"${log.date}","${rec.courseId}","${log.status}","${log.note || ''}"`
                      )
                    ).join("\n");
                    const blob = new Blob([csvHeader + csvRows], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `studentmaker_attendance_${new Date().toISOString().split("T")[0]}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  className="p-1 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
                  title="Download Attendance Logs (.csv)"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                {activeRecord.logs.map((log) => {
                  const statusColors = {
                    present: "bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400 border-green-200 dark:border-green-900/30",
                    absent: "bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400 border-red-200 dark:border-red-900/30",
                    excused: "bg-orange-100 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400 border-orange-200 dark:border-orange-900/30",
                    cancelled: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700"
                  };

                  return (
                    <div 
                      key={log.id} 
                      className="p-3 rounded-2xl bg-gray-50/50 dark:bg-gray-800/20 border border-gray-100/50 dark:border-gray-800/40 flex justify-between items-start gap-2 group hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase border ${statusColors[log.status]}`}>
                            {log.status}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {log.date}
                          </span>
                        </div>
                        {log.note && (
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-1 leading-relaxed">{log.note}</p>
                        )}
                      </div>

                      {!isStudent && (
                        <button
                          onClick={() => handleDeleteLog(activeRecord.courseId, log.id)}
                          className="p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}

                {activeRecord.logs.length === 0 && (
                  <p className="text-xs text-center text-gray-400 dark:text-gray-500 py-6 font-medium">No logs for this course yet.</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 rounded-3xl p-6 shadow-sm text-center">
            <Info className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-gray-950 dark:text-white">No Course Selected</h3>
            <p className="text-xs text-gray-400 dark:text-gray-400 mt-1">Please select or add a course to start tracking logs.</p>
          </div>
        )}

      </div>

    </div>
  );
};
