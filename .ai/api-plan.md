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
-   **Business Logic**:
    -   The system verifies the authenticated user via JWT (`auth.uid()`).
    -   All `flashcard_sets` and `flashcards` linked to the user's `user_id` are deleted. This is handled by cascading deletes defined in the database schema (`flashcard_sets.user_id` references `auth.users(id) ON DELETE CASCADE`, and `flashcards.set_id` references `flashcard_sets(id) ON DELETE CASCADE`).
    -   For any entries in `generation_error_logs` associated with the user, the `user_id` field is set to `NULL` due to the `ON DELETE SET NULL` constraint, preserving the logs anonymously.
    -   Finally, the user's record in the `auth.users` table is deleted using Supabase admin functions. This action is irreversible and complies with RODO requirements for data deletion (US-001, US-009).

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
-   **Business Logic**:
    -   The system verifies the authenticated user.
    -   Input validation:
        -   `name` is required and must be unique for the authenticated user (enforced by the `UNIQUE (user_id, name)` database constraint on `flashcard_sets`).
        -   `source_text_length`, if provided, must be between 1000 and 10000 characters (enforced by a `CHECK` constraint in the database).
    -   A new record is inserted into the `flashcard_sets` table, with `user_id` set to the authenticated user's ID.
    -   `accepted_unedited_count` and `total_flashcards_count` are initialized to `0`.
    -   The `created_at` and `updated_at` timestamps are set automatically by the database (default `NOW()`).
    -   The newly created flashcard set object is returned.

#### `GET /api/flashcard-sets`

-   **Description**: Retrieves a list of flashcard sets for the authenticated user.
-   **HTTP Method**: `GET`
-   **Authentication**: Required
-   **Query Parameters**:
    -   `page`: `integer` (optional, for pagination, default: 1)
    -   `limit`: `integer` (optional, for pagination, default: 10)
    -   `sort_by`: `string` (optional, e.g., `name`, `created_at`, default: `created_at`)
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
        "current_page": "integer",
        "total_pages": "integer",
        "total_items": "integer",
        "limit": "integer"
      }
    }
    ```
-   **Error Responses**:
    -   `401 Unauthorized`.
-   **Business Logic**:
    -   The system verifies the authenticated user.
    -   Retrieves flashcard sets from the `flashcard_sets` table where `user_id` matches the authenticated user's ID. PostgreSQL Row Level Security (RLS) policies ensure users can only select their own sets.
    -   Applies pagination using `page` and `limit` query parameters.
    -   Applies sorting based on `sort_by` (e.g., `name`, `created_at`) and `order` (`asc`, `desc`) query parameters.
    -   Returns a list of flashcard sets along with pagination metadata (`current_page`, `total_pages`, `total_items`, `limit`).

#### `GET /api/flashcard-sets/{setId}`

-   **Description**: Retrieves a specific flashcard set by its ID.
-   **HTTP Method**: `GET`
-   **Authentication**: Required
-   **Query Parameters**:
    -   `page`: `integer` (optional, default: 1)
    -   `limit`: `integer` (optional, default: 10)
    -   `sort_by`: `string` (optional, e.g., `created_at`, default: `created_at`)
    -   `order`: `string` (optional, `asc` or `desc`, default: `asc`)
    -   `filter_source`: `string` (optional, e.g., `manual`, `ai_generated`)
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
-   **Business Logic**:
    -   The system verifies the authenticated user.
    -   Retrieves the flashcard set from the `flashcard_sets` table where `id` matches `{setId}` and `user_id` matches the authenticated user's ID. RLS policies enforce that users can only access their own sets.
    -   If the set is not found or does not belong to the user, a `404 Not Found` error is returned.
    -   Otherwise, the flashcard set object is returned.

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
-   **Business Logic**:
    -   The system verifies the authenticated user.
    -   The system checks if the flashcard set with `{setId}` exists and belongs to the authenticated user. RLS policies enforce this. If not found, returns `404`.
    -   Input validation: `name` is required and must be unique for the authenticated user (excluding the current set being updated). This is enforced by the `UNIQUE (user_id, name)` database constraint.
    -   The `name` of the specified flashcard set is updated in the `flashcard_sets` table.
    -   The `updated_at` timestamp is automatically updated by a database trigger.
    -   The updated flashcard set object is returned.

#### `DELETE /api/flashcard-sets/{setId}`

-   **Description**: Deletes a specific flashcard set and all its associated flashcards.
-   **HTTP Method**: `DELETE`
-   **Authentication**: Required
-   **Response Payload (Success)**:
    -   Status Code: `204 No Content`
-   **Error Responses**:
    -   `401 Unauthorized`.
    -   `404 Not Found`.
-   **Business Logic**:
    -   The system verifies the authenticated user.
    -   The system checks if the flashcard set with `{setId}` exists and belongs to the authenticated user. RLS policies enforce this. If not found, returns `404`.
    -   The specified flashcard set is deleted from the `flashcard_sets` table.
    -   Associated flashcards in the `flashcards` table are automatically deleted due to the `ON DELETE CASCADE` constraint on `flashcards.set_id`.
    -   Returns `204 No Content` on successful deletion.

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
-   **Business Logic**:
    -   The system verifies the authenticated user and checks if the flashcard set with `{setId}` exists and belongs to the user. RLS policies and application logic handle this.
    -   Input validation:
        -   `front`: Required, string, maximum 200 characters.
        -   `back`: Required, string, maximum 500 characters.
        -   `source`: Required, string, must be one of `'manual'`, `'ai_generated'`, `'ai_generated_modified'` (enforced by a DB `CHECK` constraint).
        -   Uniqueness of `(set_id, front, back)` is recommended (potentially checked by the API or relying on the `idx_flashcards_set_front_back_unique` database index if implemented).
    -   A new record is inserted into the `flashcards` table with the provided `front`, `back`, `source`, and the `set_id` from the path, and `user_id` of the authenticated user.
    -   Flashcard Set Count Maintenance:
        -   The `total_flashcards_count` in the parent `flashcard_sets` record (identified by `{setId}`) is incremented.
        -   If `source` is `'ai_generated'`, the `accepted_unedited_count` in the parent `flashcard_sets` record is also incremented.
    -   The `created_at` and `updated_at` timestamps for the flashcard are set automatically by the database.
    -   The newly created flashcard object is returned.

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
-   **Business Logic**:
    -   The system verifies the authenticated user and checks if the flashcard set with `{setId}` exists and belongs to the user.
    -   The request payload contains an array of `flashcards`. Each flashcard object in the array is validated:
        -   `front`: Required, string, max 200 chars.
        -   `back`: Required, string, max 500 chars.
        -   `source`: Required, string, enum (`'manual'`, `'ai_generated'`, `'ai_generated_modified'`).
        -   Uniqueness of `(set_id, front, back)` within the set should be considered for each item.
    -   The system attempts to insert all valid flashcards into the `flashcards` table in a transaction.
    -   Flashcard Set Count Maintenance: For each successfully created flashcard:
        -   The `total_flashcards_count` in the parent `flashcard_sets` record is incremented.
        -   If a created flashcard's `source` is `'ai_generated'`, the `accepted_unedited_count` is incremented. These updates should be atomic for the batch.
    -   Returns a list of successfully created flashcards and a list of errors for any flashcards that failed validation or insertion.

#### `GET /api/flashcard-sets/{setId}/flashcards`

-   **Description**: Retrieves flashcards within a specific set.
-   **HTTP Method**: `GET`
-   **Authentication**: Required
-   **Query Parameters**:
    -   `page`: `integer` (optional, default: 1)
    -   `limit`: `integer` (optional, default: 10)
    -   `sort_by`: `string` (optional, e.g., `created_at`, default: `created_at`)
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
        "current_page": "integer",
        "total_pages": "integer",
        "total_items": "integer",
        "limit": "integer"
      }
    }
    ```
