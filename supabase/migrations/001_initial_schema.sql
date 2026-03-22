-- ============================================================
-- Golf Charity Subscription Platform — Full Database Schema
-- ============================================================

create extension if not exists "uuid-ossp";

-- USERS
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text unique not null,
  full_name   text,
  role        text not null default 'subscriber' check (role in ('subscriber', 'admin')),
  avatar_url  text,
  created_at  timestamptz default now()
);

-- SUBSCRIPTIONS
create table if not exists public.subscriptions (
  id                     uuid primary key default uuid_generate_v4(),
  user_id                uuid unique not null references public.users(id) on delete cascade,
  plan                   text not null check (plan in ('monthly', 'yearly')),
  status                 text not null default 'inactive' check (status in ('active', 'inactive', 'cancelled', 'past_due')),
  stripe_subscription_id text unique,
  stripe_customer_id     text,
  charity_percentage     int not null default 10 check (charity_percentage >= 10 and charity_percentage <= 100),
  current_period_start   timestamptz,
  current_period_end     timestamptz,
  created_at             timestamptz default now()
);

-- SCORES
create table if not exists public.scores (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.users(id) on delete cascade,
  score      int not null check (score >= 1 and score <= 45),
  played_on  date not null,
  created_at timestamptz default now()
);

create index if not exists idx_scores_user_date on public.scores(user_id, played_on desc);

-- DRAWS
create table if not exists public.draws (
  id              uuid primary key default uuid_generate_v4(),
  status          text not null default 'pending' check (status in ('pending', 'simulation', 'published')),
  logic_type      text not null default 'random' check (logic_type in ('random', 'weighted')),
  winning_numbers int[],
  draw_date       date not null,
  published_at    timestamptz,
  created_at      timestamptz default now()
);

-- DRAW ENTRIES
create table if not exists public.draw_entries (
  id             uuid primary key default uuid_generate_v4(),
  draw_id        uuid not null references public.draws(id) on delete cascade,
  user_id        uuid not null references public.users(id) on delete cascade,
  score_snapshot int[] not null,
  created_at     timestamptz default now(),
  unique (draw_id, user_id)
);

-- PRIZE POOLS
create table if not exists public.prize_pools (
  id                      uuid primary key default uuid_generate_v4(),
  draw_id                 uuid unique not null references public.draws(id) on delete cascade,
  total_amount            numeric(10,2) not null default 0,
  jackpot_percentage      int not null default 40,
  four_match_percentage   int not null default 35,
  three_match_percentage  int not null default 25,
  rollover_amount         numeric(10,2) not null default 0,
  created_at              timestamptz default now()
);

-- CHARITIES
create table if not exists public.charities (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  description text not null,
  image_url   text,
  website_url text,
  is_featured boolean not null default false,
  is_active   boolean not null default true,
  created_at  timestamptz default now()
);

-- CHARITY SELECTIONS
create table if not exists public.charity_selections (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid unique not null references public.users(id) on delete cascade,
  charity_id  uuid not null references public.charities(id),
  selected_at timestamptz default now()
);

-- CHARITY DONATIONS
create table if not exists public.charity_donations (
  id              uuid primary key default uuid_generate_v4(),
  charity_id      uuid not null references public.charities(id),
  subscription_id uuid not null references public.subscriptions(id),
  amount          numeric(10,2) not null,
  donated_at      timestamptz default now()
);

-- WINNERS
create table if not exists public.winners (
  id              uuid primary key default uuid_generate_v4(),
  draw_id         uuid not null references public.draws(id) on delete cascade,
  user_id         uuid not null references public.users(id) on delete cascade,
  prize_pool_id   uuid references public.prize_pools(id),
  match_count     int not null check (match_count between 3 and 5),
  matched_numbers int[],
  prize_amount    numeric(10,2) not null default 0,
  payment_status  text not null default 'pending' check (payment_status in ('pending', 'paid', 'rejected')),
  created_at      timestamptz default now()
);

