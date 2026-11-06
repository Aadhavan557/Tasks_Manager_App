import { useState, useEffect } from "react";
import {
  GraduationCap,
  Cpu,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type SubjectStatus = "not_started" | "in_progress" | "completed";

interface GateSubject {
  id: number;
  name: string;
  topics: string[];
}

interface VlsiLevel {
  level: number;
  name: string;
  desc: string;
  topics: string[];
}

const GATE_SUBJECTS: GateSubject[] = [
  { id: 1, name: "Engineering Mathematics", topics: ["Linear Algebra", "Calculus", "Differential Equations", "Complex Variables", "Probability & Statistics"] },
  { id: 2, name: "Network Theory", topics: ["Network Solution Methods", "Network Theorems", "Transient Response", "Sinusoidal Steady State", "Two-Port Networks"] },
  { id: 3, name: "Signals and Systems", topics: ["Representation of Signals", "LTI Systems", "Fourier Series & Transforms", "Laplace Transform", "z-Transform"] },
  { id: 4, name: "Electronic Devices (EDC)", topics: ["Energy Bands", "Carrier Transport", "P-N Junction", "Zener Diode", "BJT", "MOS Capacitor & MOSFET"] },
  { id: 5, name: "Analog Electronics", topics: ["Diode Circuits", "BJT & MOSFET Amplifiers", "Op-Amp Circuits", "Active Filters", "Oscillators"] },
  { id: 6, name: "Digital Electronics", topics: ["Number Systems", "Boolean Algebra", "Combinational Circuits", "Sequential Circuits (Flip-Flops, Counters)", "Data Converters"] },
  { id: 7, name: "Control Systems", topics: ["Transfer Function", "Block Diagrams", "Time Response Analysis", "Routh-Hurwitz", "Root Locus", "Bode Plot"] },
  { id: 8, name: "Communications", topics: ["Analog Modulation (AM/FM)", "Digital Communications (PCM, PSK, QAM)", "Random Processes", "Information Theory"] },
  { id: 9, name: "Electromagnetics", topics: ["Electrostatics", "Magnetostatics", "Maxwell's Equations", "EM Waves", "Transmission Lines", "Antennas"] },
  { id: 10, name: "General Aptitude", topics: ["Verbal Ability", "Numerical Ability", "Analytical Reasoning", "Spatial Aptitude"] },
];

const VLSI_LEVELS: VlsiLevel[] = [
  { level: 1, name: "Level 1: Digital Fundamentals", desc: "Boolean algebra, combinational & sequential logic, state machines", topics: ["Number systems", "Logic gates", "Combinational circuits", "Sequential circuits", "Finite State Machines"] },
  { level: 2, name: "Level 2: HDL Programming", desc: "Synthesizable Verilog, testbenches & SystemVerilog", topics: ["Verilog fundamentals", "Operators & assignments", "Combinational & sequential RTL", "Testbench writing", "SystemVerilog basics"] },
  { level: 3, name: "Level 3: RTL Design & Verification", desc: "Synthesis constraints, functional coverage, design optimization", topics: ["RTL coding styles", "Clock domain crossing", "Synthesis guidelines", "Functional verification", "Coverage metrics"] },
  { level: 4, name: "Level 4: VLSI Design & CMOS", desc: "MOSFET operation, CMOS logic, Static Timing Analysis (STA)", topics: ["MOSFET physics", "CMOS inverter & gates", "Static Timing Analysis", "Setup & hold time", "Design for Testability"] },
  { level: 5, name: "Level 5: Physical Design (ASIC)", desc: "Floorplanning, placement, clock tree synthesis, routing, GDSII", topics: ["Floorplanning", "Power grid design", "Placement & CTS", "Routing & DRC/LVS", "Timing closure"] },
  { level: 6, name: "Level 6: FPGA Development", desc: "FPGA architecture, DSP blocks, hardware debugging with ILA", topics: ["FPGA architectures", "LUTs & slices", "Resource optimization", "Hardware debugging", "FPGA project build"] },
  { level: 7, name: "Level 7: AI + Semiconductor Accelerators", desc: "Systolic arrays, quantization, hardware-aware deep learning", topics: ["Quantization (INT8/FP8)", "Systolic arrays", "NPU architectures", "FPGA AI acceleration", "Hardware-software co-design"] },
];

export function RoadmapPage() {
  const { profile, partnerProfile } = useAuth();
  const [selectedTrack, setSelectedTrack] = useState<"gate" | "vlsi">("gate");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Real user topic statuses
  const gateKey = `duomate_roadmap_gate_${profile?.username || "user"}`;
  const vlsiKey = `duomate_roadmap_vlsi_${profile?.username || "user"}`;

  const [gateProgress, setGateProgress] = useState<Record<number, SubjectStatus>>({});
  const [vlsiProgress, setVlsiProgress] = useState<Record<number, SubjectStatus>>({});

  useEffect(() => {
    // Load GATE statuses
    const savedGate = localStorage.getItem(gateKey);
    if (savedGate) {
      try {
        setGateProgress(JSON.parse(savedGate));
      } catch {
        setGateProgress({});
      }
    } else {
      setGateProgress({});
    }

    // Load VLSI statuses
    const savedVlsi = localStorage.getItem(vlsiKey);
    if (savedVlsi) {
      try {
        setVlsiProgress(JSON.parse(savedVlsi));
      } catch {
        setVlsiProgress({});
      }
    } else {
      setVlsiProgress({});
    }
  }, [profile?.username]);

  const updateGateStatus = (id: number, status: SubjectStatus) => {
    const updated = { ...gateProgress, [id]: status };
    setGateProgress(updated);
    localStorage.setItem(gateKey, JSON.stringify(updated));
    toast.success("Subject progress updated");
  };

  const updateVlsiStatus = (level: number, status: SubjectStatus) => {
    const updated = { ...vlsiProgress, [level]: status };
    setVlsiProgress(updated);
    localStorage.setItem(vlsiKey, JSON.stringify(updated));
    toast.success("Level progress updated");
  };

  // Compute actual overall percentages (Starts at 0%!)
  const gateCompletedCount = Object.values(gateProgress).filter((s) => s === "completed").length;
  const gateInProgressCount = Object.values(gateProgress).filter((s) => s === "in_progress").length;
  const gatePct = Math.round(((gateCompletedCount + gateInProgressCount * 0.5) / GATE_SUBJECTS.length) * 100);

  const vlsiCompletedCount = Object.values(vlsiProgress).filter((s) => s === "completed").length;
  const vlsiInProgressCount = Object.values(vlsiProgress).filter((s) => s === "in_progress").length;
  const vlsiPct = Math.round(((vlsiCompletedCount + vlsiInProgressCount * 0.5) / VLSI_LEVELS.length) * 100);

  const getStatusBadge = (status?: SubjectStatus) => {
    if (status === "completed") {
      return <Badge variant="success">Completed</Badge>;
    }
    if (status === "in_progress") {
      return <Badge variant="purple">In Progress</Badge>;
    }
    return <Badge variant="outline" className="text-muted-foreground">Not Started</Badge>;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-indigo-500" />
            Career Roadmap &amp; Study Tracks
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Aadhavan &amp; Narmatha's joint study roadmap for GATE ECE and VLSI / AI Hardware.
          </p>
        </div>

        {/* Dynamic summary pill */}
        <div className="text-right bg-card/80 border border-border px-4 py-2 rounded-xl flex-shrink-0">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
            Overall Progress
          </p>
          <p className="text-base font-bold text-foreground">
            {selectedTrack === "gate" ? `${gatePct}% GATE` : `${vlsiPct}% VLSI`}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={selectedTrack}
        onValueChange={(v) => setSelectedTrack(v as "gate" | "vlsi")}
        className="space-y-4"
      >
        <TabsList className="grid grid-cols-2 max-w-sm">
          <TabsTrigger value="gate" className="text-xs gap-2">
            <GraduationCap className="h-4 w-4" />
            GATE ECE ({gateCompletedCount}/{GATE_SUBJECTS.length})
          </TabsTrigger>
          <TabsTrigger value="vlsi" className="text-xs gap-2">
            <Cpu className="h-4 w-4" />
            VLSI + AI Hardware ({vlsiCompletedCount}/{VLSI_LEVELS.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: GATE ECE */}
        <TabsContent value="gate" className="space-y-3 mt-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-muted-foreground">
              10 Core GATE ECE Subjects
            </span>
            <span className="text-xs font-medium text-indigo-500">
              {gateCompletedCount} completed · {gateInProgressCount} in progress
            </span>
          </div>

          <div className="space-y-2.5">
            {GATE_SUBJECTS.map((sub) => {
              const currentStatus = gateProgress[sub.id] || "not_started";
              const isExpanded = expandedId === sub.id;

              return (
                <Card key={sub.id} className="border border-border">
                  <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-500 font-mono">
                          #{sub.id}
                        </span>
                        <h3 className="text-sm font-bold text-foreground truncate">
                          {sub.name}
                        </h3>
                        {getStatusBadge(currentStatus)}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 truncate">
                        {sub.topics.join(" · ")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <select
                        aria-label={`Status for ${sub.name}`}
                        value={currentStatus}
                        onChange={(e) => updateGateStatus(sub.id, e.target.value as SubjectStatus)}
                        className="text-xs rounded-lg border border-border bg-background px-2.5 py-1.5 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="not_started">Not Started</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                        className="h-8 w-8 text-muted-foreground"
                        title="View Topics"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-3 pt-1 border-t border-border/40 bg-muted/20">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                        Key Syllabus Topics
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {sub.topics.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-card border border-border text-[11px] text-foreground font-medium"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* TAB 2: VLSI + AI HARDWARE */}
        <TabsContent value="vlsi" className="space-y-3 mt-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-muted-foreground">
              7 Progressive Career Levels
            </span>
            <span className="text-xs font-medium text-purple-500">
              {vlsiCompletedCount} completed · {vlsiInProgressCount} in progress
            </span>
          </div>

          <div className="space-y-2.5">
            {VLSI_LEVELS.map((lvl) => {
              const currentStatus = vlsiProgress[lvl.level] || "not_started";
              const isExpanded = expandedId === 100 + lvl.level;

              return (
                <Card key={lvl.level} className="border border-border">
                  <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-foreground">
                          {lvl.name}
                        </h3>
                        {getStatusBadge(currentStatus)}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {lvl.desc}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <select
                        aria-label={`Status for ${lvl.name}`}
                        value={currentStatus}
                        onChange={(e) => updateVlsiStatus(lvl.level, e.target.value as SubjectStatus)}
                        className="text-xs rounded-lg border border-border bg-background px-2.5 py-1.5 font-medium focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="not_started">Not Started</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setExpandedId(isExpanded ? null : 100 + lvl.level)}
                        className="h-8 w-8 text-muted-foreground"
                        title="View Topics"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-3 pt-1 border-t border-border/40 bg-muted/20">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                        Core Competencies
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {lvl.topics.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-card border border-border text-[11px] text-foreground font-medium"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
