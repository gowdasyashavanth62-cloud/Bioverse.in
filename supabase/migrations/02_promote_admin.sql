update public.users
set role = 'admin'
where email = 'yashavanthgowdasbgsit@gmail.com';

select id, email, full_name, role, created_at
from public.users
where email = 'yashavanthgowdasbgsit@gmail.com';
