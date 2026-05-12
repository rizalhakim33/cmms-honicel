-- e-CMMS Supabase Schema for Honeycomb Paper Facility

-- 1. Assets Table (Mesin & Peralatan)
create table assets (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  category text,
  location text not null,
  technical_specs jsonb default '{}'::jsonb,
  qr_code_data text unique,
  status text default 'operational',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Labor Profiles (Teknisi)
create table labor_profiles (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  specialization text,
  role text default 'technician',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Preventive Maintenance (PM) Schedules
create table pm_schedules (
  id uuid default gen_random_uuid() primary key,
  asset_id uuid references assets(id) on delete cascade not null,
  title text not null,
  description text,
  frequency_days integer not null,
  last_performed_at timestamp with time zone,
  next_due_at timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Work Orders (WO)
create table work_orders (
  id uuid default gen_random_uuid() primary key,
  asset_id uuid references assets(id) on delete cascade not null,
  pm_id uuid references pm_schedules(id) on delete set null,
  title text not null,
  description text,
  status text default 'open',
  priority text default 'medium',
  assignee_id uuid references labor_profiles(id) on delete set null,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Maintenance Logs (Audit Trail)
create table maintenance_logs (
  id uuid default gen_random_uuid() primary key,
  work_order_id uuid references work_orders(id) on delete cascade not null,
  asset_id uuid references assets(id) on delete cascade not null,
  technician_id uuid references labor_profiles(id) on delete set null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table assets enable row level security;
alter table labor_profiles enable row level security;
alter table pm_schedules enable row level security;
alter table work_orders enable row level security;
alter table maintenance_logs enable row level security;

-- Policies (Authenticated users can perform full CRUD for development)
create policy "Authenticated users can CRUD assets" on assets for all to authenticated using (true);
create policy "Authenticated users can CRUD labor profiles" on labor_profiles for all to authenticated using (true);
create policy "Authenticated users can CRUD PM schedules" on pm_schedules for all to authenticated using (true);
create policy "Authenticated users can CRUD work orders" on work_orders for all to authenticated using (true);
create policy "Authenticated users can CRUD maintenance logs" on maintenance_logs for all to authenticated using (true);

-- Function to handle auto-timestamp on update
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_assets_updated_at before update on assets for each row execute procedure handle_updated_at();
create trigger set_wo_updated_at before update on work_orders for each row execute procedure handle_updated_at();
