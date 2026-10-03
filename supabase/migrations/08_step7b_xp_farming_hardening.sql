-- Step 7B — XP / game-session farming hardening
-- Run in Supabase Dashboard -> SQL Editor.
--
-- Scope: exactly the four Step 7A findings below. Nothing else touched.
--   1. Protect users.last_active_at (was student-writable; farmed the streak)
--   2. Server-side session-creation rate limit in start_game_session
--      (10 new sessions / 10 minutes / student, identity from auth.uid())
--   3. Tighten first_challenge + bio_explorer to require >=1 correct answer
--      per qualifying session (was: any completed session, even 0-correct)
--   4. Lazy session expiry: a stale in_progress session (>24h old) can no
--      longer be submitted (blocks farming abandoned/forgotten sessions)
--
-- NOTE ON MIGRATION HISTORY: this repo's numbered SQL files (01, 02, 04-07)
-- are manual-run scripts, not files tracked by the Supabase CLI's
-- supabase_migrations.schema_migrations table -- the live project's real
-- migration history (5 entries, timestamp-named) is separate and predates
-- this repo's migration folder entirely (see README_MISSING_03.txt). This
-- file follows the repo's existing convention; it is NOT retroactively
-- registered as a CLI migration, and none of the underlying live objects
-- from Steps 1-7A have migration files here either. That gap is
-- pre-existing and unrelated to this fix.

-- 1. Extend the existing guard trigger's function (same trigger, no new one)
CREATE OR REPLACE FUNCTION public.protect_sensitive_user_columns()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.is_admin() and coalesce(current_setting('app.bypass_xp_guard', true), 'off') <> 'on' then
    if new.role is distinct from old.role
       or new.xp is distinct from old.xp
       or new.streak is distinct from old.streak
       or new.subscription_plan is distinct from old.subscription_plan
       or new.last_active_at is distinct from old.last_active_at then
      raise exception 'Not allowed to change role, xp, streak, last_active_at, or subscription_plan directly.';
    end if;
  end if;
  return new;
end;
$function$;

