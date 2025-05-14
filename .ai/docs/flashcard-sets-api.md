# API Endpoint: Flashcard Sets

## Create Flashcard Set

Allows authenticated users (currently using a default user ID) to create a new flashcard set.

- **Method**: `POST`
- **URL**: `/api/flashcard-sets`
- **Prerender**: `false` (Dynamic endpoint)

### Request

**Headers:**

- `Content-Type: application/json`

**Body (JSON):**

The request body must be a JSON object with the following structure, based on the `CreateFlashcardSetCommand` type:

```json
{
  "name": "string (required, unique per user)",
  "source_text_hash": "string (optional)",
  "source_text_length": "integer (optional, must be between 1000 and 10000 if provided)",
  "generation_duration_ms": "integer (optional, must be >= 0 if provided)"
}
```

**Field Descriptions:**

- `name` (string, required): The name of the flashcard set. Must be unique for the given user. Cannot be empty.
- `source_text_hash` (string, optional): An optional SHA-256 hash of the source text if the set was generated from text. (Note: Current implementation does not enforce SHA-256 format, but it's the intended use).
- `source_text_length` (integer, optional): The length of the source text, if applicable. If provided, must be an integer between 1000 and 10000 (inclusive).
- `generation_duration_ms` (integer, optional): The duration in milliseconds it took to generate the flashcards if AI was used. If provided, must be a non-negative integer.

**Example Request:**

```json
{
  "name": "Historia Starożytnego Rzymu",
  "source_text_hash": "a1b2c3d4e5f67890...",
  "source_text_length": 5500,
  "generation_duration_ms": 12500
}
```

### Response

**Success (201 Created):**

Returns a JSON object representing the newly created flashcard set (`FlashcardSetDto`).

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

**Field Descriptions (Response):**

- `id` (uuid): Unique identifier for the flashcard set.
- `user_id` (uuid): Identifier of the user who owns the set. (Currently defaults to `DEFAULT_USER_ID`).
- `name` (string): Name of the flashcard set.
- `accepted_unedited_count` (integer): Default is `0`. Number of flashcards accepted without edits.
- `total_flashcards_count` (integer): Default is `0`. Total number of flashcards in the set.
- `generation_duration_ms` (integer | null): Duration of AI generation, if applicable.
- `source_text_hash` (string | null): Hash of the source text, if applicable.
- `source_text_length` (integer | null): Length of the source text, if applicable.
- `created_at` (timestamp): Timestamp of when the set was created.
- `updated_at` (timestamp): Timestamp of the last update to the set.
- `last_studied_at` (timestamp | null): Timestamp of when the set was last studied. Defaults to `null`.

**Example Success Response (201 Created):**

```json
{
  "id": "a1b2c3d4-1234-5678-abcd-abcdef123456",
  "user_id": "00000000-0000-0000-0000-000000000000", // Example DEFAULT_USER_ID
  "name": "Historia Starożytnego Rzymu",
  "accepted_unedited_count": 0,
  "total_flashcards_count": 0,
  "generation_duration_ms": 12500,
  "source_text_hash": "a1b2c3d4e5f67890...",
  "source_text_length": 5500,
  "created_at": "2023-10-27T10:00:00.000Z",
  "updated_at": "2023-10-27T10:00:00.000Z",
  "last_studied_at": null
}
```

**Error Responses:**

- **400 Bad Request:**
    - If the request body is not valid JSON:
      ```json
      {
        "message": "Invalid JSON format in request body."
      }
      ```
    - If Zod validation fails (e.g., missing `name`, `source_text_length` out of range):
      ```json
      {
        "message": "Validation failed.",
        "errors": {
          "name": ["Name is required and cannot be empty."]
          // ... other field errors
        }
      }
      ```
    - If a flashcard set with the same `name` already exists for the user (database unique constraint violation `23505`):
      ```json
      {
        "message": "A set with this name already exists for the user."
      }
      ```

- **401 Unauthorized:** (Currently not active as `DEFAULT_USER_ID` is used. This response will be active once full JWT-based authentication is implemented via middleware.)
  ```json
  {
    "message": "Unauthorized: User not authenticated."
  }
  ```

- **500 Internal Server Error:**
  If an unexpected error occurs on the server side during processing or database interaction (other than unique constraint violation).
  ```json
  {
    "message": "Internal Server Error: Could not create flashcard set." 
    // Or a more generic "Internal Server Error: An unexpected error occurred."
  }
  ```

### Important Notes

- **Authentication**: Currently, this endpoint uses a `DEFAULT_USER_ID` for all operations as full user authentication middleware is not yet implemented for this specific endpoint flow. The `user_id` in the created record will reflect this default ID.
- **Database Logic**:
    - The `user_id` is used in the database to enforce row-level security (RLS) policies (allowing users to only interact with their own data) once full authentication is in place.
    - A `UNIQUE` constraint exists in the database for `(user_id, name)` to prevent duplicate set names for the same user.
    - Fields `accepted_unedited_count` and `total_flashcards_count` default to `0` in the database upon creation.
    - `created_at` and `updated_at` timestamps are automatically managed by the database.
    - `last_studied_at` defaults to `null`.
