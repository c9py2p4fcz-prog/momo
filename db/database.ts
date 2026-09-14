import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { Account, Bill, Category, Receipt, Transaction, UtilitySubscription } from './schema';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('momo_finance.db');
  }
  return dbInstance;
}

export async function initDatabase(): Promise<void> {
  const db = await getDatabase();

  if (Platform.OS !== 'web') {
    try {
      await db.execAsync('PRAGMA journal_mode = WAL;');
    } catch (err) {
      console.warn('Could not set WAL mode:', err);
    }
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
    // Clean up any legacy auto-generated subscriber bills
    await db.runAsync("DELETE FROM bills WHERE id LIKE 'bill_auto_%'");
  } catch (err) {
    console.warn('Auto bill cleanup notice:', err);
  }

  try {
    // Seed default accounts if none exist
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

  try {
    // Seed default categories if none exist
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

  try {
    // Seed initial sample transactions and bills if empty
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
  const db = await getDatabase();
  return db.getAllAsync<Account>('SELECT * FROM accounts ORDER BY created_at ASC');
}

export async function createAccount(account: Omit<Account, 'created_at'>): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
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
  const db = await getDatabase();
  await db.runAsync('UPDATE accounts SET balance = ? WHERE id = ?', newBalance, accountId);
}

export async function deleteAccount(accountId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM accounts WHERE id = ?', accountId);
}

// ----------------- CRUD: CATEGORIES -----------------

export async function getCategories(): Promise<Category[]> {
  const db = await getDatabase();
  return db.getAllAsync<Category>('SELECT * FROM categories ORDER BY name ASC');
}

// ----------------- CRUD: TRANSACTIONS -----------------

export async function getTransactions(): Promise<
  Array<Transaction & { category_name?: string; category_icon?: string; category_color?: string; account_name?: string }>
> {
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

export async function createTransaction(
  tx: Omit<Transaction, 'created_at'>
): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  // Execute in transaction: insert tx and update account balance
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

    // Update account balance
    const balanceDelta = tx.type === 'expense' ? -tx.amount : tx.amount;
    await db.runAsync(
      'UPDATE accounts SET balance = balance + ? WHERE id = ?',
      balanceDelta,
      tx.account_id
    );

    // Link receipt if present
    if (tx.receipt_id) {
      await db.runAsync(
        'UPDATE receipts SET transaction_id = ? WHERE id = ?',
        tx.id,
        tx.receipt_id
      );
    }
  });
}

export async function deleteTransaction(transactionId: string): Promise<void> {
  const db = await getDatabase();
  const tx = await db.getFirstAsync<Transaction>('SELECT * FROM transactions WHERE id = ?', transactionId);
  if (!tx) return;

  await db.withTransactionAsync(async () => {
    // Revert account balance
    const balanceDelta = tx.type === 'expense' ? tx.amount : -tx.amount;
    await db.runAsync('UPDATE accounts SET balance = balance + ? WHERE id = ?', balanceDelta, tx.account_id);

    // If there is an associated receipt, unlink it
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
  const db = await getDatabase();
  const now = new Date().toISOString();
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
  const db = await getDatabase();
  await db.runAsync('UPDATE bills SET is_paid = ? WHERE id = ?', isPaid ? 1 : 0, billId);
}

export async function updateBillAmount(billId: string, amount: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE bills SET amount = ? WHERE id = ?', amount, billId);
}

export async function deleteBill(billId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM bills WHERE id = ?', billId);
}

// ----------------- CRUD: RECEIPTS -----------------

export async function getReceipts(): Promise<
  Array<Receipt & { transaction_title?: string; category_name?: string }>
> {
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
  const db = await getDatabase();
  const now = new Date().toISOString();
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
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    // Unlink any transaction pointing to this receipt
    await db.runAsync('UPDATE transactions SET receipt_id = NULL WHERE receipt_id = ?', receiptId);
    await db.runAsync('DELETE FROM receipts WHERE id = ?', receiptId);
  });
}

// ----------------- CRUD: UTILITY SUBSCRIPTIONS -----------------

export async function getUtilitySubscriptions(): Promise<UtilitySubscription[]> {
  const db = await getDatabase();
  return db.getAllAsync<UtilitySubscription>('SELECT * FROM utility_subscriptions ORDER BY created_at ASC');
}

export async function createUtilitySubscription(
  sub: Omit<UtilitySubscription, 'created_at'>
): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
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
  const db = await getDatabase();
  const now = new Date().toISOString();
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

export async function updateUtilitySubscriptionAmount(
  id: string,
  amount: number,
  isPaid: number = 0
): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
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
  const db = await getDatabase();
  await db.runAsync('DELETE FROM bills WHERE id = ?', `bill_auto_${id}`);
  await db.runAsync('DELETE FROM utility_subscriptions WHERE id = ?', id);
}

