export const prerender = false;

import type { APIContext, APIRoute } from "astro";
import { z } from "zod";
// import type { FlashcardDto } from "@/types"; // Removed unused import
import { DEFAULT_USER_ID } from "@/db/supabase.client"; // Keep this if DEFAULT_USER_ID is still needed
import { flashcardService } from "@/lib/services/flashcardService"; // Import the service with correct casing
import type { UpdateFlashcardCommand } from "../../../types";
import { UpdateFlashcardCommandSchema } from "@/lib/schemas/flashcardSchemas"; // Import the schema
import type { DeleteFlashcardResult } from "@/lib/services/flashcardService"; // Import the result type

// Zod schema for flashcardId validation (as per plan step 4)
// This one is for the string itself, used by GET and PUT
const FlashcardIdSchema = z.string().uuid({ message: "Invalid flashcard ID format. Must be a valid UUID." });

// Path parameter schema for object validation, preferred for handler consistency
const PathParamsSchema = z.object({
  flashcardId: z.string().uuid({ message: "Invalid flashcard ID format." }),
});

export async function GET(context: APIContext): Promise<Response> {
  const { supabase, user } = context.locals; // Get supabase and user from context.locals
  // Step 3: Pobierz flashcardId z params (częściowo)
  const { flashcardId: rawFlashcardId } = context.params;

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
    const flashcard = await flashcardService.getFlashcardById(supabase, flashcardId, userId);

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

export async function PUT(context: APIContext): Promise<Response> {
  const { supabase, user } = context.locals; // Get supabase and user from context.locals
  const { params, request } = context; // Removed unused 'locals' from destructuring

  // 1. Authentication (Stubbed for now - using DEFAULT_USER_ID)
  // const session = await locals.auth(); // Example: Get session from Astro locals
  // if (!session?.user) {
  //   return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  // }
  // const userId = session.user.id;
  // const client = locals.supabase; // Authenticated Supabase client from middleware

  const userId = DEFAULT_USER_ID; // Using default user ID as per current requirement
  const client = supabase; // Using imported client as per current requirement

  // 2. Validate flashcardId path parameter
  const flashcardIdValidation = FlashcardIdSchema.safeParse(params.flashcardId);
  if (!flashcardIdValidation.success) {
    return new Response(
      JSON.stringify({
        message: "Validation failed.",
        errors: { flashcardId: flashcardIdValidation.error.format()._errors.join(", ") },
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  const flashcardId = flashcardIdValidation.data;

  let rawData;
  try {
    rawData = await request.json();
  } catch (_error) {
    // Standard practice for unused catch parameter
    return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const validatedBody = UpdateFlashcardCommandSchema.safeParse(rawData);
  if (!validatedBody.success) {
    return new Response(JSON.stringify({ message: "Validation failed", errors: validatedBody.error.format() }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const updateData: UpdateFlashcardCommand = validatedBody.data;

  // Check if at least one field is provided for update
  if (Object.keys(updateData).length === 0) {
    return new Response(
      JSON.stringify({ error: "Request body must contain at least one field to update (front, back, or source)." }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const updatedFlashcard = await flashcardService.updateFlashcard(client, flashcardId, userId, updateData);

    if (!updatedFlashcard) {
      // This could be because the RPC returned null (e.g., flashcard not found for user based on P0002 in SQL fn)
      return new Response(JSON.stringify({ error: "Flashcard not found or update failed" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Successfully updated
    return new Response(JSON.stringify(updatedFlashcard), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // console.error("Error updating flashcard:", error); // Removed console.error
    // Here, map specific PostgreSQL error codes (from error.code) to HTTP responses
    // as per the implementation plan (e.g., unique constraint violation)
    // Type guard for Supabase/PostgREST errors which have a 'code' property
    if (error && typeof error === "object" && "code" in error && typeof error.code === "string") {
      if (error.code === "23505") {
        // PostgreSQL unique_violation
        return new Response(JSON.stringify({ error: "Duplicate front/back combination in the set" }), {
          status: 400, // Or 409 Conflict
          headers: { "Content-Type": "application/json" },
        });
      }
      // Add more specific error mapping here based on codes from the RPC or Supabase errors
    }

    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export const DELETE: APIRoute = async (context: APIContext) => {
  const { supabase, user } = context.locals; // Get supabase and user from context.locals
  const { params } = context;

  // Use imported supabaseClient and DEFAULT_USER_ID as per project requirements
  const userId = DEFAULT_USER_ID;

  // Validate path parameter flashcardId
  const parsedParams = PathParamsSchema.safeParse(params);
  if (!parsedParams.success) {
    return new Response(
      JSON.stringify({
        message: "Validation failed",
        errors: parsedParams.error.flatten().fieldErrors,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { flashcardId } = parsedParams.data;

  try {
    const result: DeleteFlashcardResult = await flashcardService.deleteFlashcard(supabase, userId, flashcardId);

    if (result.success) {
      return new Response(null, { status: 204 }); // 204 No Content for successful DELETE
    } else {
      // Service returned an error (NotFound, Unauthorized, ServiceError)
      return new Response(JSON.stringify({ message: result.message || "Error deleting flashcard" }), {
        status: result.statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (_error) {
    // Standard practice for unused catch parameter
    // Prefixed error with underscore as it's not used in this generic catch block
    // Catch unexpected errors from the service call itself, though the service is designed to return structured errors.
    // console.error("Unexpected error in DELETE /api/flashcards/[flashcardId]:", error); // Logging removed
    return new Response(JSON.stringify({ message: "An internal server error occurred." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
