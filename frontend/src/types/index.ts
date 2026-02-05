// User types
export interface User {
  id: number;
  email: string;
  name: string;
  profileImage: string | null;
}

// Business types
export interface BudgetItem {
  id?: number;
  name: string;
  budgetAmount: number;
}

export interface Business {
  id: number;
  name: string;
  createdAt: string;
  budgetItems: BudgetItem[];
}

// Receipt types
export interface Receipt {
  id: number;
  budgetItemId: number;
  itemName?: string;
  date: string;
  description: string;
  amount: number;
  notes: string | null;
  imagePath: string;
  createdAt: string;
}

export interface ExtractedReceiptData {
  imagePath: string;
  date: string;
  description: string;
  amount: number;
  rawText: string;
}

// Dashboard types
export interface DashboardSummary {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  executionRate: number;
}

export interface DashboardItem {
  id: number;
  name: string;
  budget: number;
  spent: number;
  remaining: number;
  executionRate: number;
}

export interface DashboardData {
  business: {
    id: number;
    name: string;
  };
  summary: DashboardSummary;
  items: DashboardItem[];
  receipts: Receipt[];
}

// API Response types
export interface ApiError {
  error: string;
}

export interface AuthStatus {
  isAuthenticated: boolean;
}
