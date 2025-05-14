# API Endpoint: GET /api/flashcard-sets/{setId}/flashcards

## 1. Overview
This endpoint allows authenticated users to retrieve a list of flashcards belonging to a specific set (`setId`). It supports pagination, sorting, and filtering of flashcards by their source.

## 2. Request Details
-   **HTTP Method**: `GET`
-   **URL Structure**: `/api/flashcard-sets/{setId}/flashcards`
-   **Parameters**:
    -   **Path Parameters**:
        -   `setId` (UUID string, **Required**): The identifier of the flashcard set.
    -   **Query Parameters (Optional)**:
        -   `page` (integer, default: 1): Page number for pagination.
        -   `limit` (integer, default: 10, max: 100): Number of flashcards per page.
        -   `sort_by` (string, default: `created_at`): Field to sort results by. Allowed values: `created_at`, `updated_at`, `front`, `back`, `source`.
        -   `order` (string, default: `asc`): Sort direction. Allowed values: `asc`, `desc`.
        -   `filter_source` (string): Filters flashcards by source. Allowed values: `manual`, `ai_generated`, `ai_generated_modified`.
-   **Request Body**: None (for GET requests).

## 3. Used Types
-   **DTOs (Data Transfer Objects)** from `src/types.ts`:
    -   `FlashcardDto`: Represents a single flashcard.
    -   `PaginationInfoDto`: Contains pagination information.
    -   `PaginatedFlashcardsDto`: Main response DTO, containing a list of flashcards and pagination info.

## 4. Response Details
-   **Success (`200 OK`)**:
    ```json
    {
      "data": [
        {
          "id": "uuid",
          "set_id": "uuid",
          "user_id": "uuid",
          "front": "string",
          "back": "string",
          "source": "string ('manual' | 'ai_generated' | 'ai_generated_modified')",
          "created_at": "timestamp",
          "updated_at": "timestamp"
        }
        // ... more flashcards
      ],
      "pagination": {
        "current_page": 1,
        "total_pages": 5,
        "total_items": 48,
        "limit": 10
      }
    }
    ```
-   **Errors**:
    -   `400 Bad Request`: Invalid request parameters (e.g., validation error for `setId`, `page`, `limit`, `sort_by`, `order`, `filter_source`). Response body includes validation error details.
        ```json
        {
          "message": "Validation failed",
          "errors": {
            "setId": ["Invalid Set ID format"] 
            // or other field errors
          }
        }
        ```
    -   `401 Unauthorized`: (To be fully implemented) User is not authenticated.
    -   `404 Not Found`: The flashcard set with the given `setId` does not exist or does not belong to the authenticated user.
        ```json
        {
          "message": "Flashcard set with ID {setId} not found or user {userId} does not have access."
        }
        ```
    -   `500 Internal Server Error`: An internal server error occurred (e.g., database connectivity issue).
        ```json
        {
          "message": "Database error while fetching flashcards: {specific_error_message}" 
          // or "An internal server error occurred"
        }
        ```

## 5. Data Flow & Implementation Notes
1.  The `GET` request hits the Astro API route `src/pages/api/flashcard-sets/[setId]/flashcards.ts`.
2.  Authentication (currently uses `DEFAULT_USER_ID` from `src/db/supabase.client.ts` for development; will be replaced with JWT verification via Astro middleware and `context.locals.user`). Supabase client is used directly (`supabaseClient` from `src/db/supabase.client.ts` instead of `context.locals.supabase`).
3.  The API route handler:
    a.  Retrieves `setId` from `Astro.params` and query parameters from `Astro.url.searchParams`.
    b.  Validates `setId` using `pathParamsSchema` (Zod schema).
    c.  Validates query parameters using `queryParamsSchema` (Zod schema).
    d.  If validation fails, returns a `400 Bad Request` with error details.
    e.  Calls `flashcardService.getFlashcardsInSet(DEFAULT_USER_ID, setId, validatedQueryParams)`.
4.  **Service Logic (`FlashcardService` in `src/lib/services/flashcardService.ts`)**:
    a.  **Set Ownership Verification**: Checks if the flashcard set (`flashcard_sets` table) with `setId` exists and belongs to `DEFAULT_USER_ID`. If not, throws `FlashcardSetNotFoundError`.
    b.  **Fetching Flashcards**: Constructs a Supabase query to the `flashcards` table:
        -   Filters by `set_id` and `user_id` (`DEFAULT_USER_ID`).
        -   Applies `filter_source` if provided.
        -   Applies sorting (`sort_by`, `order`).
        -   Applies pagination (`range` from `page` and `limit`).
        -   Uses `select('*', { count: 'exact' })` to get flashcards and the total count.
    c.  If a database error occurs during fetching, throws a generic `Error`.
    d.  **Pagination Metadata**: Calculates `total_pages`.
    e.  Returns a `PaginatedFlashcardsDto` object containing `data: FlashcardDto[]` and `pagination: PaginationInfoDto`.
5.  The API route handler receives the result from the service:
    a.  If successful, returns a `200 OK` response with the `PaginatedFlashcardsDto`.
    b.  If `FlashcardSetNotFoundError` is caught, returns a `404 Not Found`.
    c.  If any other error is caught, returns a `500 Internal Server Error`.
6.  `export const prerender = false;` is set in the API route file.

## 6. Security Considerations
-   **Authentication**: Currently relies on `DEFAULT_USER_ID`. Will be updated to use Supabase JWTs and Astro middleware.
-   **Authorization**:
    -   RLS policies on `flashcard_sets` and `flashcards` tables ensure users can only access their own data.
    -   The service explicitly checks `user_id` in queries as a defense-in-depth measure.
-   **Input Validation**: Zod schemas validate path and query parameters to prevent injection and invalid data. `setId` is validated as UUID. `limit` has a max value (100).
-   **Error Information**: Generic error messages for 500 errors.

## 7. Performance Considerations
-   **Database Indexes**: Assumes indexes exist on `flashcard_sets(id, user_id)` and `flashcards(set_id, user_id, source, created_at, updated_at)`.
-   **Pagination**: Implemented using `range` and `count` for efficiency.
