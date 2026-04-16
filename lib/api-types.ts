export interface LoginResponse {
  tokens: {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    session_id: number;
  };
  user: {
    user_id: number;
    username: string;
    first_name: string;
    last_name: string;
    organization_id: number;
    role_id: number;
    email: string;
    status: string;
  };
}

export interface Organization {
  organization_id: number;
  organization_name: string;
  license_status: string;
  created_at: string;
  updated_at: string;
}

export interface PlatformStats {
  total_organizations: number;
  total_users: number;
  active_users_today: number;
}

export interface RevenueData {
  mrr: number;
  arr: number;
  monthly: Array<{ month: string; revenue: number }>;
}

export interface GrowthData {
  monthly: Array<{ month: string; new_schools: number }>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
}

export interface Ticket {
  ticket_id: number;
  user_id: number;
  subject: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  first_name?: string;
  last_name?: string;
  organization_name?: string;
}

export interface Invoice {
  invoice_id: number;
  org_id: number;
  plan_id: number;
  amount: number;
  billing_cycle: string;
  status: string;
  invoice_date: string;
  due_date: string;
  organization_name?: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  category: string;
  read_at: string | null;
  created_at: string;
}
