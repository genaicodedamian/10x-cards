# API Endpoint: GET /api/flashcard-sets

## 1. Overview

The `GET /api/flashcard-sets` endpoint allows authenticated users to retrieve a paginated and sortable list of their flashcard sets.

**Note on Authentication (Current State):** For development and UI testing purposes, this endpoint is temporarily configured to use a `DEFAULT_USER_ID` if no authenticated user session is found or if the standard authentication check is bypassed. The plan is to revert to strict JWT-based authentication enforcement once the frontend authentication flow is fully implemented.

## 2. Request Details

-   **HTTP Method**: `GET`
-   **URL Structure**: `/api/flashcard-sets`
-   **Query Parameters**:
    -   `page`: `integer` (optional, default: `1`) - The page number for pagination.
    -   `limit`: `integer` (optional, default: `10`, max: `100`) - The number of items per page.
    -   `sort_by`: `string` (optional, default: `created_at`) - The field to sort the results by. Allowed values: `name`, `created_at`, `updated_at`, `last_studied_at`.
    -   `order`: `string` (optional, default: `desc`) - The sort order. Allowed values: `asc`, `desc`.
-   **Headers**:
    -   (Implicit) `Cookie`: Contains `sb-access-token` if the user is logged in via Supabase client-side auth. The middleware uses this token.
-   **Request Body**: None.

## 3. Authentication & Authorization

-   **Authentication (Intended)**: Required. Access should be restricted to logged-in users. This is handled by Astro middleware verifying a Supabase JWT from cookies and populating `context.locals.user`.
-   **Authentication (Current Temporary State)**: If `context.locals.user` is not populated by the middleware (or if the check is bypassed in the handler), the endpoint currently falls back to using a `DEFAULT_USER_ID` to fetch flashcard sets. This is to facilitate frontend development without requiring a full login flow immediately.
-   **Authorization**: Users can only retrieve their own flashcard sets. This is enforced by filtering queries by `user_id` (either the authenticated user's ID or the `DEFAULT_USER_ID` in the current temporary state) and is further backed by Supabase Row Level Security (RLS) policies on the `flashcard_sets` table (e.g., `USING (auth.uid() = user_id)`).

## 4. Response Details

### 4.1. Successful Response (200 OK)

Returns a JSON object (`PaginatedFlashcardSetsDto`) containing an array of flashcard sets and pagination information.

```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "string",
      "accepted_unedited_count": "integer",
      "total_flashcards_count": "integer",
      "generation_duration_ms": "integer | null",
      "source_text_hash": "string | null",
      "source_text_length": "integer | null",
      "created_at": "timestamp",
      "updated_at": "timestamp",
      "last_studied_at": "timestamp | null"
    }
    // ... other flashcard sets
  ],
  "pagination": {
    "current_page": "integer",
    "total_pages": "integer",
    "total_items": "integer",
    "limit": "integer"
  }
}
```

-   `data`: An array of `FlashcardSetDto` objects.
-   `pagination`: A `PaginationInfoDto` object.

### 4.2. Error Responses

-   **Status Code**: `400 Bad Request`
    -   **Response Body**: `{"message": "Bad Request", "errors": { "field_name": ["error message"] }}`
    -   Description: Returned if query parameters fail validation (e.g., invalid `page` format, `limit` out of range, invalid `sort_by` or `order` values). The `errors` object contains details from Zod validation.

-   **Status Code**: `401 Unauthorized`
    -   **Response Body**: `{"message": "Unauthorized"}`
    -   Description: Returned if the user is not authenticated and the endpoint is configured to strictly require authentication (i.e., not in the temporary `DEFAULT_USER_ID` fallback mode).

-   **Status Code**: `500 Internal Server Error`
    -   **Response Body**: `{"message": "Internal Server Error"}` or `{"message": "Internal Server Error: Supabase client missing"}`
    -   Description: Returned for unexpected server-side errors, such as issues with database communication or if the Supabase client is not available in `context.locals`.

## 5. Zod Schema (Query Parameter Validation)

The following Zod schema (`GetFlashcardSetsQuerySchema` from `src/lib/schemas/flashcardSetSchemas.ts`) is used for validating query parameters:

```typescript
import { z } from 'zod';

const GetFlashcardSetsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10).transform(val => Math.min(val, 100)), // Max limit 100
  sort_by: z.enum(['name', 'created_at', 'updated_at', 'last_studied_at']).optional().default('created_at'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});
```

## 6. Types Used

Key data structures for this endpoint are defined in `src/types.ts`:

-   `FlashcardSetDto`: Represents a single flashcard set.
-   `PaginationInfoDto`: Represents pagination metadata.
-   `PaginatedFlashcardSetsDto`: Represents the overall structure of the successful response.

## 7. Dependencies

-   Astro Middleware (`src/middleware/index.ts`): Handles setting up `context.locals.supabase` and `context.locals.user`.
-   `FlashcardSetService` (`src/lib/services/flashcardSetService.ts`): Contains the business logic for fetching flashcard sets from the database.
-   `GetFlashcardSetsQuerySchema` (`src/lib/schemas/flashcardSetSchemas.ts`): For query parameter validation.
