import type { AstroCookies } from "astro";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import type { Database } from "../db/database.types.ts";

export const cookieOptions: CookieOptionsWithName = {
  name: "sb-auth-token", // Nazwa ciasteczka może być dostosowana, ale 'sb-auth-token' jest często używane i zgodne z przykładami Supabase.
  path: "/",
  secure: true, // W produkcji zawsze true. Dla dewelopmentu na localhost bez HTTPS może być false.
  httpOnly: true,
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 7, // 1 tydzień, można dostosować
};

function parseCookieHeader(cookieHeader: string | null | undefined): { name: string; value: string }[] {
  if (!cookieHeader) {
    return [];
  }
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

export const createSupabaseServerInstance = (context: { headers: Headers; cookies: AstroCookies }) => {
  // Używamy PUBLIC_ zmiennych które są dostępne w Cloudflare
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL;
  const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables:', {
      url: !!supabaseUrl,
      key: !!supabaseKey,
      available: Object.keys(import.meta.env).filter(key => key.includes('SUPABASE'))
    });
    throw new Error('Missing required Supabase environment variables');
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookieOptions,
    cookies: {
      getAll() {
        // Astro.cookies.getAll() zwraca obiekt { name: string, value: string, ...options }[]
        // createServerClient oczekuje { name: string, value: string }[]
        // Musimy dostosować to, jeśli Astro.cookies.getAll() jest używane bezpośrednio
        // lub parsować nagłówek 'Cookie' jak w przykładzie z supabase-auth.mdc
        return parseCookieHeader(context.headers.get("Cookie"));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  return supabase;
};

// Export typu dla klienta serwerowego, jeśli potrzebne gdzie indziej
export type SupabaseServerClient = ReturnType<typeof createSupabaseServerInstance>;

// Default User ID for development/testing fallback as per API plan
export const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000000";
