import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  Timer,
  MessageCircle,
  ListTodo,
  CheckSquare,
  Sparkles,
  Flame,
  FileText,
  CalendarDays,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, formatStudyHours, STATUS_COLORS, cn } from "@/lib/utils";
import type { Task, StudySession } from "@/types/database";

export function DashboardPage() {
  const { profile, partnerProfile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [studySeconds, setStudySeconds] = useState(0);
  const [partnerStudySeconds, setPartnerStudySeconds] = useState(0);

  useEffect(() => {
    loadLocalDashboard();

    const handleUpdate = () => loadLocalDashboard();
    window.addEventListener("duomate_task_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("duomate_task_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [profile?.id, partnerProfile?.id]);

  const loadLocalDashboard = () => {
    // 1. Load real tasks from localStorage (or Supabase)
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

    // 2. Load study sessions
    const storedSessions = localStorage.getItem("duomate_study_sessions");
    if (storedSessions) {
      try {
        const sessions: StudySession[] = JSON.parse(storedSessions);
        const mySecs = sessions
          .filter((s) => s.user_id === profile?.id)
          .reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
        const pSecs = sessions
          .filter((s) => s.user_id === partnerProfile?.id)
          .reduce((sum, s) => sum + (s.duration_seconds || 0), 0);

        setStudySeconds(mySecs);
        setPartnerStudySeconds(pSecs);
      } catch {
        setStudySeconds(0);
        setPartnerStudySeconds(0);
      }
    }
  };

  const isAadhavan = profile?.full_name?.toLowerCase().includes("aadhavan");

  // Metrics calculated ONLY from actual user-created tasks (including shared "both" tasks)
  const myTasks = tasks.filter((t) => t.assigned_to === profile?.id || t.assigned_to === "both");
  const myCompleted = myTasks.filter((t) => t.status === "Approved").length;
  const myPending = myTasks.filter((t) =>
    ["Requested", "Accepted", "In Progress", "Submitted for Review"].includes(t.status)
  ).length;

  const partnerTasks = tasks.filter((t) => t.assigned_to === partnerProfile?.id || t.assigned_to === "both");
  const partnerCompleted = partnerTasks.filter((t) => t.status === "Approved").length;
  const partnerPending = partnerTasks.filter((t) =>
    ["Requested", "Accepted", "In Progress", "Submitted for Review"].includes(t.status)
  ).length;

  const activeTasks = tasks.filter(
    (t) => !["Approved", "Cancelled"].includes(t.status)
  );

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-border">
        <div>
          <h1 className="text-xl font-bold">
            Hi, {profile?.full_name || "Friend"} 👋
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Partner: <strong className="text-foreground">{partnerProfile?.full_name}</strong> · Career Track: VLSI &amp; GATE ECE
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/tasks?new=1">
            <Button variant="gradient" size="sm" className="gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" />
              Assign Task to {partnerProfile?.full_name?.split(" ")[0] || "Partner"}
            </Button>
          </Link>
          <Link to="/timer">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Timer className="h-3.5 w-3.5" />
              Start Study Timer
            </Button>
          </Link>
        </div>
      </div>

      {/* Head to Head Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* My Performance Card */}
        <Card className="border-indigo-500/20">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={profile?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs font-bold">
                    {getInitials(profile?.full_name ?? "U1")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-sm">{profile?.full_name} (You)</CardTitle>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px]">
                Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-xl bg-muted/40">
                <p className="text-lg font-bold font-mono text-green-500">
                  {myCompleted}
                </p>
                <p className="text-[10px] text-muted-foreground">Approved</p>
              </div>
              <div className="p-2 rounded-xl bg-muted/40">
                <p className="text-lg font-bold font-mono text-indigo-500">
                  {myPending}
                </p>
                <p className="text-[10px] text-muted-foreground">Pending</p>
              </div>
              <div className="p-2 rounded-xl bg-muted/40">
                <p className="text-lg font-bold font-mono text-purple-500">
                  {formatStudyHours(studySeconds)}
                </p>
                <p className="text-[10px] text-muted-foreground">Study Time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Partner Performance Card */}
        <Card className="border-purple-500/20">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={partnerProfile?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs font-bold">
                    {getInitials(partnerProfile?.full_name ?? "P2")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-sm">{partnerProfile?.full_name}</CardTitle>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px]">
                Partner
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-xl bg-muted/40">
                <p className="text-lg font-bold font-mono text-green-500">
                  {partnerCompleted}
                </p>
                <p className="text-[10px] text-muted-foreground">Approved</p>
              </div>
              <div className="p-2 rounded-xl bg-muted/40">
                <p className="text-lg font-bold font-mono text-indigo-500">
                  {partnerPending}
                </p>
                <p className="text-[10px] text-muted-foreground">Pending</p>
              </div>
              <div className="p-2 rounded-xl bg-muted/40">
                <p className="text-lg font-bold font-mono text-purple-500">
                  {formatStudyHours(partnerStudySeconds)}
                </p>
                <p className="text-[10px] text-muted-foreground">Study Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Tasks & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Tasks List */}
        <Card className="lg:col-span-2 border-border">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-indigo-500" />
                Active Tasks ({activeTasks.length})
              </CardTitle>
              <Link to="/tasks">
                <Button variant="ghost" size="sm" className="h-7 text-xs text-indigo-500 gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            {activeTasks.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-semibold">No active tasks right now.</p>
                <p className="text-[11px] text-muted-foreground/80 mt-1">
                  Create a task for your partner or assign yourself a study goal.
                </p>
                <Link to="/tasks?new=1" className="inline-block mt-3">
                  <Button variant="outline" size="sm" className="text-xs gap-1.5">
                    <Plus className="h-3 w-3" /> Create Task
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {activeTasks.slice(0, 4).map((task) => (
                  <Link key={task.id} to="/tasks">
                    <div className="flex items-center justify-between p-3 rounded-xl border border-border/60 hover:border-indigo-500/40 bg-card transition-all">
                      <div className="min-w-0 pr-3">
                        <p className="text-xs font-bold truncate">{task.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Assigned to:{" "}
                          <strong className="text-foreground/90">
                            {task.assigned_to === "both"
                              ? "Both of You (Shared)"
                              : task.assigned_to === profile?.id
                              ? "You"
                              : partnerProfile?.full_name}
                          </strong>{" "}
                          · {task.category}
                        </p>
                      </div>
                      <Badge className={cn("text-[10px] border shrink-0", STATUS_COLORS[task.status])}>
                        {task.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Tools */}
        <div className="space-y-4">
          <Card className="border-border">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                Quick Study Hub
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-2">
              <Link to="/checklist" className="block">
                <div className="flex items-center gap-3 p-2.5 rounded-xl border border-border/60 hover:bg-muted/40 transition-colors">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                    <ListTodo className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-none">Daily Checklist</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Tick off today's study goals
                    </p>
                  </div>
                </div>
              </Link>

              <Link to="/timer" className="block">
                <div className="flex items-center gap-3 p-2.5 rounded-xl border border-border/60 hover:bg-muted/40 transition-colors">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                    <Timer className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-none">Pomodoro Study Timer</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      25-minute deep focus sessions
                    </p>
                  </div>
                </div>
              </Link>

              <Link to="/chat" className="block">
                <div className="flex items-center gap-3 p-2.5 rounded-xl border border-border/60 hover:bg-muted/40 transition-colors">
                  <div className="p-2 rounded-lg bg-pink-500/10 text-pink-500">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-none">Private Chat</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Chat directly with {partnerProfile?.full_name?.split(" ")[0]}
                    </p>
                  </div>
                </div>
              </Link>

              <Link to="/notes" className="block">
                <div className="flex items-center gap-3 p-2.5 rounded-xl border border-border/60 hover:bg-muted/40 transition-colors">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-none">Shared Study Notes</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Blank canvas &amp; formulas with live sync
                    </p>
                  </div>
                </div>
              </Link>

              <Link to="/calendar" className="block">
                <div className="flex items-center gap-3 p-2.5 rounded-xl border border-border/60 hover:bg-muted/40 transition-colors">
                  <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
                    <CalendarDays className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-none">Calendar &amp; Exams</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Mark exam dates, mock tests &amp; hints
                    </p>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
