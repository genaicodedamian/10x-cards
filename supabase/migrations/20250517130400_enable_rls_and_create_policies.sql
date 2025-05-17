-- migration_created_at: 20250517130400
-- title: enable_rls_and_create_policies
-- description: this migration enables row level security (rls) for flashcard_sets, flashcards, and generation_error_logs tables and creates the necessary policies for authenticated users.

-- enable row level security for flashcard_sets table
alter table public.flashcard_sets enable row level security;

-- policies for flashcard_sets table
-- policy: allow authenticated users to select their own flashcard sets
create policy "allow_authenticated_to_select_own_flashcard_sets"
on public.flashcard_sets for select
to authenticated
using (auth.uid() = user_id);

-- policy: allow authenticated users to insert their own flashcard sets
create policy "allow_authenticated_to_insert_own_flashcard_sets"
on public.flashcard_sets for insert
to authenticated
with check (auth.uid() = user_id);

-- policy: allow authenticated users to update their own flashcard sets
create policy "allow_authenticated_to_update_own_flashcard_sets"
on public.flashcard_sets for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- policy: allow authenticated users to delete their own flashcard sets
create policy "allow_authenticated_to_delete_own_flashcard_sets"
on public.flashcard_sets for delete
to authenticated
using (auth.uid() = user_id);

-- enable row level security for flashcards table
alter table public.flashcards enable row level security;

-- policies for flashcards table
-- policy: allow authenticated users to select their own flashcards
create policy "allow_authenticated_to_select_own_flashcards"
on public.flashcards for select
to authenticated
using (auth.uid() = user_id);

-- policy: allow authenticated users to insert their own flashcards
create policy "allow_authenticated_to_insert_own_flashcards"
on public.flashcards for insert
to authenticated
with check (auth.uid() = user_id);

-- policy: allow authenticated users to update their own flashcards
create policy "allow_authenticated_to_update_own_flashcards"
on public.flashcards for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- policy: allow authenticated users to delete their own flashcards
create policy "allow_authenticated_to_delete_own_flashcards"
on public.flashcards for delete
to authenticated
using (auth.uid() = user_id);

-- enable row level security for generation_error_logs table
alter table public.generation_error_logs enable row level security;

-- policies for generation_error_logs table
-- policy: allow authenticated users to select their own generation error logs
create policy "allow_authenticated_to_select_own_generation_error_logs"
on public.generation_error_logs for select
to authenticated
using (auth.uid() = user_id);

-- policy: allow authenticated users to insert their own generation error logs
create policy "allow_authenticated_to_insert_own_generation_error_logs"
on public.generation_error_logs for insert
to authenticated
with check (auth.uid() = user_id);

-- note: update and delete policies for generation_error_logs are intentionally omitted
-- as logs are generally append-only and should not be modified or deleted by users. 