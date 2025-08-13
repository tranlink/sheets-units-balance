export interface Purchase {
  id: string;
  date: string;
  category: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalCost: number;
  unit?: string;
  partner?: string;
  receipt?: string;
}

export interface Unit {
  id: string;
  name: string;
  type: string;
  budget: number;
  actualCost: number;
  status: 'Planning' | 'In Progress' | 'Completed' | 'On Hold';
  completionDate?: string;
  partner?: string;
}

export interface Partner {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalContribution: number;
  totalSpent: number;
  balance: number;
  status: 'Active' | 'Inactive';
}

export interface BudgetCategory {
  id: string;
  name: string;
  budgetAmount: number;
  spentAmount: number;
  remaining: number;
}

export interface Alert {
  id: string;
  message: string;
  type: 'warning' | 'error' | 'info';
  severity: 'high' | 'medium' | 'low';
  date: string;
}