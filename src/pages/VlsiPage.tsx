import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu,
  CheckCircle2,
  Circle,
  Clock,
  RotateCw,
  Sparkles,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Code2,
  Layers,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { TopicStatus } from "@/types/database";

interface TopicItem {
  id: string;
  title: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  status: TopicStatus;
}

interface LevelData {
  level: number;
  name: string;
  badge: string;
  desc: string;
  topics: TopicItem[];
}

const INITIAL_VLSI_LEVELS: LevelData[] = [
  {
    level: 1,
    name: "Digital Fundamentals",
    badge: "Foundation",
    desc: "Boolean algebra, Karnaugh maps, combinational & sequential building blocks",
    topics: [
      { id: "1-1", title: "Number Systems & Binary Codes", difficulty: "beginner", status: "completed" },
      { id: "1-2", title: "Boolean Algebra & Logic Simplification", difficulty: "beginner", status: "completed" },
      { id: "1-3", title: "Logic Gates & Universal Logic Implementation", difficulty: "beginner", status: "completed" },
      { id: "1-4", title: "Combinational Circuits (Adders, MUX, Decoders)", difficulty: "beginner", status: "completed" },
      { id: "1-5", title: "Sequential Circuits (Latches vs Flip-Flops)", difficulty: "beginner", status: "completed" },
      { id: "1-6", title: "Flip-Flop Timing & Setup/Hold Times", difficulty: "intermediate", status: "in_progress" },
      { id: "1-7", title: "Synchronous & Asynchronous Counters", difficulty: "intermediate", status: "in_progress" },
      { id: "1-8", title: "Finite State Machine (Mealy vs Moore) Design", difficulty: "intermediate", status: "in_progress" },
    ],
  },
  {
    level: 2,
    name: "HDL Programming (Verilog & SystemVerilog)",
    badge: "Core Skill",
    desc: "Synthesizable RTL, procedural modeling, testbench design & SV assertions",
    topics: [
      { id: "2-1", title: "Verilog Language Fundamentals & Data Types", difficulty: "beginner", status: "completed" },
      { id: "2-2", title: "Verilog Operators & Continuous Assignment", difficulty: "beginner", status: "completed" },
      { id: "2-3", title: "Modules, Hierarchy & Port Mapping", difficulty: "beginner", status: "completed" },
      { id: "2-4", title: "Combinational Logic with always @(*)", difficulty: "intermediate", status: "completed" },
      { id: "2-5", title: "Sequential Logic with Non-blocking (<=) Assignments", difficulty: "intermediate", status: "in_progress" },
      { id: "2-6", title: "FSM Implementation (2-Always vs 3-Always Pattern)", difficulty: "intermediate", status: "in_progress" },
      { id: "2-7", title: "Testbenches, Clocks, Resets & Waveform Dumps", difficulty: "intermediate", status: "in_progress" },
      { id: "2-8", title: "Icarus Verilog & GTKWave Simulation Flow", difficulty: "intermediate", status: "completed" },
      { id: "2-9", title: "SystemVerilog Interfaces, Structs & Assertions", difficulty: "advanced", status: "not_started" },
    ],
  },
  {
    level: 3,
    name: "RTL Design & Synthesis",
    badge: "Architecture",
    desc: "Synthesis-friendly architectures, timing budget, pipelining & verification",
    topics: [
      { id: "3-1", title: "RTL Coding for Synthesis (Avoiding Latches)", difficulty: "intermediate", status: "in_progress" },
      { id: "3-2", title: "Design Optimization for PPA (Power, Performance, Area)", difficulty: "advanced", status: "not_started" },
      { id: "3-3", title: "Pipelining & Throughput Maximization", difficulty: "advanced", status: "not_started" },
      { id: "3-4", title: "Timing Concepts (Propagation, Clock Skew, Jitter)", difficulty: "intermediate", status: "in_progress" },
      { id: "3-5", title: "Verification Fundamentals & Constrained Random Testing", difficulty: "advanced", status: "not_started" },
      { id: "3-6", title: "Functional Coverage & Code Coverage Metrics", difficulty: "advanced", status: "not_started" },
    ],
  },
  {
    level: 4,
    name: "VLSI Design & CMOS Technology",
    badge: "Semiconductor",
    desc: "MOSFET physics, CMOS layout, STA, CDC & DFT principles",
    topics: [
      { id: "4-1", title: "MOSFET Fundamentals & I-V Characteristics", difficulty: "intermediate", status: "in_progress" },
      { id: "4-2", title: "CMOS Inverter DC Characteristics & Noise Margins", difficulty: "intermediate", status: "not_started" },
      { id: "4-3", title: "CMOS Complex Logic & Transmission Gate Design", difficulty: "intermediate", status: "not_started" },
      { id: "4-4", title: "Static Timing Analysis (STA, Setup/Hold Slacks)", difficulty: "advanced", status: "not_started" },
      { id: "4-5", title: "Clock Domain Crossing (CDC) & Synchronizers", difficulty: "advanced", status: "not_started" },
      { id: "4-6", title: "Logic Synthesis Flow with Standard Cell Libraries", difficulty: "advanced", status: "not_started" },
      { id: "4-7", title: "Design for Testability (Scan Chains, BIST, ATPG)", difficulty: "advanced", status: "not_started" },
    ],
  },
  {
    level: 5,
    name: "Physical Design (ASIC Flow)",
    badge: "Backend",
    desc: "From Netlist to GDSII: floorplanning, placement, CTS, routing & signoff",
    topics: [
      { id: "5-1", title: "ASIC Design Flow & Netlist Import", difficulty: "intermediate", status: "not_started" },
      { id: "5-2", title: "Floorplanning, Power Planning & Pad Placement", difficulty: "advanced", status: "not_started" },
      { id: "5-3", title: "Standard Cell Placement & Congestion Analysis", difficulty: "advanced", status: "not_started" },
      { id: "5-4", title: "Clock Tree Synthesis (CTS) & Skew Minimization", difficulty: "advanced", status: "not_started" },
      { id: "5-5", title: "Global & Detail Routing with DRC/LVS Verification", difficulty: "advanced", status: "not_started" },
      { id: "5-6", title: "Parasitic Extraction (SPEF) & Timing Closure", difficulty: "advanced", status: "not_started" },
      { id: "5-7", title: "RTL-to-GDSII Signoff with OpenLane / Yosys", difficulty: "advanced", status: "not_started" },
    ],
  },
  {
    level: 6,
    name: "FPGA Development",
    badge: "Hardware",
    desc: "FPGA fabric, LUTs, BRAM, DSP blocks & hardware prototyping",
    topics: [
      { id: "6-1", title: "FPGA Architecture (LUTs, CLBs, Interconnect)", difficulty: "intermediate", status: "not_started" },
      { id: "6-2", title: "Vivado / Quartus Tool Flow & Synthesis", difficulty: "intermediate", status: "not_started" },
      { id: "6-3", title: "Resource Optimization (Block RAM & DSP Slices)", difficulty: "advanced", status: "not_started" },
      { id: "6-4", title: "Hardware Debugging with Integrated Logic Analyzer (ILA)", difficulty: "advanced", status: "not_started" },
      { id: "6-5", title: "FPGA-based Project: High-Speed UART & SPI Controller", difficulty: "advanced", status: "not_started" },
    ],
  },
  {
    level: 7,
    name: "AI Hardware Accelerators & Neuromorphic Chip Design",
    badge: "Frontier",
    desc: "Systolic arrays, quantization, NPU architectures & edge AI silicon",
    topics: [
      { id: "7-1", title: "Deep Learning Workloads (GEMM, Convolutions, Attention)", difficulty: "intermediate", status: "not_started" },
      { id: "7-2", title: "Quantization Techniques (FP32, FP16, INT8, INT4)", difficulty: "advanced", status: "not_started" },
      { id: "7-3", title: "Model Compression, Pruning & Weight Sparsity", difficulty: "advanced", status: "not_started" },
      { id: "7-4", title: "Systolic Array Architecture for Matrix Multiplication", difficulty: "advanced", status: "not_started" },
      { id: "7-5", title: "Dataflow Architectures (Weight Stationary vs Output Stationary)", difficulty: "advanced", status: "not_started" },
      { id: "7-6", title: "On-Chip Memory Subsystems (SRAM scratchpads, banked memory)", difficulty: "advanced", status: "not_started" },
      { id: "7-7", title: "Hardware-Aware Neural Architecture Search (NAS)", difficulty: "advanced", status: "not_started" },
      { id: "7-8", title: "FPGA-based AI Inference Engine Implementation", difficulty: "advanced", status: "not_started" },
      { id: "7-9", title: "Google TPU & Tesla Dojo Architectural Dissection", difficulty: "advanced", status: "not_started" },
    ],
  },
];

