create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role text not null default 'volunteer'
       check (role in ('volunteer', 'organizer')),
  created_at timestamptz not null default now()
);
create table opportunities (
  id bigint generated always as identity primary key,
  organizer_id uuid not null references profiles (id),
  title text not null,
  description text,
  category text not null,
  location text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity int not null check (capacity > 0),
  spots_taken int not null default 0,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create table registrations (
  id bigint generated always as identity primary key,
  opportunity_id bigint not null references opportunities (id) on delete cascade,
  user_id uuid not null references profiles (id),
  created_at timestamptz not null default now(),
  unique (opportunity_id, user_id)
);