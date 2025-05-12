-- migration: 20250510233655_create_flashcards.sql
-- purpose: creates the flashcards table, enables rls, defines policies, adds indexes, and applies the updated_at trigger.
-- affected_tables: public.flashcards
-- special_considerations: depends on the public.update_updated_at_column function created in a previous migration.

-- create the flashcards table
create table public.flashcards (
    id uuid primary key default gen_random_uuid(),
    set_id uuid not null references public.flashcard_sets(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    front text not null,
    back text not null,
    source text not null check (source in ('manual', 'ai_generated', 'ai_generated_modified')),
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now()
);

-- add comments to columns
comment on column public.flashcards.id is 'unique identifier for the flashcard';
comment on column public.flashcards.set_id is 'identifier of the set to which the flashcard belongs';
comment on column public.flashcards.user_id is 'identifier of the user who owns the flashcard (for rls simplification)';
comment on column public.flashcards.front is 'content of the flashcard\'s front side (question)';
comment on column public.flashcards.back is 'content of the flashcard\'s back side (answer)';
comment on column public.flashcards.source is 'origin of the flashcard (\'manual\', \'ai_generated\', \'ai_generated_modified\')';
comment on column public.flashcards.created_at is 'timestamp of flashcard creation';
comment on column public.flashcards.updated_at is 'timestamp of last flashcard modification';

-- enable row level security
alter table public.flashcards enable row level security;

-- rls policies for anon role
-- policy: anon users cannot select any flashcards
create policy "allow_anon_to_select_flashcards"
on public.flashcards for select
to anon
using (false);

-- policy: anon users cannot insert flashcards
create policy "allow_anon_to_insert_flashcards"
on public.flashcards for insert
to anon
with check (false);

-- policy: anon users cannot update flashcards
create policy "allow_anon_to_update_flashcards"
on public.flashcards for update
to anon
using (false)
with check (false);

-- policy: anon users cannot delete flashcards
create policy "allow_anon_to_delete_flashcards"
on public.flashcards for delete
to anon
using (false);

-- rls policies for authenticated role
-- policy: authenticated users can select their own flashcards
create policy "allow_authenticated_to_select_own_flashcards"
on public.flashcards for select
to authenticated
using (auth.uid() = user_id);

-- policy: authenticated users can insert flashcards for themselves
create policy "allow_authenticated_to_insert_own_flashcards"
on public.flashcards for insert
to authenticated
with check (auth.uid() = user_id);

-- policy: authenticated users can update their own flashcards
create policy "allow_authenticated_to_update_own_flashcards"
on public.flashcards for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- policy: authenticated users can delete their own flashcards
create policy "allow_authenticated_to_delete_own_flashcards"
on public.flashcards for delete
to authenticated
using (auth.uid() = user_id);

-- apply the trigger to flashcards
create trigger update_flashcards_updated_at
before update on public.flashcards
for each row
execute function public.update_updated_at_column();

-- create indexes
create index idx_flashcards_set_id on public.flashcards(set_id);
create index idx_flashcards_user_id on public.flashcards(user_id);

-- recommended unique index on (set_id, front, back)
create unique index idx_flashcards_set_front_back_unique on public.flashcards(set_id, front, back); 