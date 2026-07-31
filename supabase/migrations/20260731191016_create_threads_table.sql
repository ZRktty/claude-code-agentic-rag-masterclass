create table if not exists public.threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New chat',
  openai_conversation_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.threads enable row level security;

create policy "Users can view own threads" on public.threads
  for select using (auth.uid() = user_id);
create policy "Users can insert own threads" on public.threads
  for insert with check (auth.uid() = user_id);
create policy "Users can update own threads" on public.threads
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own threads" on public.threads
  for delete using (auth.uid() = user_id);

create index if not exists threads_user_id_idx on public.threads(user_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger threads_set_updated_at
  before update on public.threads
  for each row execute function public.set_updated_at();
