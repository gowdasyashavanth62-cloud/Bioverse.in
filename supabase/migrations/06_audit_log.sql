create table if not exists public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.users(id) on delete set null,
  action      text not null,
  table_name  text not null,
  record_id   text,
  details     jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists audit_log_created_at_idx on public.audit_log (created_at desc);
create index if not exists audit_log_actor_id_idx on public.audit_log (actor_id);

alter table public.audit_log enable row level security;

drop policy if exists "audit_log_admin_select" on public.audit_log;
create policy "audit_log_admin_select"
on public.audit_log for select
using (public.is_admin());

drop policy if exists "audit_log_write" on public.audit_log;
create policy "audit_log_write"
on public.audit_log for insert
with check (public.is_teacher_or_admin());
