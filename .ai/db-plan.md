# PostgreSQL Database Schema for 10x-cards

## 1. Tables

### a. `users`
*(Note: This table is primarily managed by Supabase Auth. Its structure is shown here for foreign key reference.)*
| Column Name      | Data Type                    | Constraints                                       | Description                                  |
|------------------|------------------------------|---------------------------------------------------|----------------------------------------------|
| `id`             | `UUID`                       | `PRIMARY KEY`                                     | User's unique identifier (from Supabase Auth) |
| `email`          | `TEXT`                       | `UNIQUE`, `NOT NULL` (managed by Supabase Auth) | User's email address                         |
| `created_at`     | `TIMESTAMP WITH TIME ZONE`   | (managed by Supabase Auth)                        | Timestamp of user account creation           |
| *... (other Supabase Auth fields)* |                              |                                                   |                                              |

### b. `flashcard_sets`
| Column Name                   | Data Type                    | Constraints                                                                                    | Description                                                                     |
|-------------------------------|------------------------------|------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------|
| `id`                          | `UUID`                       | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                                                     | Unique identifier for the flashcard set                                         |
| `user_id`                     | `UUID`                       | `NOT NULL`, `REFERENCES auth.users(id) ON DELETE CASCADE`                                      | Identifier of the user who owns the set                                         |
| `name`                        | `TEXT`                       | `NOT NULL`                                                                                     | Name or topic of the flashcard set (e.g., "Product Management")                 |
| `accepted_unedited_count`     | `INTEGER`                    | `NOT NULL`, `DEFAULT 0`                                                                        | Count of AI-generated flashcards accepted without edits (`source` = 'ai_generated') |
| `total_flashcards_count`      | `INTEGER`                    | `NOT NULL`, `DEFAULT 0`                                                                        | Total count of flashcards in this set                                           |
| `generation_duration_ms`      | `INTEGER`                    |                                                                                                | Duration in milliseconds for AI generation of flashcards in this set (can be `NULL`) |
| `source_text_hash`            | `VARCHAR(64)`                |                                                                                                | Hash of the source text used for AI generation (e.g., SHA-256, can be `NULL`)     |
| `source_text_length`          | `INTEGER`                    | `CHECK (source_text_length IS NULL OR (source_text_length BETWEEN 1000 AND 10000))`            | Length of the source text used for AI generation (can be `NULL`)                |
| `created_at`                  | `TIMESTAMP WITH TIME ZONE`   | `NOT NULL`, `DEFAULT NOW()`                                                                    | Timestamp of set creation                                                       |
| `updated_at`                  | `TIMESTAMP WITH TIME ZONE`   | `NOT NULL`, `DEFAULT NOW()`                                                                    | Timestamp of last set modification                                              |
| `last_studied_at`             | `TIMESTAMP WITH TIME ZONE`   |                                                                                                | Timestamp of the last study session with this set (can be `NULL`)               |
|                               |                              | `UNIQUE (user_id, name)`                                                                       | Ensures unique set names per user                                               |

### c. `flashcards`
| Column Name        | Data Type                    | Constraints                                                                              | Description                                                                 |
|--------------------|------------------------------|------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------|
| `id`               | `UUID`                       | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                                               | Unique identifier for the flashcard                                         |
| `set_id`           | `UUID`                       | `NOT NULL`, `REFERENCES flashcard_sets(id) ON DELETE CASCADE`                            | Identifier of the set to which the flashcard belongs                        |
| `user_id`          | `UUID`                       | `NOT NULL`, `REFERENCES auth.users(id) ON DELETE CASCADE`                                | Identifier of the user who owns the flashcard (for RLS simplification)      |
| `front`            | `TEXT`                       | `NOT NULL`                                                                               | Content of the flashcard's front side (question)                            |
| `back`             | `TEXT`                       | `NOT NULL`                                                                               | Content of the flashcard's back side (answer)                               |
| `source`           | `TEXT`                       | `NOT NULL`, `CHECK (source IN ('manual', 'ai_generated', 'ai_generated_modified'))`      | Origin of the flashcard ('manual', 'ai_generated', 'ai_generated_modified') |
| `created_at`       | `TIMESTAMP WITH TIME ZONE`   | `NOT NULL`, `DEFAULT NOW()`                                                              | Timestamp of flashcard creation                                             |
| `updated_at`       | `TIMESTAMP WITH TIME ZONE`   | `NOT NULL`, `DEFAULT NOW()`                                                              | Timestamp of last flashcard modification                                    |

