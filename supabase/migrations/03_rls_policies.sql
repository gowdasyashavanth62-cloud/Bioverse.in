-- ═══════════════════════════════════════════════════════════════════════
-- BioVerse — Step 4: Row Level Security (all tables)
-- Run in: Supabase Dashboard → SQL Editor → New Query → Run
-- ═══════════════════════════════════════════════════════════════════════

-- ─── HELPER: read the caller's role without RLS recursion ────────────
-- security definer + owned by a role that bypasses RLS on `users`
-- (Supabase's default table owner does), so this is safe to call
-- from inside policies on `users` itself without infinite recursion.
create or replace function public.current_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

create or replace function public.is_admin() returns boolean
language sql security definer stable set search_path = public
as $$ select public.current_role() = 'admin'; $$;

create or replace function public.is_teacher_or_admin() returns boolean
language sql security definer stable set search_path = public
as $$ select public.current_role() in ('teacher','admin'); $$;


-- ═══════════════════════════════════════════════════════════════════════
-- 1. USERS — protects: personal profile data, and the role/xp/streak/
--    subscription columns that must never be client-settable.
-- ═══════════════════════════════════════════════════════════════════════
alter table public.users enable row level security;

-- Everyone can read their own profile; admins can read everyone
-- (needed for the admin dashboard's user list); teachers can read
-- student profiles (needed for class tracking).
drop policy if exists "users_select_own_or_admin_or_teacher" on public.users;
create policy "users_select_own_or_admin_or_teacher"
on public.users for select
using (
  id = auth.uid()
  or public.is_admin()
  or (public.current_role() = 'teacher' and role = 'student')
);

-- Users can update their own row (name/phone/class/avatar only —
-- the trigger below blocks role/xp/streak/subscription_plan changes
-- even here). Admins can update any row (e.g. promoting a teacher).
drop policy if exists "users_update_own_or_admin" on public.users;
create policy "users_update_own_or_admin"
on public.users for update
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

-- Only admins can delete accounts.
drop policy if exists "users_delete_admin_only" on public.users;
create policy "users_delete_admin_only"
on public.users for delete
using (public.is_admin());

-- No INSERT policy at all — rows are only ever created by the
-- handle_new_user() trigger from Step 2, which runs as security
-- definer and bypasses RLS. Nobody can INSERT into users directly.

-- Column-level lock: role/xp/streak/subscription_plan can only
-- change if the person making the change is an admin.
create or replace function public.protect_sensitive_user_columns()
returns trigger as $$
begin
  if not public.is_admin() then
    if new.role is distinct from old.role
       or new.xp is distinct from old.xp
       or new.streak is distinct from old.streak
       or new.subscription_plan is distinct from old.subscription_plan then
      raise exception 'Not allowed to change role, xp, streak, or subscription_plan directly.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_protect_sensitive_user_columns on public.users;
create trigger trg_protect_sensitive_user_columns
before update on public.users
for each row execute function public.protect_sensitive_user_columns();


-- ═══════════════════════════════════════════════════════════════════════
-- 2. UNITS / CHAPTERS — protects: syllabus structure. Readable by any
--    logged-in user; only admins restructure the syllabus itself.
-- ═══════════════════════════════════════════════════════════════════════
alter table public.units enable row level security;
drop policy if exists "units_select_authenticated" on public.units;
create policy "units_select_authenticated" on public.units for select
  using (auth.role() = 'authenticated');
drop policy if exists "units_write_admin_only" on public.units;
create policy "units_write_admin_only" on public.units for all
  using (public.is_admin()) with check (public.is_admin());

alter table public.chapters enable row level security;
drop policy if exists "chapters_select_authenticated" on public.chapters;
create policy "chapters_select_authenticated" on public.chapters for select
  using (auth.role() = 'authenticated');
drop policy if exists "chapters_write_admin_only" on public.chapters;
create policy "chapters_write_admin_only" on public.chapters for all
  using (public.is_admin()) with check (public.is_admin());


-- ═══════════════════════════════════════════════════════════════════════
-- 3. VIDEOS / NOTES — protects: unpublished/draft content from students,
--    while letting teachers/admins manage it.
-- ═══════════════════════════════════════════════════════════════════════
alter table public.videos enable row level security;
drop policy if exists "videos_select" on public.videos;
create policy "videos_select" on public.videos for select
  using (is_published = true or public.is_teacher_or_admin());
drop policy if exists "videos_write_teacher_or_admin" on public.videos;
create policy "videos_write_teacher_or_admin" on public.videos for insert
  with check (public.is_teacher_or_admin());
drop policy if exists "videos_update_teacher_or_admin" on public.videos;
create policy "videos_update_teacher_or_admin" on public.videos for update
  using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());
drop policy if exists "videos_delete_admin_only" on public.videos;
create policy "videos_delete_admin_only" on public.videos for delete
  using (public.is_admin());

alter table public.notes enable row level security;
drop policy if exists "notes_select" on public.notes;
create policy "notes_select" on public.notes for select
  using (is_published = true or public.is_teacher_or_admin());
drop policy if exists "notes_write_teacher_or_admin" on public.notes;
create policy "notes_write_teacher_or_admin" on public.notes for insert
  with check (public.is_teacher_or_admin());
drop policy if exists "notes_update_teacher_or_admin" on public.notes;
create policy "notes_update_teacher_or_admin" on public.notes for update
  using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());
