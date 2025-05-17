/// <reference types="astro/client" />

import type { SupabaseServerClient } from './db/supabase.client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
// import type { Database } from './db/database.types.ts'; // This might not be directly needed in Locals if client is typed

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseServerClient;
      user: SupabaseUser | null;
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
