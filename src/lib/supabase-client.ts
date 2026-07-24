import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase environment variables are missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable live data.");
} else {
  // Cookie-based session storage (via @supabase/ssr) so the middleware in
  // src/proxy.ts can verify admin sessions server-side. localStorage sessions
  // are invisible to the server and would leave /admin guarded client-side only.
  client = createBrowserClient(supabaseUrl, supabaseKey);
}

export const supabase = client;
