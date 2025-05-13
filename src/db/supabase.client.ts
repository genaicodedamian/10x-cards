import { createClient } from '@supabase/supabase-js';

import type { Database } from '../db/database.types.ts';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Default User ID for development/testing when auth is not fully implemented
export const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000'; // Replace with a valid UUID if needed for FK constraints 