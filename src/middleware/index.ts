import { defineMiddleware } from 'astro:middleware';
import { supabaseClient } from '../db/supabase.client';
import type { User } from '@supabase/supabase-js';

const PROTECTED_ROUTES = ["/dashboard"]; // Definicja chronionych ścieżek
const LOGIN_ROUTE = "/login"; // Definicja ścieżki logowania

// --- START: Temporary Test User Bypass ---
const TEST_USER_EMAIL = 'test_default@example.com';
const TEST_USER_ID = '1509b58d-58e9-4e18-b3c3-878d2a1004c0';
// --- END: Temporary Test User Bypass ---

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.supabase = supabaseClient;

  // --- START: Temporary Test User Bypass Logic ---
  const url = new URL(context.request.url);
  if (url.searchParams.get('test_user_bypass') === 'true') {
    console.log('ACTIVATING TEST USER BYPASS');
    context.locals.user = {
      id: TEST_USER_ID,
      app_metadata: { provider: 'email', providers: [ 'email' ] },
      user_metadata: { email: TEST_USER_EMAIL }, // Przykładowe user_metadata
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      // Możesz dodać więcej pól, jeśli są potrzebne dla Twojego Astro.locals.user
      // Ważne, aby struktura była zbliżona do tego, co Supabase zwraca
      // np. email, jeśli go używasz w dashboard.astro
      email: TEST_USER_EMAIL 
    } as User;
    // Jeśli użytkownik jest zalogowany (nawet przez bypass) i próbuje przejść na /login lub /register, przekieruj na /dashboard
    if (context.url.pathname === LOGIN_ROUTE || context.url.pathname === "/register") {
      return context.redirect("/dashboard", 307);
    }
    return next(); // Przejdź dalej, pomijając standardową logikę autentykacji poniżej dla tego przypadku
  }
  // --- END: Temporary Test User Bypass Logic ---

  const accessToken = context.cookies.get('sb-access-token')?.value;
  const refreshToken = context.cookies.get('sb-refresh-token')?.value;

  let user: User | null = null;

  if (accessToken && refreshToken) {
    const { data, error } = await context.locals.supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      // W przypadku błędu odświeżania sesji, np. token wygasł, usuwamy ciasteczka
      context.cookies.delete("sb-access-token", { path: "/" });
      context.cookies.delete("sb-refresh-token", { path: "/" });
      console.error("Error refreshing session:", error.message);
    } else if (data.user) {
      user = data.user;
    }
  } else if (accessToken) {
    // Fallback, jeśli jest tylko access token (chociaż setSession jest preferowane)
    const { data } = await context.locals.supabase.auth.getUser(accessToken);
    if (data.user) {
      user = data.user;
    }
  }

  context.locals.user = user;

  // Ochrona ścieżek
  const currentPath = context.url.pathname;
  if (PROTECTED_ROUTES.includes(currentPath) && !user) {
    return context.redirect(LOGIN_ROUTE, 307); // Przekierowanie na stronę logowania
  }

  // Jeśli użytkownik jest zalogowany i próbuje przejść na /login lub /register, przekieruj na /dashboard
  if (user && (currentPath === LOGIN_ROUTE || currentPath === "/register")) {
    return context.redirect("/dashboard", 307);
  }

  return next();
}); 