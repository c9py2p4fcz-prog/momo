import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { Account, Bill, Category, Receipt, Transaction, UtilitySubscription } from './schema';

const isWeb = Platform.OS === 'web';

// ----------------- DEFAULT SEED DATA -----------------

export const DEFAULT_ACCOUNTS: Account[] = [
  {
    id: 'acc_bank_1',
    name: 'Банкова сметка',
    type: 'bank',
    balance: 2450.00,
    currency: 'BGN',
    icon: 'card-outline',
    color: '#007AFF',
    created_at: new Date().toISOString(),
  },
  {
    id: 'acc_cash_1',
    name: 'В брой (Портфейл)',
    type: 'cash',
    balance: 180.00,
    currency: 'BGN',
    icon: 'cash-outline',
    color: '#34C759',
    created_at: new Date().toISOString(),
  },
  {
    id: 'acc_savings_1',
    name: 'Спестовна сметка',
    type: 'savings',
    balance: 5000.00,
    currency: 'BGN',
    icon: 'shield-checkmark-outline',
    color: '#FF9500',
    created_at: new Date().toISOString(),
  },
];

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_supermarket', name: 'Супермаркет', type: 'expense', icon: 'cart-outline', color: '#34C759' },
  { id: 'cat_food', name: 'Храна и ресторанти', type: 'expense', icon: 'restaurant-outline', color: '#FF9500' },
  { id: 'cat_bills', name: 'Битови сметки & Комунални', type: 'expense', icon: 'flash-outline', color: '#FF3B30' },
  { id: 'cat_rent', name: 'Наем и имот', type: 'expense', icon: 'home-outline', color: '#5856D6' },
  { id: 'cat_transport', name: 'Транспорт и гориво', type: 'expense', icon: 'car-outline', color: '#007AFF' },
  { id: 'cat_health', name: 'Здраве и аптека', type: 'expense', icon: 'medkit-outline', color: '#FF2D55' },
  { id: 'cat_shopping', name: 'Дрехи и покупки', type: 'expense', icon: 'bag-handle-outline', color: '#AF52DE' },
  { id: 'cat_entertainment', name: 'Забавления и хоби', type: 'expense', icon: 'game-controller-outline', color: '#FFCC00' },
  { id: 'cat_services', name: 'Абонаменти и услуги', type: 'expense', icon: 'tv-outline', color: '#5AC8FA' },
  { id: 'cat_other_exp', name: 'Други разходи', type: 'expense', icon: 'ellipsis-horizontal-circle-outline', color: '#8E8E93' },
  { id: 'cat_salary', name: 'Заплата', type: 'income', icon: 'briefcase-outline', color: '#34C759' },
  { id: 'cat_bonus', name: 'Бонус и премия', type: 'income', icon: 'gift-outline', color: '#30B0C7' },
  { id: 'cat_investments', name: 'Инвестиции и дивиденти', type: 'income', icon: 'trending-up-outline', color: '#5856D6' },
  { id: 'cat_other_inc', name: 'Други приходи', type: 'income', icon: 'add-circle-outline', color: '#007AFF' },
];

export const DEFAULT_BILLS: Bill[] = [
  {
    id: 'bill_1',
    title: 'Електроенергия (ЧЕЗ/Електрохолд)',
    category_id: 'cat_bills',
    amount: 78.50,
    currency: 'BGN',
    due_day: 15,
    frequency: 'monthly',
    is_paid: 0,
    reminder_enabled: 1,
    notes: 'Сметка за ток',
    created_at: new Date().toISOString(),
  },
  {
    id: 'bill_2',
    title: 'Оптичен интернет & ТВ',
    category_id: 'cat_services',
    amount: 35.00,
    currency: 'BGN',
    due_day: 18,
    frequency: 'monthly',
    is_paid: 0,
    reminder_enabled: 1,
    notes: 'А1 / Vivacom',
    created_at: new Date().toISOString(),
  },
  {
    id: 'bill_3',
    title: 'Водоснабдяване (Софийска вода)',
    category_id: 'cat_bills',
    amount: 32.20,
    currency: 'BGN',
    due_day: 22,
    frequency: 'monthly',
    is_paid: 0,
    reminder_enabled: 1,
    notes: 'Студена и топла вода',
    created_at: new Date().toISOString(),
  },
  {
    id: 'bill_4',
    title: 'Мобилен план',
    category_id: 'cat_services',
    amount: 29.99,
    currency: 'BGN',
    due_day: 25,
    frequency: 'monthly',
    is_paid: 1,
    reminder_enabled: 1,
    notes: 'Месечна такса',
    created_at: new Date().toISOString(),
  },
];

