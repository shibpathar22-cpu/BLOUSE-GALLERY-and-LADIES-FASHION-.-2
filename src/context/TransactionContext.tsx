import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Transaction,
  DayRecord,
  ShopProfile,
  DailySummary,
  DenominationCount,
  TransactionType,
} from '../types';
import {
  DEFAULT_SHOP_PROFILE,
  getInitialData,
} from '../data/sampleData';
import {
  DEFAULT_RECEIPT_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_OWNER_PAYOUT_CATEGORIES,
} from '../data/categories';

interface CategoriesState {
  receipts: string[];
  expenses: string[];
  ownerPayouts: string[];
}

interface TransactionContextType {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  transactions: Transaction[];
  dayRecords: Record<string, DayRecord>;
  shopProfile: ShopProfile;
  categories: CategoriesState;
  currentSummary: DailySummary;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, tx: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  setOpeningBalance: (date: string, cash: number, online: number) => void;
  closeDay: (
    date: string,
    denominations: DenominationCount,
    actualPhysicalCash: number,
    notes?: string
  ) => void;
  reopenDay: (date: string) => void;
  updateShopProfile: (profile: Partial<ShopProfile>) => void;
  addCategory: (type: TransactionType, name: string) => void;
  getSummaryForDate: (date: string) => DailySummary;
  resetToSampleData: () => void;
  exportDataJson: () => string;
  importDataJson: (jsonStr: string) => boolean;
}

