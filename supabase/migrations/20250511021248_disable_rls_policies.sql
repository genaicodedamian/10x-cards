-- migration: 20250511021248_disable_rls_policies.sql
-- purpose: disables all rls policies on flashcards, generation_error_logs, and flashcard_sets tables.
-- affected_tables: public.flashcards, public.generation_error_logs, public.flashcard_sets

-- Disable RLS policies for public.flashcards
drop policy if exists "allow_anon_to_select_flashcards" on public.flashcards;
drop policy if exists "allow_anon_to_insert_flashcards" on public.flashcards;
drop policy if exists "allow_anon_to_update_flashcards" on public.flashcards;
drop policy if exists "allow_anon_to_delete_flashcards" on public.flashcards;
drop policy if exists "allow_authenticated_to_select_own_flashcards" on public.flashcards;
drop policy if exists "allow_authenticated_to_insert_own_flashcards" on public.flashcards;
drop policy if exists "allow_authenticated_to_update_own_flashcards" on public.flashcards;
drop policy if exists "allow_authenticated_to_delete_own_flashcards" on public.flashcards;

-- Disable RLS policies for public.generation_error_logs
drop policy if exists "allow_anon_to_select_generation_error_logs" on public.generation_error_logs;
drop policy if exists "allow_anon_to_insert_generation_error_logs" on public.generation_error_logs;
drop policy if exists "allow_anon_to_update_generation_error_logs" on public.generation_error_logs;
drop policy if exists "allow_anon_to_delete_generation_error_logs" on public.generation_error_logs;
drop policy if exists "allow_authenticated_to_select_own_generation_error_logs" on public.generation_error_logs;
drop policy if exists "allow_authenticated_to_insert_own_generation_error_logs" on public.generation_error_logs;
drop policy if exists "prevent_authenticated_from_updating_generation_error_logs" on public.generation_error_logs;
drop policy if exists "prevent_authenticated_from_deleting_generation_error_logs" on public.generation_error_logs;

-- Disable RLS policies for public.flashcard_sets
drop policy if exists "allow_anon_to_select_flashcard_sets" on public.flashcard_sets;
drop policy if exists "allow_anon_to_insert_flashcard_sets" on public.flashcard_sets;
drop policy if exists "allow_anon_to_update_flashcard_sets" on public.flashcard_sets;
drop policy if exists "allow_anon_to_delete_flashcard_sets" on public.flashcard_sets;
drop policy if exists "allow_authenticated_to_select_own_flashcard_sets" on public.flashcard_sets;
drop policy if exists "allow_authenticated_to_insert_own_flashcard_sets" on public.flashcard_sets;
drop policy if exists "allow_authenticated_to_update_own_flashcard_sets" on public.flashcard_sets;
drop policy if exists "allow_authenticated_to_delete_own_flashcard_sets" on public.flashcard_sets;

-- Additionally, it's good practice to also disable RLS on the tables themselves if no policies are intended.
alter table public.flashcards disable row level security;
alter table public.generation_error_logs disable row level security;
alter table public.flashcard_sets disable row level security;
-- However, the request was to disable policies, so I will leave RLS enabled on the tables but without any specific policies.
-- If you want to completely disable RLS for these tables, uncomment the lines above. 