-- Online enrolment (Razorpay) — run this once in the Supabase SQL editor,
-- after schema.sql. Safe to run again.
--
-- Students who pay online get a login made for them automatically. These
-- columns hold where to email it, and the Razorpay payment it came from so a
-- payment Razorpay sends twice never makes two logins.

alter table students add column if not exists email      text;
alter table students add column if not exists phone      text;
alter table students add column if not exists payment_id text;

-- one login per payment; one active login per email address
create unique index if not exists students_payment_id_key on students (payment_id) where payment_id is not null;
create unique index if not exists students_email_active_key on students (lower(email)) where email is not null and active;

notify pgrst, 'reload schema';
