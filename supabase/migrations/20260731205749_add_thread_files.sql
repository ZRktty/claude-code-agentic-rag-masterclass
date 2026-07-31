alter table public.threads add column if not exists openai_vector_store_id text;

create table if not exists public.thread_files (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  openai_file_id text not null,
  filename text not null,
  created_at timestamptz not null default now()
);

alter table public.thread_files enable row level security;

create policy "Users can view own thread files" on public.thread_files
  for select using (auth.uid() = user_id);
create policy "Users can insert own thread files" on public.thread_files
  for insert with check (auth.uid() = user_id);

create index if not exists thread_files_thread_id_idx on public.thread_files(thread_id);
