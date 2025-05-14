# API Endpoint: POST /api/flashcards/{flashcardId}/regenerate

## 1. Overview

This endpoint allows a user to trigger the regeneration of content (front and back) for an existing flashcard that was originally AI-generated. The process uses a (currently mocked) Language Model (LLM) service. If successful, the flashcard's `front` and `back` fields are updated in the database, while its `source` field remains `'ai_generated'`. Errors during the LLM interaction or database operations are logged.

This documentation reflects **Phase 1 (Mock LLM)** of the implementation.

-   **Method**: `POST`
-   **URL Structure**: `/api/flashcards/{flashcardId}/regenerate`
-   **Prerender**: `false` (Dynamic endpoint)

## 2. Path Parameters

-   `flashcardId` (string, UUID, required): The unique identifier of the AI-generated flashcard to regenerate. Must be a valid UUID.

## 3. Request Details

**Headers:**

-   `Content-Type: application/json` (Recommended, even for an empty body)
-   `Accept: application/json`

**Body (JSON):**

The request body must be an empty JSON object.

```json
{}
```

**Command Model:**

-   `RegenerateFlashcardCommand` (from `src/types.ts`): `export type RegenerateFlashcardCommand = {};`

## 4. Authentication & Authorization (Current State)

-   **Authentication**: Currently, this endpoint operates using a `DEFAULT_USER_ID` (`00000000-0000-0000-0000-000000000000`) defined in `src/db/supabase.client.ts`. No JWT or user-specific authentication token is required for this phase. The global `supabaseClient` from `src/db/supabase.client.ts` is used.
-   **Authorization**:
    -   The `DEFAULT_USER_ID` must be the owner of the flashcard. This is checked by the service logic.
    -   The flashcard must have its `source` field set to `'ai_generated'`.

## 5. Response Details

### 5.1. Successful Response (200 OK)

Returns the updated flashcard data as a JSON object (`SingleFlashcardResponseDto`, which is an alias for `FlashcardDto`).

**Content-Type**: `application/json`

```json
{
  "id": "uuid-string-of-the-flashcard",
  "set_id": "uuid-string-of-the-parent-set",
  "user_id": "00000000-0000-0000-0000-000000000000", // DEFAULT_USER_ID
  "front": "Mock Regenerated: Original front content", // New front
  "back": "Mock Regenerated: Original back content",   // New back
  "source": "ai_generated", // Remains unchanged
  "created_at": "timestamp-string",
  "updated_at": "timestamp-string" // Will be updated by DB trigger
}
```

### 5.2. Error Responses

-   **400 Bad Request:**
    -   If `flashcardId` path parameter is not a valid UUID:
        ```json
        {
          "message": "Validation failed.",
          "errors": {
            "flashcardId": ["Invalid flashcard ID format. Must be a valid UUID."]
          }
        }
        ```
    -   If the request body is not an empty JSON object (e.g., contains fields, or is not valid JSON):
        ```json
        {
          "message": "Validation failed.",
          "errors": {
            "_errors": ["Request body must be an empty object."]
          }
        }
        ```
        (For invalid JSON: `{ "message": "Invalid JSON in request body." }`)
    -   If the flashcard's `source` is not `'ai_generated'`:
        ```json
        {
          "error": "Flashcard with ID [flashcardId] has source '[actual_source]' and cannot be AI-regenerated."
        }
        ```
        (Or a similar message from `FlashcardNotAIGeneratedError`)

-   **404 Not Found:**
    -   If the flashcard specified by `flashcardId` does not exist or does not belong to the `DEFAULT_USER_ID`.
        ```json
        {
          "error": "Flashcard with ID [flashcardId] not found or not accessible by user [DEFAULT_USER_ID]."
        }
        ```
        (Or a similar message from `FlashcardNotFoundError`)

-   **429 Too Many Requests (from Mock LLM):**
    -   If the (mock) LLM service simulates a rate limit.
        ```json
        {
          "error": "Too many requests to the AI service. Please try again later."
        }
        ```

-   **500 Internal Server Error:**
    -   If the (mock) LLM service simulates a server-side error.
    -   If there's an error updating the flashcard in the database after successful LLM regeneration.
    -   If there's an error logging an LLM error to `generation_error_logs`.
    -   For other unexpected server-side errors.
        ```json
        {
          "error": "Internal Server Error. Failed to regenerate flashcard."
        }
        ```
        (Or: `{ "error": "An internal server error occurred." }` for very generic ones)

-   **503 Service Unavailable (from Mock LLM):**
    -   If the (mock) LLM service simulates temporary unavailability.
        ```json
        {
          "error": "AI service is temporarily unavailable. Please try again later."
        }
        ```

## 6. Key Types Used (from `src/types.ts`)

-   `RegenerateFlashcardCommand`: For the (empty) request body.
-   `FlashcardDto` (aliased as `SingleFlashcardResponseDto`): For the success response body.
-   `TablesInsert<'generation_error_logs'>`: For logging LLM errors.

## 7. Zod Schemas Used (from `src/lib/schemas/flashcardSchemas.ts`)

-   `FlashcardIdPathParamsSchema`: Validates the `flashcardId` path parameter (`z.object({ flashcardId: z.string().uuid() })`).
-   `RegenerateFlashcardCommandSchema`: Validates the request body (`z.object({}).strict()`).

## 8. Underlying Logic & Important Notes

1.  **Validation**: The `flashcardId` is validated as a UUID. The request body is validated to be an empty JSON object.
2.  **Service Call**: The route handler calls `flashcardService.regenerateAIFlashcard`.
3.  **Flashcard Retrieval & Validation (Service)**:
    -   The service fetches the flashcard by `id` and `user_id` (`DEFAULT_USER_ID`).
    -   It verifies the flashcard exists and belongs to the user.
    -   It verifies the flashcard's `source` is `'ai_generated'`.
4.  **Mock LLM Interaction (Service)**:
    -   The service calls `aiMockService.mockRegenerateFlashcardContent` with the current `front` and `back`.
    -   The mock service can simulate success or various errors (429, 500, 503).
5.  **LLM Error Logging (Service)**:
    -   If `mockRegenerateFlashcardContent` throws a `MockLLMError`, the service attempts to:
        -   Fetch `source_text_hash` and `source_text_length` from the parent `flashcard_set` (using placeholders like "REGEN_CONTEXT_NA" and 1000 if not found or invalid).
        -   Insert a record into the `generation_error_logs` table with details of the LLM error.
6.  **Content Processing (Service)**:
    -   Generated `front` content is truncated to 200 characters if longer.
    -   Generated `back` content is truncated to 500 characters if longer.
7.  **Database Update (Service)**:
    -   The flashcard's `front` and `back` fields are updated.
    -   The `source` field remains `'ai_generated'`.
    -   `updated_at` is automatically updated by a database trigger.
8.  **Custom Errors**: The service layer uses custom errors (`FlashcardNotFoundError`, `FlashcardNotAIGeneratedError`, `FlashcardRegenerationFailedError`) which the API route handler maps to appropriate HTTP responses.

This endpoint is currently in **Phase 1** and relies on a **mock LLM service** (`aiMockService.ts`) and uses `DEFAULT_USER_ID` for all operations.
