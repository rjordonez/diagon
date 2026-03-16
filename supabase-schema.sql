-- Users profile (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  company text,
  created_at timestamptz default now()
);

-- Borrowers (pipeline)
create table public.borrowers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  first_name text not null,
  last_name text not null,
  co_first_name text,
  co_last_name text,
  email text not null,
  phone text,
  loan_amount numeric default 0,
  loan_purpose text,
  property_address text,
  stage text default 'new-lead',
  lead_temp text default 'warm',
  lead_score integer default 50,
  days_in_stage integer default 0,
  lead_source text,
  docs_requested integer default 0,
  docs_received integer default 0,
  docs_verified integer default 0,
  ai_flags integer default 0,
  verification_status text default 'pending',
  last_activity text default 'Just now',
  next_action text default 'Initial outreach',
  assigned_lo text default 'You',
  notes text default '',
  speed_to_lead_enabled boolean default false,
  created_at timestamptz default now()
);

-- Incoming leads (from Lead Distribution)
create table public.incoming_leads (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  email text not null,
  phone text,
  state text,
  loan_type text,
  loan_amount numeric default 0,
  property_address text,
  price numeric default 0,
  status text default 'new',
  source text,
  trusted_form_cert text,
  lead_id_token text,
  dupe_check boolean default true,
  created_at timestamptz default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.borrowers enable row level security;
alter table public.incoming_leads enable row level security;

create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

create policy "Users can read own borrowers" on public.borrowers for select using (auth.uid() = user_id);
create policy "Users can insert own borrowers" on public.borrowers for insert with check (auth.uid() = user_id);
create policy "Users can update own borrowers" on public.borrowers for update using (auth.uid() = user_id);
create policy "Users can delete own borrowers" on public.borrowers for delete using (auth.uid() = user_id);

create policy "Users can read own leads" on public.incoming_leads for select using (auth.uid() = user_id);
create policy "Users can insert own leads" on public.incoming_leads for insert with check (auth.uid() = user_id);
create policy "Users can update own leads" on public.incoming_leads for update using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Seed incoming leads for new users (triggered after profile creation)
create or replace function public.seed_incoming_leads()
returns trigger as $$
begin
  insert into public.incoming_leads (user_id, name, email, phone, state, loan_type, loan_amount, property_address, price, status, source, trusted_form_cert, lead_id_token, dupe_check) values
    (new.id, 'Marcus Webb', 'marcus.webb@email.com', '(415) 555-0142', 'CA', 'Purchase', 880000, '2847 Oak Valley Dr, San Jose, CA 95132', 45, 'new', 'CA Purchase Leads', 'tf-cert-8a3f2b', 'lid-9x2k7m', true),
    (new.id, 'Priya Nair', 'priya.nair@email.com', '(408) 555-0267', 'CA', 'Refinance', 540000, '918 Elm Creek Way, Sunnyvale, CA 94086', 45, 'new', 'Multi-State Refi', 'tf-cert-5c1d9e', 'lid-7p3n4q', true),
    (new.id, 'Derek Fontaine', 'derek.fontaine@email.com', '(510) 555-0198', 'CA', 'Purchase', 1600000, '1234 Johnson St, San Francisco, CA 94182', 45, 'new', 'High-Value Jumbo', 'tf-cert-7b2e6f', 'lid-4m8j1w', true),
    (new.id, 'Liam Torres', 'liam.torres@email.com', '(650) 555-0321', 'TX', 'Refinance', 420000, null, 45, 'new', 'Multi-State Refi', 'tf-cert-3e7h5k', 'lid-5t9v2r', true),
    (new.id, 'Natasha Okonkwo', 'natasha.o@email.com', '(925) 555-0456', 'FL', 'Purchase', 720000, '8812 Palm Bay Rd, Melbourne, FL 32940', 45, 'new', 'CA Purchase Leads', 'tf-cert-2a9f8c', 'lid-1k5r3p', true);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_profile_created
  after insert on public.profiles
  for each row execute procedure public.seed_incoming_leads();
