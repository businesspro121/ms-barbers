-- MS Barbers — database schema
-- Run this once in your Supabase project: Dashboard → SQL Editor → New query → paste → Run.

-- ---------------------------------------------------------------------------
-- profiles: one row per signed-in customer, created automatically on signup.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  age integer check (age is null or (age >= 0 and age <= 120)),
  preferred_cut_type text,
  stripe_customer_id text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row the moment someone signs up (Google or email).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- bookings: one row per requested appointment.
-- No automatic slot-conflict checking yet — each request lands as "pending"
-- for the shop to confirm by phone/in person. Treat this as a request form
-- with a database behind it, not a live calendar, until that's added.
-- ---------------------------------------------------------------------------
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  cut_type text not null,
  requested_at timestamptz not null,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  stripe_payment_method_id text,
  created_at timestamptz not null default now()
);

alter table public.bookings enable row level security;

create policy "Users can view their own bookings"
  on public.bookings for select
  using (auth.uid() = user_id);

create policy "Users can create their own bookings"
  on public.bookings for insert
  with check (auth.uid() = user_id);

create policy "Users can cancel their own pending bookings"
  on public.bookings for update
  using (auth.uid() = user_id and status = 'pending')
  with check (status = 'cancelled');

-- ---------------------------------------------------------------------------
-- Nothing in this file ever stores a card number. stripe_customer_id and
-- stripe_payment_method_id are just references — Stripe holds the actual
-- card data. See supabase/functions/create-setup-intent for how that works.
-- ---------------------------------------------------------------------------
