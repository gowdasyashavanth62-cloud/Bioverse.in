insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars',      'avatars',      true,  5242880,   array['image/png','image/jpeg','image/webp']),
  ('notes-pdfs',   'notes-pdfs',   false, 52428800,  array['application/pdf']),
  ('certificates', 'certificates', false, 10485760,  array['application/pdf']),
  ('assignments',  'assignments',  false, 20971520,  array['application/pdf','image/png','image/jpeg'])
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_own_folder_write" on storage.objects;
create policy "avatars_own_folder_write" on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and ( (storage.foldername(name))[1] = auth.uid()::text or public.is_admin() )
  );

drop policy if exists "avatars_own_folder_update" on storage.objects;
create policy "avatars_own_folder_update" on storage.objects for update
  using (
    bucket_id = 'avatars'
    and ( (storage.foldername(name))[1] = auth.uid()::text or public.is_admin() )
  );

drop policy if exists "avatars_own_folder_delete" on storage.objects;
create policy "avatars_own_folder_delete" on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and ( (storage.foldername(name))[1] = auth.uid()::text or public.is_admin() )
  );

drop policy if exists "notes_pdfs_authenticated_read" on storage.objects;
create policy "notes_pdfs_authenticated_read" on storage.objects for select
  using (bucket_id = 'notes-pdfs' and auth.role() = 'authenticated');

drop policy if exists "notes_pdfs_staff_write" on storage.objects;
create policy "notes_pdfs_staff_write" on storage.objects for insert
  with check (bucket_id = 'notes-pdfs' and public.is_teacher_or_admin());

drop policy if exists "notes_pdfs_staff_update" on storage.objects;
create policy "notes_pdfs_staff_update" on storage.objects for update
  using (bucket_id = 'notes-pdfs' and public.is_teacher_or_admin());

drop policy if exists "notes_pdfs_admin_delete" on storage.objects;
create policy "notes_pdfs_admin_delete" on storage.objects for delete
  using (bucket_id = 'notes-pdfs' and public.is_admin());

drop policy if exists "certificates_own_read" on storage.objects;
create policy "certificates_own_read" on storage.objects for select
  using (
    bucket_id = 'certificates'
    and ( (storage.foldername(name))[1] = auth.uid()::text or public.is_admin() )
  );

drop policy if exists "certificates_admin_write" on storage.objects;
create policy "certificates_admin_write" on storage.objects for insert
  with check (bucket_id = 'certificates' and public.is_admin());

drop policy if exists "certificates_admin_delete" on storage.objects;
create policy "certificates_admin_delete" on storage.objects for delete
  using (bucket_id = 'certificates' and public.is_admin());

drop policy if exists "assignments_own_or_staff_read" on storage.objects;
create policy "assignments_own_or_staff_read" on storage.objects for select
  using (
    bucket_id = 'assignments'
    and ( (storage.foldername(name))[1] = auth.uid()::text or public.is_teacher_or_admin() )
  );

drop policy if exists "assignments_own_write" on storage.objects;
create policy "assignments_own_write" on storage.objects for insert
  with check (bucket_id = 'assignments' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "assignments_own_delete" on storage.objects;
create policy "assignments_own_delete" on storage.objects for delete
  using (
    bucket_id = 'assignments'
    and ( (storage.foldername(name))[1] = auth.uid()::text or public.is_admin() )
  );
