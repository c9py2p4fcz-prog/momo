import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Account, Bill, Category, Receipt, Transaction, UtilitySubscription } from './schema';
import * as db from './database';
import { deleteReceiptImage } from '@/services/storageService';
import { syncSubscriptionBill } from '@/services/utilitySyncService';

interface FinanceContextType {
  loading: boolean;
  accounts: Account[];
  categories: Category[];
  transactions: Array<Transaction & { category_name?: string; category_icon?: string; category_color?: string; account_name?: string }>;
  bills: Array<Bill & { category_name?: string; category_icon?: string; category_color?: string }>;
  receipts: Array<Receipt & { transaction_title?: string; category_name?: string }>;
  utilitySubscriptions: UtilitySubscription[];
  refreshData: () => Promise<void>;
  
  // Quick stats
  totalBalance: number;
  monthIncome: number;
  monthExpense: number;
  unpaidBillsTotal: number;
  unpaidBillsCount: number;

  // Actions
  addNewTransaction: (tx: Omit<Transaction, 'created_at'>) => Promise<void>;
  deleteTransactionById: (id: string) => Promise<void>;
  addNewBill: (bill: Omit<Bill, 'created_at'>) => Promise<void>;
  toggleBillStatus: (id: string, isPaid: boolean) => Promise<void>;
  deleteBillById: (id: string) => Promise<void>;
  addNewReceipt: (receipt: Omit<Receipt, 'created_at'>) => Promise<void>;
  deleteReceiptById: (id: string, filenameOrUri: string) => Promise<void>;
  addNewAccount: (account: Omit<Account, 'created_at'>) => Promise<void>;
  addUtilitySubscription: (sub: Omit<UtilitySubscription, 'created_at'>) => Promise<void>;
  updateSubscriptionAmount: (id: string, amount: number, isPaid?: number) => Promise<void>;
  deleteUtilitySubscriptionById: (id: string) => Promise<void>;
  syncAllSubscriptions: () => Promise<void>;
  
  // Bulk clear & reset actions
  clearAllTransactions: () => Promise<void>;
  clearAllBills: () => Promise<void>;
  clearAllReceipts: () => Promise<void>;
  resetAccountBalances: (balance?: number) => Promise<void>;
  resetEverything: (mode: 'zero' | 'demo') => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<
    Array<Transaction & { category_name?: string; category_icon?: string; category_color?: string; account_name?: string }>
  >([]);
  const [bills, setBills] = useState<
    Array<Bill & { category_name?: string; category_icon?: string; category_color?: string }>
  >([]);
  const [receipts, setReceipts] = useState<
    Array<Receipt & { transaction_title?: string; category_name?: string }>
  >([]);
  const [utilitySubscriptions, setUtilitySubscriptions] = useState<UtilitySubscription[]>([]);