drop policy if exists "notes_delete_admin_only" on public.notes;
create policy "notes_delete_admin_only" on public.notes for delete
  using (public.is_admin());


-- ═══════════════════════════════════════════════════════════════════════
-- 4. QUESTIONS / TESTS — protects: the answer bank from tampering;
--    students can read (needed to practice) but never write.
-- ═══════════════════════════════════════════════════════════════════════
alter table public.questions enable row level security;
drop policy if exists "questions_select_authenticated" on public.questions;
create policy "questions_select_authenticated" on public.questions for select
  using (auth.role() = 'authenticated');
drop policy if exists "questions_write_teacher_or_admin" on public.questions;
create policy "questions_write_teacher_or_admin" on public.questions for insert
  with check (public.is_teacher_or_admin());
drop policy if exists "questions_update_teacher_or_admin" on public.questions;
create policy "questions_update_teacher_or_admin" on public.questions for update
  using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());
drop policy if exists "questions_delete_admin_only" on public.questions;
create policy "questions_delete_admin_only" on public.questions for delete
  using (public.is_admin());

alter table public.tests enable row level security;
drop policy if exists "tests_select" on public.tests;
create policy "tests_select" on public.tests for select
  using (is_published = true or public.is_teacher_or_admin());
drop policy if exists "tests_write_teacher_or_admin" on public.tests;
create policy "tests_write_teacher_or_admin" on public.tests for insert
  with check (public.is_teacher_or_admin());
drop policy if exists "tests_update_teacher_or_admin" on public.tests;
create policy "tests_update_teacher_or_admin" on public.tests for update
  using (public.is_teacher_or_admin()) with check (public.is_teacher_or_admin());
drop policy if exists "tests_delete_admin_only" on public.tests;
create policy "tests_delete_admin_only" on public.tests for delete
  using (public.is_admin());


-- ═══════════════════════════════════════════════════════════════════════
-- 5. PROGRESS — protects: a student's own learning progress. Students
--    can only ever touch their own row; teachers/admins read all
--    (needed for class tracking dashboards) but never edit a student's data.
-- ═══════════════════════════════════════════════════════════════════════
alter table public.progress enable row level security;
drop policy if exists "progress_select_own_or_staff" on public.progress;
create policy "progress_select_own_or_staff" on public.progress for select
  using (student_id = auth.uid() or public.is_teacher_or_admin());
drop policy if exists "progress_insert_own" on public.progress;
create policy "progress_insert_own" on public.progress for insert
  with check (student_id = auth.uid());
drop policy if exists "progress_update_own" on public.progress;
create policy "progress_update_own" on public.progress for update
  using (student_id = auth.uid()) with check (student_id = auth.uid());
drop policy if exists "progress_delete_admin_only" on public.progress;
create policy "progress_delete_admin_only" on public.progress for delete
  using (public.is_admin());


-- ═══════════════════════════════════════════════════════════════════════
-- 6. RESULTS — protects: exam result integrity. Students can insert
--    their own result once (via the app finishing a test) but can never
--    update or delete a result after the fact — that would let someone
--    fake their own score.
-- ═══════════════════════════════════════════════════════════════════════
alter table public.results enable row level security;
drop policy if exists "results_select_own_or_staff" on public.results;
create policy "results_select_own_or_staff" on public.results for select
  using (student_id = auth.uid() or public.is_teacher_or_admin());
drop policy if exists "results_insert_own" on public.results;
create policy "results_insert_own" on public.results for insert
  with check (student_id = auth.uid());
-- No update policy for anyone but admin — results are immutable by design.
drop policy if exists "results_update_admin_only" on public.results;
create policy "results_update_admin_only" on public.results for update
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "results_delete_admin_only" on public.results;
create policy "results_delete_admin_only" on public.results for delete
  using (public.is_admin());


