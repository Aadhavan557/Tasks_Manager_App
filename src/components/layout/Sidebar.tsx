import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CheckSquare,
  ListTodo,
  Timer,
  MessageCircle,
  FileText,
  CalendarDays,
  Map,
  Settings,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/components/common/AppLogo";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/" },
  { icon: CheckSquare, label: "Tasks", to: "/tasks" },
  { icon: ListTodo, label: "Daily Checklist", to: "/checklist" },
  { icon: Timer, label: "Study Timer", to: "/timer" },
  { icon: MessageCircle, label: "Chat", to: "/chat" },
  { icon: FileText, label: "Shared Notes", to: "/notes" },
  { icon: CalendarDays, label: "Calendar & Exams", to: "/calendar" },
  { icon: Map, label: "Roadmap & GATE", to: "/roadmap" },
  { icon: Settings, label: "Settings", to: "/settings" },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const { profile, partnerProfile } = useAuth();
  const location = useLocation();

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 h-screen w-60 flex flex-col border-r border-border bg-card z-50 transition-transform duration-200 lg:translate-x-0 shadow-lg",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Simple Brand Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <AppLogo size="sm" />
            <div>
              <h1 className="font-bold text-sm leading-tight gradient-text">DuoMate</h1>
              <p className="text-[10px] text-muted-foreground">Aadhavan &amp; Narmatha</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-7 w-7 text-muted-foreground"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Clean Nav List */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.to === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => {
                  if (onClose) onClose();
                }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                  isActive
                    ? "bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <item.icon
                  className={cn(
                    "h-4 w-4 flex-shrink-0",
                    isActive ? "text-indigo-500 dark:text-indigo-400" : ""
                  )}
                />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Partner Switcher & Current User Footer */}
        <div className="p-3 border-t border-border space-y-2">
          {profile && (
            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-muted/40 border border-border/50">
              <Avatar className="h-8 w-8 ring-1 ring-border">
                <AvatarImage src={profile.avatar_url ?? undefined} />
                <AvatarFallback className="text-[11px] font-bold">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate leading-none">
                  {profile.full_name}
                </p>
                <p className="text-[10px] text-muted-foreground truncate mt-1">
                  Partner: {partnerProfile?.full_name ?? "Partner"}
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