  const refreshData = useCallback(async () => {
    try {
      const [accs, cats, txs, bls, rcpts, subs] = await Promise.all([
        db.getAccounts(),
        db.getCategories(),
        db.getTransactions(),
        db.getBills(),
        db.getReceipts(),
        db.getUtilitySubscriptions(),
      ]);
      setAccounts(accs);
      setCategories(cats);
      setTransactions(txs);
      setBills(bls);
      setReceipts(rcpts);
      setUtilitySubscriptions(subs);
    } catch (error) {
      console.error('Failed to refresh finance data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function setup() {
      try {
        await db.initDatabase();
        await refreshData();
      } catch (err) {
        console.error('Failed to initialize database:', err);
        setLoading(false);
      }
    }
    setup();
  }, [refreshData]);

  // Derived statistics
  const totalBalance = useMemo(() => {
    return accounts.reduce((acc, curr) => acc + curr.balance, 0);
  }, [accounts]);

  const { monthIncome, monthExpense } = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let inc = 0;
    let exp = 0;

    for (const tx of transactions) {
      const txDate = new Date(tx.date);
      if (txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth) {
        if (tx.type === 'income') {
          inc += tx.amount;
        } else if (tx.type === 'expense') {
          exp += tx.amount;
        }
      }
    }

    return { monthIncome: inc, monthExpense: exp };
  }, [transactions]);

  const { unpaidBillsTotal, unpaidBillsCount } = useMemo(() => {
    let total = 0;
    let count = 0;
    for (const b of bills) {
      if (b.is_paid === 0) {
        total += b.amount;
        count += 1;
      }
    }
    return { unpaidBillsTotal: total, unpaidBillsCount: count };
  }, [bills]);

  // Action methods
  const addNewTransaction = async (tx: Omit<Transaction, 'created_at'>) => {
    await db.createTransaction(tx);
    await refreshData();
  };

  const deleteTransactionById = async (id: string) => {
    await db.deleteTransaction(id);
    await refreshData();
  };

  const addNewBill = async (bill: Omit<Bill, 'created_at'>) => {
    await db.createBill(bill);
    await refreshData();
  };

  const toggleBillStatus = async (id: string, isPaid: boolean) => {
    await db.toggleBillPaid(id, isPaid);
    await refreshData();
  };

  const deleteBillById = async (id: string) => {
    await db.deleteBill(id);
    await refreshData();
  };

  const addNewReceipt = async (receipt: Omit<Receipt, 'created_at'>) => {
    await db.createReceipt(receipt);
    await refreshData();
  };

  const deleteReceiptById = async (id: string, filenameOrUri: string) => {
    await db.deleteReceipt(id);
    await deleteReceiptImage(filenameOrUri);
    await refreshData();
  };

  const addNewAccount = async (account: Omit<Account, 'created_at'>) => {
    await db.createAccount(account);
    await refreshData();
  };

  const addUtilitySubscription = async (sub: Omit<UtilitySubscription, 'created_at'>) => {
    await db.createUtilitySubscription(sub);
    try {
      await syncSubscriptionBill(sub as UtilitySubscription);
    } catch (e) {
      console.warn('Initial subscription bill sync warning:', e);
    }
    await refreshData();
  };

  const updateSubscriptionAmount = async (id: string, amount: number, isPaid: number = 0) => {
    await db.updateUtilitySubscriptionAmount(id, amount, isPaid);
    const subs = await db.getUtilitySubscriptions();
    const target = subs.find((s) => s.id === id);
    if (target) {
      await syncSubscriptionBill({ ...target, current_amount: amount, is_paid: isPaid });
    }
    await refreshData();
  };

  const deleteUtilitySubscriptionById = async (id: string) => {
    await db.deleteUtilitySubscription(id);
    await refreshData();
  };

  const syncAllSubscriptions = async () => {
    const subs = await db.getUtilitySubscriptions();
    for (const sub of subs) {
      try {
        await syncSubscriptionBill(sub);
      } catch (e) {
        console.warn('Error syncing subscription:', sub.alias, e);
      }
    }
    await refreshData();
  };

  const clearAllTransactions = async () => {
    await db.clearAllTransactions();
    await refreshData();
  };

  const clearAllBills = async () => {
    await db.clearAllBills();
    await refreshData();
  };

  const clearAllReceipts = async () => {
    await db.clearAllReceipts();
    await refreshData();
  };

  const resetAccountBalances = async (balance: number = 0) => {
    await db.resetAccountBalances(balance);
    await refreshData();
  };

  const resetEverything = async (mode: 'zero' | 'demo') => {
    await db.resetEverything(mode);
    await refreshData();
  };

  return (
    <FinanceContext.Provider
      value={{
        loading,
        accounts,
        categories,
        transactions,
        bills,
        receipts,
        utilitySubscriptions,
        refreshData,
        totalBalance,
        monthIncome,
        monthExpense,
        unpaidBillsTotal,
        unpaidBillsCount,
        addNewTransaction,
        deleteTransactionById,
        addNewBill,
        toggleBillStatus,
        deleteBillById,
        addNewReceipt,
        deleteReceiptById,
        addNewAccount,
        addUtilitySubscription,
        updateSubscriptionAmount,
        deleteUtilitySubscriptionById,
        syncAllSubscriptions,
        clearAllTransactions,
        clearAllBills,
        clearAllReceipts,
        resetAccountBalances,
        resetEverything,
      }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
