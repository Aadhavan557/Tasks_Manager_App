import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Clock,
  BookOpen,
  History,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { broadcastCloudSync } from "@/lib/cloudSync";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDuration, formatStudyHours } from "@/lib/utils";

type TimerMode = "focus25" | "focus50" | "break5";

const MODES: Record<TimerMode, { label: string; minutes: number }> = {
  focus25: { label: "25m Focus", minutes: 25 },
  focus50: { label: "50m Deep Study", minutes: 50 },
  break5: { label: "5m Short Break", minutes: 5 },
};

interface StudyRecord {
  id: string;
  user_id: string;
  user_name: string;
  subject: string;
  duration_seconds: number;
  completed_at: string;
}

export function TimerPage() {
  const { profile, partnerProfile } = useAuth();
  const [mode, setMode] = useState<TimerMode>("focus25");
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [subject, setSubject] = useState("Verilog HDL");
  const [customSubject, setCustomSubject] = useState("");
  const [sessions, setSessions] = useState<StudyRecord[]>([]);

  const timerRef = useRef<any>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = () => {
    const stored = localStorage.getItem("duomate_study_sessions");
    if (stored) {
      try {
        setSessions(JSON.parse(stored));
      } catch {
        setSessions([]);
      }
    } else {
      setSessions([]);
    }
  };

  const saveSessions = (updated: StudyRecord[]) => {
    setSessions(updated);
    localStorage.setItem("duomate_study_sessions", JSON.stringify(updated));
    window.dispatchEvent(new Event("duomate_timer_updated"));
    broadcastCloudSync("TIMER_SYNC", updated[0] || null);
  };

  // Timer Tick
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, totalSeconds, mode]);

  const switchMode = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    const secs = MODES[newMode].minutes * 60;
    setTotalSeconds(secs);
    setSecondsLeft(secs);
  };

  const startTimer = () => setIsRunning(true);
  const pauseTimer = () => setIsRunning(false);
  const resetTimer = () => {
    setIsRunning(false);
    const secs = MODES[mode].minutes * 60;
    setTotalSeconds(secs);
    setSecondsLeft(secs);
  };

  const handleComplete = () => {
    setIsRunning(false);
    try {
      const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
      audio.play().catch(() => {});
    } catch {}

    const elapsed = totalSeconds;
    recordSession(elapsed);
    toast.success("Study session finished! Awesome dedication! 🎉");
    resetTimer();
  };

  const handleStopAndSave = () => {
    const elapsed = totalSeconds - secondsLeft;
    if (elapsed < 60) {
      toast.info("Session under 1 minute was not recorded.");
      resetTimer();
      return;
    }
    setIsRunning(false);
    recordSession(elapsed);
    toast.success(`Recorded ${formatDuration(elapsed)} of focused study!`);
    resetTimer();
  };

  const recordSession = (durationSeconds: number) => {
    if (!profile) return;
    const activeSubject = customSubject.trim() || subject;
    const newSession: StudyRecord = {
      id: "session-" + Date.now(),
      user_id: profile.id,
      user_name: profile.full_name,
      subject: activeSubject,
      duration_seconds: durationSeconds,
      completed_at: new Date().toISOString(),
    };

    const updated = [newSession, ...sessions];
    saveSessions(updated);
  };

  // Minutes and seconds display
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  // SVG Progress calculation
  const radius = 95;
  const circumference = 2 * Math.PI * radius;
  const progressPercent = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0;
  const strokeDashoffset = circumference - progressPercent * circumference;

  // Real my and partner study hours from stored sessions
  const myTotalSeconds = sessions
    .filter((s) => s.user_id === profile?.id)
    .reduce((sum, s) => sum + s.duration_seconds, 0);

  const partnerTotalSeconds = sessions
    .filter((s) => s.user_id === partnerProfile?.id)
    .reduce((sum, s) => sum + s.duration_seconds, 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Clock className="h-5 w-5 text-indigo-500" />
          Study Timer &amp; Focus Tracker
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Pomodoro deep focus sessions. Time studied is saved directly to your dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Timer Column */}
        <div className="md:col-span-2 space-y-4">
          <Card className="border border-border p-6 flex flex-col items-center justify-center text-center">
            {/* Mode Selector Buttons */}
            <div className="flex gap-2 p-1 bg-muted/60 rounded-xl mb-6">
              {(Object.keys(MODES) as TimerMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    mode === m
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {MODES[m].label}
                </button>
              ))}
            </div>

            {/* Circular Timer Visual */}
            <div className="relative inline-flex items-center justify-center my-2">
              <svg width={230} height={230} className="-rotate-90">
                <circle
                  cx={115}
                  cy={115}
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  className="text-muted/30"
                  strokeWidth={10}
                />
                <circle
                  cx={115}
                  cy={115}
                  r={radius}
                  fill="none"
                  stroke="url(#timer-grad)"
                  strokeWidth={10}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  style={{ transition: "stroke-dashoffset 0.5s ease" }}
                />
                <defs>
                  <linearGradient id="timer-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-extrabold tracking-tight font-mono">
                  {timeFormatted}
                </span>
                <span className="text-xs text-muted-foreground mt-1 font-medium">
                  {customSubject.trim() || subject}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 mt-6">
              {!isRunning ? (
                <Button
                  onClick={startTimer}
                  variant="gradient"
                  size="lg"
                  className="px-8 gap-2 font-semibold shadow-md shadow-indigo-500/25"
                >
                  <Play className="h-4 w-4 fill-white" />
                  Start Focus
                </Button>
              ) : (
                <Button
                  onClick={pauseTimer}
                  variant="outline"
                  size="lg"
                  className="px-8 gap-2 font-semibold"
                >
                  <Pause className="h-4 w-4" />
                  Pause
                </Button>
              )}

              <Button
                onClick={resetTimer}
                variant="ghost"
                size="icon"
                title="Reset Timer"
                className="h-10 w-10 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>

              {isRunning && (
                <Button
                  onClick={handleStopAndSave}
                  variant="secondary"
                  size="sm"
                  className="text-xs gap-1"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Done Early
                </Button>
              )}
            </div>

            {/* Subject Selector */}
            <div className="mt-6 w-full max-w-sm pt-4 border-t border-border/50 text-left">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Studying Subject / Topic
              </label>
              <div className="flex gap-2">
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue placeholder="Select topic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Verilog HDL">Verilog HDL &amp; RTL</SelectItem>
                    <SelectItem value="SystemVerilog">SystemVerilog &amp; Verification</SelectItem>
                    <SelectItem value="Digital Electronics">Digital Electronics</SelectItem>
                    <SelectItem value="VLSI Design & CMOS">VLSI Design &amp; CMOS</SelectItem>
                    <SelectItem value="GATE Engineering Math">GATE Engineering Math</SelectItem>
                    <SelectItem value="GATE Network Theory">GATE Network Theory</SelectItem>
                    <SelectItem value="Signals & Systems">Signals &amp; Systems</SelectItem>
                    <SelectItem value="Electronic Devices (EDC)">Electronic Devices (EDC)</SelectItem>
                    <SelectItem value="AI Accelerators & FPGA">AI Accelerators &amp; FPGA</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="text"
                  placeholder="Or custom topic..."
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="text-xs h-9 flex-1"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Study Stats & Real History */}
        <div className="space-y-4">
          {/* Real Study Hours Card */}
          <Card className="border border-border p-4">
            <CardHeader className="p-0 pb-3">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Total Study Time
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                <span className="text-xs font-bold text-foreground">
                  {profile?.full_name} (You)
                </span>
                <span className="text-sm font-extrabold text-indigo-500 font-mono">
                  {formatStudyHours(myTotalSeconds)}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <span className="text-xs font-bold text-foreground">
                  {partnerProfile?.full_name || "Partner"}
                </span>
                <span className="text-sm font-extrabold text-purple-500 font-mono">
                  {formatStudyHours(partnerTotalSeconds)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Real Session History */}
          <Card className="border border-border">
            <CardHeader className="py-3 px-4 border-b border-border/50">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <History className="h-3.5 w-3.5" />
                Session History ({sessions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              {sessions.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-xs">
                  <Clock className="h-6 w-6 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="font-medium text-foreground">No study sessions logged yet</p>
                  <p className="text-[11px] mt-0.5">Start your first focus session above!</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {sessions.slice(0, 10).map((s) => (
                    <div
                      key={s.id}
                      className="p-2.5 rounded-lg border border-border/50 bg-muted/30 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-semibold text-foreground">{s.subject}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {s.user_name} · {new Date(s.completed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {formatDuration(s.duration_seconds)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