-- 2. Session-creation rate limit (uses the existing
--    idx_game_sessions_student(student_id, created_at DESC) index; no
--    schema/index change needed)
CREATE OR REPLACE FUNCTION public.start_game_session(p_mode text, p_chapter_id uuid DEFAULT NULL::uuid, p_num_questions integer DEFAULT 10)
 RETURNS TABLE(session_id uuid, question_id uuid, question text, option_a text, option_b text, option_c text, option_d text, exam_type text, difficulty text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_session_id uuid;
  v_count integer;
  v_qty integer := greatest(1, least(coalesce(p_num_questions, 10), 50));
  v_picked_ids uuid[];
  v_recent_count integer;
begin
  if p_mode not in ('daily_challenge','speed_quiz','topic_battle','practice_arena') then
    raise exception 'Invalid game mode: %', p_mode;
  end if;
  if p_mode in ('topic_battle','practice_arena') and p_chapter_id is null then
    raise exception '% requires a chapter_id.', p_mode;
  end if;

  select count(*) into v_recent_count
  from public.game_sessions
  where student_id = auth.uid()
    and created_at > now() - interval '10 minutes';

  if v_recent_count >= 10 then
    raise exception 'session_creation_rate_limited';
  end if;

  select array_agg(sub.id) into v_picked_ids
  from (
    select q.id
    from public.questions q
    where (p_chapter_id is null or q.chapter_id = p_chapter_id)
    order by random()
    limit v_qty
  ) sub;

  v_count := coalesce(array_length(v_picked_ids, 1), 0);
  if v_count = 0 then
    raise exception 'No questions available for this selection.';
  end if;

  insert into public.game_sessions (student_id, mode, chapter_id, question_ids, total_questions, status)
  values (auth.uid(), p_mode, p_chapter_id, v_picked_ids, v_count, 'in_progress')
  returning id into v_session_id;

  return query
  select v_session_id, q.id, q.question, q.option_a, q.option_b, q.option_c, q.option_d,
         q.exam_type::text, q.difficulty::text
  from public.questions q
  where q.id = any(v_picked_ids);
end;
$function$;

-- 3. Tighten first_challenge + bio_explorer only; streak_7, speed_demon and
--    top_10 already represent real performance or are governed elsewhere
--    and are left exactly as they were.
CREATE OR REPLACE FUNCTION public.unlock_achievement(p_code text)
 RETURNS TABLE(unlocked boolean, xp_granted integer, reason text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_achievement public.achievements;
  v_already boolean;
  v_eligible boolean := false;
  v_my_streak integer;
  v_my_rank integer;
  v_distinct_chapters integer;
  v_best_speed_pct numeric;
begin
  select * into v_achievement from public.achievements where code = p_code;
  if not found then
    raise exception 'Unknown achievement code: %', p_code;
  end if;
 
  select exists(
    select 1 from public.user_achievements
    where student_id = auth.uid() and achievement_id = v_achievement.id
  ) into v_already;
  if v_already then
    return query select false, 0, 'already_unlocked';
    return;
  end if;
 
  if p_code = 'first_challenge' then
    v_eligible := exists(
      select 1 from public.game_sessions
      where student_id = auth.uid() and status = 'completed' and score >= 1
    );
 
  elsif p_code = 'streak_7' then
    select streak into v_my_streak from public.users where id = auth.uid();
    v_eligible := coalesce(v_my_streak, 0) >= 7;
 
  elsif p_code = 'speed_demon' then
    select max(correct_answers::numeric / nullif(total_questions,0)) into v_best_speed_pct
    from public.game_sessions
    where student_id = auth.uid() and mode = 'speed_quiz' and status = 'completed';
    v_eligible := coalesce(v_best_speed_pct, 0) >= 0.8;
 
  elsif p_code = 'bio_explorer' then
    select count(distinct chapter_id) into v_distinct_chapters
    from public.game_sessions
    where student_id = auth.uid() and status = 'completed' and chapter_id is not null and score >= 1;
    v_eligible := coalesce(v_distinct_chapters, 0) >= 5;
 
  elsif p_code = 'top_10' then
    select rank into v_my_rank from public.leaderboard where id = auth.uid();
    v_eligible := v_my_rank is not null and v_my_rank <= 10;
 
  else
    raise exception 'No eligibility rule implemented for achievement: %', p_code;
  end if;
 
  if not v_eligible then
    return query select false, 0, 'not_eligible';
    return;
  end if;
 
  insert into public.user_achievements (student_id, achievement_id)
  values (auth.uid(), v_achievement.id);
 
  perform set_config('app.bypass_xp_guard', 'on', true);
  update public.users set xp = xp + v_achievement.xp_reward where id = auth.uid();
 
  return query select true, v_achievement.xp_reward, 'unlocked';
end;
$function$;

-- 4. Lazy expiry: block submission of a stale (>24h) in_progress session.
--    No background job; no status write on the rejected path (a write
--    immediately before RAISE EXCEPTION would be rolled back with it).
CREATE OR REPLACE FUNCTION public.submit_game_session(p_session_id uuid, p_answers jsonb)
 RETURNS TABLE(correct_answers integer, total_questions integer, xp_earned integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_session public.game_sessions;
  v_correct integer;
  v_xp integer;
  v_per_correct integer;
  v_bonus integer := 0;
begin
  select * into v_session
  from public.game_sessions
  where id = p_session_id and student_id = auth.uid()
  for update;
 
  if not found then
    raise exception 'Game session not found or does not belong to you.';
  end if;
  if v_session.status <> 'in_progress' then
    raise exception 'This session has already been submitted.';
  end if;
  if v_session.started_at < now() - interval '24 hours' then
    raise exception 'session_expired';
  end if;
 
  select count(*) into v_correct
  from public.questions q
  where q.id = any(v_session.question_ids)
    and upper(trim(p_answers ->> q.id::text)) = upper(trim(q.correct_answer::text));
 
  v_per_correct := case v_session.mode
    when 'daily_challenge' then 10
    when 'speed_quiz'      then 12
    when 'topic_battle'    then 10
    when 'practice_arena'  then 5
    else 5
  end;
 
  if v_session.mode = 'daily_challenge' and v_correct = v_session.total_questions then
    v_bonus := 20;
  end if;
 
  v_xp := least(300, greatest(0, v_correct * v_per_correct + v_bonus));
 
  update public.game_sessions
  set answers = p_answers,
      correct_answers = v_correct,
      score = v_correct,
      xp_earned = v_xp,
      status = 'completed',
      completed_at = now()
  where id = p_session_id;
 
  return query select v_correct, v_session.total_questions, v_xp;
end;
$function$;
