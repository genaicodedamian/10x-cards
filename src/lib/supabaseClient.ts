import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../db/database.types";

let supabaseInstance: SupabaseClient<Database> | null = null;

function getSupabaseClient(): SupabaseClient<Database> | null {
  if (import.meta.env.SSR) {
    return null;
  }

  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "CLIENT-SIDE ERROR: Missing import.meta.env.PUBLIC_SUPABASE_URL. Ensure it is set in .env and the server was restarted."
    );
  }
  if (!supabaseAnonKey) {
    throw new Error(
      "CLIENT-SIDE ERROR: Missing import.meta.env.PUBLIC_SUPABASE_ANON_KEY. Ensure it is set in .env and the server was restarted."
    );
  }

  supabaseInstance = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
}

let supabaseExport: SupabaseClient<Database> | null;
if (import.meta.env.SSR) {
  supabaseExport = null;
} else {
  supabaseExport = getSupabaseClient();
}

export const supabase = supabaseExport;

export function ensureSupabaseClient(): SupabaseClient<Database> {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error(
      "Supabase client could not be initialized. Ensure you are running in a browser environment or PUBLIC_ env vars are set for client-side access."
    );
  }
  return client;
}
