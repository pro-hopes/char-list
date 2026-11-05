-- Characters: one row per character sheet, the whole sheet lives in `data` (jsonb).
-- The client writes only `id` and `data`; everything else is derived or set by the database.

create table public.characters (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  data           jsonb not null,

  -- Derived from `data` for the character list, so they can never drift out of sync.
  name           text generated always as (coalesce(data ->> 'name', '')) stored,
  race           text generated always as (data -> 'meta' ->> 'race') stored,
  class_name     text generated always as (data -> 'meta' ->> 'className') stored,
  level          int  generated always as (
                   case when jsonb_typeof(data -> 'meta' -> 'level') = 'number'
                        then floor((data -> 'meta' -> 'level')::numeric)::int end
                 ) stored,
  theme_color    text generated always as (data ->> 'themeColor') stored,
  schema_version int  generated always as (
                   case when jsonb_typeof(data -> 'schemaVersion') = 'number'
                        then floor((data -> 'schemaVersion')::numeric)::int end
                 ) stored,

  -- Optimistic concurrency: the client updates `where version = <known>`;
  -- zero rows updated means another device saved first.
  version        int not null default 1,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- Soft delete: hidden from the list, recoverable.
  deleted_at     timestamptz,

  constraint characters_data_is_object check (jsonb_typeof(data) = 'object'),
  constraint characters_data_id_matches check (data ->> 'id' = id::text),
  constraint characters_data_size check (pg_column_size(data) < 1000000)
);

comment on table public.characters is 'D&D character sheets; `data` is the full Character document from the app.';

create index characters_owner_updated_idx
  on public.characters (owner_id, updated_at desc)
  where deleted_at is null;

-- Server-controlled columns: clients cannot forge timestamps, version or ownership.
create function public.characters_before_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.version := 1;
  new.created_at := now();
  new.updated_at := now();
  return new;
end;
$$;

create function public.characters_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.owner_id := old.owner_id;
  new.created_at := old.created_at;
  new.version := old.version + 1;
  new.updated_at := now();
  return new;
end;
$$;

create trigger characters_before_insert
  before insert on public.characters
  for each row execute function public.characters_before_insert();

create trigger characters_before_update
  before update on public.characters
  for each row execute function public.characters_before_update();

-- Access: signed-in users only, and only their own rows.
alter table public.characters enable row level security;

revoke all on public.characters from anon;
grant select, insert, update, delete on public.characters to authenticated;

create policy "characters: select own"
  on public.characters for select to authenticated
  using (owner_id = (select auth.uid()));

create policy "characters: insert own"
  on public.characters for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "characters: update own"
  on public.characters for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "characters: delete own"
  on public.characters for delete to authenticated
  using (owner_id = (select auth.uid()));
