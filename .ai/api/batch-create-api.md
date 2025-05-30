# API Endpoint: Batch Create Flashcards in a Set

## 1. Overview

Allows authenticated users to create multiple flashcards within a specified flashcard set in a single operation. The creation process is transactional at the database level via an RPC function, ensuring data integrity.

-   **Method**: `POST`
-   **URL**: `/api/flashcard-sets/{setId}/flashcards/batch-create`
-   **Prerender**: `false` (Dynamic endpoint)

## 2. Path Parameters

-   `setId` (string, UUID, required): The unique identifier of the flashcard set to which the new flashcards will be added. Must be a valid UUID.

## 3. Request Details

**Headers:**

-   `Content-Type: application/json`

**Body (JSON):**

The request body must be a JSON object conforming to the `BatchCreateFlashcardsCommand` type, which includes an array of flashcards to be created.

```json
{
  "flashcards": [
    {
      "front": "string (required, 1-200 chars)",
      "back": "string (required, 1-500 chars)",
      "source": "string (required, 'manual' | 'ai_generated' | 'ai_generated_modified')"
    }
    // ... up to 100 flashcards
  ]
}
```

**Field Descriptions (for each flashcard object in the `flashcards` array):**

-   `front` (string, required): The content for the front of the flashcard. Must be between 1 and 200 characters.
-   `back` (string, required): The content for the back of the flashcard. Must be between 1 and 500 characters.
-   `source` (enum string, required): Indicates the origin of the flashcard. Allowed values:
    -   `"manual"`: Manually created by the user.
    -   `"ai_generated"`: Generated by AI and accepted pensamientos.
    -   `"ai_generated_modified"`: Generated by AI and subsequently modified by the user.

**Constraints:**

-   The `flashcards` array must contain at least 1 and at most 100 flashcard objects.

**Example Request:**

```json
{
  "flashcards": [
    {
      "front": "What is the capital of France?",
      "back": "Paris",
      "source": "manual"
    },
    {
      "front": "What is H2O?",
      "back": "Water",
      "source": "ai_generated"
    }
  ]
}
```

## 4. Authentication & Authorization

-   **Authentication (Intended)**: Required. Access should be restricted to logged-in users. This is handled by Astro middleware verifying a Supabase JWT from cookies and populating `context.locals.user`.
-   **Authentication (Current Temporary State)**: If `context.locals.user` is not populated (e.g., user not logged in), the endpoint currently falls back to using a `DEFAULT_USER_ID` (defined in `src/db/supabase.client.ts`) for operations. This is to facilitate frontend development.
-   **Authorization**:
    -   The user (identified by `context.locals.user.id` or `DEFAULT_USER_ID`) must have ownership of the flashcard set specified by `setId`. This is verified by the service layer before attempting to add flashcards.
    -   The underlying database function (`upsert_flashcards_batch_and_update_set_stats`) also operates within the security context of the provided user ID.

## 5. Response Details

### 5.1. Successful Response (201 Created)

Returns a JSON object (`BatchCreateFlashcardsResponseDto`) containing an array of successfully created flashcards and an optional array of errors for flashcards that could not be created (e.g., due to unique constraint violations).

```json
{
  "created_flashcards": [
    {
      "id": "uuid",
      "set_id": "uuid", // Matches the {setId} from the request
      "user_id": "uuid", // User who owns the flashcard
      "front": "string",
      "back": "string",
      "source": "string",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
    // ... other successfully created flashcards
  ],
  "errors": [ // Optional, present if some flashcards failed
    {
      "input_flashcard": { // The original input for the failed flashcard
        "front": "string",
        "back": "string",
        "source": "string"
      },
      "error_message": "string" // Reason for failure
    }
    // ... other errors
  ]
}
```

**Example Success Response (Partial Success):**

```json
{
  "created_flashcards": [
    {
      "id": "c1d2e3f4-..." ,
      "set_id": "a1b2c3d4-...",
      "user_id": "00000000-...", // DEFAULT_USER_ID in this example
      "front": "What is the capital of France?",
      "back": "Paris",
      "source": "manual",
      "created_at": "2023-10-28T10:00:00.000Z",
      "updated_at": "2023-10-28T10:00:00.000Z"
    }
  ],
  "errors": [
    {
      "input_flashcard": {
        "front": "What is H2O?",
        "back": "Water",
        "source": "ai_generated"
      },
      "error_message": "Flashcard with these front and back values already exists in this set."
    }
  ]
}
```

