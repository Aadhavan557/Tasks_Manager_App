import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  Calendar,
  User,
  Users,
  Tag,
  CheckSquare,
  FileText,
  RotateCw,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, isValidSupabaseConfig } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  formatDate,
  TASK_CATEGORIES,
  TASK_PRIORITIES,
  STATUS_COLORS,
  PRIORITY_COLORS,
  cn,
} from "@/lib/utils";
import type { Task, TaskStatus, TaskCategory, TaskPriority } from "@/types/database";

export function TasksPage() {
  const { profile, partnerProfile } = useAuth();
  const [searchParams] = useSearchParams();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "to_me" | "to_partner" | "both">("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // New task form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  // assignedTo: "both" | partnerProfile.id | profile.id
  const [assignedTo, setAssignedTo] = useState<string>("both");
  const [category, setCategory] = useState<TaskCategory>("Verilog");
  const [priority, setPriority] = useState<TaskPriority>("Medium");
  const [deadline, setDeadline] = useState("");
  const [deliverable, setDeliverable] = useState("");
  const [submissionNotes, setSubmissionNotes] = useState("");

  useEffect(() => {
    loadTasks();

    if (searchParams.get("new") === "1") {
      setShowCreateDialog(true);
    }

    // Listen to local storage changes (multi-tab sync) and in-window updates
    const handleStorageUpdate = (e: StorageEvent) => {
      if (e.key === "duomate_tasks" && e.newValue) {
        try {
          setTasks(JSON.parse(e.newValue));
        } catch {}
      }
    };

    const handleCustomUpdate = () => {
      loadTasks();
    };

    window.addEventListener("storage", handleStorageUpdate);
    window.addEventListener("duomate_task_updated", handleCustomUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageUpdate);
      window.removeEventListener("duomate_task_updated", handleCustomUpdate);
    };
  }, [searchParams]);

  // When profile or partnerProfile changes, ensure assignedTo has a sensible default
  useEffect(() => {
    if (searchParams.get("assign") === "partner" && partnerProfile) {
      setAssignedTo(partnerProfile.id);
    } else if (!assignedTo) {
      setAssignedTo("both");
    }
  }, [partnerProfile, searchParams]);

  const loadTasks = async () => {
    // 1. First load from localStorage for instant display
    const stored = localStorage.getItem("duomate_tasks");
    if (stored) {
      try {
        setTasks(JSON.parse(stored));
      } catch {
        setTasks([]);
      }
    } else {
      setTasks([]);
    }

    // 2. If Supabase is connected, fetch from DB
    if (isValidSupabaseConfig() && profile?.workspace_id) {
      try {
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .eq("workspace_id", profile.workspace_id)
          .order("created_at", { ascending: false });

        if (!error && data) {
          setTasks(data as Task[]);
          localStorage.setItem("duomate_tasks", JSON.stringify(data));
        }
      } catch (err) {
        console.error("Supabase load tasks error:", err);
      }
    }
  };

  const saveTasks = async (updated: Task[]) => {
    setTasks(updated);
    localStorage.setItem("duomate_tasks", JSON.stringify(updated));
    // Broadcast event so Dashboard and other tabs update instantly
    window.dispatchEvent(new Event("duomate_task_updated"));
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !profile) return;

    const newTask: Task = {
      id: "task-" + Date.now(),
      workspace_id: profile.workspace_id || "duomate-shared-workspace",
      title: title.trim(),
      description: description.trim() || null,
      created_by: profile.id,
      assigned_to: assignedTo || "both",
      category,
      priority,
      status: "Requested",
      start_date: null,
      deadline: deadline || null,
      expected_duration: null,
      expected_deliverable: deliverable.trim() || null,
      reference_links: [],
      additional_instructions: null,
      progress_percentage: 0,
      requires_review: true,
      submission_notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updated = [newTask, ...tasks];
    await saveTasks(updated);

    // If Supabase is connected, persist to cloud
    if (isValidSupabaseConfig()) {
      try {
        await supabase.from("tasks").insert(newTask);
      } catch (err) {
        console.error("Supabase insert error:", err);
      }
    }

    const partnerName = partnerProfile?.full_name?.split(" ")[0] || "Partner";
    if (assignedTo === "both") {
      toast.success("Shared task created for both of you!");
    } else if (assignedTo === partnerProfile?.id) {
      toast.success(`Task assigned to ${partnerName}!`);
    } else {
      toast.success("Personal task created!");
    }

    // Reset form
    setTitle("");
    setDescription("");
    setDeliverable("");
    setDeadline("");
    setShowCreateDialog(false);
    setActiveTab("all"); // Immediately show all tasks so user sees their new task!
  };

  const handleUpdateStatus = async (taskId: string, newStatus: TaskStatus, notes?: string) => {
    const updated = tasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            status: newStatus,
            submission_notes: notes !== undefined ? notes : t.submission_notes,
            progress_percentage: newStatus === "Approved" ? 100 : t.progress_percentage,
            updated_at: new Date().toISOString(),
          }
        : t
    );
    await saveTasks(updated);

    if (isValidSupabaseConfig()) {
      try {
        await supabase
          .from("tasks")
          .update({
            status: newStatus,
            submission_notes: notes !== undefined ? notes : undefined,
            progress_percentage: newStatus === "Approved" ? 100 : undefined,
            updated_at: new Date().toISOString(),
          })
          .eq("id", taskId);
      } catch (err) {
        console.error("Supabase update error:", err);
      }
    }

    if (selectedTask?.id === taskId) {
      setSelectedTask((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
              submission_notes: notes !== undefined ? notes : prev.submission_notes,
              progress_percentage: newStatus === "Approved" ? 100 : prev.progress_percentage,
            }
          : null
      );
    }
    toast.success(`Task status updated to ${newStatus}`);
  };

  const handleDeleteTask = async (taskId: string) => {
    const updated = tasks.filter((t) => t.id !== taskId);
    await saveTasks(updated);

    if (isValidSupabaseConfig()) {
      try {
        await supabase.from("tasks").delete().eq("id", taskId);
      } catch (err) {
        console.error("Supabase delete error:", err);
      }
    }

    setSelectedTask(null);
    toast.success("Task deleted");
  };

  // Filter tasks
  // 1. To Me: assigned to my id OR assigned to "both"
  const assignedToMe = tasks.filter(
    (t) => t.assigned_to === profile?.id || t.assigned_to === "both"
  );

  // 2. To Partner: assigned to partner id OR assigned to "both"
  const assignedToPartner = tasks.filter(
    (t) => t.assigned_to === partnerProfile?.id || t.assigned_to === "both"
  );

  // 3. Both only
  const sharedTasks = tasks.filter((t) => t.assigned_to === "both");

  // Displayed tasks according to active tab
  const displayedTasks =
    activeTab === "to_me"
      ? assignedToMe
      : activeTab === "to_partner"
      ? assignedToPartner
      : activeTab === "both"
      ? sharedTasks
      : tasks;

  const partnerName = partnerProfile?.full_name?.split(" ")[0] || "Partner";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-indigo-500" />
            Tasks &amp; Deliverables
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Assign tasks to each other, create shared study goals, and verify completed work.
          </p>
        </div>

        <Button
          onClick={() => {
            setAssignedTo("both");
            setShowCreateDialog(true);
          }}
          variant="gradient"
          size="sm"
          className="gap-1.5 text-xs shadow-md shadow-indigo-500/20"
        >
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "all" | "to_me" | "to_partner" | "both")}
      >
        <TabsList className="grid grid-cols-4 max-w-lg h-9">
          <TabsTrigger value="all" className="text-xs">
            All ({tasks.length})
          </TabsTrigger>
          <TabsTrigger value="to_me" className="text-xs">
            To Me ({assignedToMe.length})
          </TabsTrigger>
          <TabsTrigger value="to_partner" className="text-xs truncate">
            To {partnerName} ({assignedToPartner.length})
          </TabsTrigger>
          <TabsTrigger value="both" className="text-xs">
            Shared ({sharedTasks.length})
          </TabsTrigger>
        </TabsList>

        <div className="pt-4">
          {displayedTasks.length === 0 ? (
            <Card className="border-dashed p-10 text-center">
              <CheckSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm font-semibold">No tasks in this list</p>
              <p className="text-xs text-muted-foreground mt-1">
                Click "+ New Task" to create a task for yourself, your partner, or both of you.
              </p>
            </Card>
          ) : (
            <div className="space-y-2.5">
              {displayedTasks.map((task) => {
                const isBoth = task.assigned_to === "both";
                const isAssignedToMe = task.assigned_to === profile?.id;

                return (
                  <Card
                    key={task.id}
                    onClick={() => {
                      setSelectedTask(task);
                      setSubmissionNotes(task.submission_notes || "");
                    }}
                    className="border-border hover:border-indigo-500/40 cursor-pointer transition-all"
                  >
                    <CardContent className="p-3.5 flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-xs leading-snug truncate">
                            {task.title}
                          </h3>
                          <Badge
                            className={cn(
                              "text-[9px] px-1.5 py-0 border",
                              STATUS_COLORS[task.status]
                            )}
                          >
                            {task.status}
                          </Badge>
                          <Badge
                            className={cn(
                              "text-[9px] px-1.5 py-0 border",
                              PRIORITY_COLORS[task.priority]
                            )}
                          >
                            {task.priority}
                          </Badge>

                          {/* Assignee indicator */}
                          {isBoth ? (
                            <Badge variant="purple" className="text-[9px] px-1.5 py-0 gap-1">
                              <Users className="h-2.5 w-2.5" />
                              Both (Shared)
                            </Badge>
                          ) : isAssignedToMe ? (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-indigo-400">
                              For You
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-purple-400">
                              For {partnerName}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1.5 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {task.category}
                          </span>
                          {task.deadline && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Due {formatDate(task.deadline, "MMM d")}
                            </span>
                          )}
                          {task.expected_deliverable && (
                            <span className="flex items-center gap-1 truncate max-w-xs text-foreground/80">
                              <FileText className="h-3 w-3 text-indigo-400 shrink-0" />
                              {task.expected_deliverable}
                            </span>
                          )}
                        </div>
                      </div>

                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        View
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </Tabs>

      {/* Create Task Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4 text-indigo-500" />
              Create New Task
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateTask} className="space-y-4 pt-2">
            {/* Task Title */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Task Title *</Label>
              <Input
                placeholder="e.g. Implement 4-bit ALU in Verilog with testbench"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>

            {/* Who is this task for? (Both / Partner / Myself) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Who is this task for?</Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setAssignedTo("both")}
                  className={cn(
                    "flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-xs transition-all",
                    assignedTo === "both"
                      ? "border-indigo-500 bg-indigo-500/15 text-indigo-400 font-bold ring-1 ring-indigo-500"
                      : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/60"
                  )}
                >
                  <Users className="h-4 w-4 mb-1 text-indigo-400" />
                  <span>Both (Shared)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAssignedTo(partnerProfile?.id || "partner")}
                  className={cn(
                    "flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-xs transition-all",
                    assignedTo === partnerProfile?.id || (assignedTo !== "both" && assignedTo !== profile?.id)
                      ? "border-purple-500 bg-purple-500/15 text-purple-400 font-bold ring-1 ring-purple-500"
                      : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/60"
                  )}
                >
                  <User className="h-4 w-4 mb-1 text-purple-400" />
                  <span className="truncate">{partnerName}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAssignedTo(profile?.id || "me")}
                  className={cn(
                    "flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-xs transition-all",
                    assignedTo === profile?.id
                      ? "border-emerald-500 bg-emerald-500/15 text-emerald-400 font-bold ring-1 ring-emerald-500"
                      : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/60"
                  )}
                >
                  <User className="h-4 w-4 mb-1 text-emerald-400" />
                  <span>Myself</span>
                </button>
              </div>
            </div>

            {/* Category & Priority in Clean Native Styled Selects (Zero overlap!) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Category</Label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TaskCategory)}
                  className="h-9 w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {TASK_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Priority</Label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="h-9 w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {TASK_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Deadline */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Deadline (Optional)</Label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Description (Optional)</Label>
              <Textarea
                placeholder="Details of the problem or assignment..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="text-xs"
              />
            </div>

            {/* Expected Deliverable */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Expected Deliverable (Optional)</Label>
              <Input
                placeholder="e.g. Verilog source code + simulation testbench screenshot"
                value={deliverable}
                onChange={(e) => setDeliverable(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="gradient" size="sm">
                Assign Task
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Task Inspection & Review Dialog */}
      {selectedTask && (
        <Dialog open={Boolean(selectedTask)} onOpenChange={() => setSelectedTask(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-start justify-between pr-4">
                <div>
                  <DialogTitle className="text-sm font-bold">
                    {selectedTask.title}
                  </DialogTitle>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <Badge className={cn("text-[10px] border", STATUS_COLORS[selectedTask.status])}>
                      {selectedTask.status}
                    </Badge>
                    <Badge className={cn("text-[10px] border", PRIORITY_COLORS[selectedTask.priority])}>
                      {selectedTask.priority}
                    </Badge>
                    {selectedTask.assigned_to === "both" && (
                      <Badge variant="purple" className="text-[10px] gap-1">
                        <Users className="h-3 w-3" />
                        Shared with Both
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3 text-xs pt-2">
              {selectedTask.description && (
                <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">
                    Description
                  </p>
                  <p className="text-foreground leading-relaxed">
                    {selectedTask.description}
                  </p>
                </div>
              )}

              {selectedTask.expected_deliverable && (
                <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">
                    Expected Deliverable
                  </p>
                  <p className="text-foreground">
                    {selectedTask.expected_deliverable}
                  </p>
                </div>
              )}

              {/* Submission / Review Notes */}
              {selectedTask.submission_notes && (
                <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">
                    Submission Deliverables &amp; Notes
                  </p>
                  <p className="text-foreground break-words font-mono text-[11px]">
                    {selectedTask.submission_notes}
                  </p>
                </div>
              )}

              {/* Action Buttons depending on status */}
              <div className="pt-2 border-t border-border/50 space-y-2">
                {/* 1. Requested -> Accept */}
                {selectedTask.status === "Requested" && (
                  <Button
                    onClick={() => handleUpdateStatus(selectedTask.id, "In Progress")}
                    variant="gradient"
                    size="sm"
                    className="w-full gap-1.5 text-xs"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Accept &amp; Start Working
                  </Button>
                )}

                {/* 2. In Progress -> Submit for Review */}
                {selectedTask.status === "In Progress" && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">
                      Deliverables / Work Submission Notes:
                    </Label>
                    <Textarea
                      placeholder="e.g. Verilog code link, testbench results, simulation waveform verified..."
                      value={submissionNotes}
                      onChange={(e) => setSubmissionNotes(e.target.value)}
                      rows={2}
                      className="text-xs"
                    />
                    <Button
                      onClick={() =>
                        handleUpdateStatus(
                          selectedTask.id,
                          "Submitted for Review",
                          submissionNotes
                        )
                      }
                      variant="gradient"
                      size="sm"
                      className="w-full gap-1.5 text-xs"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Submit for Review
                    </Button>
                  </div>
                )}

                {/* 3. Submitted for Review -> Partner Approval */}
                {selectedTask.status === "Submitted for Review" && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => handleUpdateStatus(selectedTask.id, "Approved")}
                      variant="gradient"
                      size="sm"
                      className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Approve Deliverable
                    </Button>
                    <Button
                      onClick={() =>
                        handleUpdateStatus(selectedTask.id, "Revision Requested")
                      }
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs border-orange-500/40 text-orange-400"
                    >
                      <RotateCw className="h-3.5 w-3.5" />
                      Request Revision
                    </Button>
                  </div>
                )}

                {/* 4. Revision Requested -> Resubmit */}
                {selectedTask.status === "Revision Requested" && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-orange-400 font-medium">
                      Partner requested revisions on this task.
                    </p>
                    <Textarea
                      placeholder="Updated notes or code corrections..."
                      value={submissionNotes}
                      onChange={(e) => setSubmissionNotes(e.target.value)}
                      rows={2}
                      className="text-xs"
                    />
                    <Button
                      onClick={() =>
                        handleUpdateStatus(
                          selectedTask.id,
                          "Submitted for Review",
                          submissionNotes
                        )
                      }
                      variant="gradient"
                      size="sm"
                      className="w-full gap-1.5 text-xs"
                    >
                      Resubmit Work
                    </Button>
                  </div>
                )}

                {/* Approved state */}
                {selectedTask.status === "Approved" && (
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center text-emerald-400 font-medium text-xs">
                    ✓ Task completed and approved!
                  </div>
                )}

                {/* Delete button */}
                <div className="pt-2 flex justify-end">
                  <Button
                    onClick={() => handleDeleteTask(selectedTask.id)}
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-destructive gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Task
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
