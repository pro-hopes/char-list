-- Character portraits in Supabase Storage.
-- Path: <user_id>/<character_id>/<random uuid>.<ext>; the character's `data.portraitPath` points to it.
-- Files are immutable (new upload = new name), so there is deliberately no update policy.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portraits', 'portraits', false, 2097152, array['image/webp', 'image/jpeg', 'image/png']);

create policy "portraits: select own"
  on storage.objects for select to authenticated
  using (bucket_id = 'portraits' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "portraits: insert own"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'portraits' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "portraits: delete own"
  on storage.objects for delete to authenticated
  using (bucket_id = 'portraits' and (storage.foldername(name))[1] = (select auth.uid()::text));