-   **Error Responses**:
    -   `401 Unauthorized`.
    -   `404 Not Found`: If `setId` does not exist or belong to the user.
-   **Business Logic**:
    -   The system verifies the authenticated user and checks if the flashcard set with `{setId}` exists and belongs to the user.
    -   Retrieves flashcards from the `flashcards` table where `set_id` matches `{setId}` and `user_id` matches the authenticated user's ID. RLS policies enforce data access.
    -   Applies pagination (`page`, `limit`), sorting (`sort_by`, `order`), and filtering (`filter_source`) based on query parameters.
    -   Returns a list of flashcards and pagination metadata.

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
-   **Business Logic**:
    -   The system verifies the authenticated user.
    -   Retrieves the flashcard from the `flashcards` table where `id` matches `{flashcardId}` and `user_id` matches the authenticated user's ID. RLS policies enforce this.
    -   If the flashcard is not found or does not belong to the user, a `404 Not Found` error is returned.
    -   Otherwise, the flashcard object is returned.

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
-   **Business Logic**:
    -   The system verifies the authenticated user and checks if the flashcard with `{flashcardId}` exists and belongs to the user. RLS policies enforce this.
    -   Input validation for provided fields:
        -   `front`: Optional, string, max 200 chars.
        -   `back`: Optional, string, max 500 chars.
        -   `source`: Optional, string, enum (`'manual'`, `'ai_generated'`, `'ai_generated_modified'`).
        -   If `front` and/or `back` are changed, uniqueness of `(set_id, front, back)` within the set should be checked.
    -   Flashcard Source Update on Edit: If the flashcard's original `source` was `'ai_generated'` and its `front` or `back` content is changed, the `source` field should be updated to `'ai_generated_modified'`. The client is expected to send the new `source` if it changes.
    -   Flashcard Set Count Maintenance:
        -   If the `source` of the flashcard changes, the `accepted_unedited_count` in the parent `flashcard_sets` record is adjusted:
            -   If old `source` was `'ai_generated'` and new `source` is not, decrement `accepted_unedited_count`.
            -   If old `source` was not `'ai_generated'` and new `source` is `'ai_generated'`, increment `accepted_unedited_count`. (This scenario might be less common for PUT, more for POST).
    -   The specified fields of the flashcard are updated in the `flashcards` table.
    -   The `updated_at` timestamp is automatically updated by a database trigger.
    -   The updated flashcard object is returned.