### d. `generation_error_logs`
| Column Name           | Data Type                    | Constraints                                                                              | Description                                                                    |
|-----------------------|------------------------------|------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------|
| `id`                  | `UUID`                       | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                                               | Unique identifier for the error log entry                                      |
| `user_id`             | `UUID`                       | `NOT NULL`, `REFERENCES auth.users(id) ON DELETE SET NULL`                               | Identifier of the user who encountered the error (set to NULL if user deleted) |
| `model`               | `VARCHAR(255)`               | `NOT NULL`                                                                               | AI model used during the generation attempt                                    |
| `source_text_hash`    | `VARCHAR(64)`                | `NOT NULL`                                                                               | Hash of the source text that caused the error (e.g., SHA-256)                  |
| `source_text_length`  | `INTEGER`                    | `NOT NULL`, `CHECK (source_text_length BETWEEN 1000 AND 10000)`                          | Length of the source text that caused the error                                |
| `error_code`          | `VARCHAR(100)`               | `NOT NULL`                                                                               | Specific error code from the AI service or application                         |
| `error_message`       | `TEXT`                       | `NOT NULL`                                                                               | Detailed error message                                                         |
| `created_at`          | `TIMESTAMP WITH TIME ZONE`   | `NOT NULL`, `DEFAULT NOW()`                                                              | Timestamp when the error was logged                                            |

## 2. Relationships between Tables

*   **`users` and `flashcard_sets`**: One-to-Many
    *   One `user` can have many `flashcard_sets`.
    *   Each `flashcard_set` belongs to exactly one `user`.
    *   Implemented via `flashcard_sets.user_id` referencing `auth.users(id)`.

*   **`users` and `flashcards`**: One-to-Many
    *   One `user` can have many `flashcards`.
    *   Each `flashcard` belongs to exactly one `user`.
    *   Implemented via `flashcards.user_id` referencing `auth.users(id)`.

*   **`flashcard_sets` and `flashcards`**: One-to-Many
    *   One `flashcard_set` can contain many `flashcards`.
    *   Each `flashcard` belongs to exactly one `flashcard_set`.
    *   Implemented via `flashcards.set_id` referencing `flashcard_sets(id)`.

*   **`users` and `generation_error_logs`**: One-to-Many
    *   One `user` can have many `generation_error_logs`.
    *   Each `generation_error_log` is associated with one `user` (or `NULL` if the user is deleted).
    *   Implemented via `generation_error_logs.user_id` referencing `auth.users(id)`.

## 3. Indexes

### a. `flashcard_sets` Table
*   `idx_flashcard_sets_user_id`: Index on `user_id`.
*   The `UNIQUE (user_id, name)` constraint will automatically create a unique index.
*   `idx_flashcard_sets_source_text_hash`: Index on `source_text_hash` (if frequent lookups by hash are expected).

### b. `flashcards` Table
*   `idx_flashcards_set_id`: Index on `set_id`.
*   `idx_flashcards_user_id`: Index on `user_id`.
*   *(Recommended)* `idx_flashcards_set_front_back_unique`: `UNIQUE` index on `(set_id, front, back)`.

### c. `generation_error_logs` Table
*   `idx_generation_error_logs_user_id`: Index on `user_id`.
*   `idx_generation_error_logs_created_at`: Index on `created_at` (for time-based log analysis).
*   `idx_generation_error_logs_source_text_hash`: Index on `source_text_hash`.

## 4. PostgreSQL Row Level Security (RLS) Policies

### a. For `flashcard_sets` Table
```sql
-- Enable RLS
ALTER TABLE public.flashcard_sets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can SELECT their own sets
CREATE POLICY "Allow users to select their own flashcard sets"
ON public.flashcard_sets FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can INSERT sets for themselves
CREATE POLICY "Allow users to insert their own flashcard sets"
ON public.flashcard_sets FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can UPDATE their own sets
CREATE POLICY "Allow users to update their own flashcard sets"
ON public.flashcard_sets FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can DELETE their own sets
CREATE POLICY "Allow users to delete their own flashcard sets"
ON public.flashcard_sets FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

### b. For `flashcards` Table
```sql
-- Enable RLS
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

