export type AccountType = 'bank' | 'cash' | 'card' | 'savings';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  icon: string;
  color: string;
  created_at: string;
}

export type CategoryType = 'expense' | 'income';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
}

export type TransactionType = 'expense' | 'income' | 'transfer';

export interface Transaction {
  id: string;
  account_id: string;
  category_id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  title: string;
  date: string; // ISO YYYY-MM-DD or full ISO
  notes?: string;
  receipt_id?: string;
  created_at: string;
}

export type BillFrequency = 'monthly' | 'yearly' | 'one_time';

export interface Bill {
  id: string;
  title: string;
  category_id?: string;
  amount: number;
  currency: string;
  due_day: number; // 1 to 31
  frequency: BillFrequency;
  is_paid: number; // 0 or 1
  reminder_enabled: number; // 0 or 1
  notes?: string;
  created_at: string;
}

export interface Receipt {
  id: string;
  image_uri: string; // Local relative or full file URI
  filename: string;
  store_name: string;
  total_amount: number;
  currency: string;
  receipt_date: string;
  raw_ocr_text?: string;
  transaction_id?: string;
  created_at: string;
}

export interface UtilitySubscription {
  id: string;
  provider_key: string;
  provider_name: string;
  client_number: string;
  alias: string;
  category_id: string;
  current_amount: number;
  currency: string;
  due_date: string;
  due_day: number;
  is_paid: number; // 0 or 1
  last_checked: string;
  created_at: string;
}

