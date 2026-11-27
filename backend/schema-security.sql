-- ===== VolunteerConnect: security rules, sign-up/cancel functions, auto-profile =====

-- 1. Lock every table. With RLS on, nothing gets in unless a policy below allows it.
alter table public.profiles      enable row level security;
alter table public.opportunities enable row level security;
alter table public.registrations enable row level security;

-- 2. Let the API roles reach the tables at all. RLS then decides WHICH rows.
--    anon = not logged in, authenticated = logged in, service_role = secret key
grant select on public.opportunities to anon, authenticated;
grant insert, delete on public.opportunities to authenticated;
grant select on public.profiles to authenticated;
grant select on public.registrations to authenticated;
grant all on public.profiles, public.opportunities, public.registrations to service_role;

-- 3. Policies (the rules)

-- profiles: any logged-in user can read names (organizers need attendee names)
drop policy if exists "logged-in users read profiles" on public.profiles;
create policy "logged-in users read profiles" on public.profiles
  for select to authenticated using (true);

-- opportunities: everyone can read them
drop policy if exists "anyone reads opportunities" on public.opportunities;
create policy "anyone reads opportunities" on public.opportunities
  for select to anon, authenticated using (true);

-- opportunities: only organizers can create, and only as themselves
drop policy if exists "organizers create own opportunities" on public.opportunities;
create policy "organizers create own opportunities" on public.opportunities
  for insert to authenticated
  with check (
    organizer_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'organizer')
  );

-- opportunities: you can only delete ones you created
drop policy if exists "organizers delete own opportunities" on public.opportunities;
create policy "organizers delete own opportunities" on public.opportunities
  for delete to authenticated using (organizer_id = auth.uid());

-- registrations: see your own, or the ones for events you organize
drop policy if exists "see own or my events' registrations" on public.registrations;
create policy "see own or my events' registrations" on public.registrations
  for select to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.opportunities o
               where o.id = opportunity_id and o.organizer_id = auth.uid())
  );
-- No insert/delete policies on registrations on purpose: the only way in or out
-- is through the two functions below, so the capacity rule can't be skipped.

-- 4. Register: checks capacity and inserts in ONE locked step,
--    so two people can't both grab the last spot.
create or replace function public.register_for_opportunity(p_opportunity_id bigint)
returns void language plpgsql security definer set search_path = public as $$
declare
  o public.opportunities;
begin
  if auth.uid() is null then raise exception 'not_logged_in'; end if;

  -- FOR UPDATE locks this row: a second request waits here until the first finishes
  select * into o from public.opportunities where id = p_opportunity_id for update;
  if not found then raise exception 'not_found'; end if;
  if o.starts_at <= now() then raise exception 'event_started'; end if;
  if exists (select 1 from public.registrations
             where opportunity_id = p_opportunity_id and user_id = auth.uid())
    then raise exception 'already_registered'; end if;
  if o.spots_taken >= o.capacity then raise exception 'full'; end if;

  insert into public.registrations (opportunity_id, user_id) values (p_opportunity_id, auth.uid());
  update public.opportunities set spots_taken = spots_taken + 1 where id = p_opportunity_id;
end $$;

-- 5. Cancel: removes your registration and frees the spot
create or replace function public.cancel_registration(p_opportunity_id bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not_logged_in'; end if;
  perform 1 from public.opportunities where id = p_opportunity_id for update;

  delete from public.registrations
  where opportunity_id = p_opportunity_id and user_id = auth.uid();
  if not found then raise exception 'not_registered'; end if;

  update public.opportunities set spots_taken = spots_taken - 1 where id = p_opportunity_id;
end $$;

revoke execute on function public.register_for_opportunity(bigint) from public, anon;
revoke execute on function public.cancel_registration(bigint) from public, anon;
grant execute on function public.register_for_opportunity(bigint) to authenticated;
grant execute on function public.cancel_registration(bigint) to authenticated;

-- 6. Auto-create a profile whenever someone signs up.
--    The sign-up form sends full_name and role along with the email/password.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1)),
    case when new.raw_user_meta_data->>'role' = 'organizer' then 'organizer' else 'volunteer' end
  );
  return new;
end $$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();