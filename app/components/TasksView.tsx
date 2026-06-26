import React, { useState, useEffect } from "react";
import { dbService } from "../services/firebaseService";
import type { TaskItem, TimetableClass } from "../services/firebaseService";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  AlertCircle,
  Calendar,
  Tag,
  CheckCircle,
  Clock,
  Briefcase,
  Search,
  Download,
  Upload,
  FileText
} from "lucide-react";
import { useTheme } from "./ThemeContext";

export const TasksView: React.FC = () => {
  const { portalMode } = useTheme();
  const isStudent = portalMode === "student";
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [classes, setClasses] = useState<TimetableClass[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    const unsubscribeClasses = dbService.subscribeClasses((list) => {
      setClasses(list);
    });
    if (!unsubscribeClasses) {
      dbService.getClasses().then(setClasses);
    }
    return () => {
      if (unsubscribeClasses) unsubscribeClasses();
    };
  }, []);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [category, setCategory] = useState("General");
  const [attachmentFile, setAttachmentFile] = useState<{ name: string; type: string; size: string; content?: string } | null>(null);

  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const unsubscribe = dbService.subscribeTasks((list) => {
      setTasks(list);
    });
    if (!unsubscribe) {
      loadTasks();
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const loadTasks = async () => {
    const list = await dbService.getTasks();
    setTasks(list);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate) return;

    const newTask: TaskItem = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      description,
      dueDate,
      priority: "medium",
      status: "todo",
      category,
      attachments: attachmentFile ? [attachmentFile] : []
    };

    await dbService.saveTask(newTask);
    setIsFormOpen(false);

    setTitle("");
    setDescription("");
    setDueDate("");
    setCategory("Design");
    setAttachmentFile(null);

    loadTasks();
  };

  const handleToggleStatus = async (task: TaskItem) => {
    const nextStatus = task.status === "completed" ? "todo" : "completed";
    const updated: TaskItem = {
      ...task,
      status: nextStatus,
    };
    await dbService.saveTask(updated);
    loadTasks();
  };

  const handleChangeStatus = async (task: TaskItem, newStatus: "todo" | "in-progress" | "completed") => {
    const updated: TaskItem = {
      ...task,
      status: newStatus,
    };
    await dbService.saveTask(updated);
    loadTasks();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Do you want to delete this?")) {
      await dbService.deleteTask(id);
      loadTasks();
    }
  };

  const handleAssignmentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setAttachmentFile(null);
      return;
    }
    const file = files[0];

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      alert("Only PDF files are allowed for assignment documents.");
      e.target.value = "";
      setAttachmentFile(null);
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      alert("Please upload PDF files under 25MB.");
      e.target.value = "";
      setAttachmentFile(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const sizeStr = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(file.size / 1024).toFixed(1)} KB`;
      setAttachmentFile({
        name: file.name,
        type: file.type,
        size: sizeStr,
        content
      });
    };
    reader.readAsDataURL(file);
  };

  const handleStudentSubmissionUpload = (e: React.ChangeEvent<HTMLInputElement>, task: TaskItem) => {
    if (task.submissions && task.submissions.length > 0) {
      alert("You have already submitted this assignment and cannot submit it again.");
      return;
    }
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      alert("Only PDF files are allowed for submissions.");
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      alert("Please upload PDF files under 25MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const sizeStr = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(file.size / 1024).toFixed(1)} KB`;

      const newSubmission = {
        name: file.name,
        type: file.type,
        size: sizeStr,
        content,
        submittedAt: new Date().toISOString()
      };

      const updatedSubmissions = [newSubmission];
      const updatedTask: TaskItem = {
        ...task,
        status: "completed",
        submissions: updatedSubmissions
      };

      await dbService.saveTask(updatedTask);
      loadTasks();
      alert("Assignment submitted successfully!");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveSubmission = async (task: TaskItem) => {
    if (confirm("Are you sure you want to remove your submission?")) {
      const updatedTask: TaskItem = {
        ...task,
        status: "in-progress",
        submissions: []
      };
      await dbService.saveTask(updatedTask);
      loadTasks();
    }
  };

  // Compute metrics
  const totalCount = tasks.length;
  const completedCount = tasks.filter(t => t.status === "completed").length;

  const todayStr = new Date().toISOString().split("T")[0];
  const overdueCount = tasks.filter(t => t.status !== "completed" && t.dueDate < todayStr).length;
  const inProgressCount = tasks.filter(t => t.status === "in-progress").length;

  // Filter lists
  const activeTasks = tasks.filter(t => t.status !== "completed");
  const completedTasks = tasks.filter(t => t.status === "completed");

  const filterFn = (t: TaskItem) => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || t.category === filterCategory;
    return matchesSearch && matchesCategory;
  };

  const filteredActive = activeTasks.filter(filterFn);
  const filteredCompleted = completedTasks.filter(filterFn);

  const categoriesList = Array.from(new Set(tasks.map(t => t.category).concat(classes.map(c => c.name))));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6 overflow-y-auto max-h-[calc(100vh-80px)]">


      <div className="space-y-6 lg:col-span-1">
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 rounded-3xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-950 dark:text-white mb-4">Assignment Analytics</h3>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50/50 dark:bg-gray-800/20 border border-gray-100/50 dark:border-gray-800/30">
              <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">Assignments</p>
                <p className="text-lg font-black text-gray-950 dark:text-white mt-0.5">{totalCount}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50/50 dark:bg-gray-800/20 border border-gray-100/50 dark:border-gray-800/30">
              <div className="p-2.5 rounded-xl bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">Completed Assignments</p>
                <p className="text-lg font-black text-gray-950 dark:text-white mt-0.5">{completedCount}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50/50 dark:bg-gray-800/20 border border-gray-100/50 dark:border-gray-800/30">
              <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">Under Working</p>
                <p className="text-lg font-black text-gray-950 dark:text-white mt-0.5">{inProgressCount}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50/50 dark:bg-gray-800/20 border border-gray-100/50 dark:border-gray-800/30">
              <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">Not completed</p>
                <p className="text-lg font-black text-gray-950 dark:text-white mt-0.5">{overdueCount}</p>
              </div>
            </div>

            <button
              onClick={() => {
                const printWindow = window.open('', '_blank');
                if (!printWindow) return;
                const html = `<!DOCTYPE html><html><head><title>Assignments</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#333}h1{font-size:22px;margin-bottom:20px}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #ddd;padding:10px;text-align:left;font-size:13px}th{background:#f5f5f5;font-weight:bold}.done{text-decoration:line-through;color:#999}</style></head><body><h1>Student Maker - Assignments</h1><table><tr><th>#</th><th>Title</th><th>Category</th><th>Due Date</th><th>Status</th></tr>${tasks.map((t, i) => `<tr><td>${i + 1}</td><td class="${t.status === 'completed' ? 'done' : ''}">${t.title}</td><td>${t.category}</td><td>${t.dueDate}</td><td>${t.status}</td></tr>`).join('')}</table></body></html>`;
                printWindow.document.write(html);
                printWindow.document.close();
                printWindow.onload = () => { printWindow.print(); };
              }}
              className="w-full flex items-center justify-center gap-2 mt-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/40 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-800/50 text-gray-600 dark:text-gray-300 rounded-xl font-bold text-xs transition-all"
            >
              <Download className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              <span>Download(.pdf)</span>
            </button>
          </div>
        </div>
        {!isStudent && (
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-950 dark:text-white">Quick Add Assignment</h3>
            </div>

            <button
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/10 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Assignment</span>
            </button>
          </div>
        )}
      </div>

      <div className="lg:col-span-3 space-y-6">


        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-gray-100 dark:border-gray-800/80 bg-gray-50 dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white font-medium"
            />
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            <div className="flex items-center gap-1.5 text-xs font-semibold bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-800/60 rounded-xl px-3 py-2.5 text-gray-600 dark:text-gray-400">
              <Tag className="w-3.5 h-3.5" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-transparent focus:outline-none font-bold text-gray-800 dark:text-gray-300"
              >
                <option value="all">Subjects</option>
                {categoriesList.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {!isStudent && isFormOpen && (
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 rounded-3xl p-6 shadow-sm animate-in slide-in-from-top-4 duration-200">
            <h3 className="text-sm font-bold text-gray-950 dark:text-white mb-4">Create Assignment</h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">Assisgnment Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Write Chapter 3 draft"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800/80 bg-gray-50 dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800/80 bg-gray-50 dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">Category / Subject</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800/80 bg-gray-50 dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-white font-medium"
                  required
                >
                  <option value="General">General</option>
                  {Array.from(new Set(classes.map((c) => c.name))).map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">Attach Assignment Document (PDF only, under 25MB)</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleAssignmentFileChange}
                  className="w-full px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-800/80 bg-gray-50 dark:bg-gray-950 text-xs focus:outline-none file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-blue-50 dark:file:bg-blue-950/30 file:text-blue-700 dark:file:text-blue-400 hover:file:bg-blue-100"
                />
                {attachmentFile && (
                  <p className="text-[10px] text-green-600 dark:text-green-400 mt-1 font-bold">
                    ✓ Attached: {attachmentFile.name} ({attachmentFile.size})
                  </p>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/10 transition-all"
                >
                  Add Assignment
                </button>
              </div>
            </form>
          </div>
        )}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-950 dark:text-white mb-4">Active Assignment ({filteredActive.length})</h3>

            <div className="divide-y divide-gray-100 dark:divide-gray-800/40">
              {filteredActive.map((t) => (
                <div
                  key={t.id}
                  className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4 group"
                >
                  <div className="flex items-start gap-3 flex-1">
                    {isStudent ? (
                      <div className="p-1.5 text-gray-300 dark:text-gray-650 shrink-0 mt-0.5">
                        <Circle className="w-4 h-4" />
                      </div>
                    ) : (
                      <button
                        onClick={() => handleToggleStatus(t)}
                        className="p-1 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 shrink-0 mt-0.5"
                      >
                        <Circle className="w-5 h-5" />
                      </button>
                    )}

                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-gray-950 dark:text-white leading-snug">{t.title}</h4>

                      {t.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xl font-medium leading-relaxed">
                          {t.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-[10px] text-gray-400 dark:text-gray-500 font-bold pt-0.5">
                        <span className={`flex items-center gap-1 ${t.dueDate < todayStr ? "text-red-500" : ""}`}>
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Due: {t.dueDate} {t.dueDate < todayStr ? "(Overdue)" : ""}</span>
                        </span>
                      </div>

                      
                      {t.attachments && t.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Assignment Document:</p>
                          {t.attachments.map((attach, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400">
                              <FileText className="w-3.5 h-3.5 text-blue-500" />
                              <a href={attach.content} download={attach.name} className="hover:underline">
                                {attach.name} ({attach.size})
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {isStudent ? (
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800/40">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Your Submission:</span>
                              {t.status === "completed" ? (
                                <span className="text-[9px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 px-2 py-0.5 rounded-full">Submitted</span>
                              ) : (
                                <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-full">Not Submitted</span>
                              )}
                            </div>

                            {t.submissions && t.submissions.length > 0 ? (
                              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-gray-50/50 dark:bg-gray-800/40 border border-gray-100/50 dark:border-gray-800/30">
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                                  <a
                                    href={t.submissions[0].content}
                                    download={t.submissions[0].name}
                                    className="text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-blue-500 hover:underline truncate"
                                  >
                                    {t.submissions[0].name}
                                  </a>
                                  <span className="text-[9px] text-gray-400 font-semibold shrink-0">({t.submissions[0].size})</span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl font-bold text-[10px] cursor-pointer transition-all border border-blue-100 dark:border-blue-900/30">
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>Submit PDF</span>
                                  <input
                                    type="file"
                                    accept="application/pdf"
                                    onChange={(e) => handleStudentSubmissionUpload(e, t)}
                                    className="hidden"
                                  />
                                </label>
                                <span className="text-[9px] text-gray-400 font-medium">PDF format only, under 25MB</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* Admin/Teacher view: see student submissions */
                        t.submissions && t.submissions.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800/40">
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Student Submission:</p>
                            {t.submissions.map((sub, idx) => (
                              <div key={idx} className="flex items-center justify-between gap-2 mt-1 p-2 rounded-xl bg-green-50/30 dark:bg-green-950/10 border border-green-100/20 dark:border-green-900/20">
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileText className="w-4 h-4 text-green-500 shrink-0" />
                                  <a href={sub.content} download={sub.name} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline truncate">
                                    {sub.name}
                                  </a>
                                  <span className="text-[9px] text-gray-400 font-semibold shrink-0">({sub.size})</span>
                                </div>
                                <span className="text-[9px] text-gray-400 dark:text-gray-500 font-bold">{new Date(sub.submittedAt).toLocaleDateString()}</span>
                              </div>
                            ))}
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {!isStudent && (
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              {filteredActive.length === 0 && (
                <p className="text-xs text-center text-gray-400 dark:text-gray-500 py-6 font-medium">No active assignments match your filters.</p>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 mb-4">Completed History ({filteredCompleted.length})</h3>

            <div className="divide-y divide-gray-100 dark:divide-gray-800/40">
              {filteredCompleted.map((t) => (
                <div
                  key={t.id}
                  className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4 group"
                >
                  <div className="flex items-start gap-3 flex-1">
                    {isStudent ? (
                      <div className="p-1.5 text-green-500 shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    ) : (
                      <button
                        onClick={() => handleToggleStatus(t)}
                        className="p-1 text-green-500 hover:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 shrink-0 mt-0.5"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    )}

                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-gray-400 dark:text-gray-500 line-through leading-snug">{t.title}</h4>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">
                        Completed successfully
                      </p>

                      
                      {t.submissions && t.submissions.length > 0 && (
                        <div className="mt-2 flex items-center gap-2 text-xs font-bold">
                          <FileText className="w-3.5 h-3.5 text-green-500" />
                          <a href={t.submissions[0].content} download={t.submissions[0].name} className="text-blue-600 dark:text-blue-400 hover:underline">
                            {t.submissions[0].name} ({t.submissions[0].size})
                          </a>
                          {isStudent && (
                            <button
                              onClick={() => handleRemoveSubmission(t)}
                              className="text-gray-400 hover:text-red-500 ml-1"
                              title="Delete Submission"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {!isStudent && (
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              {filteredCompleted.length === 0 && (
                <p className="text-xs text-center text-gray-400 dark:text-gray-500 py-6 font-medium">No completed tasks yet.</p>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
