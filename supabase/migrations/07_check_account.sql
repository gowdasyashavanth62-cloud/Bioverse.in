-- Diagnostic — run in Supabase Dashboard → SQL Editor
-- Checks whether an auth account exists for a given email, and whether
-- its email is confirmed (unconfirmed emails also fail login).

select id, email, email_confirmed_at, created_at, last_sign_in_at
from auth.users
where email in ('yashu@gmail.com', 'yashavanthgowdasbgsit@gmail.com');
