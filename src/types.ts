export type WOStatus = 'open' | 'in_progress' | 'pending' | 'completed';
export type WOPriority = 'low' | 'medium' | 'high' | 'urgent';
export type AssetStatus = 'operational' | 'under_maintenance' | 'down';
export type AssetCategory = string;

export interface Asset {
  id: string;
  name: string;
  category: string;
  location: string;
  technical_specs: Record<string, any>;
  qr_code_data: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface LaborProfile {
  id: string;
  full_name: string;
  specialization: string;
  role: string;
}

export interface WorkOrder {
  id: string;
  asset_id: string;
  pm_id: string | null;
  title: string;
  description: string | null;
  status: WOStatus;
  priority: WOPriority;
  assignee_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  
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