const STORAGE_KEYS = {
  TRANSACTIONS: 'bg_transactions_v1',
  DAY_RECORDS: 'bg_day_records_v1',
  SHOP_PROFILE: 'bg_shop_profile_v1',
  CATEGORIES: 'bg_categories_v1',
};

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr);

  const [shopProfile, setShopProfile] = useState<ShopProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SHOP_PROFILE);
      return saved ? JSON.parse(saved) : DEFAULT_SHOP_PROFILE;
    } catch {
      return DEFAULT_SHOP_PROFILE;
    }
  });

  const [categories, setCategories] = useState<CategoriesState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return saved
        ? JSON.parse(saved)
        : {
            receipts: DEFAULT_RECEIPT_CATEGORIES,
            expenses: DEFAULT_EXPENSE_CATEGORIES,
            ownerPayouts: DEFAULT_OWNER_PAYOUT_CATEGORIES,
          };
    } catch {
      return {
        receipts: DEFAULT_RECEIPT_CATEGORIES,
        expenses: DEFAULT_EXPENSE_CATEGORIES,
        ownerPayouts: DEFAULT_OWNER_PAYOUT_CATEGORIES,
      };
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (saved) return JSON.parse(saved);
      const { initialTransactions } = getInitialData();
      return initialTransactions;
    } catch {
      const { initialTransactions } = getInitialData();
      return initialTransactions;
    }
  });

  const [dayRecords, setDayRecords] = useState<Record<string, DayRecord>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DAY_RECORDS);
      if (saved) return JSON.parse(saved);
      const { initialDays } = getInitialData();
      return initialDays;
    } catch {
      const { initialDays } = getInitialData();
      return initialDays;
    }
  });

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.error('Failed to save transactions to localStorage', e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DAY_RECORDS, JSON.stringify(dayRecords));
    } catch (e) {
      console.error('Failed to save dayRecords to localStorage', e);
    }
  }, [dayRecords]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SHOP_PROFILE, JSON.stringify(shopProfile));
    } catch (e) {
      console.error('Failed to save shopProfile to localStorage', e);
    }
  }, [shopProfile]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (e) {
      console.error('Failed to save categories to localStorage', e);
    }
  }, [categories]);

  // Find prior day closing balance to auto-suggest opening balance if today's record doesn't exist
  const getPriorClosingBalances = (targetDate: string): { cash: number; online: number } => {
    const dates = Object.keys(dayRecords)
      .filter((d) => d < targetDate)
      .sort((a, b) => b.localeCompare(a)); // latest prior date first

    if (dates.length > 0) {
      const priorDate = dates[0];
      const priorSummary = calculateSummaryForDate(priorDate, transactions, dayRecords);
      return {
        cash: priorSummary.closingCashCalculated,
        online: priorSummary.closingOnlineCalculated,
      };
    }
    return { cash: 0, online: 0 };
  };

  const calculateSummaryForDate = (
    dateStr: string,
    txList: Transaction[],
    records: Record<string, DayRecord>
  ): DailySummary => {
    const record = records[dateStr];
    let openingCash = 0;
    let openingOnline = 0;

    if (record !== undefined) {
      openingCash = record.openingCash;
      openingOnline = record.openingOnline;
    } else {
      // Auto-carry forward from closest previous recorded day
      const prior = getPriorClosingBalances(dateStr);
      openingCash = prior.cash;
      openingOnline = prior.online;
    }

    const dayTx = txList.filter((tx) => tx.date === dateStr);

    let cashReceipts = 0;
    let onlineReceipts = 0;
    let cashExpenses = 0;
    let onlineExpenses = 0;
    let ownerCashPayouts = 0;
    let ownerOnlinePayouts = 0;

    dayTx.forEach((tx) => {
      const amount = Number(tx.amount) || 0;
      if (tx.type === 'receipt') {
        if (tx.mode === 'cash') cashReceipts += amount;
        else onlineReceipts += amount;
      } else if (tx.type === 'expense') {
        if (tx.mode === 'cash') cashExpenses += amount;
        else onlineExpenses += amount;
      } else if (tx.type === 'owner_payout') {
        if (tx.mode === 'cash') ownerCashPayouts += amount;
        else ownerOnlinePayouts += amount;
      }
    });

    const totalReceipts = cashReceipts + onlineReceipts;
    const totalExpenses = cashExpenses + onlineExpenses;
    const totalOwnerPayouts = ownerCashPayouts + ownerOnlinePayouts;

    // Strict formula:
    // Closing Cash = Opening Cash + Cash Receipts - Cash Expenses - Owner Cash Payout
    const closingCashCalculated = openingCash + cashReceipts - cashExpenses - ownerCashPayouts;
    // Closing Online = Opening Online + Online Receipts - Online Expenses - Owner Online Payout
    const closingOnlineCalculated = openingOnline + onlineReceipts - onlineExpenses - ownerOnlinePayouts;
    const totalClosingCalculated = closingCashCalculated + closingOnlineCalculated;
    const netDayCashFlow = totalReceipts - totalExpenses - totalOwnerPayouts;

    const isClosed = record?.isClosed || false;
    const actualPhysicalCash = record?.actualPhysicalCash;
    const cashVariance =
      actualPhysicalCash !== undefined ? actualPhysicalCash - closingCashCalculated : undefined;

    return {
      date: dateStr,
      openingCash,
      openingOnline,
      cashReceipts,
      onlineReceipts,
      totalReceipts,
      cashExpenses,
      onlineExpenses,
      totalExpenses,
      ownerCashPayouts,
      ownerOnlinePayouts,
      totalOwnerPayouts,
      closingCashCalculated,
      closingOnlineCalculated,
      totalClosingCalculated,
      netDayCashFlow,
      isClosed,
      actualPhysicalCash,
      cashVariance,
    };
  };

  const getSummaryForDate = (dateStr: string): DailySummary => {
    return calculateSummaryForDate(dateStr, transactions, dayRecords);
  };

  const currentSummary = useMemo(() => {
    return calculateSummaryForDate(selectedDate, transactions, dayRecords);
  }, [selectedDate, transactions, dayRecords]);

  const addTransaction = (txData: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: Date.now(),
    };

    // If day record does not exist for this transaction's date, initialize it
    setDayRecords((prev) => {
      if (!prev[txData.date]) {
        const prior = getPriorClosingBalances(txData.date);
        return {
          ...prev,
          [txData.date]: {
            date: txData.date,
            openingCash: prior.cash,
            openingOnline: prior.online,
            isClosed: false,
          },
        };
      }
      return prev;
    });

    setTransactions((prev) => [newTx, ...prev]);
  };

  const updateTransaction = (id: string, updatedFields: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, ...updatedFields } : tx))
    );
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  };

  const setOpeningBalance = (dateStr: string, cash: number, online: number) => {
    setDayRecords((prev) => {
      const existing = prev[dateStr] || { date: dateStr, isClosed: false };
      return {
        ...prev,
        [dateStr]: {
          ...existing,
          openingCash: Math.max(0, cash),
          openingOnline: Math.max(0, online),
        },
      };
    });
  };

  const closeDay = (
    dateStr: string,
    denominations: DenominationCount,
    actualPhysicalCash: number,
    notes?: string
  ) => {
    const summary = calculateSummaryForDate(dateStr, transactions, dayRecords);
    const variance = actualPhysicalCash - summary.closingCashCalculated;

    setDayRecords((prev) => {
      const existing = prev[dateStr] || {
        date: dateStr,
        openingCash: summary.openingCash,
        openingOnline: summary.openingOnline,
      };

      return {
        ...prev,
        [dateStr]: {
          ...existing,
          isClosed: true,
          closedAt: new Date().toISOString(),
          closingDenominations: denominations,
          actualPhysicalCash,
          cashVariance: variance,
          closingNotes: notes || '',
        },
      };
    });
  };

  const reopenDay = (dateStr: string) => {
    setDayRecords((prev) => {
      if (!prev[dateStr]) return prev;
      return {
        ...prev,
        [dateStr]: {
          ...prev[dateStr],
          isClosed: false,
        },
      };
    });
  };

  const updateShopProfile = (newProfile: Partial<ShopProfile>) => {
    setShopProfile((prev) => ({ ...prev, ...newProfile }));
  };

  const addCategory = (type: TransactionType, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCategories((prev) => {
      if (type === 'receipt') {
        if (prev.receipts.includes(trimmed)) return prev;
        return { ...prev, receipts: [...prev.receipts, trimmed] };
      } else if (type === 'expense') {
        if (prev.expenses.includes(trimmed)) return prev;
        return { ...prev, expenses: [...prev.expenses, trimmed] };
      } else {
        if (prev.ownerPayouts.includes(trimmed)) return prev;
        return { ...prev, ownerPayouts: [...prev.ownerPayouts, trimmed] };
      }
    });
  };

  const resetToSampleData = () => {
    const { initialDays, initialTransactions } = getInitialData();
    setTransactions(initialTransactions);
    setDayRecords(initialDays);
    setShopProfile(DEFAULT_SHOP_PROFILE);
    setCategories({
      receipts: DEFAULT_RECEIPT_CATEGORIES,
      expenses: DEFAULT_EXPENSE_CATEGORIES,
      ownerPayouts: DEFAULT_OWNER_PAYOUT_CATEGORIES,
    });
    setSelectedDate(getTodayStr());
  };

  const exportDataJson = (): string => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      shopProfile,
      categories,
      dayRecords,
      transactions,
    };
    return JSON.stringify(data, null, 2);
  };

  const importDataJson = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.transactions && Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
      }
      if (data.dayRecords && typeof data.dayRecords === 'object') {
        setDayRecords(data.dayRecords);
      }
      if (data.shopProfile && typeof data.shopProfile === 'object') {
        setShopProfile((prev) => ({ ...prev, ...data.shopProfile }));
      }
      if (data.categories && typeof data.categories === 'object') {
        setCategories((prev) => ({ ...prev, ...data.categories }));
      }
      return true;
    } catch (e) {
      console.error('Failed to import JSON', e);
      return false;
    }
  };

  return (
    <TransactionContext.Provider
      value={{
        selectedDate,
        setSelectedDate,
        transactions,
        dayRecords,
        shopProfile,
        categories,
        currentSummary,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        setOpeningBalance,
        closeDay,
        reopenDay,
        updateShopProfile,
        addCategory,
        getSummaryForDate,
        resetToSampleData,
        exportDataJson,
        importDataJson,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};
