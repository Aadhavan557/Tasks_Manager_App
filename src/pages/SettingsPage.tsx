import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  User,
  Shield,
  Palette,
  Bell,
  Database,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Sparkles,
  Save,
  Cloud,
  RefreshCw,
  Radio,
  Smartphone,
  Laptop,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase, isValidSupabaseConfig } from "@/lib/supabase";
import {
  getSyncTopic,
  setSyncTopic,
  subscribeCloudSyncStatus,
  sendFullCloudSnapshot,
  requestFullCloudSync,
  getDeviceId,
  type CloudSyncStatus,
} from "@/lib/cloudSync";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

export function SettingsPage() {
  const { profile, partnerProfile, refreshProfile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  // Cloud Sync state
  const [cloudStatus, setCloudStatus] = useState<CloudSyncStatus>("connecting");
  const [syncTopicInput, setSyncTopicInput] = useState(getSyncTopic());
  const [isSyncing, setIsSyncing] = useState(false);

  // Supabase Custom Config state
  const [supabaseUrl, setSupabaseUrl] = useState(
    localStorage.getItem("duomate_supabase_url") || ""
  );
  const [supabaseKey, setSupabaseKey] = useState(
    localStorage.getItem("duomate_supabase_key") || ""
  );

  // Notification switches
  const [taskAlerts, setTaskAlerts] = useState(true);
  const [chatAlerts, setChatAlerts] = useState(true);
  const [studyAlerts, setStudyAlerts] = useState(true);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setUsername(profile.username || "");
      setBio(profile.bio || "");
    }
  }, [profile]);

  useEffect(() => {
    return subscribeCloudSyncStatus(setCloudStatus);
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          username: username.trim().toLowerCase(),
          bio: bio.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (error) throw error;
      await refreshProfile();
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const copyWorkspaceId = () => {
    if (profile?.workspace_id) {
      navigator.clipboard.writeText(profile.workspace_id);
      toast.success("Workspace ID copied to clipboard!");
    }
  };

  const handleSaveSyncChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!syncTopicInput.trim()) return;
    setSyncTopic(syncTopicInput.trim());
    toast.success("Cloud sync channel updated!");
  };

  const handlePushAllToCloud = () => {
    setIsSyncing(true);
    sendFullCloudSnapshot();
    toast.success("All local tasks, notes, chat & calendar broadcast to cloud!");
    setTimeout(() => setIsSyncing(false), 1000);
  };

  const handlePullAllFromCloud = () => {
    setIsSyncing(true);
    requestFullCloudSync();
    toast.success("Requested latest data from cloud!");
    setTimeout(() => setIsSyncing(false), 1000);
  };

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      localStorage.removeItem("duomate_supabase_url");
      localStorage.removeItem("duomate_supabase_key");
      toast.info("Cleared custom Supabase configuration");
      setTimeout(() => window.location.reload(), 500);
      return;
    }

    localStorage.setItem("duomate_supabase_url", supabaseUrl.trim());
    localStorage.setItem("duomate_supabase_key", supabaseKey.trim());
    toast.success("Supabase credentials saved! Reloading to connect...");
    setTimeout(() => window.location.reload(), 600);
  };

  const isSupabaseLive = isValidSupabaseConfig();

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-indigo-500" />
          Settings &amp; Multi-Device Cloud Sync
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your personal profile, shared workspace, connection settings &amp; cloud sync.
        </p>
      </div>

      {/* ── REALTIME MULTI-DEVICE CLOUD SYNC CARD ── */}
      <Card className="border-indigo-500/30 bg-indigo-500/5 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2 text-foreground">
              <Cloud className="h-5 w-5 text-indigo-400" />
              Multi-Device Realtime Cloud Synchronization
            </CardTitle>
            <Badge
              variant={cloudStatus === "connected" ? "success" : "warning"}
              className="text-xs"
            >
              {cloudStatus === "connected" ? "🟢 Connected to Cloud" : "🟡 Connecting..."}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Synchronizes instantly across all 4 devices: Aadhavan (Laptop &amp; Phone) and Narmatha
            (Laptop &amp; Phone).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Active Devices Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 rounded-xl border border-border/80 bg-card/60 flex items-center gap-2.5">
              <Laptop className="h-4 w-4 text-indigo-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">Aadhavan</p>
                <p className="text-[10px] text-muted-foreground truncate">Laptop</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl border border-border/80 bg-card/60 flex items-center gap-2.5">
              <Smartphone className="h-4 w-4 text-indigo-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">Aadhavan</p>
                <p className="text-[10px] text-muted-foreground truncate">Phone (App)</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl border border-border/80 bg-card/60 flex items-center gap-2.5">
              <Laptop className="h-4 w-4 text-purple-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">Narmatha</p>
                <p className="text-[10px] text-muted-foreground truncate">Laptop</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl border border-border/80 bg-card/60 flex items-center gap-2.5">
              <Smartphone className="h-4 w-4 text-purple-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">Narmatha</p>
                <p className="text-[10px] text-muted-foreground truncate">Phone (App)</p>
              </div>
            </div>
          </div>

          {/* Sync Channel Configuration */}
          <form onSubmit={handleSaveSyncChannel} className="space-y-2">
            <Label className="text-xs font-semibold">Shared Cloud Channel Name</Label>
            <div className="flex items-center gap-2">
              <Input
                value={syncTopicInput}
                onChange={(e) => setSyncTopicInput(e.target.value)}
                className="h-9 text-xs font-mono"
                placeholder="duomate_sync_aadhavan_narmatha_vlsi"
                required
              />
              <Button type="submit" size="sm" variant="outline" className="h-9 text-xs flex-shrink-0">
                Update Channel
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Both Aadhavan and Narmatha must use this exact same channel name on their devices.
              Current Device ID: <code className="text-foreground">{getDeviceId()}</code>
            </p>
          </form>

          {/* Cloud Action Buttons */}
          <div className="flex items-center gap-2.5 pt-2 flex-wrap">
            <Button
              type="button"
              variant="gradient"
              size="sm"
              onClick={handlePullAllFromCloud}
              disabled={isSyncing}
              className="text-xs gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              Pull Latest from Cloud
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePushAllToCloud}
              disabled={isSyncing}
              className="text-xs gap-1.5"
            >
              <Cloud className="h-3.5 w-3.5" />
              Broadcast All Local Data to Cloud
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile Settings */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-indigo-500" />
            Personal Profile
          </CardTitle>
          <CardDescription className="text-xs">
            Your identity visible to your study partner
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-indigo-500/20">
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback className="text-base font-bold">
                  {getInitials(fullName || "User")}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">Profile Avatar</p>
                <p className="text-[11px] text-muted-foreground">
                  Logged in as <strong className="text-foreground">{profile?.full_name}</strong>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullname">Full Name</Label>
                <Input
                  id="fullname"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio &amp; Career Aspirations</Label>
              <Textarea
                id="bio"
                placeholder="e.g. Aspiring VLSI Verification Engineer | Aiming for AIR < 100 in GATE ECE"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" variant="gradient" disabled={saving} className="gap-2">
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Shared Workspace Status */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-purple-500" />
            Private Duo Workspace
          </CardTitle>
          <CardDescription className="text-xs">
            Exclusively restricted to Aadhavan and Narmatha
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Workspace ID</p>
              <p className="font-mono text-sm mt-0.5">
                {profile?.workspace_id || "duomate-shared-workspace"}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={copyWorkspaceId} className="gap-1.5">
              <Copy className="h-3.5 w-3.5" />
              Copy
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-card border border-border/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(profile?.full_name ?? "U1")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-xs">{profile?.full_name} (You)</p>
                  <p className="text-[10px] text-muted-foreground">{profile?.email}</p>
                </div>
              </div>
              <Badge variant="success" className="text-[10px]">
                Equal Partner
              </Badge>
            </div>

            <div className="p-3 rounded-xl bg-card border border-border/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={partnerProfile?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(partnerProfile?.full_name ?? "Partner")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-xs">
                    {partnerProfile?.full_name ?? "Narmatha"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {partnerProfile?.email ?? "Partner account"}
                  </p>
                </div>
              </div>
              <Badge variant="purple" className="text-[10px]">
                Equal Partner
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supabase Cloud Database */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-500" />
              Supabase PostgreSQL Database (Optional Cloud Backend)
            </CardTitle>
            <Badge variant={isSupabaseLive ? "success" : "secondary"}>
              {isSupabaseLive ? "Live Connected" : "Not Configured"}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Permanent cloud database with PostgreSQL tables and Row Level Security.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSaveSupabaseConfig} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Supabase Project URL</Label>
              <Input
                type="text"
                placeholder="https://xyzproject.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Supabase Anon Key</Label>
              <Input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <p className="text-[11px] text-muted-foreground">
                Leave empty to use the zero-config Multi-Device Cloud Sync Relay.
              </p>
              <Button type="submit" variant="gradient" size="sm" className="text-xs">
                Save &amp; Connect
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* App Preferences */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="h-4 w-4 text-indigo-500" />
            Display &amp; Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium">Dark Mode Appearance</p>
              <p className="text-xs text-muted-foreground">
                High contrast dark navy theme optimized for late-night study
              </p>
            </div>
            <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
          </div>

          <div className="flex items-center justify-between py-1 border-t border-border/50">
            <div>
              <p className="text-sm font-medium">Task Assignment Notifications</p>
              <p className="text-xs text-muted-foreground">
                Notify when your partner assigns or approves deliverables
              </p>
            </div>
            <Switch checked={taskAlerts} onCheckedChange={setTaskAlerts} />
          </div>

          <div className="flex items-center justify-between py-1 border-t border-border/50">
            <div>
              <p className="text-sm font-medium">Study Together Alerts</p>
              <p className="text-xs text-muted-foreground">
                Show live prompt when partner starts a deep work timer
              </p>
            </div>
            <Switch checked={studyAlerts} onCheckedChange={setStudyAlerts} />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Session &amp; Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Clear All Local Data</p>
              <p className="text-xs text-muted-foreground">
                Clears saved tasks, checklists, study history and chat from this browser
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm("Reset all local tasks, checklists, and chat data to start fresh?")) {
                  localStorage.removeItem("duomate_tasks");
                  localStorage.removeItem("duomate_study_sessions");
                  localStorage.removeItem("duomate_chat_messages");
                  localStorage.removeItem("duomate_checklist_aadhavan");
                  localStorage.removeItem("duomate_checklist_narmatha");
                  localStorage.removeItem("duomate_roadmap_gate_aadhavan");
                  localStorage.removeItem("duomate_roadmap_gate_narmatha");
                  localStorage.removeItem("duomate_roadmap_vlsi_aadhavan");
                  localStorage.removeItem("duomate_roadmap_vlsi_narmatha");
                  localStorage.removeItem("duomate_shared_notepad");
                  localStorage.removeItem("duomate_shared_notepad_meta");
                  localStorage.removeItem("duomate_shared_notes_list");
                  localStorage.removeItem("duomate_calendar_events");
                  toast.success("All local data reset to clean slate!");
                  setTimeout(() => window.location.reload(), 500);
                }
              }}
              className="text-xs border-destructive/40 text-destructive hover:bg-destructive/10"
            >
              Reset Data
            </Button>
          </div>

          <div className="border-t border-border/50 pt-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Sign Out of DuoMate</p>
              <p className="text-xs text-muted-foreground">
                Your status will be set to offline and session ended
              </p>
            </div>
            <Button variant="destructive" size="sm" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
