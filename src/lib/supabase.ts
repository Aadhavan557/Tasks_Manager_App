import { createClient } from "@supabase/supabase-js";

const rawUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
const rawKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isValidSupabaseConfig = (): boolean => {
  if (!rawUrl || !rawKey) return false;
  if (
    rawUrl === "your_supabase_project_url" ||
    rawUrl.includes("placeholder") ||
    rawKey === "your_supabase_anon_key"
  ) {
    return false;
  }
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const validUrl = isValidSupabaseConfig()
  ? rawUrl!
  : "https://duomate-standby.supabase.co";

const validKey = isValidSupabaseConfig()
  ? rawKey!
  : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy-standby-key";

if (!isValidSupabaseConfig()) {
  console.info(
    "ℹ️ DuoMate running in Standby Mode with Instant Partner Switcher active. Add live credentials to .env.local when ready."
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
