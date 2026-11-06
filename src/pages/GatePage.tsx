import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Plus,
  Target,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  History,
  FileCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import type { GateMockTest } from "@/types/database";

const GATE_SUBJECTS = [
  { id: "em", name: "Engineering Mathematics", weightage: "13%", topics: 14 },
  { id: "nt", name: "Network Theory", weightage: "9%", topics: 10 },
  { id: "ss", name: "Signals and Systems", weightage: "8%", topics: 11 },
  { id: "edc", name: "Electronic Devices and Circuits", weightage: "11%", topics: 12 },
  { id: "analog", name: "Analog Electronics", weightage: "10%", topics: 13 },
  { id: "digital", name: "Digital Electronics", weightage: "9%", topics: 12 },
  { id: "control", name: "Control Systems", weightage: "8%", topics: 10 },
  { id: "comm", name: "Communications", weightage: "11%", topics: 15 },
  { id: "emft", name: "Electromagnetics", weightage: "6%", topics: 9 },
  { id: "aptitude", name: "General Aptitude", weightage: "15%", topics: 8 },
];

export function GatePage() {
  const { profile, partnerProfile } = useAuth();
  const [mockTests, setMockTests] = useState<GateMockTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Form State
  const [testType, setTestType] = useState<"subject" | "topic" | "full">("subject");
  const [subject, setSubject] = useState(GATE_SUBJECTS[0].name);
  const [testDate, setTestDate] = useState(new Date().toISOString().split("T")[0]);
  const [totalQuestions, setTotalQuestions] = useState(30);
  const [attempted, setAttempted] = useState(26);
  const [correct, setCorrect] = useState(20);
  const [incorrect, setIncorrect] = useState(6);
  const [marksObtained, setMarksObtained] = useState(28.67);
  const [totalMarks, setTotalMarks] = useState(50);
  const [timeTaken, setTimeTaken] = useState(60);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (profile?.workspace_id) {
      loadMockTests();
    }
  }, [profile?.workspace_id]);

  const loadMockTests = async () => {
    if (!profile?.workspace_id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("gate_mock_tests")
        .select("*")
        .eq("workspace_id", profile.workspace_id)
        .order("test_date", { ascending: false });

      if (error) throw error;
      setMockTests((data as GateMockTest[]) || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load GATE tests");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMockTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.workspace_id) return;

    const unattempted = Math.max(0, totalQuestions - attempted);
    const accuracy =
      attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
    const negativeMarks = (incorrect * 0.33).toFixed(2);

    try {
      const { error } = await supabase.from("gate_mock_tests").insert({
        workspace_id: profile.workspace_id,
        user_id: profile.id,
        test_type: testType,
        subject: testType === "full" ? "Full Length GATE Mock" : subject,
        topic: null,
        test_date: testDate,
        total_questions: Number(totalQuestions),
        attempted: Number(attempted),
        correct: Number(correct),
        incorrect: Number(incorrect),
        unattempted,
        marks_obtained: Number(marksObtained),
        total_marks: Number(totalMarks),
        negative_marks: Number(negativeMarks),
        time_taken_minutes: Number(timeTaken),
        accuracy_percentage: accuracy,
        notes: notes.trim() || null,
      });

      if (error) throw error;

      // Log activity
      await supabase.from("activity_logs").insert({
        workspace_id: profile.workspace_id,
        user_id: profile.id,
        action: `${profile.full_name} logged a GATE test score (${marksObtained}/${totalMarks} - ${accuracy}% accuracy)`,
        entity_type: "gate_mock_test",
        entity_id: null,
        metadata: { subject, marks: marksObtained },
      });

      toast.success("GATE mock test logged successfully!");
      setShowAddDialog(false);
      loadMockTests();
    } catch (err) {
      toast.error("Failed to save test score");
    }
  };

  // Calculations
  const myTests = mockTests.filter((t) => t.user_id === profile?.id);
  const totalAttempted = myTests.reduce((acc, t) => acc + t.attempted, 0);
  const totalCorrect = myTests.reduce((acc, t) => acc + t.correct, 0);
  const avgAccuracy =
    totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;
  const avgMarks =
    myTests.length > 0
      ? (
          myTests.reduce((acc, t) => acc + t.marks_obtained, 0) / myTests.length
        ).toFixed(1)
      : "0";

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Hero Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 border border-border">
        <div>
          <div className="flex items-center gap-2 text-blue-500 font-semibold text-xs uppercase tracking-wider">
            <GraduationCap className="h-4 w-4" />
            GATE ECE Master Preparation Track
          </div>
          <h1 className="text-2xl font-bold mt-1">Syllabus &amp; Mock Test Tracker</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            10 Standard subjects. Objective accuracy tracking, negative mark control &amp; test analysis.
          </p>
        </div>

        <Button
          onClick={() => setShowAddDialog(true)}
          variant="gradient"
          className="gap-2 shadow-lg shadow-indigo-500/25 shrink-0"
        >
          <Plus className="h-4 w-4" />
          Log Mock Test Result
        </Button>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold font-mono">{myTests.length}</p>
              <p className="text-xs text-muted-foreground">Tests Logged</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-green-500/10 text-green-500">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold font-mono">{avgAccuracy}%</p>
              <p className="text-xs text-muted-foreground">Avg Accuracy</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold font-mono">{avgMarks}</p>
              <p className="text-xs text-muted-foreground">Avg Score</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold font-mono">10 Subjects</p>
              <p className="text-xs text-muted-foreground">Standard Syllabus</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* GATE Subjects Grid */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold">GATE ECE Subjects Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {GATE_SUBJECTS.map((sub, idx) => (
            <Card key={sub.id} className="border-border hover:border-indigo-500/40 transition-all">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-sm leading-tight">{sub.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {sub.topics} core chapters
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {sub.weightage}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Target Mastery</span>
                    <span className="font-mono">{35 + (idx * 5) % 55}%</span>
                  </div>
                  <Progress value={35 + (idx * 5) % 55} className="h-1.5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Mock Tests History Table */}
      <Card className="border-border">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <History className="h-4 w-4 text-indigo-500" />
              Recorded Mock Test Performance
            </CardTitle>
            <span className="text-xs text-muted-foreground">Historical records</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {mockTests.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <GraduationCap className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No mock tests recorded yet.</p>
              <p className="text-xs opacity-70">
                Click "Log Mock Test Result" to record your first subject test!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
                    <th className="py-3 px-4 text-left font-medium">Date</th>
                    <th className="py-3 px-4 text-left font-medium">Student</th>
                    <th className="py-3 px-4 text-left font-medium">Subject</th>
                    <th className="py-3 px-4 text-center font-medium">Attempted</th>
                    <th className="py-3 px-4 text-center font-medium">Accuracy</th>
                    <th className="py-3 px-4 text-center font-medium">Score</th>
                    <th className="py-3 px-4 text-right font-medium">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {mockTests.map((t) => {
                    const isMe = t.user_id === profile?.id;
                    return (
                      <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4 text-xs font-mono text-muted-foreground">
                          {formatDate(t.test_date, "MMM d, yyyy")}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              isMe
                                ? "bg-indigo-500/10 text-indigo-500"
                                : "bg-purple-500/10 text-purple-500"
                            }`}
                          >
                            {isMe ? "You" : partnerProfile?.full_name ?? "Partner"}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-xs">
                          {t.subject || "Full Mock"}
                        </td>
                        <td className="py-3 px-4 text-center text-xs font-mono">
                          {t.attempted} / {t.total_questions}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            className={`text-xs font-mono ${
                              t.accuracy_percentage >= 75
                                ? "bg-green-500/10 text-green-500 border-green-500/20"
                                : t.accuracy_percentage >= 50
                                ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                                : "bg-red-500/10 text-red-500 border-red-500/20"
                            }`}
                          >
                            {t.accuracy_percentage}%
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-xs">
                          {t.marks_obtained} / {t.total_marks}
                        </td>
                        <td className="py-3 px-4 text-right text-xs text-muted-foreground font-mono">
                          {t.time_taken_minutes}m
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Mock Test Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-indigo-500" />
              Log GATE Mock Test Result
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddMockTest} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Test Type</Label>
              <Select
                value={testType}
                onValueChange={(v) => setTestType(v as "subject" | "topic" | "full")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subject">Subject-wise Test</SelectItem>
                  <SelectItem value="topic">Topic-wise Test</SelectItem>
                  <SelectItem value="full">Full-Length Mock Test</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {testType !== "full" && (
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {GATE_SUBJECTS.map((s) => (
                      <SelectItem key={s.id} value={s.name}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Test Date</Label>
                <Input
                  type="date"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Time Taken (mins)</Label>
                <Input
                  type="number"
                  value={timeTaken}
                  onChange={(e) => setTimeTaken(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Total Qs</Label>
                <Input
                  type="number"
                  value={totalQuestions}
                  onChange={(e) => setTotalQuestions(Number(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Attempted</Label>
                <Input
                  type="number"
                  value={attempted}
                  onChange={(e) => setAttempted(Number(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Correct</Label>
                <Input
                  type="number"
                  value={correct}
                  onChange={(e) => setCorrect(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Marks Obtained</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={marksObtained}
                  onChange={(e) => setMarksObtained(Number(e.target.value))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Total Marks</Label>
                <Input
                  type="number"
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes / Mistakes Analysis</Label>
              <Input
                placeholder="e.g. S-parameter formula error, revised smith chart"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="gradient">
                Save Result
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

