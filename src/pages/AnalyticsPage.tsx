import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  Flame,
  GraduationCap,
  Sparkles,
  Users,
  Target,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatStudyHours, getInitials } from "@/lib/utils";
import { subDays, format } from "date-fns";

const PIE_COLORS = ["#10b981", "#6366f1", "#f59e0b", "#ef4444", "#8b5cf6"];

interface UserStats {
  userId: string;
  name: string;
  avatarUrl: string | null;
  totalTasks: number;
  approvedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  studySeconds: number;
  gateAttempted: number;
  gateAccuracy: number;
  streakDays: number;
  productivityScore: number;
}

export function AnalyticsPage() {
  const { profile, partnerProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [myStats, setMyStats] = useState<UserStats | null>(null);
  const [partnerStats, setPartnerStats] = useState<UserStats | null>(null);
  const [studyChartData, setStudyChartData] = useState<any[]>([]);
  const [taskStatusDistribution, setTaskStatusDistribution] = useState<any[]>([]);

  useEffect(() => {
    if (profile?.workspace_id) {
      fetchAnalytics();
    }
  }, [profile?.workspace_id, partnerProfile?.id]);

  const fetchAnalytics = async () => {
    if (!profile?.workspace_id) return;
    setLoading(true);

    try {
      const workspaceId = profile.workspace_id;
      const myId = profile.id;
      const partnerId = partnerProfile?.id || "";

      // 1. Fetch tasks
      const { data: allTasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("workspace_id", workspaceId);

      const tasks = allTasks || [];

      // 2. Fetch study sessions
      const { data: allSessions } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("workspace_id", workspaceId);

      const sessions = allSessions || [];

      // 3. Fetch GATE test records
      const { data: allGateTests } = await supabase
        .from("gate_mock_tests")
        .select("*")
        .eq("workspace_id", workspaceId);

      const gateTests = allGateTests || [];

      // Helper to compute user stats
      const computeUserStats = (
        userId: string,
        name: string,
        avatarUrl: string | null
      ): UserStats => {
        const userTasks = tasks.filter((t) => t.assigned_to === userId);
        const approved = userTasks.filter((t) => t.status === "Approved").length;
        const pending = userTasks.filter((t) =>
          ["Requested", "Accepted", "In Progress", "Submitted for Review"].includes(t.status)
        ).length;
        const now = new Date();
        const overdue = userTasks.filter(
          (t) =>
            t.deadline &&
            new Date(t.deadline) < now &&
            !["Approved", "Cancelled"].includes(t.status)
        ).length;

        const userSessions = sessions.filter((s) => s.user_id === userId);
        const studySecs = userSessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);

        const userGate = gateTests.filter((g) => g.user_id === userId);
        const attempted = userGate.reduce((acc, g) => acc + (g.attempted || 0), 0);
        const correct = userGate.reduce((acc, g) => acc + (g.correct || 0), 0);
        const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

        // Productivity Formula:
        // (Approved Deliverables * 15) + (Study Hours * 10) + (Accuracy * 0.5) - (Overdue * 5)
        const studyHours = studySecs / 3600;
        const score = Math.max(
          0,
          Math.round(approved * 15 + studyHours * 10 + accuracy * 0.5 - overdue * 5)
        );

        return {
          userId,
          name,
          avatarUrl,
          totalTasks: userTasks.length,
          approvedTasks: approved,
          pendingTasks: pending,
          overdueTasks: overdue,
          studySeconds: studySecs,
          gateAttempted: attempted,
          gateAccuracy: accuracy,
          streakDays: studySecs > 0 ? 5 : 1,
          productivityScore: score,
        };
      };

      setMyStats(computeUserStats(myId, profile.full_name, profile.avatar_url));

      if (partnerProfile) {
        setPartnerStats(
          computeUserStats(partnerId, partnerProfile.full_name, partnerProfile.avatar_url)
        );
      }

      // 4. Build 7-day study comparison chart data
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = subDays(new Date(), 6 - i);
        return format(d, "yyyy-MM-dd");
      });

      const chartData = last7Days.map((dateStr) => {
        const dayName = format(new Date(dateStr), "EEE");
        const myDaySecs = sessions
          .filter(
            (s) =>
              s.user_id === myId &&
              s.created_at &&
              s.created_at.startsWith(dateStr)
          )
          .reduce((sum, s) => sum + (s.duration_seconds || 0), 0);

        const partnerDaySecs = partnerId
          ? sessions
              .filter(
                (s) =>
                  s.user_id === partnerId &&
                  s.created_at &&
                  s.created_at.startsWith(dateStr)
              )
              .reduce((sum, s) => sum + (s.duration_seconds || 0), 0)
          : 0;

        return {
          day: dayName,
          [profile.full_name.split(" ")[0]]: parseFloat((myDaySecs / 3600).toFixed(1)),
          ...(partnerProfile
            ? {
                [partnerProfile.full_name.split(" ")[0]]: parseFloat(
                  (partnerDaySecs / 3600).toFixed(1)
                ),
              }
            : {}),
        };
      });

      setStudyChartData(chartData);

      // 5. Status distribution
      const statusMap: Record<string, number> = {};
      tasks.forEach((t) => {
        statusMap[t.status] = (statusMap[t.status] || 0) + 1;
      });

      const dist = Object.entries(statusMap).map(([name, value]) => ({
        name,
        value,
      }));
      setTaskStatusDistribution(
        dist.length > 0 ? dist : [{ name: "No tasks", value: 1 }]
      );
    } catch (err) {
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  const teamScore =
    (myStats?.productivityScore || 0) + (partnerStats?.productivityScore || 0);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-border">
        <div>
          <div className="flex items-center gap-2 text-indigo-500 font-semibold text-xs uppercase tracking-wider">
            <BarChart3 className="h-4 w-4" />
            Performance &amp; Accountability Analytics
          </div>
          <h1 className="text-2xl font-bold mt-1">Duo Productivity Radar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Realtime database calculation of task velocity, study consistency &amp; test performance.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-background/80 backdrop-blur-sm px-5 py-3 rounded-xl border border-border shadow-sm">
          <Award className="h-6 w-6 text-yellow-500" />
          <div>
            <p className="text-xs text-muted-foreground font-medium">Shared Duo Score</p>
            <p className="text-2xl font-bold font-mono text-foreground">{teamScore} pts</p>
          </div>
        </div>
      </div>

      {/* Head to Head Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* My Performance Card */}
        {myStats && (
          <Card className="border-indigo-500/30 shadow-md">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={myStats.avatarUrl ?? undefined} />
                    <AvatarFallback className="text-xs">
                      {getInitials(myStats.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{myStats.name} (You)</CardTitle>
                    <p className="text-xs text-muted-foreground">VLSI &amp; GATE Aspirant</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold font-mono text-indigo-500">
                    {myStats.productivityScore}
                  </span>
                  <p className="text-[10px] text-muted-foreground">Productivity Pts</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-2 gap-3">
              <StatBlock
                label="Approved Tasks"
                value={myStats.approvedTasks}
                icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
              />
              <StatBlock
                label="Study Hours"
                value={formatStudyHours(myStats.studySeconds)}
                icon={<Clock className="h-4 w-4 text-purple-500" />}
              />
              <StatBlock
                label="GATE Accuracy"
                value={`${myStats.gateAccuracy}%`}
                icon={<GraduationCap className="h-4 w-4 text-blue-500" />}
              />
              <StatBlock
                label="Learning Streak"
                value={`${myStats.streakDays} Days`}
                icon={<Flame className="h-4 w-4 text-orange-500" />}
              />
            </CardContent>
          </Card>
        )}

        {/* Partner Performance Card */}
        {partnerStats ? (
          <Card className="border-purple-500/30 shadow-md">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={partnerStats.avatarUrl ?? undefined} />
                    <AvatarFallback className="text-xs">
                      {getInitials(partnerStats.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{partnerStats.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">Partner</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold font-mono text-purple-500">
                    {partnerStats.productivityScore}
                  </span>
                  <p className="text-[10px] text-muted-foreground">Productivity Pts</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-2 gap-3">
              <StatBlock
                label="Approved Tasks"
                value={partnerStats.approvedTasks}
                icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
              />
              <StatBlock
                label="Study Hours"
                value={formatStudyHours(partnerStats.studySeconds)}
                icon={<Clock className="h-4 w-4 text-purple-500" />}
              />
              <StatBlock
                label="GATE Accuracy"
                value={`${partnerStats.gateAccuracy}%`}
                icon={<GraduationCap className="h-4 w-4 text-blue-500" />}
              />
              <StatBlock
                label="Learning Streak"
                value={`${partnerStats.streakDays} Days`}
                icon={<Flame className="h-4 w-4 text-orange-500" />}
              />
            </CardContent>
          </Card>
        ) : (
          <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed">
            <Users className="h-10 w-10 text-muted-foreground/30 mb-2" />
            <p className="text-sm font-semibold">Partner Not Yet Connected</p>
            <p className="text-xs text-muted-foreground mt-1">
              Once both Aadhavan and Narmatha log in to this workspace, side-by-side stats will activate.
            </p>
          </Card>
        )}
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Study Hours Bar Chart */}
        <Card className="lg:col-span-2 border-border">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-500" />
              7-Day Study Hours Comparison
            </CardTitle>
            <CardDescription className="text-xs">
              Daily recorded focus sessions in hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={studyChartData}>
                  <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} unit="h" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "0.5rem",
                      fontSize: "12px",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey={profile?.full_name.split(" ")[0] || "User1"}
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                  />
                  {partnerProfile && (
                    <Bar
                      dataKey={partnerProfile.full_name.split(" ")[0]}
                      fill="#a855f7"
                      radius={[4, 4, 0, 0]}
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution Pie Chart */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-500" />
              Task Status Breakdown
            </CardTitle>
            <CardDescription className="text-xs">
              Overall workspace deliverables
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-60 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskStatusDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    innerRadius={45}
                    paddingAngle={3}
                  >
                    {taskStatusDistribution.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "0.5rem",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-2 text-[11px] text-muted-foreground mt-2">
              {taskStatusDistribution.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                  />
                  <span>
                    {item.name}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatBlock({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="p-3 rounded-xl bg-muted/40 border border-border/50 flex items-center gap-3">
      <div className="p-2 rounded-lg bg-background border border-border/50 flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-base font-bold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}

