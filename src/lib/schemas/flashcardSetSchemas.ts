import { z } from "zod";

export const CreateFlashcardSetBodySchema = z.object({
  name: z.string().min(1, "Set name is required.").max(100, "Set name must be 100 characters or less."),
  source_text_hash: z.string().optional(),
  source_text_length: z.number().optional(),
  generation_duration_ms: z.number().optional(),
});

export const UpdateFlashcardSetBodySchema = z.object({
  name: z.string().min(1, "Set name is required.").max(100, "Set name must be 100 characters or less.").optional(),
  last_studied_at: z.string().datetime({ offset: true, message: "Invalid ISO 8601 datetime format for last_studied_at." }).optional(),
}).refine(data => data.name !== undefined || data.last_studied_at !== undefined, {
  message: "At least one field (name or last_studied_at) must be provided for update.",
  path: [], // Apply the error to the whole object if refinement fails
});

export const FlashcardSetParamsSchema = z.object({
  setId: z.string().uuid("Invalid flashcard set ID format (must be UUID)."),
});

export const GetFlashcardSetsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  sort_by: z.enum(["name", "created_at", "updated_at", "last_studied_at"]).optional().default("last_studied_at"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
});
