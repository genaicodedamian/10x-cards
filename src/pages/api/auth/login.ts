import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client"; // Upewnij się, że ścieżka jest poprawna

export const prerender = false; // Ważne dla endpointów API, które mają być dynamiczne

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Adres e-mail i hasło są wymagane." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Utwórz instancję Supabase używając kontekstu żądania (cookies, headers)
    const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Zgodnie z auth-spec.md, zwracamy ogólny błąd dla bezpieczeństwa
      // Ale logujemy szczegółowy błąd po stronie serwera
      console.error("Supabase signInWithPassword error:", error.message);
      return new Response(
        JSON.stringify({ error: "Nieprawidłowy adres e-mail lub hasło." }), // Zgodnie z US-002
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Sukces
    return new Response(JSON.stringify({ user: data.user }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    // Obsługa błędów parsowania JSON lub innych nieoczekiwanych błędów
    console.error("API login error:", e);
    let errorMessage = "Wystąpił błąd serwera.";
    if (e instanceof Error) {
      errorMessage = e.message;
    }
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
