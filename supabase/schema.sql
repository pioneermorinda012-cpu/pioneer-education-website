-- Pioneer practice portal — run this once in the Supabase SQL editor.
--
-- Design notes:
--  * Students never write to these tables directly from the browser. The
--    Next.js server does it, so Row Level Security denies everything by
--    default and only the service role (server-side) can read or write.
--  * Answers are kept alongside the score so you can see *what* a student
--    put, not just how many they got right.

create extension if not exists "pgcrypto";

-- ── students ───────────────────────────────────────────────
create table if not exists students (
  id           uuid primary key default gen_random_uuid(),
  code         text unique not null,          -- e.g. 'PEC-2431', what they type to sign in
  pin_hash     text not null,                 -- PBKDF2-SHA256, written by the teacher page; never the PIN itself
  full_name    text not null,
  batch        text,                          -- 'Morning', 'Evening' …
  track        text check (track in ('academic','gt')) default 'academic',
  active       boolean not null default true, -- switch off when a student leaves
  created_at   timestamptz not null default now()
);
create index if not exists students_batch_idx on students (batch) where active;

-- ── attempts ───────────────────────────────────────────────
create table if not exists attempts (
  id           uuid primary key default gen_random_uuid(),
  student_id   uuid not null references students(id) on delete cascade,
  test_id      text not null,                 -- matches content/tests/<id>.json
  skill        text not null,                 -- 'AL' | 'AR' | 'GL' | 'GR'
  raw_score    int  not null,
  total        int  not null,
  band         numeric(2,1) not null,
  answers      jsonb not null,                -- what the student typed / ticked
  per_question jsonb not null,                -- [{n, correct, given, expected}]
  seconds_used int,
  submitted_at timestamptz not null default now()
);
create index if not exists attempts_student_idx on attempts (student_id, submitted_at desc);
create index if not exists attempts_test_idx    on attempts (test_id);

-- ── explanations, written once and then remembered ─────────
-- The same question is got wrong all year and the reasoning does not change,
-- so the first student to ask pays the wait and everyone after reads it
-- instantly. Nothing here is student data — it is teaching material.
create table if not exists explanations (
  test_id      text not null,                 -- matches content/tests/<id>.json
  q            int  not null,                 -- the leading question number
  body         text not null,
  created_at   timestamptz not null default now(),
  primary key (test_id, q)
);

-- ── best score per student per test, for the library ───────
create or replace view student_best as
select student_id, test_id, skill,
       max(band)  as best_band,
       max(raw_score) as best_raw,
       count(*)   as tries,
       max(submitted_at) as last_try
from attempts
group by student_id, test_id, skill;

-- ── batch overview, for the teacher dashboard ──────────────
create or replace view batch_overview as
select s.id, s.code, s.full_name, s.batch,
       count(distinct a.test_id)                                as tests_done,
       max(a.submitted_at)                                      as last_attempt,
       max(a.band) filter (where a.skill in ('AL','GL'))        as best_listening,
       max(a.band) filter (where a.skill in ('AR','GR'))        as best_reading
from students s
left join attempts a on a.student_id = s.id
where s.active
group by s.id, s.code, s.full_name, s.batch;

-- ── lock everything down ───────────────────────────────────
alter table students enable row level security;
alter table attempts enable row level security;
alter table explanations enable row level security;
-- No policies are created on purpose: with RLS on and no policy, the anon
-- and authenticated keys can read nothing. Only the service-role key used
-- by the Next.js server can touch these tables.
