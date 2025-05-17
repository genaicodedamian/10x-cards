import type { APIContext } from "astro";
import { z } from "zod";
import type { CreateFlashcardSetCommand } from "../../../types";
// import { DEFAULT_USER_ID } from "../../../db/supabase.client"; // Już niepotrzebne dla GET
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
  const supabase = locals.supabase;
  const user = locals.user; // Pobierz obiekt użytkownika

  console.log("[API GET /api/flashcard-sets] Received request. URL:", url.toString());

  // Sprawdzenie użytkownika i klienta Supabase
  if (!user) {
    console.error("[API GET /api/flashcard-sets] Unauthorized: User not found in locals.");
    return new Response(JSON.stringify({ message: 'Unauthorized: User not authenticated.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const userId = user.id;
  console.log(`[API GET /api/flashcard-sets] Authenticated User ID: ${userId}`);

  if (!supabase) {
    console.error("[API GET /api/flashcard-sets] Supabase client not found in locals.");
    return new Response(JSON.stringify({ message: "Internal Server Error: Supabase client missing" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  console.log("[API GET /api/flashcard-sets] Supabase client found in locals.");

  const queryParams = {
    page: url.searchParams.get("page"),
    limit: url.searchParams.get("limit"),
    sort_by: url.searchParams.get("sort_by"),
    order: url.searchParams.get("order"),
  };
  console.log("[API GET /api/flashcard-sets] Raw query params:", queryParams);

  const validationResult = GetFlashcardSetsQuerySchema.safeParse(queryParams);

  if (!validationResult.success) {
    console.error("[API GET /api/flashcard-sets] Query params validation failed:", validationResult.error.flatten().fieldErrors);
    return new Response(
      JSON.stringify({
        message: "Bad Request: Invalid query parameters.",
        errors: validationResult.error.flatten().fieldErrors,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { page, limit, sort_by, order } = validationResult.data;
  console.log("[API GET /api/flashcard-sets] Validated query params:", { page, limit, sort_by, order });

  try {
    console.log(`[API GET /api/flashcard-sets] Calling flashcardSetService.getFlashcardSets for user: ${userId}`);
    const result = await flashcardSetService.getFlashcardSets(
      supabase, 
      userId, // Użyj ID faktycznie zalogowanego użytkownika
      {
        page,
        limit,
        sortBy: sort_by,
        order,
      }
    );
    console.log("[API GET /api/flashcard-sets] Result from service:", result);

    if (result.error) {
      console.error("[API GET /api/flashcard-sets] Service error when fetching flashcard sets:", result.error);
      return new Response(JSON.stringify({ message: "Internal Server Error while fetching data." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("[API GET /api/flashcard-sets] Successfully fetched data. Items count:", result.data?.length);
    return new Response(JSON.stringify({ data: result.data, pagination: result.pagination }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[API GET /api/flashcard-sets] Unexpected API handler error:", error);
    return new Response(JSON.stringify({ message: "Internal Server Error due to an unexpected issue." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
