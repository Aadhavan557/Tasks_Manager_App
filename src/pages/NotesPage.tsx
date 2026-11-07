import { useState, useEffect, useRef } from "react";
import {
  FileText,
  Save,
  Plus,
  Trash2,
  Copy,
  Clock,
  Sparkles,
  CheckCircle2,
  Edit3,
  User,
  Users,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { broadcastCloudSync } from "@/lib/cloudSync";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface StudyNote {
  id: string;
  title: string;
  content: string;
  category: string;
  created_by: string;
  created_by_name: string;
  last_edited_by_name: string;
  updated_at: string;
}

const NOTE_CATEGORIES = [
  "General",
  "Verilog HDL",
  "SystemVerilog",
  "Digital Electronics",
  "VLSI Design & CMOS",
  "GATE ECE",
  "Formulas & Cheatsheet",
  "Interview Prep",
];

const NOTEPAD_KEY = "duomate_shared_notepad";
const NOTEPAD_META_KEY = "duomate_shared_notepad_meta";
const NOTES_LIST_KEY = "duomate_shared_notes_list";

export function NotesPage() {
  const { profile, partnerProfile } = useAuth();

  // Active view tab: "pad" (Live shared scratchpad) or "notes" (Saved notes list)
  const [activeTab, setActiveTab] = useState<"pad" | "notes">("pad");

  // 1. Live Shared Notepad State (Blank by default!)
  const [notepadContent, setNotepadContent] = useState("");
  const [lastEditedBy, setLastEditedBy] = useState<string>("");
  const [lastEditedAt, setLastEditedAt] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // 2. Saved Notes List (Blank by default!)
  const [savedNotes, setSavedNotes] = useState<StudyNote[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNote, setSelectedNote] = useState<StudyNote | null>(null);

  // Modal for creating / editing a structured note
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteCategory, setNoteCategory] = useState("Verilog HDL");
  const [noteBody, setNoteBody] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const saveTimeoutRef = useRef<any>(null);

  // Load everything on mount & listen to sync events
  useEffect(() => {
    loadNotepad();
    loadSavedNotes();

    // Cross-tab synchronization
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === NOTEPAD_KEY && e.newValue !== null) {
        setNotepadContent(e.newValue);
        const meta = localStorage.getItem(NOTEPAD_META_KEY);
        if (meta) {
          try {
            const parsed = JSON.parse(meta);
            setLastEditedBy(parsed.by);
            setLastEditedAt(parsed.at);
          } catch {}
        }
      }
      if (e.key === NOTES_LIST_KEY && e.newValue) {
        try {
          setSavedNotes(JSON.parse(e.newValue));
        } catch {}
      }
    };

    // In-window custom event
    const handleCustomEvent = () => {
      loadNotepad();
      loadSavedNotes();
    };

    window.addEventListener("storage", handleStorageEvent);
    window.addEventListener("duomate_notes_updated", handleCustomEvent);

    return () => {
      window.removeEventListener("storage", handleStorageEvent);
      window.removeEventListener("duomate_notes_updated", handleCustomEvent);
    };
  }, []);

  const loadNotepad = () => {
    const saved = localStorage.getItem(NOTEPAD_KEY);
    setNotepadContent(saved || "");

    const meta = localStorage.getItem(NOTEPAD_META_KEY);
    if (meta) {
      try {
        const parsed = JSON.parse(meta);
        setLastEditedBy(parsed.by || "");
        setLastEditedAt(parsed.at || "");
      } catch {}
    }
  };

  const loadSavedNotes = () => {
    const saved = localStorage.getItem(NOTES_LIST_KEY);
    if (saved) {
      try {
        setSavedNotes(JSON.parse(saved));
      } catch {
        setSavedNotes([]);
      }
    } else {
      setSavedNotes([]);
    }
  };

  // Live Auto-Save for the Shared Scratchpad
  const handleNotepadChange = (newText: string) => {
    setNotepadContent(newText);
    setIsSaving(true);

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      const now = new Date().toISOString();
      const editorName = profile?.full_name || "Aadhavan";

      localStorage.setItem(NOTEPAD_KEY, newText);
      localStorage.setItem(
        NOTEPAD_META_KEY,
        JSON.stringify({ by: editorName, at: now })
      );

      setLastEditedBy(editorName);
      setLastEditedAt(now);
      setIsSaving(false);

      // Notify other windows/tabs & all devices via cloud
      window.dispatchEvent(new Event("duomate_notes_updated"));
      broadcastCloudSync("NOTEPAD_SYNC", { text: newText, meta: { by: editorName, at: now } });
    }, 400);
  };

  // Clear live scratchpad
  const handleClearNotepad = () => {
    if (!notepadContent.trim()) return;
    if (confirm("Clear this shared notepad? Both of you will see a blank page.")) {
      setNotepadContent("");
      const now = new Date().toISOString();
      const editorName = profile?.full_name || "Friend";

      localStorage.setItem(NOTEPAD_KEY, "");
      localStorage.setItem(
        NOTEPAD_META_KEY,
        JSON.stringify({ by: editorName, at: now })
      );
      setLastEditedBy(editorName);
      setLastEditedAt(now);
      window.dispatchEvent(new Event("duomate_notes_updated"));
      broadcastCloudSync("NOTEPAD_SYNC", { text: "", meta: { by: editorName, at: now } });
      toast.success("Shared notepad cleared");
    }
  };

  // Copy notepad content
  const handleCopyNotepad = () => {
    if (!notepadContent) return;
    navigator.clipboard.writeText(notepadContent);
    toast.success("Notes copied to clipboard!");
  };

  // Save notepad content as a permanent note
  const handleSaveAsNote = () => {
    if (!notepadContent.trim()) {
      toast.error("Pad is empty. Type something before saving as a note.");
      return;
    }
    setNoteTitle("");
    setNoteBody(notepadContent);
    setNoteCategory("General");
    setEditingNoteId(null);
    setShowNoteModal(true);
  };

  // Create or edit structured note
  const handleSaveStructuredNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !profile) return;

    const editorName = profile.full_name;

    if (editingNoteId) {
      // Update existing
      const updated = savedNotes.map((n) =>
        n.id === editingNoteId
          ? {
              ...n,
              title: noteTitle.trim(),
              category: noteCategory,
              content: noteBody.trim(),
              last_edited_by_name: editorName,
              updated_at: new Date().toISOString(),
            }
          : n
      );
      setSavedNotes(updated);
      localStorage.setItem(NOTES_LIST_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event("duomate_notes_updated"));
      broadcastCloudSync("NOTES_LIST_SYNC", updated);
      toast.success("Note updated!");
    } else {
      // Create new
      const newNote: StudyNote = {
        id: "note-" + Date.now(),
        title: noteTitle.trim(),
        category: noteCategory,
        content: noteBody.trim(),
        created_by: profile.id,
        created_by_name: editorName,
        last_edited_by_name: editorName,
        updated_at: new Date().toISOString(),
      };
      const updated = [newNote, ...savedNotes];
      setSavedNotes(updated);
      localStorage.setItem(NOTES_LIST_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event("duomate_notes_updated"));
      broadcastCloudSync("NOTES_LIST_SYNC", updated);
      toast.success("Note saved and shared with your partner!");
    }

    setShowNoteModal(false);
    setEditingNoteId(null);
    setActiveTab("notes"); // switch to saved notes list
  };

  const handleDeleteNote = (id: string) => {
    const updated = savedNotes.filter((n) => n.id !== id);
    setSavedNotes(updated);
    localStorage.setItem(NOTES_LIST_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("duomate_notes_updated"));
    broadcastCloudSync("NOTES_LIST_SYNC", updated);
    setSelectedNote(null);
    toast.success("Note deleted");
  };

  const handleOpenEditNote = (note: StudyNote) => {
    setEditingNoteId(note.id);
    setNoteTitle(note.title);
    setNoteCategory(note.category);
    setNoteBody(note.content);
    setShowNoteModal(true);
  };

  const filteredNotes = savedNotes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const wordCount = notepadContent.trim()
    ? notepadContent.trim().split(/\s+/).length
    : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-500" />
            Shared Study Notes
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            A collaborative blank canvas for Aadhavan &amp; Narmatha. Changes reflect to each other instantly.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setEditingNoteId(null);
              setNoteTitle("");
              setNoteCategory("Verilog HDL");
              setNoteBody("");
              setShowNoteModal(true);
            }}
            variant="gradient"
            size="sm"
            className="text-xs gap-1.5 shadow-md shadow-indigo-500/20"
          >
            <Plus className="h-3.5 w-3.5" />
            New Note
          </Button>
        </div>
      </div>

      {/* Tabs: Live Notepad vs Saved Notes */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "pad" | "notes")}
      >
        <TabsList className="grid grid-cols-2 max-w-xs h-9">
          <TabsTrigger value="pad" className="text-xs gap-1.5">
            <Edit3 className="h-3.5 w-3.5" />
            Live Pad
          </TabsTrigger>
          <TabsTrigger value="notes" className="text-xs gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Saved Notes ({savedNotes.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: LIVE SHARED NOTEPAD (BLANK CANVAS) */}
        <TabsContent value="pad" className="space-y-3 mt-4">
          <Card className="border border-border p-4">
            {/* Status & Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-border/50 gap-2 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1.5 font-bold text-foreground">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Shared Live Pad
                </span>

                {lastEditedBy && (
                  <span className="text-[11px] text-muted-foreground">
                    · Last edited by{" "}
                    <strong className="text-foreground">{lastEditedBy}</strong>
                    {lastEditedAt && (
                      <> ({new Date(lastEditedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})</>
                    )}
                  </span>
                )}

                {isSaving ? (
                  <span className="text-[11px] text-indigo-400 font-medium">
                    Saving...
                  </span>
                ) : (
                  <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Synced
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground mr-1">
                  {wordCount} words · {notepadContent.length} chars
                </span>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyNotepad}
                  disabled={!notepadContent}
                  className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                >
                  <Copy className="h-3 w-3" />
                  Copy
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveAsNote}
                  disabled={!notepadContent.trim()}
                  className="h-7 text-xs gap-1 text-indigo-400 border-indigo-500/30 hover:border-indigo-500"
                >
                  <Save className="h-3 w-3" />
                  Save as Note
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearNotepad}
                  disabled={!notepadContent}
                  className="h-7 text-xs text-muted-foreground hover:text-destructive"
                >
                  Clear
                </Button>
              </div>
            </div>

            {/* Blank Canvas Textarea */}
            <Textarea
              placeholder="Blank shared page... Both of you can write notes, paste Verilog RTL snippets, GATE formula derivations, or study checklists here. Everything auto-saves and reflects to each other instantly."
              value={notepadContent}
              onChange={(e) => handleNotepadChange(e.target.value)}
              rows={18}
              className="w-full resize-none font-mono text-sm leading-relaxed border-none bg-transparent focus-visible:ring-0 p-1"
            />
          </Card>
        </TabsContent>

        {/* TAB 2: SAVED NOTES LIST */}
        <TabsContent value="notes" className="space-y-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search saved study notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
          </div>

          {savedNotes.length === 0 ? (
            <Card className="border-dashed p-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm font-semibold">No saved notes yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Write in the Live Pad and click "Save as Note", or click "+ New Note" to save key topics together.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredNotes.map((note) => (
                <Card
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                  className="border-border hover:border-indigo-500/40 cursor-pointer transition-all p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="font-bold text-sm text-foreground line-clamp-1">
                        {note.title}
                      </h3>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {note.category}
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-3 font-mono">
                      {note.content}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/40 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      By {note.last_edited_by_name}
                    </span>
                    <span>
                      {new Date(note.updated_at).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Note View Dialog */}
      {selectedNote && (
        <Dialog open={Boolean(selectedNote)} onOpenChange={() => setSelectedNote(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <div className="flex items-start justify-between pr-4">
                <div>
                  <DialogTitle className="text-base font-bold">
                    {selectedNote.title}
                  </DialogTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px]">
                      {selectedNote.category}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      By {selectedNote.last_edited_by_name} · Updated{" "}
                      {new Date(selectedNote.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="py-2">
              <pre className="p-3 rounded-xl bg-muted/40 border border-border/50 text-xs font-mono whitespace-pre-wrap max-h-80 overflow-y-auto">
                {selectedNote.content}
              </pre>
            </div>

            <DialogFooter className="flex items-center justify-between sm:justify-between pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteNote(selectedNote.id)}
                className="text-xs text-destructive hover:bg-destructive/10 gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleOpenEditNote(selectedNote);
                    setSelectedNote(null);
                  }}
                  className="text-xs gap-1"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedNote.content);
                    toast.success("Note content copied!");
                  }}
                  className="text-xs gap-1"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Note Create / Edit Dialog */}
      <Dialog open={showNoteModal} onOpenChange={setShowNoteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-500" />
              {editingNoteId ? "Edit Study Note" : "New Study Note"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveStructuredNote} className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Note Title *</Label>
              <Input
                placeholder="e.g. Verilog Setup & Hold Time Analysis"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Category</Label>
              <select
                value={noteCategory}
                onChange={(e) => setNoteCategory(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {NOTE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Note Content *</Label>
              <Textarea
                placeholder="Write your study notes, formulas, or code..."
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                rows={8}
                required
                className="text-xs font-mono"
              />
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowNoteModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="gradient" size="sm">
                Save &amp; Share
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

