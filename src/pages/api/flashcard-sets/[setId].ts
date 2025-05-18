import type { APIRoute } from "astro";
import { UpdateFlashcardSetBodySchema, FlashcardSetParamsSchema } from "../../../lib/schemas/flashcardSetSchemas";
import { flashcardSetService } from "../../../lib/services/flashcardSetService";
import type { FlashcardSetDto } from "../../../types";
import { DEFAULT_USER_ID, type SupabaseClient } from "../../../db/supabase.client";

export const prerender = false;

export const PUT: APIRoute = async ({ params, request, locals }) => {
  const supabase = locals.supabase as SupabaseClient;
  if (!supabase) {
    console.error("Supabase client not found in locals");
    return new Response(JSON.stringify({ message: "Wewnętrzny błąd serwera: Klient Supabase niedostępny." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = locals.user?.id || DEFAULT_USER_ID;
  if (!userId) {
    console.error("User ID not found and DEFAULT_USER_ID is also missing.");
    return new Response(JSON.stringify({ message: "Brak autoryzacji: Nie udało się zidentyfikować użytkownika." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const paramsValidation = FlashcardSetParamsSchema.safeParse(params);
  if (!paramsValidation.success) {
    return new Response(
      JSON.stringify({
        message: "Błąd walidacji parametrów ścieżki.",
        errors: paramsValidation.error.flatten().fieldErrors,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  const setId = paramsValidation.data.setId;

  let requestBody;
  try {
    requestBody = await request.json();
  } catch (error) {
    return new Response(JSON.stringify({ message: "Nieprawidłowy format JSON w ciele żądania." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const bodyValidation = UpdateFlashcardSetBodySchema.safeParse(requestBody);
  if (!bodyValidation.success) {
    return new Response(
      JSON.stringify({ message: "Błąd walidacji ciała żądania.", errors: bodyValidation.error.flatten().fieldErrors }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  const { name, last_studied_at } = bodyValidation.data;

  try {
    const updatedFlashcardSet = await flashcardSetService.updateFlashcardSet(supabase, setId, userId, { name, last_studied_at });

    if (!updatedFlashcardSet) {
      return new Response(JSON.stringify({ message: "Nie znaleziono zestawu fiszek." }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(updatedFlashcardSet), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in PUT /api/flashcard-sets/{setId}:", error);
    if (error.message === "DUPLICATE_SET_NAME") {
      return new Response(JSON.stringify({ message: "Zestaw o tej nazwie już istnieje dla tego użytkownika." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ message: "Wewnętrzny błąd serwera." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
