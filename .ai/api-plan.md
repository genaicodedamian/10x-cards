# REST API Plan

## 1. Resources

-   **Users**: Represents users of the application.
    -   Database Table: `users` (Primarily managed by Supabase Auth)
-   **FlashcardSets**: Represents sets or collections of flashcards.
    -   Database Table: `flashcard_sets`
-   **Flashcards**: Represents individual flashcards with a front (question) and back (answer).
    -   Database Table: `flashcards`
-   **AIGeneration**: Represents the AI-powered flashcard suggestion functionality.
    -   Related Database Table: `generation_error_logs` (for logging errors)


## 2. Endpoints

### User Endpoints (Managed by Supabase Auth)

Supabase Auth handles user registration, login, password reset, etc. The API will rely on Supabase for user identity. No custom endpoints are typically needed for these basic auth operations, as they are handled by the Supabase client SDK. We will define an endpoint to delete user data as per RODO.

#### `DELETE /api/users/me`

-   **Description**: Allows a logged-in user to delete their account and all associated data (flashcard sets, flashcards).
-   **HTTP Method**: `DELETE`
-   **Authentication**: Required (User must be logged in)
-   **Request Payload**: None
-   **Response Payload (Success)**:
    -   Status Code: `204 No Content`
-   **Error Responses**:
    -   `401 Unauthorized`: If the user is not authenticated.
    -   `500 Internal Server Error`: If an error occurs during deletion.

### FlashcardSet Endpoints

#### `POST /api/flashcard-sets`

-   **Description**: Creates a new flashcard set for the authenticated user.
-   **HTTP Method**: `POST`
-   **Authentication**: Required
-   **Request Payload**:
    ```json
    {
      "name": "string (required, unique per user)",
      "source_text_hash": "string (optional, SHA-256 hash of source text if set is from AI generation)",
      "source_text_length": "integer (optional, length of source text, 1000-10000 if provided)",
      "generation_duration_ms": "integer (optional, duration of AI generation if applicable)"
    }
    ```
-   **Response Payload (Success)**:
    -   Status Code: `201 Created`
    ```json
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "string",
      "accepted_unedited_count": 0,
      "total_flashcards_count": 0,
      "generation_duration_ms": "integer | null",
      "source_text_hash": "string | null",
      "source_text_length": "integer | null",
      "created_at": "timestamp",
      "updated_at": "timestamp",
      "last_studied_at": "timestamp | null"
    }
    ```
-   **Error Responses**:
    -   `400 Bad Request`: If validation fails (e.g., missing `name`, invalid `source_text_length`, duplicate name for user).
    -   `401 Unauthorized`.

#### `GET /api/flashcard-sets`

-   **Description**: Retrieves a list of flashcard sets for the authenticated user.
-   **HTTP Method**: `GET`
-   **Authentication**: Required
-   **Query Parameters**:
    -   `page`: `integer` (optional, for pagination, default: 1)
    -   `limit`: `integer` (optional, for pagination, default: 10)
    -   `sortBy`: `string` (optional, e.g., `name`, `created_at`, default: `created_at`)
    -   `order`: `string` (optional, `asc` or `desc`, default: `desc`)
