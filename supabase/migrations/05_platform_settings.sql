create table if not exists public.platform_settings (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,
  value       jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.users(id) on delete set null
);

drop trigger if exists trg_platform_settings_updated_at on public.platform_settings;
create trigger trg_platform_settings_updated_at before update on public.platform_settings
  for each row execute function set_updated_at();

alter table public.platform_settings enable row level security;

drop policy if exists "platform_settings_admin_select" on public.platform_settings;
create policy "platform_settings_admin_select"
on public.platform_settings for select
using (public.is_admin());

drop policy if exists "platform_settings_admin_insert" on public.platform_settings;
create policy "platform_settings_admin_insert"
on public.platform_settings for insert
with check (public.is_admin());

drop policy if exists "platform_settings_admin_update" on public.platform_settings;
create policy "platform_settings_admin_update"
on public.platform_settings for update
using (public.is_admin()) with check (public.is_admin());
