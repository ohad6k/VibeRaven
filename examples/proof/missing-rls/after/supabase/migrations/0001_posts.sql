create table posts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id),
  body text not null,
  created_at timestamptz not null default now()
);
