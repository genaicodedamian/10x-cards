export const prerender = false;

import type { APIContext } from "astro";
import { z } from "zod";
// import type { FlashcardDto } from "@/types"; // Removed unused import
import { supabaseClient, DEFAULT_USER_ID } from "@/db/supabase.client"; // Using direct import and DEFAULT_USER_ID as requested
import { flashcardService } from "@/lib/services/flashcardService"; // Import the service with correct casing

// Zod schema for flashcardId validation (as per plan step 4)
const FlashcardIdSchema = z.string().uuid({ message: "Invalid flashcard ID format. Must be a valid UUID." });

export async function GET({ params }: APIContext) {
  // Step 3: Pobierz flashcardId z params (częściowo)
  // Step 3: Pobierz klienta Supabase (supabaseClient) i dane użytkownika (DEFAULT_USER_ID) (częściowo)
  const { flashcardId: rawFlashcardId } = params;

  // Step 4: Walidacja flashcardId
  const flashcardIdValidation = FlashcardIdSchema.safeParse(rawFlashcardId);

  if (!flashcardIdValidation.success) {
    return new Response(
      JSON.stringify({
        message: "Validation failed.",
        errors: { flashcardId: flashcardIdValidation.error.issues[0].message },
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const flashcardId = flashcardIdValidation.data;
  const userId = DEFAULT_USER_ID; // Using DEFAULT_USER_ID as requested

  try {
    // Step 7: Wywołanie serwisu z API route
    const flashcard = await flashcardService.getFlashcardById(supabaseClient, flashcardId, userId);

    if (!flashcard) {
      return new Response(JSON.stringify({ error: "Flashcard not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return 200 OK with flashcard data
    return new Response(JSON.stringify(flashcard), { status: 200, headers: { "Content-Type": "application/json" } });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // console.error(`API Error: Failed to get flashcard ${flashcardId} for user ${userId}:`, error); // Removed to comply with no-console rule

    // Handle generic errors from the service or other unexpected errors
    // The service now throws a generic Error for database issues.
    return new Response(
      // Consistent error message as per implementation plan for 500 errors
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
