import React, { useState, useEffect } from "react";
import { dbService } from "../services/firebaseService";
import type { StudentProfile, TimetableClass, TaskItem, AttendanceRecord, NoticeItem } from "../services/firebaseService";
import {
  Users,
  CheckCircle2,
  BookOpen,
  Clock,
  CheckSquare,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Sliders,
  ChevronRight,
  Flame,
  Calendar,
  GraduationCap,
  Megaphone,
  AlertTriangle,
  Info,
  Bell
} from "lucide-react";

interface DashboardViewProps {
  onNavigateToView: (view: "dashboard" | "timetable" | "tasks" | "attendance" | "notes" | "profile") => void;
  profile: StudentProfile;
}

const getLastFourMonths = () => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const result: Array<{ name: string; numStr: string }> = [];
  const today = new Date();
  for (let i = 3; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthIndex = d.getMonth();
    const monthNum = monthIndex + 1;
    result.push({
      name: months[monthIndex],
      numStr: monthNum.toString().padStart(2, "0")
    });
  }
  return result;
};

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateToView, profile }) => {
  const [classes, setClasses] = useState<TimetableClass[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [notesCount, setNotesCount] = useState(0);
  const lastFourMonths = getLastFourMonths();
  const [selectedMonth, setSelectedMonth] = useState<string>(lastFourMonths[3].name);
  const [notices, setNotices] = useState<NoticeItem[]>([]);

  // Load database items on mount with realtime subscriptions
  useEffect(() => {
    const unsubClasses = dbService.subscribeClasses(setClasses);
    const unsubTasks = dbService.subscribeTasks(setTasks);
    const unsubAttendance = dbService.subscribeAttendance(setAttendance);
    const unsubNotes = dbService.subscribeNotes((list) => setNotesCount(list.length));
    const unsubNotices = dbService.subscribeNotices(setNotices);

    if (!unsubClasses || !unsubTasks || !unsubAttendance || !unsubNotes || !unsubNotices) {
      loadDashboardData();
    }

    return () => {
      if (unsubClasses) unsubClasses();
      if (unsubTasks) unsubTasks();
      if (unsubAttendance) unsubAttendance();
      if (unsubNotes) unsubNotes();
      if (unsubNotices) unsubNotices();
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      const clsList = await dbService.getClasses();
      const tskList = await dbService.getTasks();
      const attList = await dbService.getAttendance();
      const ntsList = await dbService.getNotes();
      const notList = await dbService.getNotices();

      setClasses(clsList);
      setTasks(tskList);
      setAttendance(attList);
      setNotesCount(ntsList.length);
      setNotices(notList);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    }
  };

  const totalClassesLogCount = attendance.reduce((acc, r) => acc + r.presentCount + r.absentCount, 0);
  const totalClassesAttended = attendance.reduce((acc, r) => acc + r.presentCount, 0);
  const overallAttendanceRate = totalClassesLogCount > 0 ? Math.round((totalClassesAttended / totalClassesLogCount) * 100) : 0;
  const submittedTasksCount = tasks.filter(t => t.submissions && t.submissions.length > 0).length;

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayDayName = daysOfWeek[new Date().getDay()]; // e.g. "Wednesday"
  const todayClasses = classes.filter(cls => cls.day.toLowerCase() === todayDayName.toLowerCase());
  const upcomingClasses = classes.filter(cls => cls.day.toLowerCase() !== todayDayName.toLowerCase());

  const getMonthlyRate = (monthNumStr: string, defaultVal: number) => {
    let total = 0;
    let present = 0;
    attendance.forEach((rec) => {
      rec.logs.forEach((log) => {
        if (log.date.includes(`-${monthNumStr}-`)) {
          total++;
          if (log.status === "present") {
            present++;
          }
        }
      });
    });
    return total > 0 ? Math.round((present / total) * 100) : defaultVal;
  };

  const dynamicTrends = lastFourMonths.map((m, idx) => {
    const fallbackVal = 0;
    const rate = getMonthlyRate(m.numStr, fallbackVal);
    const yVal = 140 - ((rate / 100) * 100);
    return {
      id: m.name,
      label: idx === 3 ? `${m.name} Trends (Current)` : `${m.name} Trends`,
      rate: `${rate}%`,
      targetPath: "M 0 80 Q 180 80, 360 80",
      actualPath: `M 0 120 C 90 120, 90 ${yVal}, 180 ${yVal} C 270 ${yVal}, 270 120, 360 120`,
      activePoint: { x: 180, y: yVal }
    };
  });

  const activeTrend = dynamicTrends.find(t => t.id === selectedMonth) || dynamicTrends[3];

  const getNoticeStyle = (type: string) => {
    switch (type) {
      case "critical":
        return "border-l-4 border-red-500 bg-red-50/50 dark:bg-red-950/10";
      case "warning":
        return "border-l-4 border-amber-500 bg-amber-50/50 dark:bg-amber-950/10";
      default:
        return "border-l-4 border-blue-500 bg-blue-50/50 dark:bg-blue-950/10";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 overflow-y-auto max-h-[calc(100vh-80px)]">

      <div className="lg:col-span-2 space-y-6">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 rounded-3xl p-6 flex flex-col items-center justify-between text-center relative overflow-hidden shadow-sm">
            <div className="w-full flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-gray-900 dark:text-white tracking-wide">Profile</span>
              <button onClick={loadDashboardData} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="relative w-28 h-28 flex items-center justify-center mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-dashed border-red-400/40 dark:border-red-500/30 animate-[spin_40s_linear_infinite]" />
              <div className="absolute inset-1 rounded-full border-[3.5px] border-blue-500/80 dark:border-blue-400/80" />
              <img
                src={profile.avatarUrl}
                alt="Student Avatar"
                className="w-[96px] h-[96px] rounded-full object-cover z-10 border-4 border-white dark:border-gray-900"
              />
              <div className="absolute bottom-1 right-2 w-6 h-6 rounded-full bg-black border-2 border-white dark:border-gray-900 flex items-center justify-center z-20">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
              </div>
            </div>

            <div>
              <h2 className="text-base font-bold text-gray-950 dark:text-white leading-snug">{profile.name}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{profile.role}</p>
            </div>

            <div className="flex gap-2.5 mt-6 w-full justify-center">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 text-gray-600 dark:text-gray-400 text-xs font-bold border border-gray-100 dark:border-gray-800/50">
                <Users className="w-3.5 h-3.5 text-blue-500" />
                <span>{classes.length}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 text-gray-600 dark:text-gray-400 text-xs font-bold border border-gray-100 dark:border-gray-800/50">
                <CheckCircle2 className="w-3.5 h-3.5 text-red-500" />
                <span>{tasks.filter(t => t.status === "completed").length}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 text-gray-600 dark:text-gray-400 text-xs font-bold border border-gray-100 dark:border-gray-800/50">
                <BookOpen className="w-3.5 h-3.5 text-yellow-500" />
                <span>{notesCount}</span>
              </div>
            </div>
          </div>

          <div
            onClick={() => onNavigateToView("attendance")}
            className="bg-gradient-to-br from-orange-400 to-pink-500 dark:from-orange-500 dark:to-pink-600 rounded-3xl p-6 text-white flex flex-col justify-between shadow-lg shadow-orange-500/10 cursor-pointer transition-all hover:scale-[1.02]"
          >
            <div className="flex justify-between items-start">
              <p className="text-sm font-bold opacity-90 leading-tight">Attendance<br />Rate</p>
              <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="mt-8">
              <h3 className="text-4xl font-extrabold tracking-tight">{overallAttendanceRate}%</h3>
              <p className="text-xs font-medium opacity-80 mt-1">Average Attendance (Target: 75%)</p>
            </div>
          </div>

          <div
            onClick={() => onNavigateToView("tasks")}
            className="bg-gradient-to-br from-cyan-400 to-blue-600 dark:from-cyan-500 dark:to-blue-600 rounded-3xl p-6 text-white flex flex-col justify-between shadow-lg shadow-blue-500/10 cursor-pointer transition-all hover:scale-[1.02]"
          >
            <div className="flex justify-between items-start">
              <p className="text-sm font-bold opacity-90 leading-tight">Assignments<br />Submitted</p>
              <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md">
                <CheckSquare className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="mt-8">
              <h3 className="text-4xl font-extrabold tracking-tight">{submittedTasksCount}</h3>
              <p className="text-xs font-medium opacity-80 mt-1">Total assignments submitted</p>
            </div>
          </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div className="md:col-span-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 rounded-3xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-sm font-bold text-gray-950 dark:text-white">Attendance Graph</h3>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 font-semibold mt-0.5">Monthly attendance tracking by graph</p>
              </div>
            </div>

            <div className="relative flex-1 flex items-stretch h-36 my-2">
              <div className="w-12 flex flex-col justify-between text-[11px] font-semibold text-gray-400 dark:text-gray-500 py-2 border-r border-gray-100 dark:border-gray-800/50">
                {lastFourMonths.map((m) => (
                  <button
                    key={m.name}
                    onClick={() => setSelectedMonth(m.name)}
                    className={`text-left hover:text-blue-500 transition-colors ${selectedMonth === m.name ? "text-blue-600 dark:text-blue-400 font-bold scale-105" : ""
                      }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>

              <div className="flex-1 relative overflow-visible ml-4">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 360 160">
                  <line x1="0" y1="40" x2="360" y2="40" stroke="currentColor" strokeDasharray="3,3" className="text-gray-100 dark:text-gray-800/30" />
                  <line x1="0" y1="80" x2="360" y2="80" stroke="currentColor" strokeDasharray="3,3" className="text-gray-100 dark:text-gray-800/30" />
                  <line x1="0" y1="120" x2="360" y2="120" stroke="currentColor" strokeDasharray="3,3" className="text-gray-100 dark:text-gray-800/30" />

                  
                  <path
                    d={activeTrend.actualPath}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    className="opacity-90 transition-all duration-500"
                  />

                  
                  <g className="transition-all duration-500" transform={`translate(${activeTrend.activePoint.x}, ${activeTrend.activePoint.y})`}>
                    <circle r="6" fill="#3b82f6" stroke="#ffffff" strokeWidth="2.5" className="shadow-sm" />

                    
                    <g transform="translate(0, -32)">
                      <rect x="-65" y="-12" width="130" height="26" rx="8" className="fill-white dark:fill-gray-800 stroke-gray-100 dark:stroke-gray-800 shadow-lg" filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.06))" />
                      <text textAnchor="middle" y="5" fontSize="10" fontWeight="bold" className="fill-[#030712] dark:fill-white font-sans">
                        {activeTrend.label}: {activeTrend.rate}
                      </text>
                    </g>
                  </g>
                </svg>
              </div>
            </div>

            
            <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-800/50">
              <div className="flex gap-4 text-[10px] font-bold text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-blue-500 inline-block" />
                  <span>Actual Attendance</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xl font-black text-gray-950 dark:text-white">{activeTrend.rate}</span>
                <p className="text-[9px] text-gray-400 dark:text-gray-500 font-extrabold uppercase tracking-wide">Average Attendance</p>
              </div>
            </div>

          </div>

        </div>

      </div>

      <div className="space-y-6">

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 rounded-3xl p-6 flex flex-col justify-between shadow-sm max-h-[420px] overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-950 dark:text-white">Lectures Schedule</h3>
              <p className="text-[10px] text-gray-450 dark:text-gray-500 font-bold mt-0.5">{todayDayName} sync</p>
            </div>
            <button
              onClick={() => onNavigateToView("timetable")}
              className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
            >
              <Calendar className="w-4 h-4" />
            </button>
          </div>

          
          <div className="space-y-3.5 overflow-y-auto flex-1 pr-1">
            {todayClasses.map((cls) => (
              <div
                key={cls.id}
                className="flex items-start justify-between p-3.5 rounded-2xl bg-gray-50/50 dark:bg-gray-800/20 border border-gray-100/50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="text-center min-w-[70px] pt-1">
                    <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Today</p>
                    <p className="text-xs font-bold text-gray-900 dark:text-white mt-0.5">{cls.startTime}</p>
                  </div>

                  <div className="w-[1.5px] self-stretch bg-gray-200 dark:bg-gray-800/60 my-1" />

                  <div>
                    <h4 className="text-xs font-extrabold text-gray-950 dark:text-white group-hover:text-blue-500 transition-colors line-clamp-1">{cls.name}</h4>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold mt-0.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      {cls.professor} • {cls.room}
                    </p>
                  </div>
                </div>

                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); onNavigateToView("timetable"); }}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            ))}

            {todayClasses.length === 0 && (
              <div className="py-6 text-center space-y-2">
                <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">No classes scheduled for today</p>

                {upcomingClasses.length > 0 && (
                  <div className="pt-2 text-left space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Upcoming Lectures</p>
                    {upcomingClasses.slice(0, 2).map((cls) => (
                      <div key={cls.id} className="p-2.5 rounded-xl bg-gray-50/30 dark:bg-gray-800/10 border border-gray-100/30 dark:border-gray-800/30 text-[11px]">
                        <p className="font-bold text-gray-950 dark:text-white truncate">{cls.name}</p>
                        <p className="text-[9px] text-gray-550 dark:text-gray-400 mt-0.5">{cls.day} at {cls.startTime} ({cls.room})</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigateToView("timetable")}
            className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white mt-4 flex items-center gap-1 hover:gap-1.5 transition-all w-fit"
          >
            <span>Weekly Timetable View</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 rounded-3xl p-6 shadow-sm flex flex-col max-h-[350px]">
          <div className="flex justify-between items-center mb-3 shrink-0">
            <div>
              <h3 className="text-sm font-bold text-gray-950 dark:text-white flex items-center gap-1.5">
                <Megaphone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Notices</span>
              </h3>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 font-semibold mt-0.5">Academic updates</p>
            </div>
            <Bell className="w-4 h-4 text-gray-400" />
          </div>


          <div className="space-y-3 overflow-y-auto flex-1 pr-1">
            {notices.map((notice: NoticeItem) => (
              <div
                key={notice.id}
                className={`p-3 rounded-2xl border border-gray-100/50 dark:border-gray-800/40 flex flex-col gap-1 ${getNoticeStyle(notice.type)}`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-400">
                    {notice.type}
                  </span>
                  <span className="text-[9px] text-gray-400 dark:text-gray-505 font-bold">{notice.date}</span>
                </div>
                <h4 className="text-xs font-extrabold text-gray-950 dark:text-white leading-snug mt-1">{notice.title}</h4>
                <p className="text-[10px] text-gray-550 dark:text-gray-450 leading-relaxed font-medium mt-0.5">{notice.description}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
