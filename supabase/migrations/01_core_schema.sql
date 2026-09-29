create extension if not exists pgcrypto;

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table public.users (
  id                 uuid primary key references auth.users(id) on delete cascade,
  email              text unique not null,
  full_name          text not null default '',
  phone              text,
  class              text check (class in ('1st PU','2nd PU')),
  role               text not null default 'student' check (role in ('student','teacher','admin')),
  xp                 integer not null default 0,
  streak             integer not null default 0,
  subscription_plan  text not null default 'free',
  avatar_url         text,
  last_active_at     timestamptz default now(),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index idx_users_role on public.users(role);

create trigger trg_users_updated_at before update on public.users
  for each row execute function set_updated_at();

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, phone, class)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'class'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.units (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  level         text not null check (level in ('1st PU','2nd PU')),
  icon          text,
  color         text,
  accent        text,
  order_number  integer not null default 0,
  created_at    timestamptz not null default now()
);
create index idx_units_level on public.units(level);

create table public.chapters (
  id            uuid primary key default gen_random_uuid(),
  unit_id       uuid not null references public.units(id) on delete cascade,
  chapter_name  text not null,
  order_number  integer not null default 0,
  created_at    timestamptz not null default now()
);
create index idx_chapters_unit on public.chapters(unit_id);

create table public.videos (
  id            uuid primary key default gen_random_uuid(),
  chapter_id    uuid not null references public.chapters(id) on delete cascade,
  title         text not null,
  youtube_id    text not null,
  duration      text,
  uploaded_by   uuid references public.users(id) on delete set null,
  is_published  boolean not null default true,
  view_count    integer not null default 0,
  created_at    timestamptz not null default now()
);
create index idx_videos_chapter on public.videos(chapter_id);

create table public.notes (
  id            uuid primary key default gen_random_uuid(),
  chapter_id    uuid not null references public.chapters(id) on delete cascade,
  title         text not null,
  file_url      text,
  uploaded_by   uuid references public.users(id) on delete set null,
  is_published  boolean not null default true,
  created_at    timestamptz not null default now()
);
create index idx_notes_chapter on public.notes(chapter_id);

create table public.questions (
  id              uuid primary key default gen_random_uuid(),
  chapter_id      uuid not null references public.chapters(id) on delete cascade,
  question_text   text not null,
  options         jsonb not null,
  correct_answer  text not null,
  explanation     text,
  exam_type       text default 'All' check (exam_type in ('All','KCET','NEET')),
  difficulty      text default 'Medium' check (difficulty in ('Easy','Medium','Hard')),
  created_at      timestamptz not null default now()
);
create index idx_questions_chapter on public.questions(chapter_id);

create table public.tests (
  id            uuid primary key default gen_random_uuid(),
  chapter_id    uuid not null references public.chapters(id) on delete cascade,
  title         text not null,
  question_ids  uuid[] not null default '{}',
  duration_min  integer default 30,
  is_published  boolean not null default true,
  created_at    timestamptz not null default now()
);
create index idx_tests_chapter on public.tests(chapter_id);

create table public.progress (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references public.users(id) on delete cascade,
  chapter_id    uuid not null references public.chapters(id) on delete cascade,
  percent_done  integer not null default 0 check (percent_done between 0 and 100),
  updated_at    timestamptz not null default now(),
  unique (student_id, chapter_id)
);

create table public.results (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.users(id) on delete cascade,
  test_id     uuid not null references public.tests(id) on delete cascade,
  score       integer not null,
  total       integer not null,
  created_at  timestamptz not null default now()
);
create index idx_results_student on public.results(student_id);

create table public.subscriptions (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.users(id) on delete cascade,
  plan_name   text not null,
  status      text not null default 'active' check (status in ('active','expired','cancelled')),
  starts_at   timestamptz not null default now(),
  ends_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index idx_subscriptions_student on public.subscriptions(student_id);

create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.users(id) on delete cascade,
  title       text not null,
  body        text,
  type        text default 'Content',
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index idx_notifications_user on public.notifications(user_id);

create table public.community_posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references public.users(id) on delete cascade,
  category    text default 'General',
  title       text,
  body        text not null,
  created_at  timestamptz not null default now()
);

create table public.community_replies (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.community_posts(id) on delete cascade,
  author_id   uuid not null references public.users(id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now()
);
create index idx_replies_post on public.community_replies(post_id);

create table public.payments (
  id                    uuid primary key default gen_random_uuid(),
  student_id            uuid not null references public.users(id) on delete cascade,
  razorpay_payment_id   text not null,
  razorpay_order_id     text,
  amount                numeric not null,
  status                text not null default 'pending' check (status in ('pending','success','failed')),
  created_at            timestamptz not null default now()
);
create index idx_payments_student on public.payments(student_id);
