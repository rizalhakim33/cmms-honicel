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
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  specialization text,
  role text default 'technician',
  email text unique,
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

-- Policies (More restrictive role-based policies)

-- Public read for assets, but only admins/supervisors can write
create policy "Read assets" on assets for select to authenticated using (true);
create policy "Manage assets" on assets for all to authenticated 
  using (exists (select 1 from labor_profiles where id = auth.uid() and role in ('admin', 'supervisor')));

-- Labor profiles: users can see all, but only admin can manage
create policy "Read labor" on labor_profiles for select to authenticated using (true);
create policy "Manage labor" on labor_profiles for all to authenticated 
  using (exists (select 1 from labor_profiles where id = auth.uid() and role = 'admin'));

-- Work Orders:
-- 1. Everyone can read
-- 2. Technicians can UPDATE work orders assigned to them
-- 3. Supervisors/Admins can do everything
create policy "Read work orders" on work_orders for select to authenticated using (true);
create policy "Create work orders" on work_orders for insert to authenticated 
  using (exists (select 1 from labor_profiles where id = auth.uid() and role in ('admin', 'supervisor')));
create policy "Technicians update assigned items" on work_orders for update to authenticated 
  using (
    assignee_id = auth.uid() 
    or exists (select 1 from labor_profiles where id = auth.uid() and role in ('admin', 'supervisor'))
  );
create policy "Delete work orders" on work_orders for delete to authenticated 
  using (exists (select 1 from labor_profiles where id = auth.uid() and role in ('admin', 'supervisor')));

-- PM Schedules
create policy "Read PM" on pm_schedules for select to authenticated using (true);
create policy "Manage PM" on pm_schedules for all to authenticated 
  using (exists (select 1 from labor_profiles where id = auth.uid() and role in ('admin', 'supervisor')));

-- Maintenance logs
create policy "Read logs" on maintenance_logs for select to authenticated using (true);
create policy "Create logs" on maintenance_logs for insert to authenticated using (true);

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
