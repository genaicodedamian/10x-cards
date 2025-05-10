-- migration: 20250510233655_create_generation_error_logs.sql
-- purpose: creates the generation_error_logs table, enables rls, defines policies, and adds indexes.
-- affected_tables: public.generation_error_logs
-- special_considerations: this table does not have an updated_at column, so the trigger is not applied.

-- create the generation_error_logs table
create table public.generation_error_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete set null, -- allow null if user is deleted
    model varchar(255) not null,
    source_text_hash varchar(64) not null,
    source_text_length integer not null check (source_text_length between 1000 and 10000),
    error_code varchar(100) not null,
    error_message text not null,
    created_at timestamp with time zone not null default now()
);

-- add comments to columns
comment on column public.generation_error_logs.id is 'unique identifier for the error log entry';
comment on column public.generation_error_logs.user_id is 'identifier of the user who encountered the error (set to null if user deleted)';
comment on column public.generation_error_logs.model is 'ai model used during the generation attempt';
comment on column public.generation_error_logs.source_text_hash is 'hash of the source text that caused the error (e.g., sha-256)';
comment on column public.generation_error_logs.source_text_length is 'length of the source text that caused the error';
comment on column public.generation_error_logs.error_code is 'specific error code from the ai service or application';
comment on column public.generation_error_logs.error_message is 'detailed error message';
comment on column public.generation_error_logs.created_at is 'timestamp when the error was logged';

-- enable row level security
alter table public.generation_error_logs enable row level security;

-- rls policies for anon role
-- policy: anon users cannot select any generation error logs
create policy "allow_anon_to_select_generation_error_logs"
on public.generation_error_logs for select
to anon
using (false);

-- policy: anon users cannot insert generation error logs
create policy "allow_anon_to_insert_generation_error_logs"
on public.generation_error_logs for insert
to anon
with check (false);

-- policy: anon users cannot update generation error logs
create policy "allow_anon_to_update_generation_error_logs"
on public.generation_error_logs for update
to anon
using (false)
with check (false);

-- policy: anon users cannot delete generation error logs
create policy "allow_anon_to_delete_generation_error_logs"
on public.generation_error_logs for delete
to anon
using (false);

-- rls policies for authenticated role
-- policy: authenticated users can select their own generation error logs
create policy "allow_authenticated_to_select_own_generation_error_logs"
on public.generation_error_logs for select
to authenticated
using (auth.uid() = user_id);

-- policy: authenticated users can insert their own generation error logs
-- this assumes logs are inserted by the user's session.
-- if a backend service role inserts logs, this policy might need adjustment or RLS bypass for that role.
create policy "allow_authenticated_to_insert_own_generation_error_logs"
on public.generation_error_logs for insert
to authenticated
with check (auth.uid() = user_id);

-- policy: authenticated users cannot update generation error logs (logs are typically append-only)
create policy "prevent_authenticated_from_updating_generation_error_logs"
on public.generation_error_logs for update
to authenticated
using (false)
with check (false);

-- policy: authenticated users cannot delete generation error logs (logs are typically append-only)
create policy "prevent_authenticated_from_deleting_generation_error_logs"
on public.generation_error_logs for delete
to authenticated
using (false);

-- create indexes
create index idx_generation_error_logs_user_id on public.generation_error_logs(user_id);
create index idx_generation_error_logs_created_at on public.generation_error_logs(created_at);
create index idx_generation_error_logs_source_text_hash on public.generation_error_logs(source_text_hash); 