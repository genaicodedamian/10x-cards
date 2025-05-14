# API Endpoint: DELETE /api/users/me

## 1. Overview

The `DELETE /api/users/me` endpoint allows an authenticated user to permanently delete their account and all associated data. This includes their flashcard sets, individual flashcards, and any other linked information. This operation is compliant with GDPR requirements regarding the right to erasure.

## 2. Request Details

-   **HTTP Method**: `DELETE`
-   **URL Structure**: `/api/users/me`
-   **Parameters**:
    -   URL Parameters: None.
    -   Headers:
        -   `Authorization`: `Bearer <JWT_TOKEN>` (Required). Authentication is handled via a JWT token.
-   **Request Body**: None (Empty payload).

## 3. Authentication & Authorization

-   **Authentication**: Required. The endpoint is protected, and a valid JWT token for an active user session must be provided in the `Authorization` header.
-   **Authorization**: Users can only delete their own accounts. This is implicitly enforced by using the `user_id` derived from the authenticated session to perform the deletion.

## 4. Response Details

### 4.1. Successful Response

-   **Status Code**: `204 No Content`
-   **Response Body**: Empty.
    -   Description: Indicates that the user account and all associated data have been successfully deleted.

### 4.2. Error Responses

-   **Status Code**: `401 Unauthorized`
    -   **Response Body**: `{"message": "Unauthorized: User session not found or user not authenticated."}` (Or a similar message provided by the Astro middleware/handler)
    -   Description: Returned if the JWT token is missing, invalid, expired, or if the user session cannot be established.

-   **Status Code**: `500 Internal Server Error`
    -   **Response Body**: `{"message": "An error occurred while deleting your account. Please try again later."}` (Or a similar generic error message)
    -   Description: Returned if an unexpected error occurs on the server during the deletion process. This could be due to issues with the database operation or other internal service failures. Detailed error information is logged server-side but not exposed to the client.

## 5. Data Deletion Cascade

Upon successful execution of this endpoint:

-   The user record is deleted from the `auth.users` table in Supabase.
-   Associated data is handled as follows due to database schema definitions:
    -   All records in `flashcard_sets` linked to the `user_id` are deleted (`ON DELETE CASCADE`).
    -   All records in `flashcards` linked to the `user_id` (or indirectly via a `set_id` that is cascaded) are deleted (`ON DELETE CASCADE`).
    -   Any entries in `generation_error_logs` linked to the `user_id` will have their `user_id` field set to `NULL` (`ON DELETE SET NULL`).

## 6. Important Considerations

-   **Irreversible Operation**: This action is permanent and cannot be undone. Once a user account is deleted, the user and their data are irretrievably lost.
-   **Service Role Key**: The backend service (`UserService`) uses a `SUPABASE_SERVICE_ROLE_KEY` with administrative privileges to perform the user deletion in Supabase. This key is stored securely on the server and is not accessible to the client-side application.
-   **Performance**: While generally efficient, deleting a user with a very large amount of associated data (many flashcard sets and flashcards) might take a noticeable amount of time. However, correctness and security are prioritized over raw speed for this critical operation.