export function VlsiPage() {
  const { profile, partnerProfile } = useAuth();
  const [levels, setLevels] = useState<LevelData[]>(INITIAL_VLSI_LEVELS);
  const [expandedLevels, setExpandedLevels] = useState<number[]>([1, 2]);

  const toggleLevel = (lvlNum: number) => {
    setExpandedLevels((prev) =>
      prev.includes(lvlNum)
        ? prev.filter((n) => n !== lvlNum)
        : [...prev, lvlNum]
    );
  };

  const cycleStatus = (lvlIdx: number, topicIdx: number) => {
    const statuses: TopicStatus[] = [
      "not_started",
      "in_progress",
      "completed",
      "revision",
    ];

    setLevels((prev) => {
      const updated = [...prev];
      const curStatus = updated[lvlIdx].topics[topicIdx].status;
      const nextIdx = (statuses.indexOf(curStatus) + 1) % statuses.length;
      const nextStatus = statuses[nextIdx];

      updated[lvlIdx].topics[topicIdx].status = nextStatus;

      toast.success(
        `Updated: ${updated[lvlIdx].topics[topicIdx].title} → ${nextStatus.replace(
          "_",
          " "
        )}`
      );
      return updated;
    });
  };

  // Overall statistics
  const totalTopics = levels.reduce((acc, l) => acc + l.topics.length, 0);
  const completedTopics = levels.reduce(
    (acc, l) =>
      acc + l.topics.filter((t) => t.status === "completed").length,
    0
  );
  const inProgressTopics = levels.reduce(
    (acc, l) =>
      acc + l.topics.filter((t) => t.status === "in_progress").length,
    0
  );
  const overallPercentage = Math.round((completedTopics / totalTopics) * 100);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-purple-600/10 via-indigo-600/10 to-pink-600/10 border border-border">
        <div>
          <div className="flex items-center gap-2 text-purple-500 font-semibold text-xs uppercase tracking-wider">
            <Cpu className="h-4 w-4" />
            Semiconductor &amp; AI Hardware Track
          </div>
          <h1 className="text-2xl font-bold mt-1">7-Level VLSI &amp; Accelerator Mastery</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Structured roadmap from Digital Fundamentals through ASIC physical design to custom NPU AI accelerators.
          </p>
        </div>

        <div className="bg-background/80 backdrop-blur-sm p-4 rounded-xl border border-border shadow-sm flex items-center gap-4">
          <div className="text-right">
            <p className="text-2xl font-bold font-mono text-purple-500">
              {overallPercentage}%
            </p>
            <p className="text-xs text-muted-foreground">
              {completedTopics} of {totalTopics} completed
            </p>
          </div>
          <div className="w-20">
            <Progress value={overallPercentage} className="h-2" />
          </div>
        </div>
      </div>

      {/* 7 Levels Accordion / List */}
      <div className="space-y-4">
        {levels.map((lvl, lvlIdx) => {
          const isExpanded = expandedLevels.includes(lvl.level);
          const lvlCompleted = lvl.topics.filter((t) => t.status === "completed").length;
          const lvlPercent = Math.round((lvlCompleted / lvl.topics.length) * 100);

          return (
            <Card
              key={lvl.level}
              className="border-border hover:border-indigo-500/30 transition-all overflow-hidden"
            >
              <div
                onClick={() => toggleLevel(lvl.level)}
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors select-none"
              >
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center font-mono font-bold text-sm text-purple-500">
                    L{lvl.level}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base">{lvl.name}</h3>
                      <Badge variant="outline" className="text-[10px]">
                        {lvl.badge}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{lvl.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="hidden sm:flex flex-col items-end w-32">
                    <span className="text-xs font-mono font-semibold">
                      {lvlCompleted}/{lvl.topics.length} ({lvlPercent}%)
                    </span>
                    <Progress value={lvlPercent} className="h-1.5 w-full mt-1" />
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Topics Detail List */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-border/50 bg-muted/10 p-5 pt-3"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {lvl.topics.map((topic, topicIdx) => {
                        return (
                          <div
                            key={topic.id}
                            onClick={() => cycleStatus(lvlIdx, topicIdx)}
                            className="p-3 rounded-xl bg-card border border-border/60 hover:border-indigo-500/50 flex items-center justify-between cursor-pointer transition-all shadow-sm group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              {topic.status === "completed" ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                              ) : topic.status === "in_progress" ? (
                                <Clock className="h-4 w-4 text-indigo-500 flex-shrink-0 animate-pulse" />
                              ) : topic.status === "revision" ? (
                                <RotateCw className="h-4 w-4 text-orange-500 flex-shrink-0" />
                              ) : (
                                <Circle className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                              )}
                              <span
                                className={`text-xs font-medium truncate ${
                                  topic.status === "completed"
                                    ? "text-muted-foreground line-through"
                                    : "text-foreground"
                                }`}
                              >
                                {topic.title}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-medium ${
                                  topic.status === "completed"
                                    ? "bg-green-500/10 text-green-500"
                                    : topic.status === "in_progress"
                                    ? "bg-indigo-500/10 text-indigo-500"
                                    : topic.status === "revision"
                                    ? "bg-orange-500/10 text-orange-500"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {topic.status.replace("_", " ")}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

