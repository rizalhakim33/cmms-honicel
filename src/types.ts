export type WOStatus = 'open' | 'in_progress' | 'pending' | 'completed';
export type WOPriority = 'low' | 'medium' | 'high' | 'urgent';
export type AssetStatus = 'operational' | 'under_maintenance' | 'down';
export type AssetCategory = string;

export interface Asset {
  id: string;
  name: string;
  asset_code?: string | null;
  parent_id?: string | null;
  category: string;
  location: string;
  technical_specs: Record<string, any>;
  qr_code_data: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  subAssets?: Asset[];
}

export interface LaborProfile {
  id: string;
  full_name: string;
  specialization: string;
  role: string;
}

export type RepairType = 'Repair' | 'Setting' | 'Kalibrasi' | 'Inspection';

export interface WorkOrder {
  id: string;
  asset_id: string;
  pm_id: string | null;
  title: string;
  description: string | null;
  repair_type?: RepairType | null;
  status: WOStatus;
  priority: WOPriority;
  assignee_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  
  // Replaced sparepart tracking
  replaced_sparepart_name?: string | null;
  replaced_sparepart_qty?: number | null;
  
  // Joins
  asset?: Asset;
  assignee?: LaborProfile;
}

export interface PMSchedule {
  id: string;
  asset_id: string;
  title: string;
  description: string | null;
  frequency_days: number;
  last_performed_at: string | null;
  next_due_at: string;
  created_at: string;
  asset?: Asset;
}

export interface Sparepart {
  id: string;
  name: string;
  stock: number;
  min_stock: number;
  price: number;
  estimated_lifetime_hours: number;
  created_at: string;
  updated_at: string;
}

export interface InstalledSparepart {
  id: string;
  asset_id: string;
  work_order_id: string | null;
  sparepart_name: string;
  quantity: number;
  installed_at: string;
  estimated_lifetime_hours: number;
  created_at: string;
  
  // Join
  asset?: Asset;
}

export interface CashFlow {
  id: string;
  type: 'sparepart' | 'operational' | 'tool';
  title: string;
  amount: number;
  date: string;
  reference_id: string | null;
  created_at: string;
}
