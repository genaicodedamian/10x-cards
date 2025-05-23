import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Użytkownik niezalogowany." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        has_seen_welcome_modal: true,
      },
    });

    if (updateError) {
      console.error("Supabase updateUser metadata error:", updateError.message);
      return new Response(
        JSON.stringify({ error: "Błąd podczas aktualizacji metadanych użytkownika." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("API markWelcomeSeen error:", e);
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