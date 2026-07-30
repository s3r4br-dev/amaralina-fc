-- Tabela de Perfis de Usuários (vinculada ao auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text not null,
  role text not null default 'user' check (role in ('admin', 'user')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  linked_player_id integer,
  created_at timestamp with time zone default now(),
  last_login timestamp with time zone
);

alter table public.profiles enable row level security;

create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_update_admin" on public.profiles for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "profiles_delete_admin" on public.profiles for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Tabela de Jogadores
create table if not exists public.jogadores (
  id serial primary key,
  name text not null,
  nickname text not null,
  position text not null,
  number integer not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  linked_email text,
  photo_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.jogadores enable row level security;

create policy "jogadores_select_all" on public.jogadores for select using (true);
create policy "jogadores_insert_admin" on public.jogadores for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "jogadores_update_admin" on public.jogadores for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "jogadores_delete_admin" on public.jogadores for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Tabela de Partidas
create table if not exists public.partidas (
  id serial primary key,
  date date not null,
  time text not null,
  team_a_name text not null,
  team_b_name text not null,
  score_a integer not null default 0,
  score_b integer not null default 0,
  status text not null default 'agendado' check (status in ('agendado', 'finalizado')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.partidas enable row level security;

create policy "partidas_select_all" on public.partidas for select using (true);
create policy "partidas_insert_admin" on public.partidas for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "partidas_update_admin" on public.partidas for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "partidas_delete_admin" on public.partidas for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Tabela de Estatísticas de Jogadores por Partida
create table if not exists public.partida_jogadores (
  id serial primary key,
  partida_id integer not null references public.partidas(id) on delete cascade,
  jogador_id integer not null references public.jogadores(id) on delete cascade,
  team text not null check (team in ('A', 'B')),
  goals integer not null default 0,
  assists integer not null default 0,
  is_goalkeeper boolean not null default false,
  goals_conceded integer not null default 0,
  created_at timestamp with time zone default now(),
  unique(partida_id, jogador_id)
);

alter table public.partida_jogadores enable row level security;

create policy "partida_jogadores_select_all" on public.partida_jogadores for select using (true);
create policy "partida_jogadores_insert_admin" on public.partida_jogadores for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "partida_jogadores_update_admin" on public.partida_jogadores for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "partida_jogadores_delete_admin" on public.partida_jogadores for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Tabela de Configurações do App (logo, etc)
create table if not exists public.app_settings (
  id serial primary key,
  key text unique not null,
  value text,
  updated_at timestamp with time zone default now()
);

alter table public.app_settings enable row level security;

create policy "app_settings_select_all" on public.app_settings for select using (true);
create policy "app_settings_insert_admin" on public.app_settings for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "app_settings_update_admin" on public.app_settings for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Trigger para criar perfil automaticamente ao criar usuário
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'role', 'user')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Habilitar Realtime nas tabelas principais
alter publication supabase_realtime add table public.jogadores;
alter publication supabase_realtime add table public.partidas;
alter publication supabase_realtime add table public.partida_jogadores;
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.app_settings;

-- Criar índices para performance
create index if not exists idx_partidas_date on public.partidas(date);
create index if not exists idx_partida_jogadores_partida on public.partida_jogadores(partida_id);
create index if not exists idx_partida_jogadores_jogador on public.partida_jogadores(jogador_id);
create index if not exists idx_jogadores_status on public.jogadores(status);
