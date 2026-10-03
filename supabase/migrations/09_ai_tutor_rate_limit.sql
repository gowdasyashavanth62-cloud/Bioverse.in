-- ═══════════════════════════════════════════════════════════════════════
-- BioVerse — Step 9: AI Tutor per-user rate limit
-- Run in: Supabase Dashboard → SQL Editor → New Query → Run
-- Idempotent: safe to run multiple times.
--
-- Used ONLY by the `ai-tutor` Edge Function. It calls ai_tutor_consume_quota()
-- with the signed-in student's own access token, so the quota is keyed to
-- auth.uid() (never client-supplied) and no service-role key is needed.
--
-- Defaults chosen by the Edge Function (configurable there, not here):
--   10 requests / minute and 100 requests / hour per user.
-- ═══════════════════════════════════════════════════════════════════════

create table if not exists public.ai_tutor_usage (
  id       bigint generated always as identity primary key,
  user_id  uuid not null references auth.users(id) on delete cascade,
  used_at  timestamptz not null default now()
);
create index if not exists idx_ai_tutor_usage_user_time
  on public.ai_tutor_usage (user_id, used_at desc);

-- RLS on with NO policies: students/anon can never read or write this table
-- directly. Only the SECURITY DEFINER function below touches it.
alter table public.ai_tutor_usage enable row level security;
revoke all on table public.ai_tutor_usage from public, anon, authenticated;

create or replace function public.ai_tutor_consume_quota(
  p_per_minute integer default 10,
  p_per_hour   integer default 100
)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid     uuid := auth.uid();
  v_pm      integer := greatest(1, least(coalesce(p_per_minute, 10), 1000));
  v_ph      integer := greatest(1, least(coalesce(p_per_hour, 100), 10000));
  v_min_cnt integer;
  v_min_old timestamptz;
  v_hr_cnt  integer;
  v_hr_old  timestamptz;
  v_retry   integer;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  -- Serialize concurrent calls for the same user so the count+insert is atomic.
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));

  -- Keep the table small: drop this user's rows older than a day.
  delete from public.ai_tutor_usage
   where user_id = v_uid and used_at < now() - interval '1 day';

  select count(*), min(used_at) into v_min_cnt, v_min_old
    from public.ai_tutor_usage
   where user_id = v_uid and used_at > now() - interval '1 minute';

  select count(*), min(used_at) into v_hr_cnt, v_hr_old
    from public.ai_tutor_usage
   where user_id = v_uid and used_at > now() - interval '1 hour';

  if v_min_cnt >= v_pm or v_hr_cnt >= v_ph then
    v_retry := 1;
    if v_min_cnt >= v_pm then
      v_retry := greatest(v_retry, ceil(60 - extract(epoch from (now() - v_min_old)))::integer);
    end if;
    if v_hr_cnt >= v_ph then
      v_retry := greatest(v_retry, ceil(3600 - extract(epoch from (now() - v_hr_old)))::integer);
    end if;
    return query select false, v_retry;
    return;
  end if;

  insert into public.ai_tutor_usage (user_id) values (v_uid);
  return query select true, 0;
end;
$$;

revoke all on function public.ai_tutor_consume_quota(integer, integer) from public, anon;
grant execute on function public.ai_tutor_consume_quota(integer, integer) to authenticated;