#### `DELETE /api/flashcards/{flashcardId}`

-   **Description**: Deletes a specific flashcard.
-   **HTTP Method**: `DELETE`
-   **Authentication**: Required
-   **Response Payload (Success)**:
    -   Status Code: `204 No Content`
-   **Error Responses**:
    -   `401 Unauthorized`.
    -   `404 Not Found`.
-   **Business Logic**:
    -   The system verifies the authenticated user and checks if the flashcard with `{flashcardId}` exists and belongs to the user. RLS policies enforce this.
    -   Before deletion, the system retrieves the original `source` of the flashcard to correctly update parent set counts.
    -   The specified flashcard is deleted from the `flashcards` table.
    -   Flashcard Set Count Maintenance:
        -   The `total_flashcards_count` in the parent `flashcard_sets` record is decremented.
        -   If the original `source` of the deleted flashcard was `'ai_generated'`, the `accepted_unedited_count` in the parent `flashcard_sets` record is decremented.
    -   Returns `204 No Content` on successful deletion.

#### `POST /api/flashcards/{flashcardId}/regenerate`

-   **Description**: Regenerates a specific AI-generated flashcard using LLM.
-   **HTTP Method**: `POST`
-   **Authentication**: Required
-   **Request Payload**: None (The request body should be empty or an empty JSON object `{}`).
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
-   **Business Logic**:
    -   The system verifies the authenticated user and checks if the flashcard with `{flashcardId}` exists, belongs to the user, and its `source` is `'ai_generated'`. If not AI-generated, returns `400 Bad Request`.
    -   The system might need context to regenerate (e.g., the original text or the set's source text if available, or simply attempt to rephrase/improve the existing front/back). This detail needs clarification; assuming for now it attempts regeneration based on existing content or stored context.
    -   Calls an LLM service (e.g., Openrouter) to generate a new `front` and `back` for the flashcard.
    -   Handles errors from the LLM service:
        -   Logs error details (user_id, model, source_text_hash (if applicable), error_code, error_message) to the `generation_error_logs` table.
        -   Returns appropriate error codes (`429`, `500`, `503`) to the client.
    -   Validates the regenerated `front` (max 200 chars) and `back` (max 500 chars), applying truncation if necessary while preserving meaning, similar to the `POST /api/ai/generate-flashcards` endpoint.
    -   Updates the existing flashcard record in the `flashcards` table with the new `front` and `back`. The `source` remains `'ai_generated'`.
    -   The `updated_at` timestamp is automatically updated by a database trigger.
    -   The updated flashcard object is returned.

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
-   **Business Logic**:
    -   The system verifies the authenticated user.
    -   Input validation: `text` is required, string, length between 1000 and 10000 characters (as per PRD US-003).
    -   The backend service calculates `source_text_hash` (SHA-256) and `source_text_length` from the input text.
    -   Calls an external LLM service (e.g., Openrouter.ai API) with the provided `text` and any configured model preferences.
    -   Handles responses from the LLM service:
        -   If the LLM call fails, details (`user_id`, `model` used, `source_text_hash`, `source_text_length`, `error_code`, `error_message`) are logged to the `generation_error_logs` table. An appropriate error (`500` or `503`) is returned to the client.
    -   For successful LLM responses, each generated flashcard suggestion is validated:
        -   `front` must not exceed 200 characters.
        -   `back` must not exceed 500 characters.
        -   If limits are exceeded, a fallback strategy is applied: content is truncated to the maximum allowed length, attempting to preserve complete sentences. If truncation would significantly break meaning, the suggestion might be marked as `rejected`.
    -   Formats the validated/truncated/rejected suggestions and includes metadata (`source_text_hash`, `source_text_length`, `generation_duration_ms`, `model_used`, counts of `truncated`, `rejected`, and `total_suggestions`) in the response to the client. These suggestions are not persisted in the database at this stage.

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

This section will be refactored. The specific validation rules and business logic items previously listed here have been moved into the **Business Logic** paragraph of each respective endpoint defined above for better co-location and clarity.

The general principles remain:
- Input validation is performed at the API layer before processing.
- Database constraints (e.g., uniqueness, check constraints, foreign keys) provide a an additional layer of data integrity.
- Row Level Security (RLS) policies in PostgreSQL ensure users can only access and modify their own data.
- Application logic handles specific workflows, such as count maintenance in `flashcard_sets` and interactions with external AI services.
- Error logging, particularly for AI generation, is crucial for monitoring and debugging.

This API plan provides a comprehensive structure for the 10x-cards application, aligning with the PRD, database schema, and tech stack. 