create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  username text not null unique,
  username_key text not null unique,
  avatar_url text not null default '',
  bio text not null default '',
  city text not null default '',
  country text not null default '',
  fitness_goal text not null default '',
  training_styles text[] not null default '{}',
  age integer not null default 0,
  birth_date text not null default '',
  weight_kg numeric not null default 0,
  height_cm numeric not null default 0,
  sex text not null default 'nao-informar',
  visibility text not null default 'public',
  verified_email boolean not null default false,
  profile_completed boolean not null default false,
  account_status text not null default 'active',
  moderation_state text not null default 'clean',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  search_index text[] not null default '{}'
);

create table if not exists public.user_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_weight_kg numeric not null default 0,
  evolution_kg numeric not null default 0,
  trained_days integer not null default 0,
  current_streak integer not null default 0,
  favorite_exercises text[] not null default '{}',
  max_load_kg numeric not null default 0,
  training_minutes integer not null default 0,
  posts_count integer not null default 0,
  friends_count integer not null default 0,
  followers_count integer not null default 0,
  training_since_days integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  author_username text not null,
  author_avatar_url text not null default '',
  caption text not null,
  image_url text not null,
  post_type text not null default 'workout',
  run_time text,
  run_distance text,
  run_pace text,
  location text,
  visibility text not null default 'public',
  likes_count integer not null default 0,
  comments_count integer not null default 0,
  moderation_state text not null default 'clean',
  created_at timestamptz not null default now()
);

alter table public.posts add column if not exists run_time text;
alter table public.posts add column if not exists run_distance text;
alter table public.posts add column if not exists run_pace text;

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  author_username text not null,
  author_avatar_url text not null default '',
  text text not null,
  moderation_state text not null default 'clean',
  created_at timestamptz not null default now()
);

create table if not exists public.likes (
  id text primary key,
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create table if not exists public.friend_requests (
  id text primary key,
  from_user_id uuid not null references auth.users(id) on delete cascade,
  to_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.friendships (
  id text primary key,
  pair_key text not null unique,
  users text[] not null,
  created_at timestamptz not null default now()
);

create table if not exists public.blocks (
  id text primary key,
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null,
  target_id text not null,
  reason text not null,
  details text not null default '',
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create or replace function public.handle_post_counts()
returns trigger
language plpgsql
as $$
begin
  if tg_table_name = 'likes' then
    if tg_op = 'INSERT' then
      update public.posts set likes_count = likes_count + 1 where id = new.post_id;
    elsif tg_op = 'DELETE' then
      update public.posts set likes_count = greatest(likes_count - 1, 0) where id = old.post_id;
    end if;
  elsif tg_table_name = 'comments' then
    if tg_op = 'INSERT' then
      update public.posts set comments_count = comments_count + 1 where id = new.post_id;
    elsif tg_op = 'DELETE' then
      update public.posts set comments_count = greatest(comments_count - 1, 0) where id = old.post_id;
    end if;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists likes_count_trigger on public.likes;
create trigger likes_count_trigger
after insert or delete on public.likes
for each row execute function public.handle_post_counts();

drop trigger if exists comments_count_trigger on public.comments;
create trigger comments_count_trigger
after insert or delete on public.comments
for each row execute function public.handle_post_counts();

alter table public.profiles enable row level security;
alter table public.user_snapshots enable row level security;
alter table public.user_stats enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;
alter table public.friend_requests enable row level security;
alter table public.friendships enable row level security;
alter table public.blocks enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;

drop policy if exists "profiles public read" on public.profiles;
create policy "profiles public read" on public.profiles for select using (true);
drop policy if exists "profiles owner write" on public.profiles;
create policy "profiles owner write" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "snapshots owner read" on public.user_snapshots;
create policy "snapshots owner read" on public.user_snapshots for select using (auth.uid() = user_id);
drop policy if exists "snapshots owner write" on public.user_snapshots;
create policy "snapshots owner write" on public.user_snapshots for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "stats public read" on public.user_stats;
create policy "stats public read" on public.user_stats for select using (true);
drop policy if exists "stats owner write" on public.user_stats;
create policy "stats owner write" on public.user_stats for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "posts public read" on public.posts;
create policy "posts public read" on public.posts for select using (true);
drop policy if exists "posts owner write" on public.posts;
create policy "posts owner write" on public.posts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "comments public read" on public.comments;
create policy "comments public read" on public.comments for select using (true);
drop policy if exists "comments owner write" on public.comments;
create policy "comments owner write" on public.comments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "likes public read" on public.likes;
create policy "likes public read" on public.likes for select using (true);
drop policy if exists "likes owner write" on public.likes;
create policy "likes owner write" on public.likes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "friend requests visible" on public.friend_requests;
create policy "friend requests visible" on public.friend_requests for select using (auth.uid() = from_user_id or auth.uid() = to_user_id);
drop policy if exists "friend requests owner write" on public.friend_requests;
create policy "friend requests owner write" on public.friend_requests for all using (auth.uid() = from_user_id or auth.uid() = to_user_id) with check (auth.uid() = from_user_id or auth.uid() = to_user_id);

drop policy if exists "friendships public read" on public.friendships;
create policy "friendships public read" on public.friendships for select using (true);
drop policy if exists "friendships authenticated write" on public.friendships;
create policy "friendships authenticated write" on public.friendships for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "blocks owner read" on public.blocks;
create policy "blocks owner read" on public.blocks for select using (auth.uid() = blocker_id or auth.uid() = blocked_id);
drop policy if exists "blocks owner write" on public.blocks;
create policy "blocks owner write" on public.blocks for all using (auth.uid() = blocker_id) with check (auth.uid() = blocker_id);

drop policy if exists "notifications owner read" on public.notifications;
create policy "notifications owner read" on public.notifications for select using (auth.uid() = user_id);
drop policy if exists "notifications actor write" on public.notifications;
create policy "notifications actor write" on public.notifications for all using (auth.uid() = actor_user_id or auth.uid() = user_id) with check (auth.uid() = actor_user_id or auth.uid() = user_id);

drop policy if exists "reports owner write" on public.reports;
create policy "reports owner write" on public.reports for insert with check (auth.uid() = reporter_user_id);

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists "media public read" on storage.objects;
create policy "media public read" on storage.objects for select using (bucket_id = 'media');

drop policy if exists "media authenticated upload" on storage.objects;
create policy "media authenticated upload" on storage.objects for insert with check (
  bucket_id = 'media'
  and auth.uid() is not null
);

drop policy if exists "media owner update" on storage.objects;
create policy "media owner update" on storage.objects for update using (
  bucket_id = 'media'
  and auth.uid() is not null
) with check (
  bucket_id = 'media'
  and auth.uid() is not null
);

drop policy if exists "media owner delete" on storage.objects;
create policy "media owner delete" on storage.objects for delete using (
  bucket_id = 'media'
  and auth.uid() is not null
);