-- Policy: Users can SELECT their own flashcards
CREATE POLICY "Allow users to select their own flashcards"
ON public.flashcards FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can INSERT flashcards for themselves
CREATE POLICY "Allow users to insert their own flashcards"
ON public.flashcards FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can UPDATE their own flashcards
CREATE POLICY "Allow users to update their own flashcards"
ON public.flashcards FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can DELETE their own flashcards
CREATE POLICY "Allow users to delete their own flashcards"
ON public.flashcards FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

### c. For `generation_error_logs` Table
```sql
-- Enable RLS
ALTER TABLE public.generation_error_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can SELECT their own error logs
CREATE POLICY "Allow users to select their own generation error logs"
ON public.generation_error_logs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: System/Backend can INSERT error logs (assuming inserts are done by a trusted role or service worker)
-- For user-driven inserts if needed, a more specific policy with CHECK might be required.
-- This example allows any authenticated user to insert if they can somehow bypass application logic, which might be too permissive.
-- A tighter policy would be: CREATE POLICY "Allow backend to insert error logs" ON public.generation_error_logs FOR INSERT WITH CHECK (true); -- and rely on app logic for user_id
-- For simplicity, if logs are inserted by backend using service_role key, RLS might be bypassed for inserts.
-- If inserts are done by the user's session, the following is more appropriate:
CREATE POLICY "Allow users to insert their own generation error logs"
ON public.generation_error_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- No UPDATE or DELETE policies are typically defined for log tables, as logs are usually append-only.
-- Note: The policies above are intended for the 'authenticated' role. Policies for the 'anon' role are not defined
-- as anonymous users should not have direct access to these tables according to the current requirements.
```

## 5. Additional Notes and Design Decisions

*   **UUIDs for Primary Keys**: `UUID`s are used for all tables for consistency and benefits in distributed environments.
*   **Timestamps**: `TIMESTAMP WITH TIME ZONE` is used for all temporal data.
*   **Automatic `updated_at`**: Recommended to implement a PostgreSQL trigger function for `flashcard_sets` and `flashcards`.
    ```sql
    CREATE OR REPLACE FUNCTION public.update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
       NEW.updated_at = NOW();
       RETURN NEW;
    END;
    $$ language 'plpgsql';

    -- Apply to flashcard_sets
    CREATE TRIGGER update_flashcard_sets_updated_at
    BEFORE UPDATE ON public.flashcard_sets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

    -- Apply to flashcards
    CREATE TRIGGER update_flashcards_updated_at
    BEFORE UPDATE ON public.flashcards
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
    ```
*   **Cascading Deletes**: `ON DELETE CASCADE` for `flashcard_sets.user_id`, `flashcards.user_id`, `flashcards.set_id`. For `generation_error_logs.user_id`, `ON DELETE SET NULL` is used to preserve logs even if a user account is deleted, anonymizing the log entry regarding the user.
*   **Denormalized Counts in `flashcard_sets`**: `accepted_unedited_count` and `total_flashcards_count` are denormalized for direct access. These counts must be maintained by application logic or database triggers whenever flashcards are added, deleted, or their `source` changes within a set. For example, a trigger on `flashcards` after INSERT/DELETE/UPDATE could update these counts in the parent `flashcard_sets` table.
*   **`source_text_length` Check**: The `CHECK` constraint for `flashcard_sets.source_text_length` and `generation_error_logs.source_text_length` allows `NULL` values but enforces the range if a value is provided.
*   **`generation_error_logs` RLS**: The RLS policy for inserting into `generation_error_logs` assumes that either the backend uses a privileged role (bypassing RLS for inserts) or that the user's session is directly responsible for logging their own errors. If a service role is used for inserts, the `WITH CHECK` clause for insert RLS on this table might not be strictly necessary for user-specific checks at the policy level but rather handled by application logic populating `user_id` correctly.
*   **VARCHAR Lengths**: `VARCHAR(64)` for `source_text_hash` assumes a common hash length like SHA-256. `VARCHAR(255)` for `model` and `VARCHAR(100)` for `error_code` are general-purpose lengths and can be adjusted if more specific limits are known.
*   **User Authentication and Management**: User table (`auth.users`) and related authentication mechanisms (including password reset tokens and procedures) are managed by Supabase Auth. The schema described here primarily focuses on application-specific data tables and their relation to `auth.users`.