alter table posts enable row level security;

create policy "owners read their posts" on posts
  for select to authenticated using (auth.uid() = user_id);

create policy "owners add their posts" on posts
  for insert to authenticated with check (auth.uid() = user_id);

create policy "owners edit their posts" on posts
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