export const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_1',
    account_id: 'acc_bank_1',
    category_id: 'cat_salary',
    type: 'income',
    amount: 3200.00,
    currency: 'BGN',
    title: 'Месечна заплата',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    notes: 'За предходния месец',
    created_at: new Date().toISOString(),
  },
  {
    id: 'tx_2',
    account_id: 'acc_bank_1',
    category_id: 'cat_supermarket',
    type: 'expense',
    amount: 86.40,
    currency: 'BGN',
    title: 'Пазаруване Billa',
    date: new Date().toISOString().split('T')[0],
    notes: 'Хранителни стоки',
    created_at: new Date().toISOString(),
  },
  {
    id: 'tx_3',
    account_id: 'acc_cash_1',
    category_id: 'cat_food',
    type: 'expense',
    amount: 24.50,
    currency: 'BGN',
    title: 'Обяд с колеги',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    created_at: new Date().toISOString(),
  },
];

// ----------------- WEB LOCALSTORAGE HELPERS -----------------

const WEB_KEYS = {
  ACCOUNTS: 'momo_accounts_v1',
  CATEGORIES: 'momo_categories_v1',
  TRANSACTIONS: 'momo_transactions_v1',
  BILLS: 'momo_bills_v1',
  RECEIPTS: 'momo_receipts_v1',
  SUBSCRIPTIONS: 'momo_subscriptions_v1',
};

function getWebItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined' || !window.localStorage) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`[Storage] Read error for ${key}:`, e);
    return fallback;
  }
}

function setWebItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`[Storage] Write error for ${key}:`, e);
  }
}

// ----------------- NATIVE SQLITE DATABASE INSTANCE -----------------

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('momo_finance.db');
  }
  return dbInstance;
}

// ----------------- INITIALIZATION -----------------

