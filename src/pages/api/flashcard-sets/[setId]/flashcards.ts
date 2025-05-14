import { z } from "zod";
import type { APIContext } from "astro";
import { DEFAULT_USER_ID } from "@/db/supabase.client"; // TODO: Remove once auth is implemented
import { flashcardService, FlashcardSetNotFoundError } from "@/lib/services/flashcardService"; // Adjusted path

export const prerender = false;

const pathParamsSchema = z.object({
  setId: z.string().uuid({ message: "Invalid Set ID format" }),
});

const queryParamsSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().min(1).max(100).optional().default(10),
  sort_by: z.enum(["created_at", "updated_at", "front", "back", "source"]).optional().default("created_at"),
  order: z.enum(["asc", "desc"]).optional().default("asc"),
  filter_source: z.enum(["manual", "ai_generated", "ai_generated_modified"] as const).optional(),
});

export async function GET(context: APIContext): Promise<Response> {
  const { params: astroParams, url } = context;

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
    // 3. Call the service method
    // Note: Using DEFAULT_USER_ID as per current project setup
    const result = await flashcardService.getFlashcardsInSet(
      DEFAULT_USER_ID, // Per instruction, replace with actual user from context.locals.user.id later
      setId,
      validatedQueryParams
    );

    // 4. Handle successful response from service
    if (result) {
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    // This case should ideally not be reached if service throws errors or returns data
    return new Response(
      JSON.stringify({ message: "An unexpected error occurred: Service returned no data and no error." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // 5. Handle errors from service
    if (error instanceof FlashcardSetNotFoundError) {
      return new Response(JSON.stringify({ message: error.message }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    // Handle other generic errors (e.g., database errors thrown by the service)
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
