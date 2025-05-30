import { z } from "zod";
import type { APIContext } from "astro";
// import { DEFAULT_USER_ID } from "@/db/supabase.client"; // REMOVED
import { flashcardService, FlashcardSetNotFoundError } from "@/lib/services/flashcardService";

export const prerender = false;

const pathParamsSchema = z.object({
  setId: z.string().uuid({ message: "Invalid Set ID format" }),
});

const queryParamsSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().min(1).max(1000).optional().default(10),
  sort_by: z.enum(["created_at", "updated_at", "front", "back", "source"]).optional().default("created_at"),
  order: z.enum(["asc", "desc"]).optional().default("asc"),
  filter_source: z.enum(["manual", "ai_generated", "ai_generated_modified"] as const).optional(),
});

export async function GET(context: APIContext): Promise<Response> {
  const { params: astroParams, url, locals } = context;
  const supabase = locals.supabase;
  const user = locals.user; // Get the authenticated user object

  if (!user) {
    console.error("User not authenticated for GET /api/flashcard-sets/{setId}/flashcards");
    return new Response(JSON.stringify({ message: "Unauthorized: User not authenticated." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const userId = user.id; // Use the actual user ID

  // 1. Validate path parameter setId
  const pathValidationResult = pathParamsSchema.safeParse(astroParams);
  if (!pathValidationResult.success) {
    return new Response(
      JSON.stringify({ message: "Validation failed", errors: pathValidationResult.error.flatten().fieldErrors }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  const { setId } = pathValidationResult.data;

  // 2. Validate query parameters
  const queryParams = Object.fromEntries(url.searchParams.entries());
  const queryValidationResult = queryParamsSchema.safeParse(queryParams);

  if (!queryValidationResult.success) {
    return new Response(
      JSON.stringify({ message: "Validation failed", errors: queryValidationResult.error.flatten().fieldErrors }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  const validatedQueryParams = queryValidationResult.data;

  try {
    if (!supabase) {
      console.error("Supabase client not found in locals for GET /api/flashcard-sets/{setId}/flashcards");
      return new Response(JSON.stringify({ message: "Internal Server Error: Supabase client missing." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await flashcardService.getFlashcardsInSet(
      supabase,
      userId, // Use actual userId from authenticated user
      setId,
      validatedQueryParams
    );

    if (result) {
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(
      JSON.stringify({ message: "An unexpected error occurred: Service returned no data and no error." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    if (error instanceof FlashcardSetNotFoundError) {
      return new Response(JSON.stringify({ message: error.message }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(
      JSON.stringify({ message: error instanceof Error ? error.message : "An internal server error occurred" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Placeholder for GET handler
// export async function GET(context: APIContext): Promise<Response> {
//   // Implementation will follow
//   return new Response(JSON.stringify({ message: "Not implemented yet" }), { status: 501 });
// }
