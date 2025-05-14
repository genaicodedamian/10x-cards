# API Endpoint: DELETE /api/flashcards/{flashcardId}

## 1. Overview
This endpoint allows a user to delete a specific flashcard identified by its unique `flashcardId`.
The deletion is atomic and includes updating aggregated counters (`total_flashcards_count` and potentially `accepted_unedited_count`) in the parent `flashcard_sets` table.

- **Method**: `DELETE`
- **URL Structure**: `/api/flashcards/{flashcardId}`
- **Prerender**: `false` (Dynamic endpoint)

## 2. Path Parameters
- `flashcardId` (string, UUID, **required**): The unique identifier of the flashcard to be deleted. Must be a valid UUID.

## 3. Request Details
- **Headers**:
    - `Authorization: Bearer <SUPABASE_JWT>`: (Intended for future use with actual user authentication). For current testing with `DEFAULT_USER_ID`, this header is not strictly processed by the endpoint for auth, but good practice to note.
- **Body**: None.

## 4. Authentication & Authorization
- **Authentication (Intended)**: Required. Access should be restricted to logged-in users. This will eventually be handled by Astro middleware verifying a Supabase JWT and populating `context.locals.user` and `context.locals.supabase`.
- **Authentication (Current State for Development)**: The endpoint currently uses `DEFAULT_USER_ID` (from `src/db/supabase.client.ts`) and the global `supabaseClient` for operations, bypassing JWT-based user authentication from `context.locals`.
- **Authorization**:
    - The user associated with the operation (currently `DEFAULT_USER_ID`) must be the owner of the flashcard.
    - This is enforced by the PostgreSQL function `delete_flashcard_atomic` which checks `user_id` against `p_auth_user_id`.
    - Row Level Security (RLS) on the `flashcards` table further enforces ownership.

## 5. Response Details

### 5.1. Successful Response
- **Status Code**: `204 No Content`
- **Body**: Empty.

### 5.2. Error Responses
- **400 Bad Request**:
    - **Condition**: The provided `flashcardId` path parameter is not a valid UUID.
    - **Content-Type**: `application/json`
    - **Body Example**:
      ```json
      {
        "message": "Validation failed",
        "errors": {
          "flashcardId": ["Invalid flashcard ID format."]
        }
      }
      ```
- **401 Unauthorized**:
    - **Condition**: (Intended for future use) Request lacks a valid JWT, or the token is expired/invalid. Or, the user (derived from JWT) is not authorized to delete the flashcard (as per the RPC function's "unauthorized" status).
    - **Content-Type**: `application/json`
    - **Body Example (from RPC "unauthorized" status)**:
      ```json
      {
        "message": "User not authorized to delete this flashcard."
      }
      ```
    - **Body Example (general auth failure from middleware - future)**:
      ```json
      {
        "message": "Unauthorized"
      }
      ```
- **404 Not Found**:
    - **Condition**: No flashcard exists with the given `flashcardId`, or it does not belong to the acting user (as per the RPC function's "not_found" status).
    - **Content-Type**: `application/json`
    - **Body Example**:
      ```json
      {
        "message": "Flashcard not found."
      }
      ```
- **500 Internal Server Error**:
    - **Condition**: An unexpected error occurred on the server (e.g., database RPC call fails unexpectedly, or an unhandled exception in the service layer).
    - **Content-Type**: `application/json`
    - **Body Example**:
      ```json
      {
        "message": "An internal server error occurred."
      }
      ```
    - **Body Example (from RPC "error" status)**:
      ```json
      {
        "message": "An unexpected database error occurred: <SQLERRM>"
      }
      ```

## 6. Key Logic & Dependencies
- **Astro Route Handler**: `src/pages/api/flashcards/[flashcardId].ts` (handles `DELETE` method).
- **Service Layer**: `flashcardService.deleteFlashcard` in `src/lib/services/flashcardService.ts`.
    - Uses `DEFAULT_USER_ID` and global `supabaseClient`.
    - Calls the `delete_flashcard_atomic` RPC function.
- **Database RPC Function**: `public.delete_flashcard_atomic(p_flashcard_id UUID, p_auth_user_id UUID)`
    - Atomically deletes the flashcard.
    - Updates `total_flashcards_count` in `flashcard_sets`.
    - Updates `accepted_unedited_count` in `flashcard_sets` if `source` was `'ai_generated'`.
    - Performs ownership check (`v_flashcard_user_id != p_auth_user_id`).
    - Returns a JSONB status object: `{"status": "success" | "not_found" | "unauthorized" | "error", "message"?: "..."}`.
- **Input Validation**:
    - `flashcardId` is validated as a UUID using Zod schema in the Astro route handler.
- **Types**:
    - Path parameters validated against `PathParamsSchema` (Zod) in the route handler.
    - Service method returns `DeleteFlashcardResult`.
    - RPC function returns `DeleteFlashcardAtomicRpcResult` (internal service type).

## 7. Security Considerations
- **Atomicity**: Ensured by the `delete_flashcard_atomic` PostgreSQL function, which performs deletion and counter updates within a single transaction.
- **Ownership**: Enforced at the database level by the RPC function and RLS policies.
- **Input Validation**: `flashcardId` is validated to be a UUID.

## 8. Notes
- This endpoint currently relies on `DEFAULT_USER_ID` for development purposes. Full JWT-based authentication and user context from `context.locals` will be integrated later.
- The `delete_flashcard_atomic` RPC function includes detailed status returns (`not_found`, `unauthorized`, `error`) which are mapped to appropriate HTTP status codes and messages by the service and API handler.
