import { createClient } from "@supabase/supabase-js";


const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;


if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
console.warn(
"⚠️ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. App will fall back to local-only mode where implemented."
);
}


export const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
export const supabase = hasSupabase
? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } })
: null;