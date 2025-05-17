import type { APIContext } from "astro";
import { BatchCreateFlashcardsCommandSchema, SetIdParamSchema } from "../../../../../lib/schemas/flashcardSchemas";
import type { BatchCreateFlashcardsCommand, BatchCreateFlashcardsResponseDto } from "../../../../../types";
import {
  flashcardService,
  FlashcardSetNotFoundError,
  FlashcardBatchCreationError,
} from "../../../../../lib/services/flashcardService";
import type { SupabaseServerClient as SupabaseClient } from "../../../../../db/supabase.client";
import { DEFAULT_USER_ID } from "../../../../../db/supabase.client";

export const prerender = false;

// const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000000"; // REMOVED LOCAL DEFINITION

export async function POST(context: APIContext): Promise<Response> {
  const { params, request, locals } = context;

  // 1. Validate setId path parameter
  const setIdValidation = SetIdParamSchema.safeParse({ setId: params.setId });
  if (!setIdValidation.success) {
    return new Response(
      JSON.stringify({
        message: "Validation failed.",
        errors: setIdValidation.error.flatten().fieldErrors,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  const setId = setIdValidation.data.setId;

  // 2. Validate request body
  let command: BatchCreateFlashcardsCommand;
  try {
    const body = await request.json();
    const bodyValidation = BatchCreateFlashcardsCommandSchema.safeParse(body);
    if (!bodyValidation.success) {
      return new Response(
        JSON.stringify({
          message: "Validation failed.",
          errors: bodyValidation.error.flatten().fieldErrors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    command = bodyValidation.data as BatchCreateFlashcardsCommand; // Cast after successful validation
  } catch (parseError: unknown) {
    console.error("Invalid JSON format in request body:", parseError);
    return new Response(JSON.stringify({ message: "Invalid JSON format in request body." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 3. Get Supabase client and user ID from context
  const supabase = locals.supabase as SupabaseClient | undefined;
  if (!supabase) {
    console.error("Supabase client missing from context.locals");
    return new Response(JSON.stringify({ message: "Internal Server Error: Supabase client missing." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Determine userId: use authenticated user if available, otherwise fallback to DEFAULT_USER_ID
  const userId = locals.user?.id || DEFAULT_USER_ID;
  if (!locals.user) {
    console.warn(`No authenticated user found, using DEFAULT_USER_ID: ${DEFAULT_USER_ID} for set ${setId}`);
  }

  try {
    // 4. Call FlashcardService
    const result: BatchCreateFlashcardsResponseDto = await flashcardService.batchCreateFlashcards(
      setId,
      userId,
      command,
      supabase
    );

    return new Response(JSON.stringify(result), {
      status: 201, // Created
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    if (error instanceof FlashcardSetNotFoundError) {
      return new Response(JSON.stringify({ message: error.message }), {
        status: 404, // Not Found
        headers: { "Content-Type": "application/json" },
      });
    } else if (error instanceof FlashcardBatchCreationError) {
      // This will catch errors from RPC call failure or other specific batch errors from the service
      const message = error.message || "Failed to batch create flashcards due to a server error.";
      return new Response(JSON.stringify({ message }), {
        status: 500, // Internal Server Error
        headers: { "Content-Type": "application/json" },
      });
    } else {
      // Generic unexpected error
      console.error("Unexpected error in API handler:", error);
      const message = error instanceof Error ? error.message : "An unexpected internal server error occurred.";
      return new Response(JSON.stringify({ message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
}
