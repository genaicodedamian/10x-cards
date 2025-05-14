# API Endpoint: GET /api/flashcards/{flashcardId}

## Overview
This endpoint retrieves a single flashcard based on its unique identifier (`flashcardId`). It requires user authentication and returns the flashcard data if the authenticated user is the owner of the flashcard.

## Request Details
-   **HTTP Method**: `GET`
-   **URL Structure**: `/api/flashcards/{flashcardId}`
-   **Path Parameters**:
    -   `flashcardId` (string, UUID): **Required**. The unique identifier of the flashcard.
-   **Query Parameters**: None
-   **Request Body**: None

## Authentication
-   **Required**: Yes
-   Authentication is handled via a JWT bearer token provided in the `Authorization` header.
-   The middleware (`src/middleware/index.ts`) is responsible for validating the token and making user information available in `context.locals.user`.
-   The Supabase client obtained from `context.locals.supabase` is already authenticated in the context of the user.

## Response Details

### Success Response (200 OK)
Returns the flashcard data as a JSON object.
**Content-Type**: `application/json`
**Body**: `FlashcardDto`
```json
{
  "id": "string (uuid)",
  "set_id": "string (uuid)",
  "user_id": "string (uuid)",
  "front": "string",
  "back": "string",
  "source": "string ('manual' | 'ai_generated' | 'ai_generated_modified')",
  "created_at": "string (timestamp with time zone)",
  "updated_at": "string (timestamp with time zone)"
}
```
*(The `FlashcardDto` type corresponds to the `flashcards` table schema defined in `src/types.ts` as `Tables<'flashcards'>`)*

### Error Responses
-   **400 Bad Request**:
    -   **Condition**: The provided `flashcardId` is not a valid UUID.
    -   **Content-Type**: `application/json`
    -   **Body**:
        ```json
        {
          "message": "Validation failed.",
          "errors": {
            "flashcardId": "Invalid flashcard ID format. Must be a valid UUID."
          }
        }
        ```
        *(Note: The exact error message from Zod validation might vary slightly but will indicate the nature of the validation failure.)*

-   **401 Unauthorized**:
    -   **Condition**: The request lacks a valid JWT, or the token is expired/invalid. (Handled by Astro middleware and potentially by an explicit check in the route).
    -   **Content-Type**: `application/json`
    -   **Body**:
        ```json
        {
          "error": "Unauthorized" 
        }
        ```
        *(Or a similar message provided by the authentication middleware or route handler)*

-   **404 Not Found**:
    -   **Condition**: No flashcard exists with the given `flashcardId`, or the flashcard does not belong to the authenticated user.
    -   **Content-Type**: `application/json`
    -   **Body**:
        ```json
        {
          "error": "Flashcard not found"
        }
        ```

-   **500 Internal Server Error**:
    -   **Condition**: An unexpected error occurred on the server (e.g., database connectivity issue, unhandled exception in the service layer).
    -   **Content-Type**: `application/json`
    -   **Body**:
        ```json
        {
          "error": "Internal Server Error"
        }
        ```

## Data Flow and Logic
1.  Client sends a `GET` request to `/api/flashcards/{flashcardId}` with a JWT in the `Authorization` header.
2.  Astro middleware validates the JWT. If invalid, it typically returns a `401 Unauthorized` response. If valid, `context.locals.user` (containing user details like `id`) and `context.locals.supabase` (authenticated Supabase client) are populated.
3.  The API route handler in `src/pages/api/flashcards/[flashcardId].ts` is invoked.
4.  The `flashcardId` path parameter is extracted from `params`.
5.  The `flashcardId` is validated using a Zod schema (`z.string().uuid()`). If validation fails, a `400 Bad Request` is returned.
6.  (Implicit) If `context.locals.user` is not present (though middleware should handle this), a `401 Unauthorized` might be returned by an explicit check in the handler. For the current implementation (as per the diff), `DEFAULT_USER_ID` is used, bypassing this specific check for an authenticated user from context. *This should be updated once actual user authentication is fully integrated into this endpoint.*
7.  The `flashcardService.getFlashcardById(supabase, flashcardId, userId)` method is called.
    -   `supabase`: The Supabase client (currently `supabaseClient` imported directly, planned to be from `locals.supabase`).
    -   `flashcardId`: The validated ID from the path.
    -   `userId`: The authenticated user's ID (currently `DEFAULT_USER_ID`, planned to be from `locals.user.id`).
8.  The `flashcardService` performs a database query:
    ```sql
    SELECT * FROM flashcards WHERE id = {flashcardId} AND user_id = {userId} LIMIT 1;
    ```
    Row Level Security (RLS) policies on the `flashcards` table also enforce that `auth.uid() = user_id`.
9.  Service method behavior:
    -   If the flashcard is found and belongs to the user, it returns the `FlashcardDto`.
    -   If the flashcard is not found (or doesn't belong to the user, leading to 0 rows), it returns `null`.
    -   If a database error occurs (other than '0 rows found'), it throws an error.
10. API route handler response logic:
    -   If the service returns a `FlashcardDto`, the handler sends a `200 OK` response with the DTO as JSON.
    -   If the service returns `null`, the handler sends a `404 Not Found` response.
    -   If the service throws an error, the handler catches it and sends a `500 Internal Server Error` response.

## Security Considerations
-   **Authentication**: Enforced by Astro middleware (JWT).
-   **Authorization**: Primarily handled by RLS policies on the `flashcards` table (`USING (auth.uid() = user_id)`). The service query explicitly includes `AND user_id = {userId}` as a defense-in-depth measure.
-   **Input Validation**: `flashcardId` is validated as a UUID using Zod to prevent invalid queries.
-   **IDOR Protection**: Achieved through RLS and the `user_id` check in the query.

## Performance
-   The database query uses the primary key (`id`) and an indexed column (`user_id`), ensuring efficient lookup.
-   The response payload is small (single flashcard).
-   No significant performance bottlenecks are anticipated.

## Implementation Files
-   **API Route Handler**: `src/pages/api/flashcards/[flashcardId].ts`
-   **Service Logic**: `src/lib/services/flashcardService.ts` (method: `getFlashcardById`)
-   **Types**: `src/types.ts` (for `FlashcardDto`, `Tables<'flashcards'>`)
-   **Database Schema & RLS**: Defined in Supabase.

## Notes on Current Implementation (based on recent changes)
-   The API route `src/pages/api/flashcards/[flashcardId].ts` currently uses a `DEFAULT_USER_ID` and imports `supabaseClient` directly. The plan is to transition to using `context.locals.user.id` for the user ID and `context.locals.supabase` for the Supabase client once authentication middleware fully provisions them for this route.
-   The `flashcardService.getFlashcardById` method correctly implements the logic to fetch a flashcard by its ID and user ID, handling cases where the flashcard is not found or a database error occurs.

This documentation reflects the endpoint as described in the implementation plan and considering the recent code changes in the provided files.
