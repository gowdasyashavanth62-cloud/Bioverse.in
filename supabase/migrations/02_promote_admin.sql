-- ═══════════════════════════════════════════════════════════════════════
-- BioVerse — Step 3: Promote your account to Super Admin
-- Run in: Supabase Dashboard → SQL Editor → New Query → Run
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Promote the account
update public.users
set role = 'admin'
where email = 'yashavanthgowdasbgsit@gmail.com';

-- 2. Verify — should return exactly ONE row with role = 'admin'
select id, email, full_name, role, created_at
from public.users
where email = 'yashavanthgowdasbgsit@gmail.com';