-- WINNER PROOFS
create table if not exists public.winner_proofs (
  id           uuid primary key default uuid_generate_v4(),
  winner_id    uuid not null references public.winners(id) on delete cascade,
  file_url     text not null,
  admin_status text not null default 'pending' check (admin_status in ('pending', 'approved', 'rejected')),
  admin_notes  text,
  reviewed_at  timestamptz,
  created_at   timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.users              enable row level security;
alter table public.subscriptions      enable row level security;
alter table public.scores             enable row level security;
alter table public.draws              enable row level security;
alter table public.draw_entries       enable row level security;
alter table public.prize_pools        enable row level security;
alter table public.winners            enable row level security;
alter table public.winner_proofs      enable row level security;
alter table public.charities          enable row level security;
alter table public.charity_selections enable row level security;
alter table public.charity_donations  enable row level security;

-- Admin helper function
create or replace function public.is_admin()
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

-- USERS policies
create policy "Users can view own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
create policy "Admins can view all users" on public.users for select using (public.is_admin());
create policy "Admins can update all users" on public.users for update using (public.is_admin());
create policy "Allow insert on signup" on public.users for insert with check (auth.uid() = id);

-- SUBSCRIPTIONS policies
create policy "Users can view own subscription" on public.subscriptions for select using (auth.uid() = user_id);
create policy "Users can update own subscription" on public.subscriptions for update using (auth.uid() = user_id);
create policy "Admins can manage subscriptions" on public.subscriptions for all using (public.is_admin());
create policy "Service can insert subscriptions" on public.subscriptions for insert with check (true);

-- SCORES policies
create policy "Users can view own scores" on public.scores for select using (auth.uid() = user_id);
create policy "Users can insert own scores" on public.scores for insert with check (auth.uid() = user_id);
create policy "Users can delete own scores" on public.scores for delete using (auth.uid() = user_id);
create policy "Admins can manage all scores" on public.scores for all using (public.is_admin());

-- DRAWS policies
create policy "Anyone can view published draws" on public.draws for select using (status = 'published' or public.is_admin());
create policy "Admins can manage draws" on public.draws for all using (public.is_admin());

-- DRAW ENTRIES policies
create policy "Users can view own entries" on public.draw_entries for select using (auth.uid() = user_id);
create policy "Admins can manage draw entries" on public.draw_entries for all using (public.is_admin());

-- PRIZE POOLS
create policy "Anyone can view prize pools" on public.prize_pools for select using (true);
create policy "Admins can manage prize pools" on public.prize_pools for all using (public.is_admin());

-- WINNERS policies
create policy "Users can view own winnings" on public.winners for select using (auth.uid() = user_id);
create policy "Admins can manage winners" on public.winners for all using (public.is_admin());
create policy "Service can insert winners" on public.winners for insert with check (true);

-- WINNER PROOFS policies
create policy "Winners can upload proof" on public.winner_proofs for insert with check (
  exists (select 1 from public.winners where id = winner_id and user_id = auth.uid())
);
create policy "Users can view own proof" on public.winner_proofs for select using (
  exists (select 1 from public.winners where id = winner_id and user_id = auth.uid())
  or public.is_admin()
);
create policy "Admins can manage proofs" on public.winner_proofs for all using (public.is_admin());

-- CHARITIES
create policy "Anyone can view active charities" on public.charities for select using (is_active = true or public.is_admin());
create policy "Admins can manage charities" on public.charities for all using (public.is_admin());

-- CHARITY SELECTIONS
create policy "Users can manage own selection" on public.charity_selections for all using (auth.uid() = user_id);
create policy "Service can insert selections" on public.charity_selections for insert with check (true);

-- CHARITY DONATIONS
create policy "Admins can view all donations" on public.charity_donations for select using (public.is_admin());
create policy "Service can insert donations" on public.charity_donations for insert with check (true);

-- ============================================================
-- SEED DATA
-- ============================================================

insert into public.charities (name, description, website_url, is_featured, is_active) values
  ('Cancer Research UK', 'Leading charity dedicated to cancer research, influencing policy and providing information to help defeat cancer.', 'https://www.cancerresearchuk.org', true, true),
  ('The Golf Foundation', 'Growing golf participation among young people across Great Britain and Ireland. Making golf accessible to all.', 'https://www.golf-foundation.org', true, true),
  ('Walking with the Wounded', 'Supporting wounded veterans back into civilian life through employment programmes and mental health support.', 'https://www.walkingwiththewounded.org.uk', false, true),
  ('Macmillan Cancer Support', 'Helping people living with cancer by providing medical, emotional, practical and financial support.', 'https://www.macmillan.org.uk', false, true),
  ('Prostate Cancer UK', 'Leading charity for men with prostate cancer in the UK, funding research and providing support.', 'https://prostatecanceruk.org', false, true),
  ('The Samaritans', 'Providing emotional support to anyone in emotional distress, struggling to cope, or at risk of suicide.', 'https://www.samaritans.org', false, true)
on conflict do nothing;