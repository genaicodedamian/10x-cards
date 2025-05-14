import { createClient } from '@supabase/supabase-js';

import type { Database } from '../db/database.types.ts';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Export the type of the specific client instance
export type SupabaseClient = typeof supabaseClient;

// Default User ID for development/testing when auth is not fully implemented
export const DEFAULT_USER_ID = '1509b58d-58e9-4e18-b3c3-878d2a1004c0'; // Replace with a valid UUID if needed for FK constraints 