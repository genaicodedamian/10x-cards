export const prerender = false;

import type { APIContext } from "astro";
import { z } from "zod";
import { DEFAULT_USER_ID, supabaseClient } from "@/db/supabase.client";
import {
  FlashcardIdPathParamsSchema,
  RegenerateFlashcardCommandSchema,
} from "@/lib/schemas/flashcardSchemas";
// Import for RegenerateFlashcardCommand type, though it's just {} it's good for clarity
import type { RegenerateFlashcardCommand } from "@/types";
import { flashcardService, FlashcardNotFoundError, FlashcardNotAIGeneratedError, FlashcardRegenerationFailedError } from "@/lib/services/flashcardService";
import { MockLLMError } from "@/lib/services/aiMockService";

export async function POST(context: APIContext): Promise<Response> {
  const { params, request } = context;

  // 1. Validate Path Parameter (flashcardId)
  const pathValidationResult = FlashcardIdPathParamsSchema.safeParse(params);
  if (!pathValidationResult.success) {
    return new Response(
      JSON.stringify({
        message: "Validation failed.",
        errors: pathValidationResult.error.flatten().fieldErrors,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  const { flashcardId } = pathValidationResult.data;

  // 2. Validate Request Body (should be empty or {})
  let requestBody: RegenerateFlashcardCommand;
  try {
    // Check if request has a body. If not, default to {} for validation.
    const contentType = request.headers.get("content-type");
    if (request.body && contentType && contentType.includes("application/json")) {
      requestBody = await request.json();
    } else {
      // If no body or not JSON, treat as empty for schema validation (which expects empty)
      requestBody = {};
    }
  } catch (e) {
    return new Response(
      JSON.stringify({ message: "Invalid JSON in request body." }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const bodyValidationResult = RegenerateFlashcardCommandSchema.safeParse(requestBody);
  if (!bodyValidationResult.success) {
    return new Response(
      JSON.stringify({
        message: "Validation failed.",
        errors: bodyValidationResult.error.flatten().fieldErrors,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const userId = DEFAULT_USER_ID; // As per requirement

  try {
    const regeneratedFlashcard = await flashcardService.regenerateAIFlashcard(
      supabaseClient, // As per requirement
      userId,
      flashcardId
    );

    return new Response(JSON.stringify(regeneratedFlashcard), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    if (error instanceof FlashcardNotFoundError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (error instanceof FlashcardNotAIGeneratedError) {
      return new Response(JSON.stringify({ error: error.message }), { // Message from error is descriptive enough
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (error instanceof FlashcardRegenerationFailedError) {
      if (error.underlyingError instanceof MockLLMError) {
        const llmError = error.underlyingError;
        if (llmError.statusCode === 429) {
          return new Response(
            JSON.stringify({ error: "Too many requests to the AI service. Please try again later." }),
            {
              status: 429,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
        if (llmError.statusCode === 503) {
          return new Response(
            JSON.stringify({ error: "AI service is temporarily unavailable. Please try again later." }),
            {
              status: 503,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
        // Default for other MockLLMError (like statusCode 500) or if statusCode is not set as expected
        return new Response(
          JSON.stringify({ error: "Internal Server Error. Failed to regenerate flashcard." }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      // For FlashcardRegenerationFailedError not caused by a known MockLLMError (e.g. DB update error after LLM success)
      return new Response(
        JSON.stringify({ error: "Internal Server Error. Failed to regenerate flashcard." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Fallback for any other unexpected errors
    console.error("Unexpected error in POST /api/flashcards/[flashcardId]/regenerate:", error);
    return new Response(
      JSON.stringify({ error: "An internal server error occurred." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
} 