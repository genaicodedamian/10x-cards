import { z } from "zod";

// Schema for validating a single flashcard in the batch create command
export const CreateFlashcardCommandSchema = z.object({
  front: z
    .string()
    .trim()
    .min(1, { message: "Front is required." })
    .max(200, { message: "Front cannot exceed 200 characters." }),
  back: z
    .string()
    .trim()
    .min(1, { message: "Back is required." })
    .max(500, { message: "Back cannot exceed 500 characters." }),
  source: z.enum(["manual", "ai_generated", "ai_generated_modified"], {
    errorMap: () => ({
      message: "Invalid source value. Must be 'manual', 'ai_generated', or 'ai_generated_modified'.",
    }),
  }),
});

// Schema for validating the entire batch create flashcards command
export const BatchCreateFlashcardsCommandSchema = z.object({
  flashcards: z
    .array(CreateFlashcardCommandSchema)
    .min(1, { message: "At least one flashcard is required." })
    .max(100, { message: "Cannot create more than 100 flashcards at once." }),
});

// Schema for validating the setId path parameter
export const SetIdParamSchema = z.object({
  setId: z.string().uuid({ message: "Invalid Set ID format. Must be a valid UUID." }),
});

// Schema for validating the update flashcard command
export const UpdateFlashcardCommandSchema = z
  .object({
    front: z.string().max(200).optional(),
    back: z.string().max(500).optional(),
    source: z.enum(["manual", "ai_generated", "ai_generated_modified"]).optional(),
  })
  .strict();

// Type alias for inferred types from Zod schemas if needed elsewhere, though command types are already in src/types.ts
export type CreateFlashcardCommandValidationType = z.infer<typeof CreateFlashcardCommandSchema>;
export type BatchCreateFlashcardsCommandValidationType = z.infer<typeof BatchCreateFlashcardsCommandSchema>;

// Schema for validating the flashcardId path parameter
export const FlashcardIdPathParamsSchema = z.object({
  flashcardId: z.string().uuid({ message: "Invalid flashcard ID format. Must be a valid UUID." }),
});

// Schema for validating the regenerate flashcard command (empty body)
export const RegenerateFlashcardCommandSchema = z.object({}).strict({
  message: "Request body must be an empty object.",
});
