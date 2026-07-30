-- ═══════════════════════════════════════════════════════════════════════
-- BioVerse — Step 5: Storage Buckets + Policies
-- Run in: Supabase Dashboard → SQL Editor → New Query → Run
-- Idempotent: safe to run multiple times.
-- ═══════════════════════════════════════════════════════════════════════

-- ─── BUCKETS ────────────────────────────────────────────────────────────
-- avatars: public-read (profile photos are low-sensitivity, and public
--          read means <img src> works without generating signed URLs).
-- notes-pdfs: private. Chapter notes/PDFs — gated behind auth.
-- certificates: private. Auto-generated per-student, admin-managed.
-- assignments: private. Student submissions, staff-reviewed.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars',      'avatars',      true,  5242880,   array['image/png','image/jpeg','image/webp']),
  ('notes-pdfs',   'notes-pdfs',   false, 52428800,  array['application/pdf']),
  ('certificates', 'certificates', false, 10485760,  array['application/pdf']),
  ('assignments',  'assignments',  false, 20971520,  array['application/pdf','image/png','image/jpeg'])
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;


-- Note: storage.objects is a Supabase-managed system table, owned by the
-- supabase_storage_admin role — RLS is already enabled on it by default,
-- and this SQL Editor connection isn't the table owner, so we don't (and
-- can't) run ALTER TABLE ... ENABLE ROW LEVEL SECURITY here. We only
-- create policies on it below, which is allowed.

-- ─── AVATARS ────────────────────────────────────────────────────────────
-- Convention: files live at avatars/{user_id}/filename.ext
-- Anyone can view (bucket is public); a user can only write into their
-- own folder; admins can write into any folder (e.g. moderation).
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


-- ─── NOTES / PDFS ───────────────────────────────────────────────────────
-- Convention: files live at notes-pdfs/{chapter_id}/filename.pdf
-- This is NOT folder-restricted like the buckets above — notes aren't
-- owned by a single user, so access is purely role-based: any signed-in
-- user can read (matches the `notes` table's published content being
-- readable by all authenticated students). Only teachers and admins
-- can upload/replace/delete, regardless of which chapter folder.
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


-- ─── CERTIFICATES ───────────────────────────────────────────────────────
-- Convention: files live at certificates/{user_id}/filename.pdf
-- A student can only read their own certificate. Only admins issue them.
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


-- ─── ASSIGNMENTS ────────────────────────────────────────────────────────
-- Convention: files live at assignments/{user_id}/filename.ext
-- A student can upload/read only their own submissions.
-- Teachers/admins can read all submissions (to review/grade).
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

-- ═══════════════════════════════════════════════════════════════════════
-- End of Step 5.
-- ═══════════════════════════════════════════════════════════════════════
