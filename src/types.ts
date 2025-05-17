import type { Tables, TablesInsert, TablesUpdate } from "./db/database.types";

//-----------------------------------------------------------------------------
// Base Entity DTOs (Directly from Database Types)
//-----------------------------------------------------------------------------

/**
 * Represents a Flashcard Set entity as stored in the database.
 * Maps directly to Tables<'flashcard_sets'>.
 */
export type FlashcardSetDto = Tables<"flashcard_sets">;

/**
 * Represents a Flashcard entity as stored in the database.
 * Maps directly to Tables<'flashcards'>.
 */
export type FlashcardDto = Tables<"flashcards">;

//-----------------------------------------------------------------------------
// API Specific Types & Enums
//-----------------------------------------------------------------------------

/**
 * Defines the possible sources for a flashcard.
 * Based on API plan constraints.
 */
export type FlashcardSource = "manual" | "ai_generated" | "ai_generated_modified";

/**
 * Defines the validation status for an AI-generated flashcard suggestion.
 * Based on API plan for POST /api/ai/generate-flashcards response.
 */
export type ValidationStatus = "valid" | "truncated" | "rejected";

/**
 * Represents pagination information included in list responses.
 * Based on API plan for GET endpoints returning lists.
 */
export interface PaginationInfoDto {
  current_page: number;
  total_pages: number;
  total_items: number;
  limit: number;
}

//-----------------------------------------------------------------------------
// Flashcard Set Command Models (API Requests)
//-----------------------------------------------------------------------------

/**
 * Command model for creating a new flashcard set.
 * API: POST /api/flashcard-sets
 * Derives from TablesInsert<'flashcard_sets'>, requiring 'name' and allowing optional generation metadata.
 */
export type CreateFlashcardSetCommand = Pick<TablesInsert<"flashcard_sets">, "name"> &
  Partial<Pick<TablesInsert<"flashcard_sets">, "source_text_hash" | "source_text_length" | "generation_duration_ms">>;

/**
 * Command model for updating a flashcard set's name.
 * API: PUT /api/flashcard-sets/{setId}
 * Derives from TablesUpdate<'flashcard_sets'>, requiring only 'name'.
 */
export type UpdateFlashcardSetCommand = Required<Pick<TablesUpdate<"flashcard_sets">, "name">>;

//-----------------------------------------------------------------------------
// Flashcard Set DTOs (API Responses)
//-----------------------------------------------------------------------------

/**
 * DTO for responses containing a single flashcard set.
 * API: POST /api/flashcard-sets, GET /api/flashcard-sets/{setId}, PUT /api/flashcard-sets/{setId}
 * Reuses the base FlashcardSetDto.
 */
export type SingleFlashcardSetResponseDto = FlashcardSetDto;

/**
 * DTO for responses containing a paginated list of flashcard sets.
 * API: GET /api/flashcard-sets
 */
export interface PaginatedFlashcardSetsDto {
  data: FlashcardSetDto[];
  pagination: PaginationInfoDto;
}

//-----------------------------------------------------------------------------
// Flashcard Command Models (API Requests)
//-----------------------------------------------------------------------------

/**
 * Command model for creating a single flashcard.
 * API: POST /api/flashcard-sets/{setId}/flashcards
 * Derives from TablesInsert<'flashcards'>, requiring 'front', 'back', and 'source'.
 * Uses the specific FlashcardSource type.
 */
export type CreateFlashcardCommand = Pick<TablesInsert<"flashcards">, "front" | "back"> & {
  source: FlashcardSource;
};

/**
 * Command model for batch-creating flashcards.
 * API: POST /api/flashcard-sets/{setId}/flashcards/batch-create
 */
export interface BatchCreateFlashcardsCommand {
  flashcards: CreateFlashcardCommand[];
}

/**
 * Command model for updating a flashcard.
 * API: PUT /api/flashcards/{flashcardId}
 * Derives from TablesUpdate<'flashcards'>, allowing optional 'front', 'back', and 'source'.
 * Uses the specific FlashcardSource type.
 */
export type UpdateFlashcardCommand = Partial<Pick<TablesUpdate<"flashcards">, "front" | "back">> & {
  source?: FlashcardSource;
};

