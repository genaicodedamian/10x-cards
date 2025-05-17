import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type { SupabaseClient } from "@/db/supabase.client";

// No need to import SupabaseClient from '@/db/supabase.client' for the admin client

/**
 * Deletes a user account and all associated data using Supabase admin privileges.
 *
 * @param userId - The ID of the user to delete.
 * @returns A promise that resolves when the user is successfully deleted.
 * @throws Will throw an error if Supabase URL or Service Role Key are not configured,
 *         or if the Supabase admin API returns an error.
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("Supabase URL or Service Role Key is not configured.");
    throw new Error("Server configuration error: Supabase credentials missing.");
  }

  // Create a new Supabase client with admin privileges, typed with the Database schema
  const supabaseAdmin: SupabaseClient = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId, true); // true for hard delete

  if (error) {
    console.error(`Error deleting user ${userId}:`, error);
    // It's better to throw the original Supabase error or a custom error that wraps it
    // for more specific error handling upstream if needed.
    throw error; // Throwing the original error object
  }

  console.log(`User ${userId} deleted successfully.`);
}
