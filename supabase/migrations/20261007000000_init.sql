-- Teams, players and games for the substitution manager.
-- Every row is scoped to a team; a coach can only see teams they belong to.

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  settings jsonb not null default '{}'::jsonb,
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.team_members (
  team_id uuid not null references public.teams (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'coach' check (role in ('owner', 'coach')),
  primary key (team_id, user_id)
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  number smallint not null check (number between 0 and 99),
  positions text[] not null default '{}'
    check (positions <@ array['GK', 'D', 'M', 'S']::text[]),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
-- Jersey numbers are unique among a team's current players.
create unique index players_team_number_key on public.players (team_id, number) where active;

create table public.games (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  opponent text check (char_length(opponent) <= 80),
  played_on date not null default current_date,
  status text not null default 'setup'
    check (status in ('setup', 'ready', 'live', 'halftime', 'done')),
  state jsonb not null,
  updated_at timestamptz not null default now()
);
create index games_team_id_idx on public.games (team_id, played_on desc);

-- Membership check used by every policy. SECURITY DEFINER so the policy on
-- team_members doesn't recurse into itself.
create function public.is_team_member(t uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.team_members m
    where m.team_id = t and m.user_id = (select auth.uid())
  );
$$;

-- Whoever creates a team becomes its owner.
create function public.add_team_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.team_members (team_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end;
$$;

create trigger teams_add_owner
after insert on public.teams
for each row execute function public.add_team_owner();

create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger games_touch_updated_at
before update on public.games
for each row execute function public.touch_updated_at();

alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.players enable row level security;
alter table public.games enable row level security;

create policy "members read teams" on public.teams
  for select to authenticated using (public.is_team_member(id) or created_by = (select auth.uid()));
create policy "anyone signed in creates a team" on public.teams
  for insert to authenticated with check (created_by = (select auth.uid()));
create policy "members update teams" on public.teams
  for update to authenticated using (public.is_team_member(id));
create policy "creator deletes team" on public.teams
  for delete to authenticated using (created_by = (select auth.uid()));

create policy "members read membership" on public.team_members
  for select to authenticated using (public.is_team_member(team_id));

create policy "members manage players" on public.players
  for all to authenticated
  using (public.is_team_member(team_id))
  with check (public.is_team_member(team_id));

create policy "members manage games" on public.games
  for all to authenticated
  using (public.is_team_member(team_id))
  with check (public.is_team_member(team_id));
