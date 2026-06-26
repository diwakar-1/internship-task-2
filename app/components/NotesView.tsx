import React, { useState, useEffect, useRef } from "react";
import { dbService } from "../services/firebaseService";
import type { NoteItem, TimetableClass } from "../services/firebaseService";
import {
  Plus,
  Trash2,
  BookOpen,
  Folder,
  Paperclip,
  Eye,
  Edit3,
  Save,
  FileText,
  FileImage,
  FileCode,
  Download
} from "lucide-react";

import { useTheme } from "./ThemeContext";

export const NotesView: React.FC = () => {
  const { portalMode } = useTheme();
  const isStudent = portalMode === "student";
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [classes, setClasses] = useState<TimetableClass[]>([]);

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

  // Editor states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("General");
  const [attachments, setAttachments] = useState<Array<{ name: string; type: string; size: string; dataUrl?: string }>>([]);

  const [editorMode, setEditorMode] = useState<"edit" | "preview" | "split">("split");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pdfAttachment = attachments.find(
    (attach) => attach.type === "application/pdf" || attach.name.toLowerCase().endsWith(".pdf")
  );

  useEffect(() => {
    const unsubscribe = dbService.subscribeNotes((list) => {
      setNotes(list);
      if (list.length > 0 && !selectedNoteId) {
        handleSelectNote(list[0]);
      }
    });
    if (!unsubscribe) {
      loadNotes();
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [selectedNoteId]);

  const loadNotes = async () => {
    const list = await dbService.getNotes();
    setNotes(list);
    if (list.length > 0 && !selectedNoteId) {
      handleSelectNote(list[0]);
    }
  };

  const handleSelectNote = (note: NoteItem) => {
    setSelectedNoteId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setCategory(note.category);
    setAttachments(note.attachments || []);
  };

  const handleCreateNote = async () => {
    const newNote: NoteItem = {
      id: Math.random().toString(36).substr(2, 9),
      title: "Untitled Note",
      content: "# Untitled Note\n\nStart typing your lecture notes here...",
      category: selectedCategory === "All" ? "General" : selectedCategory,
      updatedAt: new Date().toISOString(),
      attachments: []
    };

    await dbService.saveNote(newNote);
    await loadNotes();
    handleSelectNote(newNote);
  };

  const handleSaveNote = async () => {
    if (!selectedNoteId) return;

    const updated: NoteItem = {
      id: selectedNoteId,
      title: title || "Untitled Note",
      content,
      category: category || "General",
      updatedAt: new Date().toISOString(),
      attachments
    };

    await dbService.saveNote(updated);

    // Refresh list while maintaining selection
    const list = await dbService.getNotes();
    setNotes(list);
  };

  const handleDeleteNote = async (id: string) => {
    if (confirm("Are you sure you want to delete this note?")) {
      await dbService.deleteNote(id);
      setSelectedNoteId(null);
      const list = await dbService.getNotes();
      setNotes(list);
      if (list.length > 0) {
        handleSelectNote(list[0]);
      } else {
        setTitle("");
        setContent("");
        setCategory("General");
        setAttachments([]);
      }
    }
  };

  // Attachment operations using HTML5 FileReader
  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    // Enforce PDF only
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      alert("Only PDF files are allowed for note attachments.");
      return;
    }

    // Limit to 25MB
    if (file.size > 25 * 1024 * 1024) {
      alert("Please upload PDF files under 25MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      const sizeStr = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(file.size / 1024).toFixed(1)} KB`;

      const newAttachment = {
        name: file.name,
        type: file.type,
        size: sizeStr,
        dataUrl
      };

      const updatedAttachments = [...attachments, newAttachment];
      setAttachments(updatedAttachments);

      // Auto-save the note with the attachment
      if (selectedNoteId) {
        const noteToSave: NoteItem = {
          id: selectedNoteId,
          title,
          content,
          category,
          updatedAt: new Date().toISOString(),
          attachments: updatedAttachments
        };
        await dbService.saveNote(noteToSave);
        const list = await dbService.getNotes();
        setNotes(list);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = async (index: number) => {
    const updated = attachments.filter((_, i) => i !== index);
    setAttachments(updated);

    if (selectedNoteId) {
      const noteToSave: NoteItem = {
        id: selectedNoteId,
        title,
        content,
        category,
        updatedAt: new Date().toISOString(),
        attachments: updated
      };
      await dbService.saveNote(noteToSave);
      const list = await dbService.getNotes();
      setNotes(list);
    }
  };

  // Categories helper
  const categories = ["All"].concat(
    Array.from(
      new Set(
        notes.map(n => n.category)
          .concat(classes.map(c => c.name))
      )
    )
  );

  const filteredNotes = selectedCategory === "All"
    ? notes
    : notes.filter(n => n.category === selectedCategory);

  // Custom regex markdown parser for preview
  const renderMarkdown = (mdText: string) => {
    if (!mdText) return "";
    let html = mdText
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Headers
    html = html.replace(/^### (.*?)$/gm, '<h3 class="text-sm font-bold text-gray-900 dark:text-white mt-4 mb-2">$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2 class="text-base font-bold text-gray-900 dark:text-white mt-5 mb-2.5 border-b border-gray-100 dark:border-gray-800/60 pb-1">$1</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h1 class="text-lg font-black text-gray-950 dark:text-white mt-6 mb-3">$1</h1>');

    // Bold & Italics
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
    html = html.replace(/__(.*?)__/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>');
    html = html.replace(/_(.*?)_/g, '<em class="italic">$1</em>');

    // Bullet Lists
    html = html.replace(/^- (.*?)$/gm, '<li class="ml-4 list-disc text-xs text-gray-600 dark:text-gray-400 mt-1">$1</li>');

    // Code blocks
    html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-50 dark:bg-gray-800 text-red-500 px-1 py-0.5 rounded font-mono text-[11px]">$1</code>');

    // Paragraph breaks
    html = html.replace(/\n/g, "<br />");

    return html;
  };

  const getAttachmentIcon = (type: string) => {
    if (type.includes("image")) return <FileImage className="w-4 h-4 text-blue-500" />;
    if (type.includes("code") || type.includes("javascript") || type.includes("json")) return <FileCode className="w-4 h-4 text-purple-500" />;
    return <FileText className="w-4 h-4 text-orange-500" />;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 h-[calc(100vh-80px)] overflow-hidden">

      
      <div className="md:col-span-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 rounded-3xl p-5 shadow-sm flex flex-col h-full overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-gray-950 dark:text-white flex items-center gap-1.5">
            <Folder className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Subjects</span>
          </h3>
          {!isStudent && (
            <button
              onClick={handleCreateNote}
              className="p-1 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        
        <div className="space-y-1 overflow-y-auto mb-4 border-b border-gray-200/40 dark:border-gray-800/40 pb-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${selectedCategory === cat
                  ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/30 font-bold"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-900/30"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          <span className="text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wide px-1.5">Notes List</span>
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => handleSelectNote(note)}
              className={`p-3 rounded-2xl cursor-pointer border text-left transition-all ${selectedNoteId === note.id
                  ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/10"
                  : "bg-gray-50/50 dark:bg-gray-800/20 border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/40 text-gray-900 dark:text-white"
                }`}
            >
              <h4 className="text-xs font-extrabold truncate">{note.title}</h4>
              <p className={`text-[10px] mt-1 font-semibold truncate ${selectedNoteId === note.id ? "text-white/85" : "text-gray-400 dark:text-gray-500"
                }`}>
                {note.category} • {new Date(note.updatedAt).toLocaleDateString()}
              </p>
            </div>
          ))}

          {filteredNotes.length === 0 && (
            <p className="text-xs text-center text-gray-400 dark:text-gray-500 py-6">No notes here.</p>
          )}
        </div>
      </div>

      
      <div className="md:col-span-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 rounded-3xl p-6 shadow-sm flex flex-col h-full overflow-hidden">
        {selectedNoteId ? (
          <>
            
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800/60 mb-4 shrink-0">
              <div className="flex-1 min-w-[200px] flex items-center gap-3">
                {isStudent ? (
                  <span className="text-base font-bold text-gray-950 dark:text-white py-1 block w-full truncate">{title}</span>
                ) : (
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => { setTitle(e.target.value); handleSaveNote(); }}
                    onBlur={handleSaveNote}
                    placeholder="Note Title"
                    className="text-base font-bold text-gray-950 dark:text-white bg-transparent border-b border-transparent hover:border-gray-200 dark:hover:border-gray-700 focus:border-blue-500 focus:outline-none py-1 w-full"
                  />
                )}

                
                {isStudent ? (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/30 whitespace-nowrap">
                    {category}
                  </span>
                ) : (
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      const updated: NoteItem = {
                        id: selectedNoteId || "",
                        title: title || "Untitled Note",
                        content,
                        category: e.target.value,
                        updatedAt: new Date().toISOString(),
                        attachments
                      };
                      dbService.saveNote(updated).then(() => {
                        dbService.getNotes().then(setNotes);
                      });
                    }}
                    className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/30 focus:outline-none min-w-[100px] cursor-pointer"
                  >
                    <option value="General">General</option>
                    {Array.from(new Set(classes.map((c) => c.name))).map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              
              <div className="flex items-center gap-2">
                {isStudent ? (
                  <button
                    onClick={() => {
                      const printWindow = window.open('', '_blank');
                      if (!printWindow) return;
                      const renderedHtml = renderMarkdown(content);
                      const html = `<!DOCTYPE html><html><head><title>${title}</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#333;line-height:1.7}h1{font-size:22px;margin-bottom:10px}h2{font-size:18px;border-bottom:1px solid #eee;padding-bottom:4px;margin-top:20px}h3{font-size:15px;margin-top:16px}ul{padding-left:20px}li{margin:4px 0}code{background:#f5f5f5;padding:2px 6px;border-radius:4px;font-size:12px}</style></head><body>${renderedHtml}</body></html>`;
                      printWindow.document.write(html);
                      printWindow.document.close();
                      printWindow.onload = () => { printWindow.print(); };
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/10 transition-all"
                    title="Download Note (.pdf)"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Note (.pdf)</span>
                  </button>
                ) : (
                  <>
                    
                    <div className="bg-gray-50 dark:bg-gray-800 p-1 rounded-xl flex border border-gray-100 dark:border-gray-700">
                      <button
                        onClick={() => setEditorMode("edit")}
                        className={`p-1.5 rounded-lg text-gray-500 dark:text-gray-400 ${editorMode === "edit" ? "bg-white dark:bg-gray-900 text-blue-500 dark:text-blue-400 shadow-sm" : "hover:text-gray-800"
                          }`}
                        title="Edit Only"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditorMode("split")}
                        className={`hidden md:block p-1.5 rounded-lg text-gray-500 dark:text-gray-400 ${editorMode === "split" ? "bg-white dark:bg-gray-900 text-blue-500 dark:text-blue-400 shadow-sm" : "hover:text-gray-800"
                          }`}
                        title="Split Screen"
                      >
                        <BookOpen className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditorMode("preview")}
                        className={`p-1.5 rounded-lg text-gray-500 dark:text-gray-400 ${editorMode === "preview" ? "bg-white dark:bg-gray-900 text-blue-500 dark:text-blue-400 shadow-sm" : "hover:text-gray-800"
                          }`}
                        title="Preview Only"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={handleSaveNote}
                      className="p-2.5 rounded-xl bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 text-white shadow-sm flex items-center justify-center"
                      title="Force Save"
                    >
                      <Save className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteNote(selectedNoteId)}
                      className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center"
                      title="Delete Note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            
            <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
              {pdfAttachment ? (
                <div className="flex-1 flex flex-col h-full rounded-2xl border border-gray-100 dark:border-gray-800/60 overflow-hidden bg-white dark:bg-gray-900">
                  <iframe
                    src={pdfAttachment.dataUrl}
                    className="w-full h-full min-h-[450px] border-0"
                    title={title}
                  />
                </div>
              ) : (
                <>
                  
                  {!isStudent && (editorMode === "edit" || (editorMode === "split" && typeof window !== "undefined" && window.innerWidth >= 768)) && (
                    <div className="flex-1 flex flex-col h-full min-h-0">
                      <textarea
                        value={content}
                        onChange={(e) => { setContent(e.target.value); handleSaveNote(); }}
                        onBlur={handleSaveNote}
                        placeholder="Type rich notes here... (e.g. # Header, **bold**, - lists)"
                        className="w-full flex-1 p-4 rounded-2xl border border-gray-100 dark:border-gray-800/80 bg-gray-50 dark:bg-gray-950 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/10 text-gray-900 dark:text-white leading-relaxed resize-none overflow-y-auto"
                      />
                    </div>
                  )}

                  
                  {(isStudent || editorMode === "preview" || editorMode === "split") && (
                    <div className="flex-1 p-4 rounded-2xl bg-white dark:bg-gray-900/20 border border-gray-100 dark:border-gray-800/50 overflow-y-auto prose dark:prose-invert max-w-none text-left leading-relaxed">
                      {content ? (
                        <div
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
                          className="text-xs text-gray-700 dark:text-gray-300 font-sans"
                        />
                      ) : (
                        <em className="text-xs text-gray-400 font-medium">Nothing to preview. Start writing in the editor panel.</em>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800/60 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wide flex items-center gap-1">
                  <Paperclip className="w-3.5 h-3.5 text-blue-500" />
                  <span>Attachments ({attachments.length})</span>
                </span>

                {!isStudent && (
                  <>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700/80 text-gray-600 dark:text-gray-400 rounded-xl font-bold text-[10px] transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Attach File</span>
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAttachmentUpload}
                      accept="application/pdf"
                      className="hidden"
                    />
                  </>
                )}
              </div>

              
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto py-1">
                {attachments.map((attach, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    {getAttachmentIcon(attach.type)}

                    <div className="max-w-[120px] overflow-hidden">
                      <p className="text-[10px] font-bold text-gray-900 dark:text-white truncate" title={attach.name}>{attach.name}</p>
                      <p className="text-[8px] text-gray-400 font-semibold">{attach.size}</p>
                    </div>

                    
                    {attach.dataUrl && (
                      <a
                        href={attach.dataUrl}
                        download={attach.name}
                        className="p-1 text-gray-400 hover:text-blue-500"
                        title="Download file"
                      >
                        <Download className="w-3 h-3" />
                      </a>
                    )}

                    {!isStudent && (
                      <button
                        onClick={() => handleRemoveAttachment(index)}
                        className="p-1 text-gray-400 hover:text-red-500 rounded-md"
                        title="Remove attachment"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}

                {attachments.length === 0 && (
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium py-1">No attachments loaded in this note. Upload PDF files under 25MB.</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <BookOpen className="w-12 h-12 text-blue-500 opacity-60 mb-3" />
            <h3 className="text-sm font-bold text-gray-950 dark:text-white">
              {isStudent ? "Select a Lecture Note" : "Start Writing Lectures"}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mt-1 mb-4">
              {isStudent
                ? "Select an existing lecture note folder and file on the left side to view or download it."
                : "Select an existing notes file on the left side, or create a brand new notes document."}
            </p>
            {!isStudent && (
              <button
                onClick={handleCreateNote}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/10 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create Note</span>
              </button>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
