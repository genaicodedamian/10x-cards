export const prerender = false;

import type { APIContext } from "astro";
import { z } from "zod";
import { DEFAULT_USER_ID } from "@/db/supabase.client";
import { FlashcardIdPathParamsSchema, RegenerateFlashcardCommandSchema } from "@/lib/schemas/flashcardSchemas";
// Import for RegenerateFlashcardCommand type, though it's just {} it's good for clarity
import type { RegenerateFlashcardCommand } from "@/types";
import {
  flashcardService,
  FlashcardNotFoundError,
  FlashcardNotAIGeneratedError,
  FlashcardRegenerationFailedError,
} from "@/lib/services/flashcardService";
import { MockLLMError } from "@/lib/services/aiMockService";

// Placeholder for the actual AI regeneration logic
async function regenerateFlashcardContent(front: string, back: string): Promise<{ front: string; back: string }> {
  // TODO: Implement actual call to an AI service (e.g., OpenRouter)
  // For now, just prepending "Regenerated: " to simulate change
  console.warn("AI regeneration logic is not implemented. Using placeholder.");
  return {
    front: `Regenerated: ${front}`,
    back: `Regenerated: ${back}`,
  };
}

export async function POST(context: APIContext): Promise<Response> {
  const { supabase, user } = context.locals;

  if (!user) {
    return new Response(JSON.stringify({ error: "User not authenticated" }), { status: 401 });
  }

  const paramsValidation = FlashcardIdPathParamsSchema.safeParse(context.params);
  if (!paramsValidation.success) {
    return new Response(JSON.stringify({ error: "Invalid flashcard ID format", details: paramsValidation.error.flatten() }), {
      status: 400,
    });
  }
  const { flashcardId } = paramsValidation.data;

  let requestBody;
  try {
    requestBody = await context.request.json();
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 });
  }

  const bodyValidation = RegenerateFlashcardCommandSchema.safeParse(requestBody);
  if (!bodyValidation.success) {
    return new Response(JSON.stringify({ error: "Invalid request body", details: bodyValidation.error.flatten() }), {
      status: 400,
    });
  }
  // const {} = bodyValidation.data; // No specific data expected in RegenerateFlashcardCommandSchema yet

  try {
    // 1. Fetch the existing flashcard
    const { data: existingFlashcard, error: fetchError } = await supabase
      .from("flashcards")
      .select("front, back, user_id")
      .eq("id", flashcardId)
      .single();

    if (fetchError) {
      console.error("Error fetching flashcard for regeneration:", fetchError);
      return new Response(JSON.stringify({ error: "Failed to fetch flashcard", details: fetchError.message }), {
        status: 500,
      });
    }

    if (!existingFlashcard) {
      return new Response(JSON.stringify({ error: "Flashcard not found" }), { status: 404 });
    }

    // Authorization: Check if the current user owns the flashcard
    if (existingFlashcard.user_id !== user.id && user.id !== DEFAULT_USER_ID) {
      // Allow DEFAULT_USER_ID for testing/admin purposes
      return new Response(JSON.stringify({ error: "User not authorized to regenerate this flashcard" }), { status: 403 });
    }

    // 2. Regenerate content (placeholder logic for now)
    const { front: newFront, back: newBack } = await regenerateFlashcardContent(
      existingFlashcard.front,
      existingFlashcard.back
    );

    // 3. Update the flashcard with new content and mark as ai_generated_modified
    const { data: updatedFlashcard, error: updateError } = await supabase
      .from("flashcards")
      .update({
        front: newFront,
        back: newBack,
        source: "ai_generated_modified", // As per FlashcardSource
        // last_reviewed, interval, ease_factor, repetitions might be reset or handled based on SRS logic
      })
      .eq("id", flashcardId)
      .select("id, front, back, source")
      .single();

    if (updateError) {
      console.error("Error updating flashcard after regeneration:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update flashcard", details: updateError.message }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify(updatedFlashcard), { status: 200 });
  } catch (error) {
    console.error("Unexpected error during flashcard regeneration:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), { status: 500 });
  }
}
