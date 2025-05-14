# API Endpoint: PUT /api/flashcard-sets/{setId}

## 1. Overview

The `PUT /api/flashcard-sets/{setId}` endpoint allows authenticated users to update an existing flashcard set, primarily its name. The flashcard set is identified by the `setId` path parameter.

**Note on Authentication (Current State):** Similar to other endpoints, for development and UI testing, this endpoint temporarily uses a `DEFAULT_USER_ID` if no authenticated user session is found. The plan is to enforce strict JWT-based authentication once the frontend authentication flow is fully implemented.

## 2. Request Details

-   **HTTP Method**: `PUT`
-   **URL Structure**: `/api/flashcard-sets/{setId}`
-   **Path Parameters**:
    -   `setId` (string, UUID, required): The unique identifier of the flashcard set to be updated.
-   **Headers**:
    -   `Content-Type`: `application/json` (required)
-   **Request Body (JSON)**:
    The request body must be a JSON object with the following structure, conceptually mapping to an `UpdateFlashcardSetCommand` (though the specific command type isn't directly used in the handler, `UpdateFlashcardSetBodySchema` validates the body).

    ```json
    {
      "name": "string (required, unique per user for active sets)"
    }
    ```
    -   `name`: The new name for the flashcard set. It must be unique for the given user (excluding the set being updated if the name remains unchanged). Must not be empty and has a maximum length of 255 characters.

    **Example Request:**
    ```json
    {
      "name": "Updated Ancient History Trivia"
    }
    ```

## 3. Authentication & Authorization

-   **Authentication (Intended)**: Required. Access should be restricted to logged-in users, handled by Astro middleware verifying a Supabase JWT.
-   **Authentication (Current Temporary State)**: If `context.locals.user` is not populated, the endpoint falls back to using `DEFAULT_USER_ID` (from `src/db/supabase.client.ts`).
-   **Authorization**: Users can only update their own flashcard sets. This is enforced by:
    1.  The `FlashcardSetService` querying the database with both `setId` and `user_id`.
    2.  Supabase Row Level Security (RLS) policies on the `flashcard_sets` table (e.g., `USING (auth.uid() = user_id)`).

## 4. Response Details

### 4.1. Successful Response (200 OK)

Returns the updated flashcard set object (`FlashcardSetDto`).

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "string", // The new, updated name
  "accepted_unedited_count": "integer",
  "total_flashcards_count": "integer",
  "generation_duration_ms": "integer | null",
  "source_text_hash": "string | null",
  "source_text_length": "integer | null",
  "created_at": "timestamp",
  "updated_at": "timestamp", // This will reflect the time of the update
  "last_studied_at": "timestamp | null"
}
```
**Example Success Response (200 OK):**
```json
{
  "id": "a1b2c3d4-1234-5678-abcd-abcdef123456",
  "user_id": "1509b58d-58e9-4e18-b3c3-878d2a1004c0", // Example DEFAULT_USER_ID
  "name": "Updated Ancient History Trivia",
  "accepted_unedited_count": 0,
  "total_flashcards_count": 5,
  "generation_duration_ms": null,
  "source_text_hash": null,
  "source_text_length": null,
  "created_at": "2023-10-27T10:00:00.000Z",
  "updated_at": "2023-10-28T12:30:00.000Z", // Updated timestamp
  "last_studied_at": null
}
```

### 4.2. Error Responses

-   **Status Code**: `400 Bad Request`
    -   **Invalid JSON in Request Body**:
        ```json
        {
          "message": "Nieprawidłowy format JSON w ciele żądania."
        }
        ```
    -   **Path Parameter Validation Error** (e.g., `setId` is not a UUID):
        ```json
        {
          "message": "Błąd walidacji parametrów ścieżki.",
          "errors": {
            "setId": ["Nieprawidłowy format UUID dla setId."] // Example from Zod
          }
        }
        ```
    -   **Request Body Validation Error** (e.g., `name` is missing, empty, or too long):
        ```json
        {
          "message": "Błąd walidacji ciała żądania.",
          "errors": {
            "name": ["Nazwa jest wymagana i nie może być pusta."] // Example
          }
        }
        ```
    -   **Duplicate Set Name for User**:
        ```json
        {
          "message": "Zestaw o tej nazwie już istnieje dla tego użytkownika."
        }
        ```
-   **Status Code**: `401 Unauthorized`
    -   **Response Body**: `{"message": "Brak autoryzacji: Nie udało się zidentyfikować użytkownika."}`
    -   Description: Returned if `userId` cannot be determined (e.g. `DEFAULT_USER_ID` is somehow missing and no user session). (This is a safeguard; typical 401 for missing JWT will be handled by middleware once fully active).
-   **Status Code**: `404 Not Found`
    -   **Response Body**: `{"message": "Nie znaleziono zestawu fiszek."}`
    -   Description: Returned if the flashcard set with the given `setId` does not exist or does not belong to the authenticated user.
-   **Status Code**: `500 Internal Server Error`
    -   **Response Body (Supabase client missing)**: `{"message": "Wewnętrzny błąd serwera: Klient Supabase niedostępny."}`
    -   **Response Body (Other server errors)**: `{"message": "Wewnętrzny błąd serwera."}`
    -   Description: For unexpected server-side errors or database issues not otherwise handled.

## 5. Zod Schemas Used

-   `UpdateFlashcardSetParamsSchema` (from `src/lib/schemas/flashcardSetSchemas.ts`): Validates the `setId` path parameter.
-   `UpdateFlashcardSetBodySchema` (from `src/lib/schemas/flashcardSetSchemas.ts`): Validates the request body (`name`).

## 6. Types Used

-   `FlashcardSetDto` (from `src/types.ts`): Represents a single flashcard set in responses.
-   Conceptually, the request body aligns with `UpdateFlashcardSetCommand` (from `src/types.ts`), though the handler uses Zod directly.

## 7. Dependencies

-   Astro Middleware (`src/middleware/index.ts`): Expected to handle Supabase client setup (`context.locals.supabase`) and user authentication (`context.locals.user`).
-   `FlashcardSetService` (`src/lib/services/flashcardSetService.ts`): Contains the business logic for updating the flashcard set.
-   Zod Schemas (`src/lib/schemas/flashcardSetSchemas.ts`): For input validation.
