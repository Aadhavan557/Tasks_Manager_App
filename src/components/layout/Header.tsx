import { useState } from "react";
import { Link } from "react-router-dom";
import { Sun, Moon, LogOut, Menu, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getGreeting, getInitials } from "@/lib/utils";
import { format } from "date-fns";

interface HeaderProps {
  onOpenMobileMenu?: () => void;
}

export function Header({ onOpenMobileMenu }: HeaderProps) {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);

  if (!profile) return null;

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-4 md:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-8 w-8 text-muted-foreground"
          onClick={onOpenMobileMenu}
        >
          <Menu className="h-4 w-4" />
        </Button>

        {/* Greeting */}
        <div>
          <h2 className="text-sm font-bold leading-tight">
            {getGreeting(profile.full_name)}
          </h2>
          <p className="text-[10px] text-muted-foreground">
            {format(new Date(), "EEEE, MMM d, yyyy")}
          </p>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-8 w-8 rounded-lg"
          title="Toggle Dark / Light Theme"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* User avatar & menu */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg p-0.5 hover:bg-accent transition-colors"
          >
            <Avatar className="h-8 w-8 ring-1 ring-border">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="text-[10px] font-bold">
                {getInitials(profile.full_name)}
              </AvatarFallback>
            </Avatar>
          </button>

          {showDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border bg-popover shadow-xl z-50 py-1">
                <div className="px-3 py-2 border-b border-border/50">
                  <p className="text-xs font-bold">{profile.full_name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{profile.email}</p>
                </div>

                <Link
                  to="/settings"
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-accent transition-colors"
                >
                  <User className="h-3.5 w-3.5" />
                  Settings
                </Link>

                <div className="border-t border-border/50 my-1" />

                <button
                  onClick={() => {
                    setShowDropdown(false);
                    signOut();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
