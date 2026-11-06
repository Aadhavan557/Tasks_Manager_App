import React, { createContext, useContext, useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase, isValidSupabaseConfig } from "@/lib/supabase";
import type { Profile } from "@/types/database";

const AADHAVAN_PROFILE: Profile = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "aadhavan@duomate.dev",
  full_name: "Aadhavan",
  username: "aadhavan",
  avatar_url: null,
  bio: "VLSI Architecture & AI Hardware Accelerators | GATE ECE Aspirant",
  is_online: true,
  last_active: new Date().toISOString(),
  workspace_id: "duomate-shared-workspace",
  theme: "dark",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const NARMATHA_PROFILE: Profile = {
  id: "00000000-0000-0000-0000-000000000002",
  email: "narmatha@duomate.dev",
  full_name: "Narmatha",
  username: "narmatha",
  avatar_url: null,
  bio: "Digital Electronics, Verilog HDL & Semiconductor Systems | GATE ECE Aspirant",
  is_online: true,
  last_active: new Date().toISOString(),
  workspace_id: "duomate-shared-workspace",
  theme: "dark",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  partnerProfile: Profile | null;
  loading: boolean;
  isDemoMode: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  loginAsDemo: (person: "aadhavan" | "narmatha") => void;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    username: string
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isSupabaseLive = isValidSupabaseConfig();

  // Initialize strictly from active user storage; if not set, user is NULL (show Login Page!)
  const [user, setUser] = useState<User | null>(() => {
    if (!isSupabaseLive) {
      const active = typeof window !== "undefined" ? localStorage.getItem("duomate_active_user") : null;
      if (active === "aadhavan") return { id: AADHAVAN_PROFILE.id, email: AADHAVAN_PROFILE.email } as User;
      if (active === "narmatha") return { id: NARMATHA_PROFILE.id, email: NARMATHA_PROFILE.email } as User;
      return null;
    }
    return null;
  });

  const [session, setSession] = useState<Session | null>(null);

  const [profile, setProfile] = useState<Profile | null>(() => {
    if (!isSupabaseLive) {
      const active = typeof window !== "undefined" ? localStorage.getItem("duomate_active_user") : null;
      if (active === "aadhavan") return AADHAVAN_PROFILE;
      if (active === "narmatha") return NARMATHA_PROFILE;
      return null;
    }
    return null;
  });

  const [partnerProfile, setPartnerProfile] = useState<Profile | null>(() => {
    if (!isSupabaseLive) {
      const active = typeof window !== "undefined" ? localStorage.getItem("duomate_active_user") : null;
      if (active === "aadhavan") return NARMATHA_PROFILE;
      if (active === "narmatha") return AADHAVAN_PROFILE;
      return null;
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(() => isSupabaseLive);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => !isSupabaseLive);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data);

      if (data?.workspace_id) {
        const { data: partnerData } = await supabase
          .from("profiles")
          .select("*")
          .eq("workspace_id", data.workspace_id)
          .neq("id", userId)
          .limit(1)
          .maybeSingle();

        if (partnerData) {
          setPartnerProfile(partnerData);
        }
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  useEffect(() => {
    if (!isSupabaseLive) {
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setPartnerProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isSupabaseLive]);

  const loginAsDemo = (person: "aadhavan" | "narmatha") => {
    localStorage.setItem("duomate_active_user", person);
    setIsDemoMode(true);
    if (person === "aadhavan") {
      setProfile(AADHAVAN_PROFILE);
      setPartnerProfile(NARMATHA_PROFILE);
      setUser({ id: AADHAVAN_PROFILE.id, email: AADHAVAN_PROFILE.email } as User);
    } else {
      setProfile(NARMATHA_PROFILE);
      setPartnerProfile(AADHAVAN_PROFILE);
      setUser({ id: NARMATHA_PROFILE.id, email: NARMATHA_PROFILE.email } as User);
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseLive) {
      const lower = email.toLowerCase().trim();
      if (lower.includes("narmatha") || lower === "narmatha") {
        loginAsDemo("narmatha");
        return { error: null };
      }
      if (lower.includes("aadhavan") || lower === "aadhavan") {
        loginAsDemo("aadhavan");
        return { error: null };
      }
      // If entered standard email or name
      loginAsDemo("aadhavan");
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!error) {
        localStorage.removeItem("duomate_active_user");
        setIsDemoMode(false);
      }
      return { error: error as Error | null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    username: string
  ) => {
    if (!isSupabaseLive) {
      const newProf: Profile = {
        id: "user-" + Date.now(),
        email,
        full_name: fullName,
        username,
        avatar_url: null,
        bio: null,
        is_online: true,
        last_active: new Date().toISOString(),
        theme: "dark",
        workspace_id: "duomate-shared-workspace",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProfile(newProf);
      setUser({ id: newProf.id, email } as User);
      setIsDemoMode(true);
      return { error: null };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, username },
        },
      });

      if (error) return { error: error as Error };

      if (data.user) {
        await supabase.from("profiles").insert({
          id: data.user.id,
          email,
          full_name: fullName,
          username,
          is_online: true,
          last_active: new Date().toISOString(),
          theme: "dark",
          workspace_id: "duomate-shared-workspace",
        });
      }

      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signOut = async () => {
    localStorage.removeItem("duomate_active_user");
    localStorage.removeItem("duomate_demo_user");
    setIsDemoMode(false);
    if (isSupabaseLive && user) {
      try {
        await supabase
          .from("profiles")
          .update({ is_online: false })
          .eq("id", user.id);
        await supabase.auth.signOut();
      } catch {}
    }
    setUser(null);
    setProfile(null);
    setPartnerProfile(null);
  };

  const refreshProfile = async () => {
    if (user && isSupabaseLive) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        partnerProfile,
        loading,
        isDemoMode,
        signIn,
        loginAsDemo,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