export async function initDatabase(): Promise<void> {
  if (isWeb) {
    // Initialize Web LocalStorage if empty
    if (!window.localStorage.getItem(WEB_KEYS.ACCOUNTS)) {
      setWebItem(WEB_KEYS.ACCOUNTS, DEFAULT_ACCOUNTS);
    }
    if (!window.localStorage.getItem(WEB_KEYS.CATEGORIES)) {
      setWebItem(WEB_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
    }
    if (!window.localStorage.getItem(WEB_KEYS.BILLS)) {
      setWebItem(WEB_KEYS.BILLS, DEFAULT_BILLS);
    }
    if (!window.localStorage.getItem(WEB_KEYS.TRANSACTIONS)) {
      setWebItem(WEB_KEYS.TRANSACTIONS, DEFAULT_TRANSACTIONS);
    }
    if (!window.localStorage.getItem(WEB_KEYS.RECEIPTS)) {
      setWebItem(WEB_KEYS.RECEIPTS, []);
    }
    if (!window.localStorage.getItem(WEB_KEYS.SUBSCRIPTIONS)) {
      setWebItem(WEB_KEYS.SUBSCRIPTIONS, []);
    }
    return;
  }

  // Native SQLite setup
  const db = await getDatabase();

  try {
    await db.execAsync('PRAGMA journal_mode = WAL;');
  } catch (err) {
    console.warn('Could not set WAL mode:', err);
  }

  // Create tables
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      balance REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'BGN',
      icon TEXT NOT NULL DEFAULT 'wallet',
      color TEXT NOT NULL DEFAULT '#007AFF',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY NOT NULL,
      account_id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'BGN',
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      notes TEXT,
      receipt_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (account_id) REFERENCES accounts(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS bills (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      category_id TEXT,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'BGN',
      due_day INTEGER NOT NULL,
      frequency TEXT NOT NULL DEFAULT 'monthly',
      is_paid INTEGER NOT NULL DEFAULT 0,
      reminder_enabled INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS receipts (
      id TEXT PRIMARY KEY NOT NULL,
      image_uri TEXT NOT NULL,
      filename TEXT NOT NULL,
      store_name TEXT NOT NULL,
      total_amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'BGN',
      receipt_date TEXT NOT NULL,
      raw_ocr_text TEXT,
      transaction_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS utility_subscriptions (
      id TEXT PRIMARY KEY NOT NULL,
      provider_key TEXT NOT NULL,
      provider_name TEXT NOT NULL,
      client_number TEXT NOT NULL,
      alias TEXT NOT NULL,
      category_id TEXT NOT NULL,
      current_amount REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'BGN',
      due_date TEXT NOT NULL,
      due_day INTEGER NOT NULL DEFAULT 20,
      is_paid INTEGER NOT NULL DEFAULT 0,
      last_checked TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  try {
    await db.runAsync("DELETE FROM bills WHERE id LIKE 'bill_auto_%'");
  } catch (err) {
    console.warn('Auto bill cleanup notice:', err);
  }

  // Seed default accounts
  try {
    const existingAccounts = await db.getAllAsync<Account>('SELECT * FROM accounts LIMIT 1');
    if (existingAccounts.length === 0) {
      const now = new Date().toISOString();
      await db.runAsync(
        `INSERT INTO accounts (id, name, type, balance, currency, icon, color, created_at) VALUES 
        ('acc_bank_1', 'Банкова сметка', 'bank', 2450.00, 'BGN', 'card-outline', '#007AFF', ?),
        ('acc_cash_1', 'В брой (Портфейл)', 'cash', 180.00, 'BGN', 'cash-outline', '#34C759', ?),
        ('acc_savings_1', 'Спестовна сметка', 'savings', 5000.00, 'BGN', 'shield-checkmark-outline', '#FF9500', ?)`,
        now,
        now,
        now
      );
    }
  } catch (err) {
    console.warn('Accounts seed warning:', err);
  }

  // Seed default categories
  try {
    const existingCategories = await db.getAllAsync<Category>('SELECT * FROM categories LIMIT 1');
    if (existingCategories.length === 0) {
      await db.execAsync(`
        INSERT INTO categories (id, name, type, icon, color) VALUES 
        ('cat_supermarket', 'Супермаркет', 'expense', 'cart-outline', '#34C759'),
        ('cat_food', 'Храна и ресторанти', 'expense', 'restaurant-outline', '#FF9500'),
        ('cat_bills', 'Битови сметки & Комунални', 'expense', 'flash-outline', '#FF3B30'),
        ('cat_rent', 'Наем и имот', 'expense', 'home-outline', '#5856D6'),
        ('cat_transport', 'Транспорт и гориво', 'expense', 'car-outline', '#007AFF'),
        ('cat_health', 'Здраве и аптека', 'expense', 'medkit-outline', '#FF2D55'),
        ('cat_shopping', 'Дрехи и покупки', 'expense', 'bag-handle-outline', '#AF52DE'),
        ('cat_entertainment', 'Забавления и хоби', 'expense', 'game-controller-outline', '#FFCC00'),
        ('cat_services', 'Абонаменти и услуги', 'expense', 'tv-outline', '#5AC8FA'),
        ('cat_other_exp', 'Други разходи', 'expense', 'ellipsis-horizontal-circle-outline', '#8E8E93'),
        ('cat_salary', 'Заплата', 'income', 'briefcase-outline', '#34C759'),
        ('cat_bonus', 'Бонус и премия', 'income', 'gift-outline', '#30B0C7'),
        ('cat_investments', 'Инвестиции и дивиденти', 'income', 'trending-up-outline', '#5856D6'),
        ('cat_other_inc', 'Други приходи', 'income', 'add-circle-outline', '#007AFF');
      `);
    }
  } catch (err) {
    console.warn('Categories seed warning:', err);
  }

  // Seed initial sample transactions
  try {
    const existingTx = await db.getAllAsync<Transaction>('SELECT * FROM transactions LIMIT 1');
    if (existingTx.length === 0) {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const now = new Date().toISOString();

      await db.runAsync(
        `INSERT INTO transactions (id, account_id, category_id, type, amount, currency, title, date, notes, created_at) VALUES 
        ('tx_1', 'acc_bank_1', 'cat_salary', 'income', 3200.00, 'BGN', 'Месечна заплата', ?, 'За предходния месец', ?),
        ('tx_2', 'acc_bank_1', 'cat_supermarket', 'expense', 86.40, 'BGN', 'Пазаруване Billa', ?, 'Хранителни стоки', ?),
        ('tx_3', 'acc_cash_1', 'cat_food', 'expense', 24.50, 'BGN', 'Обяд с колеги', ?, '', ?)`,
        yesterday,
        now,
        today,
        now,
        today,
        now
      );
    }
  } catch (err) {
    console.warn('Transactions seed warning:', err);
  }

  // Seed default bills
  try {
    const existingBills = await db.getAllAsync<Bill>('SELECT * FROM bills LIMIT 1');
    if (existingBills.length === 0) {
      const now = new Date().toISOString();
      await db.runAsync(
        `INSERT INTO bills (id, title, category_id, amount, currency, due_day, frequency, is_paid, reminder_enabled, notes, created_at) VALUES 
        ('bill_1', 'Електроенергия (ЧЕЗ/Електрохолд)', 'cat_bills', 78.50, 'BGN', 15, 'monthly', 0, 1, 'Сметка за ток', ?),
        ('bill_2', 'Оптичен интернет & ТВ', 'cat_services', 35.00, 'BGN', 18, 'monthly', 0, 1, 'А1 / Vivacom', ?),
        ('bill_3', 'Водоснабдяване (Софийска вода)', 'cat_bills', 32.20, 'BGN', 22, 'monthly', 0, 1, 'Студена и топла вода', ?),
        ('bill_4', 'Мобилен план', 'cat_services', 29.99, 'BGN', 25, 'monthly', 1, 1, 'Месечна такса', ?)`,
        now,
        now,
        now,
        now
      );
    }
  } catch (err) {
    console.warn('Bills seed warning:', err);
  }
}

// ----------------- CRUD: ACCOUNTS -----------------

export async function getAccounts(): Promise<Account[]> {
  if (isWeb) {
    return getWebItem<Account[]>(WEB_KEYS.ACCOUNTS, DEFAULT_ACCOUNTS);
  }
  const db = await getDatabase();
  return db.getAllAsync<Account>('SELECT * FROM accounts ORDER BY created_at ASC');
}

export async function createAccount(account: Omit<Account, 'created_at'>): Promise<void> {
  const now = new Date().toISOString();
  if (isWeb) {
    const list = getWebItem<Account[]>(WEB_KEYS.ACCOUNTS, DEFAULT_ACCOUNTS);
    list.push({ ...account, created_at: now });
    setWebItem(WEB_KEYS.ACCOUNTS, list);
    return;
  }
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO accounts (id, name, type, balance, currency, icon, color, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    account.id,
    account.name,
    account.type,
    account.balance,
    account.currency,
    account.icon,
    account.color,
    now
  );
}

export async function updateAccountBalance(accountId: string, newBalance: number): Promise<void> {
  if (isWeb) {
    const list = getWebItem<Account[]>(WEB_KEYS.ACCOUNTS, DEFAULT_ACCOUNTS);
    const item = list.find((a) => a.id === accountId);
    if (item) {
      item.balance = newBalance;
      setWebItem(WEB_KEYS.ACCOUNTS, list);
    }
    return;
  }
  const db = await getDatabase();
  await db.runAsync('UPDATE accounts SET balance = ? WHERE id = ?', newBalance, accountId);
}

export async function deleteAccount(accountId: string): Promise<void> {
  if (isWeb) {
    const list = getWebItem<Account[]>(WEB_KEYS.ACCOUNTS, DEFAULT_ACCOUNTS);
    setWebItem(WEB_KEYS.ACCOUNTS, list.filter((a) => a.id !== accountId));
    return;
  }
  const db = await getDatabase();
  await db.runAsync('DELETE FROM accounts WHERE id = ?', accountId);
}

// ----------------- CRUD: CATEGORIES -----------------

export async function getCategories(): Promise<Category[]> {
  if (isWeb) {
    return getWebItem<Category[]>(WEB_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
  }
  const db = await getDatabase();
  return db.getAllAsync<Category>('SELECT * FROM categories ORDER BY name ASC');
}

// ----------------- CRUD: TRANSACTIONS -----------------

export async function getTransactions(): Promise<
  Array<Transaction & { category_name?: string; category_icon?: string; category_color?: string; account_name?: string }>
> {
  if (isWeb) {
    const txs = getWebItem<Transaction[]>(WEB_KEYS.TRANSACTIONS, DEFAULT_TRANSACTIONS);
    const cats = getWebItem<Category[]>(WEB_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
    const accs = getWebItem<Account[]>(WEB_KEYS.ACCOUNTS, DEFAULT_ACCOUNTS);

    return txs
      .map((t) => {
        const cat = cats.find((c) => c.id === t.category_id);
        const acc = accs.find((a) => a.id === t.account_id);
        return {
          ...t,
          category_name: cat?.name,
          category_icon: cat?.icon,
          category_color: cat?.color,
          account_name: acc?.name,
        };
      })
      .sort((a, b) => (b.date + (b.created_at || '')).localeCompare(a.date + (a.created_at || '')));
  }

  const db = await getDatabase();
  return db.getAllAsync<
    Transaction & { category_name?: string; category_icon?: string; category_color?: string; account_name?: string }
  >(`
    SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color, a.name as account_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN accounts a ON t.account_id = a.id
    ORDER BY t.date DESC, t.created_at DESC
  `);
}

export async function createTransaction(tx: Omit<Transaction, 'created_at'>): Promise<void> {
  const now = new Date().toISOString();

  if (isWeb) {
    const txs = getWebItem<Transaction[]>(WEB_KEYS.TRANSACTIONS, DEFAULT_TRANSACTIONS);
    const accounts = getWebItem<Account[]>(WEB_KEYS.ACCOUNTS, DEFAULT_ACCOUNTS);

    const newTx: Transaction = { ...tx, created_at: now };
    txs.unshift(newTx);
    setWebItem(WEB_KEYS.TRANSACTIONS, txs);

    // Update account balance
    const acc = accounts.find((a) => a.id === tx.account_id);
    if (acc) {
      acc.balance += tx.type === 'expense' ? -tx.amount : tx.amount;
      setWebItem(WEB_KEYS.ACCOUNTS, accounts);
    }

    // Link receipt if present
    if (tx.receipt_id) {
      const receipts = getWebItem<Receipt[]>(WEB_KEYS.RECEIPTS, []);
      const r = receipts.find((x) => x.id === tx.receipt_id);
      if (r) {
        r.transaction_id = tx.id;
        setWebItem(WEB_KEYS.RECEIPTS, receipts);
      }
    }
    return;
  }

  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO transactions (id, account_id, category_id, type, amount, currency, title, date, notes, receipt_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      tx.id,
      tx.account_id,
      tx.category_id,
      tx.type,
      tx.amount,
      tx.currency,
      tx.title,
      tx.date,
      tx.notes || null,
      tx.receipt_id || null,
      now
    );

    const balanceDelta = tx.type === 'expense' ? -tx.amount : tx.amount;
    await db.runAsync('UPDATE accounts SET balance = balance + ? WHERE id = ?', balanceDelta, tx.account_id);

    if (tx.receipt_id) {
      await db.runAsync('UPDATE receipts SET transaction_id = ? WHERE id = ?', tx.id, tx.receipt_id);
    }
  });
}

export async function deleteTransaction(transactionId: string): Promise<void> {
  if (isWeb) {
    const txs = getWebItem<Transaction[]>(WEB_KEYS.TRANSACTIONS, DEFAULT_TRANSACTIONS);
    const target = txs.find((t) => t.id === transactionId);
    if (!target) return;

    const accounts = getWebItem<Account[]>(WEB_KEYS.ACCOUNTS, DEFAULT_ACCOUNTS);
    const acc = accounts.find((a) => a.id === target.account_id);
    if (acc) {
      acc.balance += target.type === 'expense' ? target.amount : -target.amount;
      setWebItem(WEB_KEYS.ACCOUNTS, accounts);
    }

    if (target.receipt_id) {
      const receipts = getWebItem<Receipt[]>(WEB_KEYS.RECEIPTS, []);
      const r = receipts.find((x) => x.id === target.receipt_id);
      if (r) {
        r.transaction_id = undefined;
        setWebItem(WEB_KEYS.RECEIPTS, receipts);
      }
    }

    setWebItem(WEB_KEYS.TRANSACTIONS, txs.filter((t) => t.id !== transactionId));
    return;
  }

  const db = await getDatabase();
  const tx = await db.getFirstAsync<Transaction>('SELECT * FROM transactions WHERE id = ?', transactionId);
  if (!tx) return;

  await db.withTransactionAsync(async () => {
    const balanceDelta = tx.type === 'expense' ? tx.amount : -tx.amount;
    await db.runAsync('UPDATE accounts SET balance = balance + ? WHERE id = ?', balanceDelta, tx.account_id);

    if (tx.receipt_id) {
      await db.runAsync('UPDATE receipts SET transaction_id = NULL WHERE id = ?', tx.receipt_id);
    }

    await db.runAsync('DELETE FROM transactions WHERE id = ?', transactionId);
  });
}

// ----------------- CRUD: BILLS -----------------

export async function getBills(): Promise<
  Array<Bill & { category_name?: string; category_icon?: string; category_color?: string }>
> {
  if (isWeb) {
    const bills = getWebItem<Bill[]>(WEB_KEYS.BILLS, DEFAULT_BILLS);
    const cats = getWebItem<Category[]>(WEB_KEYS.CATEGORIES, DEFAULT_CATEGORIES);

    return bills
      .map((b) => {
        const cat = cats.find((c) => c.id === b.category_id);
        return {
          ...b,
          category_name: cat?.name,
          category_icon: cat?.icon,
          category_color: cat?.color,
        };
      })
      .sort((a, b) => a.due_day - b.due_day);
  }

  const db = await getDatabase();
  return db.getAllAsync<
    Bill & { category_name?: string; category_icon?: string; category_color?: string }
  >(`
    SELECT b.*, c.name as category_name, c.icon as category_icon, c.color as category_color
    FROM bills b
    LEFT JOIN categories c ON b.category_id = c.id
    ORDER BY b.due_day ASC
  `);
}

export async function createBill(bill: Omit<Bill, 'created_at'>): Promise<void> {
  const now = new Date().toISOString();
  if (isWeb) {
    const bills = getWebItem<Bill[]>(WEB_KEYS.BILLS, DEFAULT_BILLS);
    bills.push({ ...bill, created_at: now });
    setWebItem(WEB_KEYS.BILLS, bills);
    return;
  }

  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO bills (id, title, category_id, amount, currency, due_day, frequency, is_paid, reminder_enabled, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    bill.id,
    bill.title,
    bill.category_id || null,
    bill.amount,
    bill.currency,
    bill.due_day,
    bill.frequency,
    bill.is_paid,
    bill.reminder_enabled,
    bill.notes || null,
    now
  );
}

export async function toggleBillPaid(billId: string, isPaid: boolean): Promise<void> {
  if (isWeb) {
    const bills = getWebItem<Bill[]>(WEB_KEYS.BILLS, DEFAULT_BILLS);
    const b = bills.find((x) => x.id === billId);
    if (b) {
      b.is_paid = isPaid ? 1 : 0;
      setWebItem(WEB_KEYS.BILLS, bills);
    }
    return;
  }

  const db = await getDatabase();
  await db.runAsync('UPDATE bills SET is_paid = ? WHERE id = ?', isPaid ? 1 : 0, billId);
}

export async function updateBillAmount(billId: string, amount: number): Promise<void> {
  if (isWeb) {
    const bills = getWebItem<Bill[]>(WEB_KEYS.BILLS, DEFAULT_BILLS);
    const b = bills.find((x) => x.id === billId);
    if (b) {
      b.amount = amount;
      setWebItem(WEB_KEYS.BILLS, bills);
    }
    return;
  }

  const db = await getDatabase();
  await db.runAsync('UPDATE bills SET amount = ? WHERE id = ?', amount, billId);
}

export async function deleteBill(billId: string): Promise<void> {
  if (isWeb) {
    const bills = getWebItem<Bill[]>(WEB_KEYS.BILLS, DEFAULT_BILLS);
    setWebItem(WEB_KEYS.BILLS, bills.filter((b) => b.id !== billId));
    return;
  }

  const db = await getDatabase();
  await db.runAsync('DELETE FROM bills WHERE id = ?', billId);
}

// ----------------- CRUD: RECEIPTS -----------------

export async function getReceipts(): Promise<
  Array<Receipt & { transaction_title?: string; category_name?: string }>
> {
  if (isWeb) {
    const receipts = getWebItem<Receipt[]>(WEB_KEYS.RECEIPTS, []);
    const txs = getWebItem<Transaction[]>(WEB_KEYS.TRANSACTIONS, DEFAULT_TRANSACTIONS);
    const cats = getWebItem<Category[]>(WEB_KEYS.CATEGORIES, DEFAULT_CATEGORIES);

    return receipts
      .map((r) => {
        const tx = txs.find((t) => t.id === r.transaction_id);
        const cat = tx ? cats.find((c) => c.id === tx.category_id) : undefined;
        return {
          ...r,
          transaction_title: tx?.title,
          category_name: cat?.name,
        };
      })
      .sort((a, b) => (b.receipt_date + (b.created_at || '')).localeCompare(a.receipt_date + (a.created_at || '')));
  }

  const db = await getDatabase();
  return db.getAllAsync<Receipt & { transaction_title?: string; category_name?: string }>(`
    SELECT r.*, t.title as transaction_title, c.name as category_name
    FROM receipts r
    LEFT JOIN transactions t ON r.transaction_id = t.id
    LEFT JOIN categories c ON t.category_id = c.id
    ORDER BY r.receipt_date DESC, r.created_at DESC
  `);
}

export async function getReceiptById(receiptId: string): Promise<
  (Receipt & { transaction_title?: string; category_name?: string; category_icon?: string }) | null
> {
  if (isWeb) {
    const receipts = getWebItem<Receipt[]>(WEB_KEYS.RECEIPTS, []);
    const r = receipts.find((x) => x.id === receiptId);
    if (!r) return null;

    const txs = getWebItem<Transaction[]>(WEB_KEYS.TRANSACTIONS, DEFAULT_TRANSACTIONS);
    const cats = getWebItem<Category[]>(WEB_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
    const tx = txs.find((t) => t.id === r.transaction_id);
    const cat = tx ? cats.find((c) => c.id === tx.category_id) : undefined;

    return {
      ...r,
      transaction_title: tx?.title,
      category_name: cat?.name,
      category_icon: cat?.icon,
    };
  }

  const db = await getDatabase();
  return db.getFirstAsync<
    Receipt & { transaction_title?: string; category_name?: string; category_icon?: string }
  >(
    `
    SELECT r.*, t.title as transaction_title, c.name as category_name, c.icon as category_icon
    FROM receipts r
    LEFT JOIN transactions t ON r.transaction_id = t.id
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE r.id = ?
  `,
    receiptId
  );
}

export async function createReceipt(receipt: Omit<Receipt, 'created_at'>): Promise<void> {
  const now = new Date().toISOString();
  if (isWeb) {
    const receipts = getWebItem<Receipt[]>(WEB_KEYS.RECEIPTS, []);
    receipts.unshift({ ...receipt, created_at: now });
    setWebItem(WEB_KEYS.RECEIPTS, receipts);
    return;
  }

  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO receipts (id, image_uri, filename, store_name, total_amount, currency, receipt_date, raw_ocr_text, transaction_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    receipt.id,
    receipt.image_uri,
    receipt.filename,
    receipt.store_name,
    receipt.total_amount,
    receipt.currency,
    receipt.receipt_date,
    receipt.raw_ocr_text || null,
    receipt.transaction_id || null,
    now
  );
}

export async function deleteReceipt(receiptId: string): Promise<void> {
  if (isWeb) {
    const receipts = getWebItem<Receipt[]>(WEB_KEYS.RECEIPTS, []);
    const txs = getWebItem<Transaction[]>(WEB_KEYS.TRANSACTIONS, DEFAULT_TRANSACTIONS);
    for (const t of txs) {
      if (t.receipt_id === receiptId) {
        t.receipt_id = undefined;
      }
    }
    setWebItem(WEB_KEYS.TRANSACTIONS, txs);
    setWebItem(WEB_KEYS.RECEIPTS, receipts.filter((r) => r.id !== receiptId));
    return;
  }

  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE transactions SET receipt_id = NULL WHERE receipt_id = ?', receiptId);
    await db.runAsync('DELETE FROM receipts WHERE id = ?', receiptId);
  });
}

// ----------------- CRUD: UTILITY SUBSCRIPTIONS -----------------

export async function getUtilitySubscriptions(): Promise<UtilitySubscription[]> {
  if (isWeb) {
    return getWebItem<UtilitySubscription[]>(WEB_KEYS.SUBSCRIPTIONS, []);
  }
  const db = await getDatabase();
  return db.getAllAsync<UtilitySubscription>('SELECT * FROM utility_subscriptions ORDER BY created_at ASC');
}

export async function createUtilitySubscription(sub: Omit<UtilitySubscription, 'created_at'>): Promise<void> {
  const now = new Date().toISOString();
  if (isWeb) {
    const list = getWebItem<UtilitySubscription[]>(WEB_KEYS.SUBSCRIPTIONS, []);
    list.push({ ...sub, created_at: now });
    setWebItem(WEB_KEYS.SUBSCRIPTIONS, list);
    return;
  }

  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO utility_subscriptions (id, provider_key, provider_name, client_number, alias, category_id, current_amount, currency, due_date, due_day, is_paid, last_checked, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    sub.id,
    sub.provider_key,
    sub.provider_name,
    sub.client_number,
    sub.alias,
    sub.category_id,
    sub.current_amount,
    sub.currency,
    sub.due_date,
    sub.due_day,
    sub.is_paid,
    sub.last_checked,
    now
  );
}

export async function updateUtilitySubscriptionBill(
  id: string,
  amount: number,
  dueDate: string,
  dueDay: number,
  isPaid: number
): Promise<void> {
  const now = new Date().toISOString();
  if (isWeb) {
    const list = getWebItem<UtilitySubscription[]>(WEB_KEYS.SUBSCRIPTIONS, []);
    const sub = list.find((s) => s.id === id);
    if (sub) {
      sub.current_amount = amount;
      sub.due_date = dueDate;
      sub.due_day = dueDay;
      sub.is_paid = isPaid;
      sub.last_checked = now;
      setWebItem(WEB_KEYS.SUBSCRIPTIONS, list);
    }
    return;
  }

  const db = await getDatabase();
  await db.runAsync(
    `UPDATE utility_subscriptions 
     SET current_amount = ?, due_date = ?, due_day = ?, is_paid = ?, last_checked = ? 
     WHERE id = ?`,
    amount,
    dueDate,
    dueDay,
    isPaid,
    now,
    id
  );
}

export async function updateUtilitySubscriptionAmount(id: string, amount: number, isPaid: number = 0): Promise<void> {
  const now = new Date().toISOString();
  if (isWeb) {
    const list = getWebItem<UtilitySubscription[]>(WEB_KEYS.SUBSCRIPTIONS, []);
    const sub = list.find((s) => s.id === id);
    if (sub) {
      sub.current_amount = amount;
      sub.is_paid = isPaid;
      sub.last_checked = now;
      setWebItem(WEB_KEYS.SUBSCRIPTIONS, list);
    }
    return;
  }

  const db = await getDatabase();
  await db.runAsync(
    `UPDATE utility_subscriptions 
     SET current_amount = ?, is_paid = ?, last_checked = ? 
     WHERE id = ?`,
    amount,
    isPaid,
    now,
    id
  );
}

export async function deleteUtilitySubscription(id: string): Promise<void> {
  if (isWeb) {
    const list = getWebItem<UtilitySubscription[]>(WEB_KEYS.SUBSCRIPTIONS, []);
    setWebItem(WEB_KEYS.SUBSCRIPTIONS, list.filter((s) => s.id !== id));
    const bills = getWebItem<Bill[]>(WEB_KEYS.BILLS, DEFAULT_BILLS);
    setWebItem(WEB_KEYS.BILLS, bills.filter((b) => b.id !== `bill_auto_${id}`));
    return;
  }

  const db = await getDatabase();
  await db.runAsync('DELETE FROM bills WHERE id = ?', `bill_auto_${id}`);
  await db.runAsync('DELETE FROM utility_subscriptions WHERE id = ?', id);
}
