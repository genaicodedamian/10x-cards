-- migration: 20250510233532_create_flashcard_sets.sql
-- purpose: creates the flashcard_sets table, enables rls, defines policies, and adds indexes.
-- affected_tables: public.flashcard_sets
-- special_considerations: an updated_at trigger function is also created and applied.

-- create the function to update the updated_at column
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
   new.updated_at = now();
   return new;
end;
$$ language 'plpgsql';

-- create the flashcard_sets table
create table public.flashcard_sets (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    accepted_unedited_count integer not null default 0,
    total_flashcards_count integer not null default 0,
    generation_duration_ms integer,
    source_text_hash varchar(64),
    source_text_length integer check (source_text_length is null or (source_text_length between 1000 and 10000)),
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    last_studied_at timestamp with time zone,
    constraint unique_user_set_name unique (user_id, name)
);

-- add comments to columns
comment on column public.flashcard_sets.id is 'unique identifier for the flashcard set';
comment on column public.flashcard_sets.user_id is 'identifier of the user who owns the set';
comment on column public.flashcard_sets.name is 'name or topic of the flashcard set (e.g., "product management")';
comment on column public.flashcard_sets.accepted_unedited_count is 'count of ai-generated flashcards accepted without edits (source = ''ai_generated'')';
comment on column public.flashcard_sets.total_flashcards_count is 'total count of flashcards in this set';
comment on column public.flashcard_sets.generation_duration_ms is 'duration in milliseconds for ai generation of flashcards in this set (can be null)';
comment on column public.flashcard_sets.source_text_hash is 'hash of the source text used for ai generation (e.g., sha-256, can be null)';
comment on column public.flashcard_sets.source_text_length is 'length of the source text used for ai generation (can be null)';
comment on column public.flashcard_sets.created_at is 'timestamp of set creation';
comment on column public.flashcard_sets.updated_at is 'timestamp of last set modification';
comment on column public.flashcard_sets.last_studied_at is 'timestamp of the last study session with this set (can be null)';

-- enable row level security
alter table public.flashcard_sets enable row level security;

-- rls policies for anon role
-- policy: anon users cannot select any flashcard sets
create policy "allow_anon_to_select_flashcard_sets"
on public.flashcard_sets for select
to anon
using (false);

-- policy: anon users cannot insert flashcard sets
create policy "allow_anon_to_insert_flashcard_sets"
on public.flashcard_sets for insert
to anon
with check (false);

-- policy: anon users cannot update flashcard sets
create policy "allow_anon_to_update_flashcard_sets"
on public.flashcard_sets for update
to anon
using (false)
with check (false);

-- policy: anon users cannot delete flashcard sets
create policy "allow_anon_to_delete_flashcard_sets"
on public.flashcard_sets for delete
to anon
using (false);

-- rls policies for authenticated role
-- policy: authenticated users can select their own flashcard sets
create policy "allow_authenticated_to_select_own_flashcard_sets"
on public.flashcard_sets for select
to authenticated
using (auth.uid() = user_id);

-- policy: authenticated users can insert flashcard sets for themselves
create policy "allow_authenticated_to_insert_own_flashcard_sets"
on public.flashcard_sets for insert
to authenticated
with check (auth.uid() = user_id);

-- policy: authenticated users can update their own flashcard sets
create policy "allow_authenticated_to_update_own_flashcard_sets"
on public.flashcard_sets for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- policy: authenticated users can delete their own flashcard sets
create policy "allow_authenticated_to_delete_own_flashcard_sets"
on public.flashcard_sets for delete
to authenticated
using (auth.uid() = user_id);

-- apply the trigger to flashcard_sets
create trigger update_flashcard_sets_updated_at
before update on public.flashcard_sets
for each row
execute function public.update_updated_at_column();

-- create indexes
create index idx_flashcard_sets_user_id on public.flashcard_sets(user_id);
create index idx_flashcard_sets_source_text_hash on public.flashcard_sets(source_text_hash);
-- the unique constraint (user_id, name) automatically creates a unique index. 