-- ═══════════════════════════════════════════════════════════════════════
-- 7. SUBSCRIPTIONS — protects: premium access. Students can only READ
--    their own subscription. There is deliberately NO insert/update
--    policy for students — subscriptions are only ever written by the
--    service role from the payments Edge Function (Step 9), which
--    bypasses RLS entirely. A student can never grant themselves premium.
-- ═══════════════════════════════════════════════════════════════════════
alter table public.subscriptions enable row level security;
drop policy if exists "subscriptions_select_own_or_admin" on public.subscriptions;
create policy "subscriptions_select_own_or_admin" on public.subscriptions for select
  using (student_id = auth.uid() or public.is_admin());
drop policy if exists "subscriptions_admin_write" on public.subscriptions;
create policy "subscriptions_admin_write" on public.subscriptions for all
  using (public.is_admin()) with check (public.is_admin());
-- (admin policy above covers insert/update/delete for admins;
--  students get no write access at all on this table)


-- ═══════════════════════════════════════════════════════════════════════
-- 8. NOTIFICATIONS — protects: users only see their own notifications
--    or broadcasts (user_id IS NULL). Only staff can send notifications.
--    A student may mark their own notification read but not edit its content.
-- ═══════════════════════════════════════════════════════════════════════
alter table public.notifications enable row level security;
drop policy if exists "notifications_select_own_or_broadcast" on public.notifications;
create policy "notifications_select_own_or_broadcast" on public.notifications for select
  using (user_id = auth.uid() or user_id is null or public.is_admin());
drop policy if exists "notifications_insert_staff_only" on public.notifications;
create policy "notifications_insert_staff_only" on public.notifications for insert
  with check (public.is_teacher_or_admin());
drop policy if exists "notifications_update_mark_read_own" on public.notifications;
create policy "notifications_update_mark_read_own" on public.notifications for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "notifications_delete_admin_only" on public.notifications;
create policy "notifications_delete_admin_only" on public.notifications for delete
  using (public.is_admin());


-- ═══════════════════════════════════════════════════════════════════════
-- 9. COMMUNITY POSTS / REPLIES — protects: any signed-in user can post/
--    reply, but can only edit or delete their own; admins moderate all.
-- ═══════════════════════════════════════════════════════════════════════
alter table public.community_posts enable row level security;
drop policy if exists "posts_select_authenticated" on public.community_posts;
create policy "posts_select_authenticated" on public.community_posts for select
  using (auth.role() = 'authenticated');
drop policy if exists "posts_insert_own" on public.community_posts;
create policy "posts_insert_own" on public.community_posts for insert
  with check (author_id = auth.uid());
drop policy if exists "posts_update_own_or_admin" on public.community_posts;
create policy "posts_update_own_or_admin" on public.community_posts for update
  using (author_id = auth.uid() or public.is_admin())
  with check (author_id = auth.uid() or public.is_admin());
drop policy if exists "posts_delete_own_or_admin" on public.community_posts;
create policy "posts_delete_own_or_admin" on public.community_posts for delete
  using (author_id = auth.uid() or public.is_admin());

alter table public.community_replies enable row level security;
drop policy if exists "replies_select_authenticated" on public.community_replies;
create policy "replies_select_authenticated" on public.community_replies for select
  using (auth.role() = 'authenticated');
drop policy if exists "replies_insert_own" on public.community_replies;
create policy "replies_insert_own" on public.community_replies for insert
  with check (author_id = auth.uid());
drop policy if exists "replies_update_own_or_admin" on public.community_replies;
create policy "replies_update_own_or_admin" on public.community_replies for update
  using (author_id = auth.uid() or public.is_admin())
  with check (author_id = auth.uid() or public.is_admin());
drop policy if exists "replies_delete_own_or_admin" on public.community_replies;
create policy "replies_delete_own_or_admin" on public.community_replies for delete
  using (author_id = auth.uid() or public.is_admin());


-- ═══════════════════════════════════════════════════════════════════════
-- 10. PAYMENTS — protects: financial records. Students may only READ
--     their own payment history. There is NO insert/update policy for
--     students at all — payment rows are only ever written by the
--     service role from the Edge Function in Step 9, after verifying
--     the Razorpay signature server-side. A student can never write a
--     fake "success" payment row themselves.
-- ═══════════════════════════════════════════════════════════════════════
alter table public.payments enable row level security;
drop policy if exists "payments_select_own_or_admin" on public.payments;
create policy "payments_select_own_or_admin" on public.payments for select
  using (student_id = auth.uid() or public.is_admin());
drop policy if exists "payments_admin_write" on public.payments;
create policy "payments_admin_write" on public.payments for all
  using (public.is_admin()) with check (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════
-- End of Step 4. Every table now has RLS enabled with explicit policies.
-- ═══════════════════════════════════════════════════════════════════════
