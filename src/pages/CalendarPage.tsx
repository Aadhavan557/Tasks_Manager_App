import { useState, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  GraduationCap,
  Lightbulb,
  FileText,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  Target,
  User,
  Users,
} from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  differenceInDays,
} from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { broadcastCloudSync } from "@/lib/cloudSync";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type CalendarEventType = "exam" | "mock_test" | "hint" | "deadline" | "milestone";

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  type: CalendarEventType;
  notes?: string;
  time?: string;
  assigned_to: "both" | "aadhavan" | "narmatha";
  created_by: string;
  created_by_name: string;
  created_at: string;
}

const STORAGE_KEY = "duomate_calendar_events";

const TYPE_CONFIG: Record<
  CalendarEventType,
  { label: string; icon: typeof GraduationCap; color: string; badgeClass: string; dotClass: string }
> = {
  exam: {
    label: "Exam",
    icon: GraduationCap,
    color: "#f43f5e",
    badgeClass: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    dotClass: "bg-rose-500",
  },
  mock_test: {
    label: "Mock Test",
    icon: FileText,
    color: "#6366f1",
    badgeClass: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    dotClass: "bg-indigo-500",
  },
  hint: {
    label: "Study Hint & Formula",
    icon: Lightbulb,
    color: "#eab308",
    badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    dotClass: "bg-amber-500",
  },
  deadline: {
    label: "Deadline",
    icon: AlertCircle,
    color: "#f97316",
    badgeClass: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    dotClass: "bg-orange-500",
  },
  milestone: {
    label: "Milestone",
    icon: Target,
    color: "#10b981",
    badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    dotClass: "bg-emerald-500",
  },
};

