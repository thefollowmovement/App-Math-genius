-- Phase 7: the placement test. A test is a session of kind 'placement' (the kind exists since the
-- practice sessions): the device plays it with @math-genius/exercise-engine (placement.ts) and
-- syncs it with sync_session, mastery included, like any session. award_session gives it XP, and
-- no gems, chest or streak day, which only the daily session earns.
--
-- The parent's view computes the test's result again from its answers, against the grade the
-- child was in when taking it: each session now keeps that grade.

alter table public.sessions add column grade public.grade;

update public.sessions s
set grade = c.grade
from public.children c
where c.id = s.child_id;

alter table public.sessions alter column grade set not null;

-- The child's grade when the session is first recorded; a later change of grade leaves it as is.
create function private.set_session_grade() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.grade is null then
    select c.grade into new.grade from public.children c where c.id = new.child_id;
  end if;
  return new;
end;
$$;

create trigger sessions_grade before insert on public.sessions
  for each row execute function private.set_session_grade();
