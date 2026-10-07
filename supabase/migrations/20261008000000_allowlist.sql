-- Only allow-listed Google accounts can use the app.
--
-- Every data policy goes through is_team_member() or the teams policies below,
-- so adding the allow-list check there locks down all tables. Add people with:
--   insert into public.allowed_emails (email) values ('someone@example.com');

create table public.allowed_emails (
  email text primary key check (email = lower(email))
);
-- RLS on with no policies: clients can't read or change the list.
alter table public.allowed_emails enable row level security;

create function public.is_allowed_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.allowed_emails a
    where a.email = lower((select auth.jwt() ->> 'email'))
  );
$$;

revoke execute on function public.is_allowed_user() from public, anon;
grant execute on function public.is_allowed_user() to authenticated;

create or replace function public.is_team_member(t uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_allowed_user() and exists (
    select 1 from public.team_members m
    where m.team_id = t and m.user_id = (select auth.uid())
  );
$$;

drop policy "members read teams" on public.teams;
create policy "members read teams" on public.teams
  for select to authenticated
  using (public.is_team_member(id) or (public.is_allowed_user() and created_by = (select auth.uid())));

drop policy "anyone signed in creates a team" on public.teams;
create policy "allowed users create teams" on public.teams
  for insert to authenticated
  with check (public.is_allowed_user() and created_by = (select auth.uid()));

drop policy "creator deletes team" on public.teams;
create policy "creator deletes team" on public.teams
  for delete to authenticated
  using (public.is_allowed_user() and created_by = (select auth.uid()));
