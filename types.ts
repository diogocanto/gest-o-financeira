
export interface Customer {
  id: string;
  name: string;
  phone: string;
  birth_date: string;
  total_bought: number;
  total_paid: number;
  created_at: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  model: string;
  size: string;
  category: string;
  cost_price: number;
  sale_price: number;
  stock: number;
}

export enum PaymentMethod {
  PIX = 'Pix',
  CASH = 'Dinheiro',
  CARD = 'Cartão',
  INSTALLMENT = 'Crediário'
}

export interface Sale {
  id: string;
  customer_id?: string;
  date: string;
  total_value: number;
  payment_method: PaymentMethod;
  installments_count?: number;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
}

export interface Installment {
  id: string;
  sale_id: string;
  customer_id: string;
  number: number;
  value: number;
  due_date: string;
  paid_at?: string; // Data real do pagamento
  status: 'pending' | 'paid' | 'overdue';
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  category: string;
  value: number;
  payment_method: string;
}

export interface DashboardStats {
  today_income: number;
  today_expenses: number;
  monthly_balance: number;
  credit_pending: number;
}
