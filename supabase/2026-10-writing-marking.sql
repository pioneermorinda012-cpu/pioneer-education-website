-- Writing saved to the student's account and marked by the teacher.
-- Run once in the Supabase SQL editor, after schema.sql. Safe to run again.

create table if not exists writings (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references students(id) on delete cascade,
  task_id       text not null,                 -- matches content/writing/*.json, e.g. 'w2-14'
  kind          text not null,                 -- 'task1' | 'gt1' | 'task2'
  question      text not null,                 -- the question as the student saw it
  body          text not null,                 -- what the student wrote
  words         int  not null,
  seconds_used  int,
  auto_band     numeric(2,1),                  -- the instant check's rough guide
  status        text not null default 'submitted' check (status in ('submitted','checked')),
  marks         jsonb not null default '[]',   -- [{s, e, kind: 'err'|'good', note}] character offsets into body
  teacher_band  numeric(2,1),
  criteria      jsonb,                         -- {ta, cc, lr, gra}
  teacher_note  text,
  submitted_at  timestamptz not null default now(),
  checked_at    timestamptz
);
create index if not exists writings_student_idx on writings (student_id, submitted_at desc);
create index if not exists writings_status_idx  on writings (status, submitted_at desc);

alter table writings enable row level security;   -- server-only, like the other tables
