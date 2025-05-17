import type { APIContext } from "astro";
import { z } from "zod";
import type { CreateFlashcardSetCommand } from "../../../types";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";
import { flashcardSetService } from "../../../lib/services/flashcardSetService"; // Import the service instance
import { GetFlashcardSetsQuerySchema } from "../../../lib/schemas/flashcardSetSchemas";

export const prerender = false;

// Step 4: Define Zod schema
const createFlashcardSetSchema = z.object({
  name: z.string().min(1, { message: "Name is required and cannot be empty." }),
  source_text_hash: z.string().optional(),
  source_text_length: z
    .number()
    .int()
    .min(1000, { message: "Source text length must be at least 1000 if provided." })
    .max(10000, { message: "Source text length must be at most 10000 if provided." })
    .optional(),
  generation_duration_ms: z
    .number()
    .int()
    .min(0, { message: "Generation duration must be a non-negative integer if provided." })
    .optional(),
});

export async function POST(context: APIContext): Promise<Response> {
  const { supabase, user } = context.locals;

  // Ensure Supabase client is available
  if (!supabase) {
    console.error("Supabase client not found in context.locals for POST /api/flashcard-sets");
    return new Response(JSON.stringify({ message: "Internal Server Error: Supabase client missing." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Ensure user is authenticated
  if (!user) {
    return new Response(JSON.stringify({ message: "Unauthorized: User not authenticated." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const userId = user.id;

  let rawBody;
  try {
    rawBody = await context.request.json();
  } catch (error) {
    return new Response(JSON.stringify({ message: "Invalid JSON format in request body." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const validationResult = createFlashcardSetSchema.safeParse(rawBody);

  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        message: "Validation failed.",
        errors: validationResult.error.flatten().fieldErrors,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const validatedData = validationResult.data as CreateFlashcardSetCommand;

  try {
    const { data: newSet, error: serviceError } = await flashcardSetService.createSet(
      userId,
      validatedData,
      supabase
    );

    if (serviceError) {
      console.error("Service error in POST /api/flashcard-sets:", serviceError);
      // Check for unique constraint violation (code 23505 for PostgreSQL)
      if (serviceError.code === "23505") {
        return new Response(
          JSON.stringify({ message: "A set with this name already exists for the user." }),
          { status: 400, headers: { "Content-Type": "application/json" } } // 400 as per plan for this specific error
        );
      }
      // For other database/service errors, return a generic 500
      return new Response(JSON.stringify({ message: "Internal Server Error: Could not create flashcard set." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (newSet) {
      return new Response(
        JSON.stringify(newSet),
        { status: 201, headers: { "Content-Type": "application/json" } } // 201 Created for success
      );
    }

    // Fallback for unexpected case where newSet is null without an error
    console.error("Flashcard set creation resulted in null data without an error.");
    return new Response(JSON.stringify({ message: "Internal Server Error: An unexpected issue occurred." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    // Catch any other unexpected errors during service call or response handling
    console.error("Unexpected error in POST /api/flashcard-sets:", e);
    return new Response(JSON.stringify({ message: "Internal Server Error: An unexpected error occurred." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function GET(context: APIContext) {
  const { locals, url } = context;
  const supabase = locals.supabase; // Retrieve supabase client directly

  // Temporarily comment out user authentication check for UI development
  /*
  if (!locals.user || !locals.supabase) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  */

  // Ensure supabase client is available, even if user check is off
  if (!supabase) {
    console.error("Supabase client not found in context.locals");
    return new Response(JSON.stringify({ message: "Internal Server Error: Supabase client missing" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const queryParams = {
    page: url.searchParams.get("page"),
    limit: url.searchParams.get("limit"),
    sort_by: url.searchParams.get("sort_by"),
    order: url.searchParams.get("order"),
  };

  const validationResult = GetFlashcardSetsQuerySchema.safeParse(queryParams);

  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        message: "Bad Request",
        errors: validationResult.error.flatten().fieldErrors,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { page, limit, sort_by, order } = validationResult.data;

  try {
    const result = await flashcardSetService.getFlashcardSets(
      supabase, // Use Supabase client from context
      DEFAULT_USER_ID, // Use DEFAULT_USER_ID instead of locals.user.id
      {
        page,
        limit,
        sortBy: sort_by,
        order,
      }
    );

    if (result.error) {
      console.error("Service error when fetching flashcard sets:", result.error);
      return new Response(JSON.stringify({ message: "Internal Server Error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ data: result.data, pagination: result.pagination }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("API handler error when fetching flashcard sets:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
