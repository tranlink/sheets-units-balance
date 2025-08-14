import { supabase } from "@/integrations/supabase/client";

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  total_budget: number;
  location?: string;
  categories: string[];
  created_at: string;
  updated_at: string;
}

export interface Partner {
  id: string;
  project_id: string;
  name: string;
  email?: string;
  phone?: string;
  total_contribution: number;
  status: 'Active' | 'Inactive';
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: string;
  project_id: string;
  name: string;
  type: string;
  budget: number;
  status: 'Planning' | 'In Progress' | 'Completed' | 'On Hold';
  partner_id?: string;
  completion_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Purchase {
  id: string;
  project_id: string;
  unit_id?: string;
  partner_id?: string;
  date: string;
  category: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_cost: number;
  receipt_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UnitCostData {
  unit_id: string;
  unit_name: string;
  unit_type: string;
  budget: number;
  actual_cost: number;
  cost_percentage: number;
}

export interface CategorySpendingData {
  category: string;
  total_spent: number;
  purchase_count: number;
  average_purchase: number;
}

// Project Operations
export const createProject = async (project: Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('projects')
    .insert([project])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateProject = async (id: string, updates: Partial<Project>) => {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const getProjects = async () => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const getProject = async (id: string) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

// Partner Operations
export const createPartner = async (partner: Omit<Partner, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('partners')
    .insert([partner])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updatePartner = async (id: string, updates: Partial<Partner>) => {
  const { data, error } = await supabase
    .from('partners')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const getPartners = async (projectId: string) => {
  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

// Unit Operations
export const createUnit = async (unit: Omit<Unit, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('units')
    .insert([unit])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateUnit = async (id: string, updates: Partial<Unit>) => {
  const { data, error } = await supabase
    .from('units')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const getUnits = async (projectId: string) => {
  const { data, error } = await supabase
    .from('units')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

// Purchase Operations
export const createPurchase = async (purchase: Omit<Purchase, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('purchases')
    .insert([purchase])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updatePurchase = async (id: string, updates: Partial<Purchase>) => {
  const { data, error } = await supabase
    .from('purchases')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const getPurchases = async (projectId: string) => {
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .eq('project_id', projectId)
    .order('date', { ascending: false });
  
  if (error) throw error;
  return data;
};

// Reporting Functions
export const getUnitCosts = async (projectId: string): Promise<UnitCostData[]> => {
  const { data, error } = await supabase
    .rpc('get_unit_costs', { project_uuid: projectId });
  
  if (error) throw error;
  return data || [];
};

export const getCategorySpending = async (projectId: string): Promise<CategorySpendingData[]> => {
  const { data, error } = await supabase
    .rpc('get_category_spending', { project_uuid: projectId });
  
  if (error) throw error;
  return data || [];
};