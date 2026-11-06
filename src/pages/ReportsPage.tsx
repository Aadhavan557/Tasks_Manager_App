import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Award,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Target,
  Printer,
  Heart,
} from "lucide-react";
import { format, subWeeks, addWeeks, startOfWeek, endOfWeek } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, formatStudyHours } from "@/lib/utils";

export function ReportsPage() {
  const { profile, partnerProfile } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(false);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto print:max-w-full">
      {/* Header and Print action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-indigo-500" />
            Weekly Partnership &amp; Career Report
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Automated executive summary of weekly study hours, approvals, GATE mock accuracy &amp; teamwork.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={prevWeek}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold text-xs px-2 min-w-40 text-center font-mono">
              {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={nextWeek}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
            <Printer className="h-3.5 w-3.5" />
            Print / Export
          </Button>
        </div>
      </div>

      {/* Main Report Document */}
      <Card className="border-border shadow-xl overflow-hidden print:border-none print:shadow-none">
        {/* Document Header Banner */}
        <div className="p-8 bg-gradient-to-r from-indigo-900 via-indigo-950 to-purple-950 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center font-bold text-lg">
                DM
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">DuoMate Weekly Digest</h2>
                <p className="text-xs text-indigo-200">
                  Aadhavan &amp; Narmatha · Semiconductor &amp; GATE ECE Partnership
                </p>
              </div>
            </div>

            <Badge className="bg-white/10 text-white border-white/20 font-mono text-xs">
              Week {format(weekStart, "w, yyyy")}
            </Badge>
          </div>

          <div className="mt-6 flex items-center gap-2 text-indigo-200 text-xs">
            <Heart className="h-3.5 w-3.5 text-pink-400 fill-current" />
            <span>"Two Friends. One Goal. Better Every Day."</span>
          </div>
        </div>

        <CardContent className="p-6 sm:p-8 space-y-8">
          {/* Executive Duo Summary */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              Shared Team Accomplishments
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
                <p className="text-2xl font-bold font-mono text-indigo-500">18.5h</p>
                <p className="text-xs text-muted-foreground mt-1">Combined Study Time</p>
              </div>
              <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                <p className="text-2xl font-bold font-mono text-green-500">12</p>
                <p className="text-xs text-muted-foreground mt-1">Deliverables Approved</p>
              </div>
              <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
                <p className="text-2xl font-bold font-mono text-purple-500">76%</p>
                <p className="text-xs text-muted-foreground mt-1">Avg GATE Accuracy</p>
              </div>
              <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
                <p className="text-2xl font-bold font-mono text-orange-500">6 Topics</p>
                <p className="text-xs text-muted-foreground mt-1">VLSI Units Cleared</p>
              </div>
            </div>
          </div>

          {/* Individual Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Aadhavan's Section */}
            <div className="p-5 rounded-2xl border border-border bg-muted/20 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-border/60">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs bg-indigo-500 text-white font-bold">
                    AD
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-bold text-sm">Aadhavan</h4>
                  <p className="text-xs text-muted-foreground">VLSI &amp; FPGA Focus</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Study Hours Logged</span>
                  <span className="font-mono font-bold">10.2 hrs</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Deliverables Submitted</span>
                  <span className="font-mono font-bold">7 tasks</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Partner Approvals Received</span>
                  <span className="font-mono font-bold text-green-500">6 approved</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">GATE Questions Practiced</span>
                  <span className="font-mono font-bold">65 questions</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Key Technical Win</span>
                  <span className="font-medium text-right text-indigo-500">
                    Implemented Verilog ALU &amp; FSM
                  </span>
                </div>
              </div>
            </div>

            {/* Narmatha's Section */}
            <div className="p-5 rounded-2xl border border-border bg-muted/20 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-border/60">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs bg-purple-500 text-white font-bold">
                    NM
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-bold text-sm">Narmatha</h4>
                  <p className="text-xs text-muted-foreground">Digital &amp; GATE ECE Focus</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Study Hours Logged</span>
                  <span className="font-mono font-bold">8.3 hrs</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Deliverables Submitted</span>
                  <span className="font-mono font-bold">6 tasks</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Partner Approvals Received</span>
                  <span className="font-mono font-bold text-green-500">6 approved</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">GATE Questions Practiced</span>
                  <span className="font-mono font-bold">80 questions</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Key Technical Win</span>
                  <span className="font-medium text-right text-purple-500">
                    Signals &amp; Systems Transform Review
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Qualitative Insights & Next Week Plan */}
          <div className="p-5 rounded-xl bg-card border border-border space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Strategic Review &amp; Next Week Targets
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
              <div>
                <p className="font-semibold text-foreground mb-1">
                  Areas Requiring Attention:
                </p>
                <p className="text-muted-foreground">
                  MOSFET small signal analysis needs deeper practice problems. Timing closure concepts in STA should be assigned as early morning tasks next week.
                </p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">
                  Goals for Upcoming Week:
                </p>
                <p className="text-muted-foreground">
                  Complete Level 2 HDL testbench verification; solve 50 Engineering Mathematics questions together on Sunday study sprint.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

