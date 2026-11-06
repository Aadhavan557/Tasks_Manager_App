import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FolderOpen,
  Plus,
  Search,
  FileCode,
  FileText,
  FileArchive,
  Download,
  ExternalLink,
  Tag,
  Calendar,
  Sparkles,
  Paperclip,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TASK_CATEGORIES, formatDate, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { LearningResource, TaskCategory } from "@/types/database";

export function ResourcesPage() {
  const { profile, partnerProfile } = useAuth();
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TaskCategory>("Verilog");
  const [fileUrl, setFileUrl] = useState("");
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile?.workspace_id) {
      loadResources();
    }
  }, [profile?.workspace_id]);

  const loadResources = async () => {
    if (!profile?.workspace_id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("learning_resources")
        .select(`
          *,
          uploader:profiles!learning_resources_uploaded_by_fkey(*)
        `)
        .eq("workspace_id", profile.workspace_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setResources((data as LearningResource[]) || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load resources");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.workspace_id || !title.trim()) return;

    setSubmitting(true);
    try {
      const tagArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const { error } = await supabase.from("learning_resources").insert({
        workspace_id: profile.workspace_id,
        uploaded_by: profile.id,
        title: title.trim(),
        description: description.trim() || null,
        category,
        file_name: title.trim(),
        file_url: fileUrl.trim() || "https://example.com/resource",
        file_type: "pdf/code",
        file_size: 1024 * 50,
        tags: tagArray,
        linked_topic_id: null,
      });

      if (error) throw error;

      // Log activity
      await supabase.from("activity_logs").insert({
        workspace_id: profile.workspace_id,
        user_id: profile.id,
        action: `${profile.full_name} shared a study resource: "${title}"`,
        entity_type: "learning_resource",
        entity_id: null,
        metadata: { title, category },
      });

      toast.success("Resource shared with workspace!");
      setShowAddDialog(false);
      setTitle("");
      setDescription("");
      setFileUrl("");
      setTags("");
      loadResources();
    } catch (err) {
      toast.error("Failed to add resource");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredResources = resources.filter((res) => {
    const matchesSearch =
      !search ||
      res.title.toLowerCase().includes(search.toLowerCase()) ||
      res.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || res.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getFileIcon = (category: string) => {
    if (["Verilog", "SystemVerilog", "FPGA"].includes(category)) {
      return <FileCode className="h-5 w-5 text-indigo-500" />;
    }
    return <FileText className="h-5 w-5 text-purple-500" />;
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-indigo-500" />
            Shared Resource Library
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Central repository for Verilog testbenches, GATE formulas, synthesis scripts and research PDFs.
          </p>
        </div>

        <Button
          onClick={() => setShowAddDialog(true)}
          variant="gradient"
          className="gap-2 shrink-0 shadow-lg shadow-indigo-500/25"
        >
          <Plus className="h-4 w-4" />
          Upload / Add Resource
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-56 text-xs">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent className="max-h-56">
            <SelectItem value="all">All Categories</SelectItem>
            {TASK_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Resource Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 rounded-xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : filteredResources.length === 0 ? (
        <Card className="border-dashed p-12 text-center">
          <FolderOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm font-semibold">No resources found</p>
          <p className="text-xs text-muted-foreground mt-1">
            Add lecture notes, code repositories or gate formulas to start your shared library.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((res) => (
            <Card
              key={res.id}
              className="border-border hover:border-indigo-500/40 transition-all flex flex-col justify-between"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2 rounded-lg bg-muted flex-shrink-0">
                    {getFileIcon(res.category)}
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {res.category}
                  </Badge>
                </div>
                <CardTitle className="text-sm font-bold line-clamp-1 mt-2">
                  {res.title}
                </CardTitle>
                {res.description && (
                  <CardDescription className="text-xs line-clamp-2">
                    {res.description}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="pt-2 border-t border-border/40 mt-auto">
                {res.tags && res.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {res.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] bg-muted/80 text-muted-foreground px-1.5 py-0.5 rounded font-mono"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] text-muted-foreground">
                    {formatDate(res.created_at, "MMM d, yyyy")}
                  </span>
                  <a
                    href={res.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1 text-indigo-500"
                    >
                      <Download className="h-3 w-3" />
                      Open
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Resource Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-indigo-500" />
              Add Study Resource / Code File
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateResource} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                placeholder="e.g., Verilog 4-bit ALU Testbench with Assertions"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as TaskCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {TASK_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="What does this resource cover?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Resource Link / File URL</Label>
              <Input
                placeholder="https://drive.google.com/... or GitHub link"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Tags (comma separated)</Label>
              <Input
                placeholder="verilog, alu, simulation, gate2027"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
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
              <Button type="submit" variant="gradient" disabled={submitting}>
                {submitting ? "Adding..." : "Add to Library"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

