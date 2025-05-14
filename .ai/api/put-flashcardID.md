# API Endpoint: PUT /api/flashcards/{flashcardId}

## 1. Overview

This endpoint allows an authenticated user to update an existing flashcard identified by `flashcardId`. The user can modify the `front`, `back`, and `source` of the flashcard. The system automatically manages the logic for changing the flashcard's status (e.g., from 'ai_generated' to 'ai_generated_modified' upon edit) and updates related counts in the parent flashcard set (`flashcard_sets`).

-   **Method**: `PUT`
-   **URL**: `/api/flashcards/{flashcardId}`
-   **Prerender**: `false` (Dynamic endpoint)

## 2. Path Parameters

-   `flashcardId` (string, UUID, required): The unique identifier of the flashcard to update. Must be a valid UUID.

## 3. Request Details

**Headers:**

-   `Content-Type: application/json`

**Body (JSON):**

The request body must be a JSON object conforming to the `UpdateFlashcardCommand` type. At least one of the fields (`front`, `back`, `source`) must be provided.

```json
{
  "front": "string (optional, max 200 chars)",
  "back": "string (optional, max 500 chars)",
  "source": "string (optional, 'manual' | 'ai_generated' | 'ai_generated_modified')"
}
```

**Field Descriptions:**

-   `front` (string, optional): The new content for the front of the flashcard. Max 200 characters.
-   `back` (string, optional): The new content for the back of the flashcard. Max 500 characters.
-   `source` (enum string, optional): The new source of the flashcard. Allowed values:
    -   `"manual"`
    -   `"ai_generated"`
    -   `"ai_generated_modified"`

**Example Request (updating front and source):**

```json
{
  "front": "Updated capital of Poland?",
  "source": "manual"
}
```

## 4. Authentication & Authorization

-   **Authentication (Intended)**: Required. Access should be restricted to logged-in users. This will eventually be handled by Astro middleware verifying a Supabase JWT and populating `context.locals.user` and `context.locals.supabase`.
-   **Authentication (Current Temporary State)**: The endpoint currently uses a `DEFAULT_USER_ID` (defined in `src/db/supabase.client.ts`) and the global `supabaseClient` for operations. This is to facilitate frontend development.
-   **Authorization**:
    -   The user (identified by `context.locals.user.id` or `DEFAULT_USER_ID`) must be the owner of the flashcard. This is enforced by the PostgreSQL function `update_flashcard_and_manage_counts` which checks `user_id`. Row Level Security on the `flashcards` table further enforces this.

## 5. Response Details

### 5.1. Successful Response (200 OK)

Returns the updated flashcard data as a JSON object (`FlashcardDto`).

```json
{
  "id": "string (uuid)",
  "set_id": "string (uuid)",
  "user_id": "string (uuid)",
  "front": "string",
  "back": "string",
  "source": "string ('manual' | 'ai_generated' | 'ai_generated_modified')",
  "created_at": "string (timestamp with time zone)",
  "updated_at": "string (timestamp with time zone)" // Will be updated
}
```

**Example Success Response:**

```json
{
  "id": "c1d2e3f4-a5b6-7890-1234-abcdef123456",
  "set_id": "a1b2c3d4-e5f6-7890-1234-abcdef987654",
  "user_id": "1509b58d-58e9-4e18-b3c3-878d2a1004c0", // DEFAULT_USER_ID in this example
  "front": "Updated capital of Poland?",
  "back": "Warsaw",
  "source": "manual",
  "created_at": "2023-10-28T10:00:00.000Z",
  "updated_at": "2023-10-28T12:30:00.000Z"
}
```

### 5.2. Error Responses

-   **400 Bad Request:**
    -   If `flashcardId` path parameter is not a valid UUID:
        ```json
        {
          "message": "Validation failed.",
          "errors": {
            "flashcardId": "Invalid flashcard ID format. Must be a valid UUID."
          }
        }
        ```
    -   If the request body is not valid JSON:
        ```json
        { "error": "Invalid JSON in request body" }
        ```
    -   If Zod validation of the request body fails (e.g., `front` too long, invalid `source` value, or unexpected fields due to `.strict()`):
        ```json
        {
          "message": "Validation failed",
          "errors": { /* Zod error details, e.g.: */
            "front": ["String must contain at most 200 character(s)"]
          }
        }
        ```
    -   If the request body is empty (e.g., `{}`):
        ```json
        { "error": "Request body must contain at least one field to update (front, back, or source)." }
        ```
    -   If updating the flashcard would result in a duplicate `front`/`back` combination within the same set:
        ```json
        { "error": "Duplicate front/back combination in the set" }
        ```
-   **401 Unauthorized:** (Currently not actively returned due to `DEFAULT_USER_ID` fallback, but will be relevant once strict authentication is enforced.)
    ```json
    { "error": "Unauthorized" }
    ```
-   **404 Not Found:**
    -   If the flashcard specified by `flashcardId` does not exist or does not belong to the acting user:
        ```json
        { "error": "Flashcard not found or update failed" }
        ```
        *(Note: The "update failed" part might also cover scenarios where the RPC returns null for other reasons, but typically this implies not found/not authorized).*
-   **500 Internal Server Error:**
    -   For any other unexpected server-side error (e.g., database RPC call fails unexpectedly):
        ```json
        { "error": "Internal Server Error" }
        ```

## 6. Key Types Used

-   `UpdateFlashcardCommand` (Request Body): Defined in `src/types.ts`.
-   `FlashcardDto` (Response Body & underlying entity): Defined in `src/types.ts`.

## 7. Zod Schemas Used for Validation

-   `FlashcardIdSchema` (internal to the route for path param): Validates the `flashcardId` path parameter.
-   `UpdateFlashcardCommandSchema`: Validates the request body. Defined in `src/lib/schemas/flashcardSchemas.ts`.

## 8. Underlying Logic & Important Notes

-   **Transactional Processing**: The core logic of updating the flashcard and managing related counts (like `accepted_unedited_count` in `flashcard_sets`) is handled by a PostgreSQL RPC function named `update_flashcard_and_manage_counts`. This ensures atomicity.
-   **Source Field Logic**:
    -   If `source` is explicitly provided in the request, it will be used.
    -   If an `ai_generated` flashcard's `front` or `back` is modified, and no `source` is provided in the request, its `source` will automatically be changed to `ai_generated_modified`.
-   **Database Counts**: The `accepted_unedited_count` in the `flashcard_sets` table is automatically decremented if an `ai_generated` flashcard's source changes to something else (e.g. `manual` or `ai_generated_modified`). It's incremented if a card's source changes from non-`ai_generated` to `ai_generated`.
-   **Uniqueness**: The database function checks for uniqueness of (`set_id`, `front`, `back`) to prevent exact duplicates (excluding the card being updated itself).
-   **Service Layer**: The API route handler calls `flashcardService.updateFlashcard()`, which encapsulates the call to the database RPC function.