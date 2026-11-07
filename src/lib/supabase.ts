import { createClient } from "@supabase/supabase-js";

function getActiveSupabaseUrl(): string | undefined {
  if (typeof window !== "undefined") {
    const custom = localStorage.getItem("duomate_supabase_url");
    if (custom && custom.trim()) return custom.trim();
  }
  return (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
}

function getActiveSupabaseKey(): string | undefined {
  if (typeof window !== "undefined") {
    const custom = localStorage.getItem("duomate_supabase_key");
    if (custom && custom.trim()) return custom.trim();
  }
  return (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined;
}

export const isValidSupabaseConfig = (): boolean => {
  const url = getActiveSupabaseUrl();
  const key = getActiveSupabaseKey();
  if (!url || !key) return false;
  if (
    url === "your_supabase_project_url" ||
    url.includes("placeholder") ||
    key === "your_supabase_anon_key"
  ) {
    return false;
  }
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const validUrl = isValidSupabaseConfig()
  ? getActiveSupabaseUrl()!
  : "https://duomate-standby.supabase.co";

const validKey = isValidSupabaseConfig()
  ? getActiveSupabaseKey()!
  : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy-standby-key";

if (!isValidSupabaseConfig()) {
  console.info(
    "ℹ️ DuoMate running with Instant Multi-Device Cloud Sync Relay active across all devices."
  );
}

export const supabase = createClient(validUrl, validKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