/**
 * Command model for regenerating an AI-generated flashcard.
 * API: POST /api/flashcards/{flashcardId}/regenerate
 * This is an action trigger, not directly mapping to database update fields.
 * The request body is empty as model selection is handled backend-side.
 */
export type RegenerateFlashcardCommand = Record<string, never>;

//-----------------------------------------------------------------------------
// Flashcard DTOs (API Responses)
//-----------------------------------------------------------------------------

/**
 * DTO for responses containing a single flashcard.
 * API: POST /api/flashcard-sets/{setId}/flashcards, GET /api/flashcards/{flashcardId}, PUT /api/flashcards/{flashcardId}, POST /api/flashcards/{flashcardId}/regenerate
 * Reuses the base FlashcardDto.
 */
export type SingleFlashcardResponseDto = FlashcardDto;

/**
 * Represents an error that occurred during batch flashcard creation.
 * Part of the BatchCreateFlashcardsResponseDto.
 */
export interface BatchCreateErrorDto {
  input_flashcard: CreateFlashcardCommand;
  error_message: string;
}

/**
 * DTO for the response of a batch flashcard creation request.
 * API: POST /api/flashcard-sets/{setId}/flashcards/batch-create
 */
export interface BatchCreateFlashcardsResponseDto {
  created_flashcards: FlashcardDto[];
  errors?: BatchCreateErrorDto[]; // Optional, as per API plan description
}

/**
 * DTO for responses containing a paginated list of flashcards.
 * API: GET /api/flashcard-sets/{setId}/flashcards
 */
export interface PaginatedFlashcardsDto {
  data: FlashcardDto[];
  pagination: PaginationInfoDto;
}

//-----------------------------------------------------------------------------
// AI Generation Command Models & DTOs
//-----------------------------------------------------------------------------

/**
 * Command model for requesting AI flashcard generation.
 * API: POST /api/ai/generate-flashcards
 * This is an action trigger.
 */
export interface AIGenerateFlashcardsCommand {
  text: string;
}

/**
 * Represents a single flashcard suggestion generated by the AI.
 * Part of the AIGenerateFlashcardsResponseDto.
 */
export interface FlashcardSuggestionDto {
  front: string; // Max 200 chars (enforced by API logic/validation)
  back: string; // Max 500 chars (enforced by API logic/validation)
  validation_status: ValidationStatus;
  validation_message?: string;
}

/**
 * Represents metadata associated with an AI flashcard generation request.
 * Part of the AIGenerateFlashcardsResponseDto. Fields correspond conceptually
 * to columns in 'flashcard_sets' and 'generation_error_logs'.
 */
export interface AIGenerationMetadataDto {
  source_text_hash: string;
  source_text_length: number;
  generation_duration_ms: number;
  model_used: string;
  truncated_count: number;
  rejected_count: number;
  total_suggestions: number;
}

/**
 * DTO for the response of an AI flashcard generation request.
 * API: POST /api/ai/generate-flashcards
 */
export interface AIGenerateFlashcardsResponseDto {
  suggestions: FlashcardSuggestionDto[];
  metadata: AIGenerationMetadataDto;
}

//-----------------------------------------------------------------------------
// View-specific ViewModels
//-----------------------------------------------------------------------------

/**
 * Represents a flashcard temporarily stored on the client-side during manual creation.
 * Used in the Create Manual view.
 */
export interface TemporaryFlashcard {
  id: string; // Client-generated UUID
  front: string;
  back: string;
}

/**
 * ViewModel for a flashcard set displayed in the "My Flashcards" view.
 */
export interface FlashcardSetViewModel {
  id: string;
  name: string;
  flashcardCount: number;
  status: "AI Generated" | "Manual";
  lastStudiedDisplay: string; // np. "Ostatnia nauka: 01.01.2024" lub "Nigdy nie uczono"
  studyLink: string; // np. /study-session/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
}

//-----------------------------------------------------------------------------
// User Command Models & DTOs (Minimal for now)
//-----------------------------------------------------------------------------

// No specific DTOs/Commands needed for user management based on the API plan,
// as Supabase Auth handles most operations. The DELETE /api/users/me endpoint
// doesn't require a request body and returns 204 No Content on success.
