import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  CheckCircle2,
  Clock,
  BookOpen,
  CheckSquare,
  Users,
  Calendar,
  Filter,
  FileCheck,
  Zap,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelative, getInitials } from "@/lib/utils";
import type { ActivityLog } from "@/types/database";

export function ActivityPage() {
  const { profile, partnerProfile } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [userFilter, setUserFilter] = useState<string>("all");

  useEffect(() => {
    if (profile?.workspace_id) {
      loadActivityLogs();

      // Realtime listener
      const channel = supabase
        .channel(`activity_${profile.workspace_id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "activity_logs",
            filter: `workspace_id=eq.${profile.workspace_id}`,
          },
          (payload) => {
            const newLog = payload.new as ActivityLog;
            setLogs((prev) => [newLog, ...prev]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile?.workspace_id]);

  const loadActivityLogs = async () => {
    if (!profile?.workspace_id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("activity_logs")
        .select(`
          *,
          user:profiles!activity_logs_user_id_fkey(*)
        `)
        .eq("workspace_id", profile.workspace_id)
        .order("created_at", { ascending: false })
        .limit(40);

      if (error) throw error;
      setLogs((data as ActivityLog[]) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (userFilter === "me") return log.user_id === profile?.id;
    if (userFilter === "partner") return log.user_id === partnerProfile?.id;
    return true;
  });

  const getActivityIcon = (entityType: string, action: string) => {
    if (action.includes("Approved") || action.includes("completed")) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    if (entityType === "study_session") {
      return <Clock className="h-4 w-4 text-purple-500" />;
    }
    if (entityType === "gate_mock_test") {
      return <FileCheck className="h-4 w-4 text-blue-500" />;
    }
    if (entityType === "task") {
      return <CheckSquare className="h-4 w-4 text-indigo-500" />;
    }
    return <Zap className="h-4 w-4 text-orange-500" />;
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-indigo-500" />
            Transparent Activity Timeline
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Realtime audit log of study sessions, task assignments, reviews and milestones.
          </p>
        </div>

        {/* User filter */}
        <Select value={userFilter} onValueChange={setUserFilter}>
          <SelectTrigger className="w-44 text-xs">
            <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Filter user" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Activities</SelectItem>
            <SelectItem value="me">My Activities Only</SelectItem>
            {partnerProfile && (
              <SelectItem value="partner">
                {partnerProfile.full_name}'s Only
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Timeline Stream */}
      <Card className="border-border shadow-md">
        <CardContent className="p-6">
          {loading ? (
            <div className="space-y-6 py-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <Activity className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">No recorded activity yet</p>
              <p className="text-xs opacity-70 mt-1">
                Actions like creating tasks, starting timers, or submitting deliverables will appear here.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
              {filteredLogs.map((log) => {
                const isMe = log.user_id === profile?.id;
                const icon = getActivityIcon(log.entity_type, log.action);

                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="relative flex items-start gap-4"
                  >
                    {/* Node on vertical line */}
                    <div className="absolute -left-6 top-1 w-6 h-6 rounded-full bg-background border-2 border-border flex items-center justify-center shadow-sm">
                      {icon}
                    </div>

                    <div className="flex-1 bg-muted/30 border border-border/50 rounded-xl p-3.5 hover:border-indigo-500/30 transition-all">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={log.user?.avatar_url ?? undefined} />
                            <AvatarFallback className="text-[10px]">
                              {getInitials(log.user?.full_name ?? "User")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-bold">
                            {isMe ? "You" : log.user?.full_name ?? "Partner"}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {formatRelative(log.created_at)}
                        </span>
                      </div>

                      <p className="text-sm mt-1.5 leading-relaxed">{log.action}</p>

                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {log.entity_type.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

