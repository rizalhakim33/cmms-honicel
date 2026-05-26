-- e-CMMS Supabase Schema for Honeycomb Paper Facility

-- 1. Assets Table (Mesin & Peralatan)
create table if not exists assets (
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
create table if not exists labor_profiles (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  specialization text,
  role text default 'technician',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Preventive Maintenance (PM) Schedules
create table if not exists pm_schedules (
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
create table if not exists work_orders (
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

-- Alter existing work_orders to add new sparepart usage columns safely
alter table work_orders add column if not exists replaced_sparepart_name text;
alter table work_orders add column if not exists replaced_sparepart_qty integer default 1 check (replaced_sparepart_qty > 0);

-- Drop auth.users constraint so CSV imports work
alter table labor_profiles drop constraint if exists labor_profiles_id_fkey;

-- 4.1 Spareparts Catalog (Suku Cadang Gudang)
create table if not exists spareparts (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  stock integer default 0 check (stock >= 0),
  price numeric default 0 check (price >= 0),
  estimated_lifetime_hours integer default 2000 check (estimated_lifetime_hours > 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4.2 Installed Spareparts Tracking (Pencatatan Umur Suku Cadang Terpasang)
create table if not exists installed_spareparts (
  id uuid default gen_random_uuid() primary key,
  asset_id uuid references assets(id) on delete cascade not null,
  work_order_id uuid references work_orders(id) on delete set null,
  sparepart_name text not null,
  quantity integer default 1 check (quantity > 0),
  installed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  estimated_lifetime_hours integer default 2000 check (estimated_lifetime_hours > 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4.3 Cash Flows Ledger (Arus Kas Pengeluaran Perawatan)
create table if not exists cash_flows (
  id uuid default gen_random_uuid() primary key,
  type text not null check (type in ('sparepart', 'operational')),
  title text not null,
  amount numeric not null check (amount > 0),
  date date not null default current_date,
  reference_id uuid references work_orders(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Maintenance Logs (Audit Trail)
create table if not exists maintenance_logs (
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
alter table spareparts enable row level security;
alter table installed_spareparts enable row level security;
alter table cash_flows enable row level security;

-- Policies (More restrictive role-based policies)
drop policy if exists "Read assets" on assets;
drop policy if exists "Manage assets" on assets;
drop policy if exists "Read spareparts" on spareparts;
drop policy if exists "Manage spareparts" on spareparts;
drop policy if exists "Read installed parts" on installed_spareparts;
drop policy if exists "Insert installed parts" on installed_spareparts;
drop policy if exists "Manage installed parts" on installed_spareparts;
drop policy if exists "Read cash flows" on cash_flows;
drop policy if exists "Manage cash flows" on cash_flows;
drop policy if exists "Read labor" on labor_profiles;
drop policy if exists "Manage labor" on labor_profiles;
drop policy if exists "Insert labor" on labor_profiles;
drop policy if exists "Update labor" on labor_profiles;
drop policy if exists "Delete labor" on labor_profiles;
drop policy if exists "Read work orders" on work_orders;
drop policy if exists "Create work orders" on work_orders;
drop policy if exists "Technicians update assigned items" on work_orders;
drop policy if exists "Delete work orders" on work_orders;
drop policy if exists "Read PM" on pm_schedules;
drop policy if exists "Manage PM" on pm_schedules;
drop policy if exists "Read logs" on maintenance_logs;
drop policy if exists "Create logs" on maintenance_logs;

-- Public read for assets, but only admins/supervisors can write
create policy "Read assets" on assets for select to authenticated using (true);
create policy "Manage assets" on assets for all to authenticated 
  using (exists (select 1 from labor_profiles where id = auth.uid() and role in ('admin', 'supervisor')));

-- Spareparts: authenticated read, write for admins/supervisors
create policy "Read spareparts" on spareparts for select to authenticated using (true);
create policy "Insert spareparts" on spareparts for insert to authenticated 
  with check (exists (select 1 from labor_profiles where id = auth.uid() and role in ('admin', 'supervisor')));
create policy "Update spareparts" on spareparts for update to authenticated 
  using (exists (select 1 from labor_profiles where id = auth.uid() and role in ('admin', 'supervisor')));
create policy "Delete spareparts" on spareparts for delete to authenticated 
  using (exists (select 1 from labor_profiles where id = auth.uid() and role in ('admin', 'supervisor')));

-- Installed spareparts: authenticated read, any crew can insert log context
create policy "Read installed parts" on installed_spareparts for select to authenticated using (true);
create policy "Insert installed parts" on installed_spareparts for insert to authenticated with check (true);
create policy "Manage installed parts" on installed_spareparts for all to authenticated 
  using (exists (select 1 from labor_profiles where id = auth.uid() and role in ('admin', 'supervisor')));

-- Cash flows accounting ledger: authenticated read, write for admins/supervisors
create policy "Read cash flows" on cash_flows for select to authenticated using (true);
create policy "Manage cash flows" on cash_flows for all to authenticated 
  using (exists (select 1 from labor_profiles where id = auth.uid() and role in ('admin', 'supervisor')));

-- Labor profiles: users can see all, but only admin can manage
create policy "Read labor" on labor_profiles for select to authenticated using (true);

create policy "Insert labor" on labor_profiles for insert to authenticated 
  with check (exists (select 1 from labor_profiles where id = auth.uid() and role = 'admin') or auth.uid() = id);

create policy "Update labor" on labor_profiles for update to authenticated 
  using (exists (select 1 from labor_profiles where id = auth.uid() and role = 'admin') or auth.uid() = id);

create policy "Delete labor" on labor_profiles for delete to authenticated 
  using (exists (select 1 from labor_profiles where id = auth.uid() and role = 'admin'));

-- Work Orders:
-- 1. Everyone can read
-- 2. Technicians can UPDATE work orders assigned to them
-- 3. Supervisors/Admins can do everything
create policy "Read work orders" on work_orders for select to authenticated using (true);
create policy "Create work orders" on work_orders for insert to authenticated 
  with check (exists (select 1 from labor_profiles where id = auth.uid() and role in ('admin', 'supervisor')));
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
create policy "Create logs" on maintenance_logs for insert to authenticated with check (true);

-- Function to handle auto-timestamp on update
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_assets_updated_at on assets;
create trigger set_assets_updated_at before update on assets for each row execute procedure handle_updated_at();

drop trigger if exists set_wo_updated_at on work_orders;
create trigger set_wo_updated_at before update on work_orders for each row execute procedure handle_updated_at();

drop trigger if exists set_spareparts_updated_at on spareparts;
create trigger set_spareparts_updated_at before update on spareparts for each row execute procedure handle_updated_at();
