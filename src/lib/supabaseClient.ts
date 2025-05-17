import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../db/database.types";

let supabaseInstance: SupabaseClient<Database> | null = null;

function getSupabaseClient(): SupabaseClient<Database> | null {
  if (import.meta.env.SSR) {
    // Return a mock or null client during SSR if direct access to PUBLIC_ env vars is problematic
    // Or, if you have server-side Supabase client for SSR, use that here.
    // For now, returning null as this client is primarily for browser-side auth forms.
    console.warn("Supabase client (browser) accessed during SSR. Returning null client.");
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

// Export a getter function or an instance that will be initialized on first client-side access.
// For simplicity, we can export the result of the getter immediately.
// However, React components might import this at the module level.
// A getter function ensures initialization on first *use*.

// Option 1: Export the client directly, hoping module evaluation is deferred enough by client: directives.
// This is what we had, and it failed for some components.
// export const supabase = getSupabaseClient();

// Option 2: Export a getter. Components would call supabase().
// export const getSupabase = () => getSupabaseClient();

// Option 3: Create a proxy or a lazily initialized export.
// For now, let's try to export an instance that might be null during SSR but should be populated on client.
let supabaseExport: SupabaseClient<Database> | null;
if (import.meta.env.SSR) {
  // During SSR, make it clear this is not the fully functional client if accessed directly.
  // Components should ideally call a getter or handle null.
  supabaseExport = null;
} else {
  // On the client, initialize immediately.
  supabaseExport = getSupabaseClient();
}

export const supabase = supabaseExport;

// A helper for components to ensure they get a client instance, especially if they might run early.
export function ensureSupabaseClient(): SupabaseClient<Database> {
  const client = getSupabaseClient();
  if (!client) {
    // This case should ideally not be hit if components correctly run client-side
    // or if SSR access to this specific client is avoided/mocked.
    throw new Error(
      "Supabase client could not be initialized. Ensure you are running in a browser environment or PUBLIC_ env vars are set for client-side access."
    );
  }
  return client;
}
