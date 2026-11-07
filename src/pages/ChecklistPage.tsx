import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Calendar,
  ListTodo,
  User,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { broadcastCloudSync } from "@/lib/cloudSync";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

interface SimpleChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

export function ChecklistPage() {
  const { profile, partnerProfile } = useAuth();
  const [myItems, setMyItems] = useState<SimpleChecklistItem[]>([]);
  const [partnerItems, setPartnerItems] = useState<SimpleChecklistItem[]>([]);
  const [newItemText, setNewItemText] = useState("");
  const [activeTab, setActiveTab] = useState<"mine" | "partner">("mine");

  const todayDisplay = format(new Date(), "EEEE, MMMM d, yyyy");
  const username = profile?.username || "aadhavan";
  const myKey = `duomate_checklist_${username}`;
  const partnerKey = `duomate_checklist_${partnerProfile?.username || "narmatha"}`;

  useEffect(() => {
    loadChecklists();
  }, [username, partnerProfile?.username]);

  const loadChecklists = () => {
    // Load mine
    const savedMine = localStorage.getItem(myKey);
    if (savedMine) {
      try {
        setMyItems(JSON.parse(savedMine));
      } catch {
        setMyItems([]);
      }
    } else {
      setMyItems([]);
    }

    // Load partner
    const savedPartner = localStorage.getItem(partnerKey);
    if (savedPartner) {
      try {
        setPartnerItems(JSON.parse(savedPartner));
      } catch {
        setPartnerItems([]);
      }
    } else {
      setPartnerItems([]);
    }
  };

  const saveMyItems = (updated: SimpleChecklistItem[]) => {
    setMyItems(updated);
    localStorage.setItem(myKey, JSON.stringify(updated));
    window.dispatchEvent(new Event("duomate_checklist_updated"));
    broadcastCloudSync("CHECKLIST_SYNC", { user: username, items: updated });
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;

    const newItem: SimpleChecklistItem = {
      id: "item-" + Date.now(),
      text: newItemText.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const updated = [...myItems, newItem];
    saveMyItems(updated);
    setNewItemText("");
    toast.success("Checklist item added!");
  };

  const handleToggle = (id: string) => {
    const updated = myItems.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    saveMyItems(updated);
  };

  const handleDelete = (id: string) => {
    const updated = myItems.filter((item) => item.id !== id);
    saveMyItems(updated);
    toast.success("Item removed");
  };

  const myDoneCount = myItems.filter((i) => i.completed).length;
  const myPct = myItems.length > 0 ? Math.round((myDoneCount / myItems.length) * 100) : 0;

  const partnerDoneCount = partnerItems.filter((i) => i.completed).length;
  const partnerPct = partnerItems.length > 0 ? Math.round((partnerDoneCount / partnerItems.length) * 100) : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-indigo-500" />
            Daily Study Checklist
          </h1>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <Calendar className="h-3.5 w-3.5" />
            {todayDisplay}
          </p>
        </div>

        {/* Progress pill */}
        <div className="flex items-center gap-3 bg-card border border-border px-4 py-2 rounded-xl">
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              Today's Completion
            </p>
            <p className="text-base font-bold text-foreground">
              {myDoneCount}/{myItems.length} Done ({myPct}%)
            </p>
          </div>
          <div className="w-16">
            <Progress value={myPct} className="h-2" />
          </div>
        </div>
      </div>

      {/* View Switcher Tabs: My Checklist vs Partner's Checklist */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "mine" | "partner")}>
        <TabsList className="grid grid-cols-2 max-w-xs">
          <TabsTrigger value="mine" className="text-xs gap-1.5">
            <User className="h-3.5 w-3.5" />
            My Checklist ({myItems.length})
          </TabsTrigger>
          <TabsTrigger value="partner" className="text-xs gap-1.5">
            <Avatar className="h-4 w-4">
              <AvatarImage src={partnerProfile?.avatar_url ?? undefined} />
              <AvatarFallback className="text-[9px]">
                {partnerProfile ? getInitials(partnerProfile.full_name) : "P"}
              </AvatarFallback>
            </Avatar>
            {partnerProfile?.full_name || "Partner"} ({partnerItems.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: MY CHECKLIST */}
        <TabsContent value="mine" className="space-y-4 mt-4">
          {/* Add item input */}
          <form onSubmit={handleAddItem} className="flex gap-2">
            <Input
              type="text"
              placeholder="Add today's study goal or topic (e.g., Revise Verilog FSM, Solve 10 GATE Math questions)..."
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              className="text-sm h-11"
            />
            <Button type="submit" variant="gradient" className="h-11 px-5 gap-1.5 flex-shrink-0">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </form>

          {/* List of items */}
          <Card className="border border-border">
            <CardHeader className="py-3 px-4 border-b border-border/50 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Today's Items ({myItems.length})
              </CardTitle>
              {myItems.length > 0 && (
                <span className="text-xs font-medium text-muted-foreground">
                  {myDoneCount} of {myItems.length} completed
                </span>
              )}
            </CardHeader>
            <CardContent className="p-2 sm:p-3 divide-y divide-border/40">
              {myItems.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <ListTodo className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-medium text-foreground">No checklist items yet today</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                    Add your daily study goals above to stay accountable and track your progress with {partnerProfile?.full_name || "your partner"}.
                  </p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {myItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/40 transition-colors group"
                    >
                      <button
                        type="button"
                        onClick={() => handleToggle(item.id)}
                        className="flex items-center gap-3 text-left flex-1 min-w-0"
                      >
                        {item.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-indigo-500 flex-shrink-0" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground/60 hover:text-indigo-400 flex-shrink-0 transition-colors" />
                        )}
                        <span
                          className={`text-sm break-words ${
                            item.completed
                              ? "line-through text-muted-foreground/70 font-normal"
                              : "text-foreground font-medium"
                          }`}
                        >
                          {item.text}
                        </span>
                      </button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.id)}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: PARTNER'S CHECKLIST */}
        <TabsContent value="partner" className="space-y-4 mt-4">
          <Card className="border border-border">
            <CardHeader className="py-3 px-4 border-b border-border/50 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={partnerProfile?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-[10px]">
                    {partnerProfile ? getInitials(partnerProfile.full_name) : "P"}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {partnerProfile?.full_name}'s Progress ({partnerDoneCount}/{partnerItems.length} Done)
                </CardTitle>
              </div>
              <span className="text-xs font-semibold text-indigo-500">{partnerPct}% Completed</span>
            </CardHeader>
            <CardContent className="p-3 divide-y divide-border/40">
              {partnerItems.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <ListTodo className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-medium text-foreground">
                    {partnerProfile?.full_name || "Partner"} hasn't added any checklist items today
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                    When {partnerProfile?.full_name || "your partner"} adds items to their checklist, you will be able to follow their progress in real-time here.
                  </p>
                </div>
              ) : (
                partnerItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg"
                  >
                    {item.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-indigo-500 flex-shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground/50 flex-shrink-0" />
                    )}
                    <span
                      className={`text-sm break-words ${
                        item.completed
                          ? "line-through text-muted-foreground/70"
                          : "text-foreground font-medium"
                      }`}
                    >
                      {item.text}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