### 5.2. Error Responses

-   **400 Bad Request:**
    -   If `setId` path parameter is not a valid UUID:
        ```json
        {
          "message": "Validation failed.",
          "errors": {
            "setId": ["Invalid Set ID format. Must be a valid UUID."]
          }
        }
        ```
    -   If the request body is not valid JSON:
        ```json
        { "message": "Invalid JSON format in request body." }
        ```
    -   If Zod validation of the request body fails (e.g., `flashcards` array is empty, too long, or individual flashcards have invalid fields):
        ```json
        {
          "message": "Validation failed.",
          "errors": { // Field-specific errors from Zod
            "flashcards": ["At least one flashcard is required."] 
            // or "flashcards.0.front": ["Front cannot exceed 200 characters."]
          }
        }
        ```
-   **401 Unauthorized:** (Currently not actively returned due to `DEFAULT_USER_ID` fallback, but will be relevant once strict authentication is enforced.)
    ```json
    { "message": "Unauthorized" } 
    ```
-   **404 Not Found:**
    -   If the flashcard set specified by `setId` does not exist or does not belong to the acting user:
        ```json
        { "message": "Flashcard set with ID {setId} not found or user {userId} does not have access." }
        ```
-   **500 Internal Server Error:**
    -   If the Supabase client is missing from the server context:
        ```json
        { "message": "Internal Server Error: Supabase client missing." }
        ```
    -   If the underlying RPC database function call fails for reasons other than handled errors (e.g., unexpected database issue, critical error within RPC logic):
        ```json
        { "message": "RPC error during batch flashcard creation: {specific RPC error message}" }
        ```
    -   For any other unexpected server-side error:
        ```json
        { "message": "An unexpected internal server error occurred." }
        ```
        or
        ```json
        { "message": "Database error while verifying flashcard set: {specific DB error}"}
        ```

## 6. Key Types Used

-   `BatchCreateFlashcardsCommand` (Request Body): Defined in `src/types.ts`.
-   `CreateFlashcardCommand` (Individual flashcard in request): Defined in `src/types.ts`.
-   `BatchCreateFlashcardsResponseDto` (Response Body): Defined in `src/types.ts`.
-   `FlashcardDto` (Individual created flashcard in response): Defined in `src/types.ts`.
-   `BatchCreateErrorDto` (Individual error in response): Defined in `src/types.ts`.

## 7. Zod Schemas Used for Validation

-   `SetIdParamSchema`: Validates the `setId` path parameter. Defined in `src/lib/schemas/flashcardSchemas.ts`.
-   `BatchCreateFlashcardsCommandSchema`: Validates the overall request body. Defined in `src/lib/schemas/flashcardSchemas.ts`.
-   `CreateFlashcardCommandSchema`: Validates each individual flashcard object within the request body. Defined in `src/lib/schemas/flashcardSchemas.ts`.

## 8. Underlying Logic & Important Notes

-   **Transactional Processing**: The core logic of creating flashcards and updating associated counts in the `flashcard_sets` table (specifically `total_flashcards_count` and `accepted_unedited_count`) is handled by a PostgreSQL RPC function named `upsert_flashcards_batch_and_update_set_stats`. This ensures that the entire batch operation is atomic.
-   **Partial Success**: The endpoint supports partial success. If some flashcards in the batch are valid and can be created, while others fail (e.g., due to a unique constraint violation - same front/back for the same set), the valid ones will be created, and details about the failed ones will be returned in the `errors` array of the response.
-   **Error Handling**:
    -   Unique constraint violations (`(set_id, front, back)`) for individual flashcards are caught by the RPC function and reported in the `errors` array without failing the entire batch.
    -   Other critical errors during the RPC execution (e.g., failure to update counts in `flashcard_sets`) will cause the entire transaction within the RPC to roll back, and the API will return a 500 Internal Server Error.
-   **User Context**: The `user_id` (either from an authenticated session or `DEFAULT_USER_ID`) is passed to the service layer and ultimately to the RPC function to ensure operations are performed for the correct user.
