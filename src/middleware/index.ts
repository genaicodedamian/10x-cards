import { createSupabaseServerInstance } from "../db/supabase.client";
import { defineMiddleware } from "astro:middleware";

// Ścieżki publiczne, które nie wymagają autentykacji
// Zgodnie z supabase-auth.mdc, ale dostosowane do naszej struktury (np. /login zamiast /auth/login)
const PUBLIC_PATHS = [
  "/login",
  "/register", // Dodajemy, jeśli mamy stronę rejestracji
  "/forgot-password", // Dodajemy, jeśli mamy stronę odzyskiwania hasła
  "/reset-password", // Dodajemy, jeśli mamy stronę resetowania hasła
  // API endpoints (jeśli jakieś są publiczne)
  "/api/auth/login",
  "/api/auth/register",
  // Można dodać inne publiczne API, np. /api/health
];

// Ścieżki, które są tylko dla niezalogowanych użytkowników (np. formularz logowania)
// Jeśli zalogowany użytkownik spróbuje tu wejść, zostanie przekierowany na dashboard
const AUTH_FLOW_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

// Ścieżki chronione, wymagające zalogowania
const PROTECTED_PATHS = [
  "/dashboard",
  "/generate-ai",
  "/create-manual",
  "/my-flashcards",
  "/study-session", // Catches all /study-session/* routes
];

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Inicjalizacja klienta Supabase dla każdego żądania
  const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });
  locals.supabase = supabase; // Udostępnienie klienta Supabase w Astro.locals

  // Zawsze pobieraj sesję użytkownika jako pierwszy krok
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    locals.user = user; // Przypisujemy cały obiekt użytkownika Supabase
  } else {
    locals.user = null;
  }

  const currentPath = url.pathname;

  // 1. Przekierowanie z / na /dashboard (jeśli zalogowany) lub /login (jeśli niezalogowany)
  if (currentPath === "/") {
    if (locals.user) {
      return redirect("/dashboard", 307);
    }
    // Jeśli niezalogowany, pozwalamy Astro obsłużyć stronę główną (np. landing page)
    // lub przekierowujemy na /login, jeśli strona główna jest tylko dla zalogowanych
    // Zgodnie z PRD US-000, strona główna jest publiczna i ma przyciski logowania/rejestracji.
    // Więc nie przekierowujemy stąd na /login, chyba że to jest zamierzone.
    // Na razie zostawiam tak, że / przekierowuje na dashboard jeśli zalogowany.
    // Jeśli ma być publiczny landing page, tę logikę trzeba dostosować.
  }

  // 2. Jeśli użytkownik jest zalogowany i próbuje uzyskać dostęp do ścieżek przepływu autentykacji (np. /login)
  if (locals.user && AUTH_FLOW_PATHS.includes(currentPath)) {
    return redirect("/dashboard", 307);
  }

  // 3. Jeśli użytkownik NIE jest zalogowany i próbuje uzyskać dostęp do chronionej ścieżki
  //    (która nie jest jednocześnie ścieżką publiczną - to ważne np. dla API)
  if (
    !locals.user &&
    PROTECTED_PATHS.some((path) => currentPath.startsWith(path)) &&
    !PUBLIC_PATHS.includes(currentPath)
  ) {
    return redirect("/login", 307);
  }

  // Kontynuuj do następnego middleware lub strony
  return next();
});