export function CalendarPage() {
  const { profile } = useAuth();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  // Form states
  const [formDate, setFormDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [formTitle, setFormTitle] = useState<string>("");
  const [formType, setFormType] = useState<CalendarEventType>("exam");
  const [formNotes, setFormNotes] = useState<string>("");
  const [formTime, setFormTime] = useState<string>("");
  const [formAssignedTo, setFormAssignedTo] = useState<"both" | "aadhavan" | "narmatha">("both");

  // Load from localStorage & listen for cross-tab updates
  const loadEvents = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setEvents(JSON.parse(raw));
      } else {
        setEvents([]);
      }
    } catch {
      setEvents([]);
    }
  };

  useEffect(() => {
    loadEvents();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) loadEvents();
    };

    const handleCustom = () => loadEvents();

    window.addEventListener("storage", handleStorage);
    window.addEventListener("duomate_calendar_updated", handleCustom);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("duomate_calendar_updated", handleCustom);
    };
  }, []);

  const saveEvents = (updated: CalendarEvent[]) => {
    setEvents(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("duomate_calendar_updated"));
    broadcastCloudSync("CALENDAR_SYNC", updated);
  };

  // Month navigation
  const prevMonth = () => setCurrentMonth((prev) => subMonths(prev, 1));
  const nextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  // Days grid calculation
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    if (filterType === "all") return events;
    return events.filter((ev) => ev.type === filterType);
  }, [events, filterType]);

  // Events map by date string "YYYY-MM-DD"
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    filteredEvents.forEach((ev) => {
      const list = map.get(ev.date) || [];
      list.push(ev);
      map.set(ev.date, list);
    });
    return map;
  }, [filteredEvents]);

  // Selected date events
  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const selectedDateEvents = useMemo(() => {
    return events.filter((ev) => ev.date === selectedDateStr);
  }, [events, selectedDateStr]);

  // Upcoming exams & milestones countdown (future events)
  const upcomingExams = useMemo(() => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    return events
      .filter((ev) => ev.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 4);
  }, [events]);

  // Open add dialog pre-filled with selected date
  const handleOpenAdd = (date?: Date) => {
    const target = date || selectedDate;
    setFormDate(format(target, "yyyy-MM-dd"));
    setFormTitle("");
    setFormType("exam");
    setFormNotes("");
    setFormTime("");
    setFormAssignedTo("both");
    setDialogOpen(true);
  };

  // Save new event
  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error("Please provide a title");
      return;
    }

    const currentUserName = profile?.full_name || "Partner";
    const currentUsername = profile?.username || "aadhavan";

    const newEvent: CalendarEvent = {
      id: "cal-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      date: formDate,
      title: formTitle.trim(),
      type: formType,
      notes: formNotes.trim() || undefined,
      time: formTime.trim() || undefined,
      assigned_to: formAssignedTo,
      created_by: currentUsername,
      created_by_name: currentUserName,
      created_at: new Date().toISOString(),
    };

    const updated = [newEvent, ...events];
    saveEvents(updated);
    setDialogOpen(false);
    toast.success(`Marked on ${format(parseISO(formDate), "MMM d, yyyy")}! Reflects for both.`);
  };

  // Delete event
  const handleDeleteEvent = (id: string) => {
    const updated = events.filter((ev) => ev.id !== id);
    saveEvents(updated);
    toast.success("Event removed from calendar");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400">
              <CalendarDays className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight gradient-text">
                Study Calendar &amp; Exams
              </h1>
              <p className="text-xs text-muted-foreground">
                Mark exam dates, mock tests, and revision hints — instantly shared between both of you
              </p>
            </div>
          </div>
        </div>

        {/* Quick action: Add date/exam */}
        <Button
          onClick={() => handleOpenAdd()}
          variant="gradient"
          className="gap-2 shadow-lg shadow-indigo-500/25 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Mark Date / Add Exam
        </Button>
      </div>

      {/* ── Upcoming Countdown Bar (if any upcoming events exist) ── */}
      {upcomingExams.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {upcomingExams.map((ev) => {
            const daysLeft = differenceInDays(parseISO(ev.date), new Date());
            const cfg = TYPE_CONFIG[ev.type];
            const Icon = cfg.icon;

            return (
              <div
                key={ev.id}
                onClick={() => {
                  setSelectedDate(parseISO(ev.date));
                  setCurrentMonth(parseISO(ev.date));
                }}
                className="cursor-pointer group p-3.5 rounded-xl border border-border/70 bg-card hover:border-indigo-500/50 hover:bg-muted/40 transition-all flex items-start justify-between gap-3 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={cn("w-2 h-2 rounded-full", cfg.dotClass)} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-xs font-bold truncate group-hover:text-indigo-400 transition-colors">
                    {ev.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {format(parseISO(ev.date), "EEE, MMM d, yyyy")}
                  </p>
                </div>

                <div className="flex flex-col items-end flex-shrink-0">
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                      daysLeft === 0
                        ? "bg-rose-500 text-white border-rose-600 animate-pulse"
                        : daysLeft === 1
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                        : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                    )}
                  >
                    {daysLeft === 0 ? "TODAY" : daysLeft === 1 ? "TOMORROW" : `${daysLeft}d left`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Main Layout: Calendar Grid + Day Details Panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Calendar Grid (8 cols) */}
        <Card className="lg:col-span-8 border-border shadow-md">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Month Navigator */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={prevMonth}
                  className="h-8 w-8"
                  title="Previous Month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-base font-extrabold min-w-36 text-center">
                  {format(currentMonth, "MMMM yyyy")}
                </h2>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={nextMonth}
                  className="h-8 w-8"
                  title="Next Month"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToToday}
                  className="h-8 text-xs font-semibold px-2.5 text-indigo-400 hover:text-indigo-300"
                >
                  Today
                </Button>
              </div>

              {/* Type Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setFilterType("all")}
                  className={cn(
                    "text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all",
                    filterType === "all"
                      ? "bg-indigo-500 text-white font-bold"
                      : "text-muted-foreground hover:text-foreground bg-muted/40"
                  )}
                >
                  All
                </button>
                {(["exam", "mock_test", "hint", "deadline"] as CalendarEventType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFilterType(t)}
                    className={cn(
                      "text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all whitespace-nowrap",
                      filterType === t
                        ? "bg-indigo-500 text-white font-bold"
                        : "text-muted-foreground hover:text-foreground bg-muted/40"
                    )}
                  >
                    {TYPE_CONFIG[t].label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-3 sm:p-4">
            {/* Weekday Labels (Mon - Sun) */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <div
                  key={day}
                  className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider py-1.5"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {calendarDays.map((day) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const dayEvents = eventsByDate.get(dateKey) || [];
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isDaySelected = isSameDay(day, selectedDate);
                const isDayToday = isToday(day);

                return (
                  <div
                    key={dateKey}
                    onClick={() => setSelectedDate(day)}
                    onDoubleClick={() => handleOpenAdd(day)}
                    className={cn(
                      "min-h-20 sm:min-h-24 p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group",
                      !isCurrentMonth && "opacity-35 bg-muted/10",
                      isCurrentMonth && "bg-card/70 hover:bg-muted/40",
                      isDaySelected
                        ? "border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-500/5 shadow-md"
                        : "border-border/60 hover:border-indigo-500/40",
                      isDayToday && !isDaySelected && "border-pink-500/70"
                    )}
                  >
                    {/* Date Number Header */}
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "text-xs font-bold inline-flex items-center justify-center w-6 h-6 rounded-full transition-all",
                          isDayToday
                            ? "bg-pink-500 text-white shadow-sm shadow-pink-500/50"
                            : isDaySelected
                            ? "bg-indigo-600 text-white"
                            : "text-foreground group-hover:text-indigo-400"
                        )}
                      >
                        {format(day, "d")}
                      </span>

                      {/* Quick add + icon on hover */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAdd(day);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted-foreground hover:text-indigo-400 transition-opacity"
                        title="Add event on this date"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Day Events Badges / Indicators */}
                    <div className="space-y-1 mt-1">
                      {dayEvents.slice(0, 2).map((ev) => {
                        const cfg = TYPE_CONFIG[ev.type];
                        return (
                          <div
                            key={ev.id}
                            className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded truncate font-medium flex items-center gap-1 border",
                              cfg.badgeClass
                            )}
                            title={`${cfg.label}: ${ev.title}`}
                          >
                            <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", cfg.dotClass)} />
                            <span className="truncate">{ev.title}</span>
                          </div>
                        );
                      })}

                      {dayEvents.length > 2 && (
                        <p className="text-[9px] font-bold text-muted-foreground text-center">
                          +{dayEvents.length - 2} more
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Selected Date Inspector (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border-border shadow-md">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Selected Date
                  </p>
                  <CardTitle className="text-base font-extrabold text-foreground mt-0.5">
                    {format(selectedDate, "EEEE, MMMM d, yyyy")}
                  </CardTitle>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenAdd(selectedDate)}
                  className="h-8 gap-1 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              {selectedDateEvents.length === 0 ? (
                <div className="text-center py-8 px-4 border border-dashed border-border/80 rounded-xl space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
                    <CalendarIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">No events on this day</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Mark exams, revision hints, or mock tests for this date
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="gradient"
                    onClick={() => handleOpenAdd(selectedDate)}
                    className="h-8 text-xs gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Mark this date
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                  {selectedDateEvents.map((ev) => {
                    const cfg = TYPE_CONFIG[ev.type];
                    const Icon = cfg.icon;

                    return (
                      <div
                        key={ev.id}
                        className="p-3.5 rounded-xl border border-border/80 bg-muted/20 hover:bg-muted/40 transition-all space-y-2.5 relative group"
                      >
                        {/* Header: Type + Who + Delete */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1",
                                cfg.badgeClass
                              )}
                            >
                              <Icon className="h-3 w-3" />
                              {cfg.label}
                            </span>

                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium flex items-center gap-1">
                              {ev.assigned_to === "both" ? (
                                <>
                                  <Users className="h-3 w-3" /> Both
                                </>
                              ) : (
                                <>
                                  <User className="h-3 w-3" />{" "}
                                  {ev.assigned_to === "aadhavan" ? "Aadhavan" : "Narmatha"}
                                </>
                              )}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteEvent(ev.id)}
                            className="text-muted-foreground hover:text-rose-400 p-1 rounded transition-colors opacity-70 group-hover:opacity-100"
                            title="Delete event"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Title & Time */}
                        <div>
                          <h4 className="text-sm font-bold text-foreground leading-snug">
                            {ev.title}
                          </h4>
                          {ev.time && (
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                              <Clock className="h-3 w-3" />
                              <span>{ev.time}</span>
                            </div>
                          )}
                        </div>

                        {/* Study Notes / Formula Hints Callout */}
                        {ev.notes && (
                          <div className="p-2.5 rounded-lg bg-background/80 border border-border/60 text-xs text-foreground/90 whitespace-pre-line leading-relaxed font-mono">
                            <div className="flex items-center gap-1 text-[10px] font-sans font-bold text-amber-400 mb-1">
                              <Lightbulb className="h-3 w-3" />
                              <span>Important Notes &amp; Hints:</span>
                            </div>
                            {ev.notes}
                          </div>
                        )}

                        {/* Creator footer */}
                        <p className="text-[10px] text-muted-foreground/70 text-right">
                          Added by {ev.created_by_name}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick study tip */}
          <div className="p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 flex items-start gap-3">
            <Sparkles className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Shared Realtime Calendar:</strong> Everything
              you mark here automatically reflects on your partner's calendar. Use it to keep each
              other accountable for upcoming GATE and VLSI milestones!
            </p>
          </div>
        </div>
      </div>

      {/* ── Dialog: Add Exam, Mock Test, or Hint ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-indigo-400" />
              Mark Date / Add Exam &amp; Hint
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveEvent} className="space-y-4 pt-2">
            {/* Date and Time Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Date *</Label>
                <Input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Time (Optional)</Label>
                <Input
                  type="text"
                  placeholder="e.g. 09:30 AM"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <Label className="text-xs">Title / Subject *</Label>
              <Input
                type="text"
                placeholder="e.g. GATE ECE 2027 or Verilog FSM Mock Test"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>

            {/* Type & Assign To */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as CalendarEventType)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="exam">🎓 Exam</option>
                  <option value="mock_test">📝 Mock Test</option>
                  <option value="hint">💡 Study Hint &amp; Formula</option>
                  <option value="deadline">⏰ Deadline / Submission</option>
                  <option value="milestone">🎯 Goal Milestone</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">For Whom</Label>
                <select
                  value={formAssignedTo}
                  onChange={(e) =>
                    setFormAssignedTo(e.target.value as "both" | "aadhavan" | "narmatha")
                  }
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="both">Both (Shared)</option>
                  <option value="aadhavan">Aadhavan</option>
                  <option value="narmatha">Narmatha</option>
                </select>
              </div>
            </div>

            {/* Notes / Formula Hints */}
            <div className="space-y-1">
              <Label className="text-xs">
                Important Hints, Syllabus &amp; Formula Notes (Optional)
              </Label>
              <Textarea
                placeholder="Write formulas to remember, key topics to revise, exam hall instructions, or hints..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={3}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(false)}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" variant="gradient" size="sm" className="h-9 text-xs gap-1">
                Save &amp; Reflect to Partner
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