-   **Response Payload (Success)**:
    -   Status Code: `200 OK`
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
      ],
      "pagination": {
        "currentPage": "integer",
        "totalPages": "integer",
        "totalItems": "integer",
        "limit": "integer"
      }
    }
    ```
-   **Error Responses**:
    -   `401 Unauthorized`.

#### `GET /api/flashcard-sets/{setId}`

-   **Description**: Retrieves a specific flashcard set by its ID.
-   **HTTP Method**: `GET`
-   **Authentication**: Required
-   **Response Payload (Success)**:
    -   Status Code: `200 OK`
    ```json
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
    ```
-   **Error Responses**:
    -   `401 Unauthorized`.
    -   `404 Not Found`: If the set does not exist or does not belong to the user.

#### `PUT /api/flashcard-sets/{setId}`

-   **Description**: Updates a specific flashcard set (e.g., rename).
-   **HTTP Method**: `PUT`
-   **Authentication**: Required
-   **Request Payload**:
    ```json
    {
      "name": "string (required, unique per user)"
    }
    ```
-   **Response Payload (Success)**:
    -   Status Code: `200 OK`
    ```json
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "string",
      "accepted_unedited_count": "integer",
      "total_flashcards_count": "integer",
      // ... other fields
      "updated_at": "timestamp"
    }
    ```
-   **Error Responses**:
    -   `400 Bad Request`: If validation fails (e.g., missing `name`, duplicate name for user).
    -   `401 Unauthorized`.
    -   `404 Not Found`.

#### `DELETE /api/flashcard-sets/{setId}`

-   **Description**: Deletes a specific flashcard set and all its associated flashcards.
-   **HTTP Method**: `DELETE`
-   **Authentication**: Required
-   **Response Payload (Success)**:
    -   Status Code: `204 No Content`
-   **Error Responses**:
    -   `401 Unauthorized`.
    -   `404 Not Found`.

### Flashcard Endpoints

#### `POST /api/flashcard-sets/{setId}/flashcards`

-   **Description**: Creates a new flashcard within a specified set.
-   **HTTP Method**: `POST`
-   **Authentication**: Required
-   **Request Payload**:
    ```json
    {
      "front": "string (required)",
      "back": "string (required)",
      "source": "string (required, 'manual' | 'ai_generated' | 'ai_generated_modified')"
    }
    ```
-   **Response Payload (Success)**:
    -   Status Code: `201 Created`
    ```json
    {
      "id": "uuid",
      "set_id": "uuid",
      "user_id": "uuid",
      "front": "string",
      "back": "string",
      "source": "string",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
    ```
-   **Error Responses**:
    -   `400 Bad Request`: Validation errors (e.g., missing fields, invalid `source`, duplicate front/back in set).
    -   `401 Unauthorized`.
    -   `404 Not Found`: If `setId` does not exist or belong to the user.

#### `POST /api/flashcard-sets/{setId}/flashcards/batch-create`

-   **Description**: Creates multiple flashcards within a specified set in a single request.
-   **HTTP Method**: `POST`
-   **Authentication**: Required
-   **Request Payload**:
    ```json
    {
      "flashcards": [
        {
          "front": "string (required)",
          "back": "string (required)",
          "source": "string (required, 'manual' | 'ai_generated' | 'ai_generated_modified')"
        }
        // ... more flashcards
      ]
    }
    ```
-   **Response Payload (Success)**:
    -   Status Code: `201 Created`
    ```json
    {
      "created_flashcards": [
        {
          "id": "uuid",
          "set_id": "uuid",
          "user_id": "uuid",
          "front": "string",
          "back": "string",
          "source": "string",
          "created_at": "timestamp",
          "updated_at": "timestamp"
        }
      ],
      "errors": [ // Optional: if some creations failed within the batch
        {
          "input_flashcard": { /* original input data */ },
          "error_message": "string"
        }
      ]
    }
    ```
-   **Error Responses**:
    -   `400 Bad Request`: General validation errors for the batch or individual items.
    -   `401 Unauthorized`.
    -   `404 Not Found`: If `setId` does not exist or belong to the user.

#### `GET /api/flashcard-sets/{setId}/flashcards`

-   **Description**: Retrieves flashcards within a specific set.
-   **HTTP Method**: `GET`
-   **Authentication**: Required
-   **Query Parameters**:
    -   `page`: `integer` (optional, default: 1)
    -   `limit`: `integer` (optional, default: 10)
    -   `sortBy`: `string` (optional, e.g., `created_at`, default: `created_at`)
    -   `order`: `string` (optional, `asc` or `desc`, default: `asc`)
    -   `filter_source`: `string` (optional, e.g., `manual`, `ai_generated`)
-   **Response Payload (Success)**:
    -   Status Code: `200 OK`
    ```json
    {
      "data": [
        {
          "id": "uuid",
          "set_id": "uuid",
          "user_id": "uuid",
          "front": "string",
          "back": "string",
          "source": "string",
          "created_at": "timestamp",
          "updated_at": "timestamp"
        }
      ],
      "pagination": {
        "currentPage": "integer",
        "totalPages": "integer",
        "totalItems": "integer",
        "limit": "integer"
      }
    }
    ```
-   **Error Responses**:
    -   `401 Unauthorized`.
    -   `404 Not Found`: If `setId` does not exist or belong to the user.

#### `GET /api/flashcards/{flashcardId}`

-   **Description**: Retrieves a specific flashcard by its ID.
-   **HTTP Method**: `GET`
-   **Authentication**: Required
-   **Response Payload (Success)**:
    -   Status Code: `200 OK`
    ```json
    {
      "id": "uuid",
      "set_id": "uuid",
      "user_id": "uuid",
      "front": "string",
      "back": "string",
      "source": "string",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
    ```
-   **Error Responses**:
    -   `401 Unauthorized`.
    -   `404 Not Found`: If the flashcard does not exist or does not belong to the user.

#### `PUT /api/flashcards/{flashcardId}`

-   **Description**: Updates a specific flashcard.
-   **HTTP Method**: `PUT`
-   **Authentication**: Required
-   **Request Payload**:
    ```json
    {
      "front": "string (optional)",
      "back": "string (optional)",
      "source": "string (optional, 'manual' | 'ai_generated' | 'ai_generated_modified')"
    }
    ```
-   **Response Payload (Success)**:
    -   Status Code: `200 OK`
    ```json
    {
      "id": "uuid",
      "set_id": "uuid",
      "user_id": "uuid",
      "front": "string",
      "back": "string",
      "source": "string",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
    ```
-   **Error Responses**:
    -   `400 Bad Request`: Validation errors (e.g. duplicate front/back in set if changed).
    -   `401 Unauthorized`.
    -   `404 Not Found`.

#### `DELETE /api/flashcards/{flashcardId}`

-   **Description**: Deletes a specific flashcard.
-   **HTTP Method**: `DELETE`
-   **Authentication**: Required
-   **Response Payload (Success)**:
    -   Status Code: `204 No Content`
-   **Error Responses**:
    -   `401 Unauthorized`.
    -   `404 Not Found`.

#### `POST /api/flashcards/{flashcardId}/regenerate`

-   **Description**: Regenerates a specific AI-generated flashcard using LLM.
-   **HTTP Method**: `POST`
-   **Authentication**: Required
-   **Request Payload**:
    ```json
    {
      "model_preference": "string (optional, e.g., 'gpt-4-mini', 'claude-3-haiku')"
    }
    ```
-   **Response Payload (Success)**:
    -   Status Code: `200 OK`
    ```json
    {
      "id": "uuid",
      "set_id": "uuid",
      "user_id": "uuid",
      "front": "string",
      "back": "string",
      "source": "ai_generated",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
    ```
-   **Error Responses**:
    -   `400 Bad Request`: If the flashcard is not AI-generated.
    -   `401 Unauthorized`.
    -   `404 Not Found`: If the flashcard doesn't exist or belong to the user.
    -   `429 Too Many Requests`: If rate limits are exceeded.
    -   `500 Internal Server Error`: If LLM service fails.
    -   `503 Service Unavailable`: If the LLM service is temporarily unavailable.

### AI Generation Endpoints

#### `POST /api/ai/generate-flashcards`

-   **Description**: Generates flashcard suggestions from a given text using an LLM. These are proposals and not persisted flashcards.
-   **HTTP Method**: `POST`
-   **Authentication**: Required
-   **Request Payload**:
    ```json
    {
      "text": "string (required, length between 1000 and 10000 characters)",
    }
    ```
-   **Response Payload (Success)**:
    -   Status Code: `200 OK`
    ```json
    {
      "suggestions": [
        {
          "front": "string (max 200 characters)",
          "back": "string (max 500 characters)",
          "validation_status": "string (enum: 'valid', 'truncated', 'rejected')",
          "validation_message": "string (optional, explains truncation/rejection reason)"
        }
        // ... more suggestions
      ],
      "metadata": {
        "source_text_hash": "string (SHA-256 of input text)",
        "source_text_length": "integer",
        "generation_duration_ms": "integer",
        "model_used": "string",
        "truncated_count": "integer",
        "rejected_count": "integer",
        "total_suggestions": "integer"
      }
    }
    ```
-   **Error Responses**:
    -   `400 Bad Request`: If `text` validation fails.
    -   `401 Unauthorized`.
    -   `429 Too Many Requests`: If rate limits are exceeded.
    -   `500 Internal Server Error`: If LLM service fails or other internal error. (Backend logs to `generation_error_logs`)
    -   `503 Service Unavailable`: If the LLM service is temporarily unavailable.

## 3. Authentication and Authorization

-   **Authentication Mechanism**: Supabase Auth will be used. Clients (Astro frontend) will use the Supabase client library to handle user registration, login, and session management (JWTs).
-   **Implementation Details**:
    -   API endpoints (Astro API routes) will expect a JWT in the `Authorization` header (`Bearer <token>`).
    -   On the server-side, the Supabase Admin SDK or a server client will be used to verify the JWT and retrieve the authenticated user's ID (`auth.uid()`).
    -   This `user_id` will be used in database queries to ensure users can only access their own data.
-   **Authorization**:
    -   Primarily enforced by PostgreSQL Row Level Security (RLS) policies defined in the database schema (`.ai/db-plan.md`).
    -   Policies ensure that `SELECT`, `INSERT`, `UPDATE`, `DELETE` operations on `flashcard_sets`, `flashcards`, and `generation_error_logs` are scoped to the `user_id` matching `auth.uid()`.

## 4. Validation and Business Logic

### a. Input Validation

-   **`POST /api/ai/generate-flashcards`**:
    -   `text`: Required, string, length between 1000 and 10000 characters.
-   **`POST /api/flashcard-sets`**:
    -   `name`: Required, string. Must be unique per user (enforced by DB constraint `UNIQUE (user_id, name)`).
    -   `source_text_length`: Optional, integer. If provided, must be between 1000 and 10000 (DB constraint).
-   **`PUT /api/flashcard-sets/{setId}`**:
    -   `name`: Required, string. Must be unique per user.
-   **`POST /api/flashcard-sets/{setId}/flashcards` (and batch create items)**:
    -   `front`: Required, string, maximum length 200 characters.
    -   `back`: Required, string, maximum length 500 characters.
    -   `source`: Required, string, must be one of `'manual'`, `'ai_generated'`, `'ai_generated_modified'` (DB constraint).
    -   Uniqueness of `(set_id, front, back)` is recommended by DB plan (index `idx_flashcards_set_front_back_unique`). API should check or rely on DB error.
-   **`PUT /api/flashcards/{flashcardId}`**:
    -   If `front` and/or `back` are changed, check uniqueness for `(set_id, front, back)`.
    -   If `front` is provided, maximum length 200 characters.
    -   If `back` is provided, maximum length 500 characters.
    -   If `source` is provided, must be one of `'manual'`, `'ai_generated'`, `'ai_generated_modified'`.

### b. Business Logic Implementation

1.  **AI Flashcard Generation (`POST /api/ai/generate-flashcards`)**:
    -   The backend service receives the text.
    -   It calls the Openrouter.ai API with the text and any model preferences.
    -   Handles responses from Openrouter, including errors.
    -   If Openrouter call fails, logs details to `generation_error_logs` table (including `user_id`, `model` used, `source_text_hash`, `source_text_length`, `error_code`, `error_message`).
    -   For successful responses, validates each generated flashcard proposal:
        -   Checks if front side exceeds 200 characters or back side exceeds 500 characters.
        -   If limits are exceeded, implements fallback strategy:
            -   Truncates content to the maximum allowed length while preserving complete sentences.
            -   If truncation would break meaning, marks the flashcard for rejection.
    -   Formats validated suggestions and metadata for the client.

2.  **Flashcard Set Count Maintenance**:
    -   The `accepted_unedited_count` and `total_flashcards_count` fields in the `flashcard_sets` table must be updated by application logic:
        -   When a flashcard is created via `POST /api/flashcard-sets/{setId}/flashcards` or `POST /api/flashcard-sets/{setId}/flashcards/batch-create`:
            -   Increment `total_flashcards_count`.
            -   If `source` is `'ai_generated'`, increment `accepted_unedited_count`.
        -   When a flashcard is deleted via `DELETE /api/flashcards/{flashcardId}`:
            -   Decrement `total_flashcards_count`.
            -   If original `source` was `'ai_generated'`, decrement `accepted_unedited_count`.
        -   When a flashcard is updated via `PUT /api/flashcards/{flashcardId}` and its `source` changes:
            -   If old `source` was `'ai_generated'` and new `source` is not, decrement `accepted_unedited_count`.
            -   If old `source` was not `'ai_generated'` and new `source` is, increment `accepted_unedited_count`.

4.  **Flashcard Source Update on Edit (`PUT /api/flashcards/{flashcardId}`)**:
    -   If a flashcard with `source = 'ai_generated'` is edited (its `front` or `back` content changes), the backend logic should automatically update its `source` to `'ai_generated_modified'`. This should be sent by the client or inferred by the backend if only `front`/`back` are provided for an `ai_generated` card. It's safer if client explicitly sends the new source if it changes. The API definition allows the client to send the `source`.

5.  **User Data Deletion (`DELETE /api/users/me`)**:
    -   The backend will ensure all `flashcard_sets` and `flashcards` linked to the `user_id` are deleted (cascading deletes in DB handle this for `flashcard_sets` -> `flashcards`).
    -   For `generation_error_logs`, the `user_id` is set to `NULL` due to `ON DELETE SET NULL`.
    -   Finally, the user record in `auth.users` is deleted via Supabase admin functions.

6.  **Error Logging**:
    -   As mentioned in AI Generation, critical errors (especially from third-party services like LLMs) are logged to `generation_error_logs` with relevant context for debugging and monitoring.

This API plan provides a comprehensive structure for the 10x-cards application, aligning with the PRD, database schema, and tech stack. 