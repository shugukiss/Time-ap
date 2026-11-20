-- Spusťte celý soubor v Supabase: SQL Editor > New query > Run
create table public.categories(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  color text not null default '#2563eb',
  archived boolean not null default false,
  created_at timestamptz not null default now());
create table public.activities(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  activity_date date not null,
  minutes integer not null check (minutes > 0 and minutes <= 1440),
  note text not null default '',
  created_at timestamptz not null default now());
create index on public.activities(user_id, activity_date);
create table public.goals(
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  weekly_hours integer not null default 30 check (weekly_hours >= 0),
  monthly_hours integer not null default 120 check (monthly_hours >= 0));
alter table public.categories enable row level security;
alter table public.activities enable row level security;
alter table public.goals enable row level security;
create policy "vlastni kategorie" on public.categories for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "vlastni aktivity" on public.activities for all to authenticated
  using (auth.uid() = user_id) with check (
    auth.uid() = user_id and exists (select 1 from public.categories c where c.id = category_id and c.user_id = auth.uid()));
create policy "vlastni cile" on public.goals for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Po registraci se automaticky vytvoří výchozí kategorie a cíle
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.categories(user_id,name,color) values
   (new.id,'Volání klientům','#2563eb'),(new.id,'Schůzky s klienty','#16a34a'),
   (new.id,'Administrativa','#f59e0b'),(new.id,'Vzdělávání','#8b5cf6'),
   (new.id,'Příprava nabídek','#ec4899'),(new.id,'Ostatní','#64748b');
  insert into public.goals(user_id) values (new.id);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
