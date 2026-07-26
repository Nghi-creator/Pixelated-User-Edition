import { createClient } from "@supabase/supabase-js";

const configuredUrl = import.meta.env.VITE_SUPABASE_URL;
const configuredAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const SUPABASE_CONFIGURATION_ERROR =
  configuredUrl && configuredAnonKey ? null : "Missing Supabase environment variables";

// Keep public/local-only pages renderable when auth is not configured.
const supabaseUrl = configuredUrl || "http://127.0.0.1:54321";
const supabaseAnonKey = configuredAnonKey || "pixelated-auth-unavailable";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
