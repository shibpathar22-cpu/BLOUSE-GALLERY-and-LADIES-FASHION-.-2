import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Transaction,
  DayRecord,
  ShopProfile,
  DailySummary,
  DenominationCount,
  TransactionType,
  AppBranding,
  AuditLogEntry,
  BackupMetadata,
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
import {
  saveImageToIndexedDB,
  getImageFromIndexedDB,
  deleteImageFromIndexedDB,
  getAllImagesFromIndexedDB,
  importImagesToIndexedDB,
} from '../utils/imageStorage';
import { useAuth } from './AuthContext';

interface CategoriesState {
  receipts: string[];
  expenses: string[];
  ownerPayouts: string[];
}

export interface BackupPackage {
  format: 'BLOUSE_GALLERY_BACKUP';
  schemaVersion: '2.0';
  exportedAt: string;
  appVersion: '1.2.0';
  recordsCount: {
    transactions: number;
    dayRecords: number;
    auditLogs: number;
    images: number;
  };
  shopProfile: ShopProfile;
  branding: AppBranding;
  images: Record<string, string>;
  categories: CategoriesState;
  dayRecords: Record<string, DayRecord>;
  transactions: Transaction[];
  auditLogs: AuditLogEntry[];
  usersSanitized?: Array<{
    id: string;
    name: string;
    phone: string;
    role: string;
    isActive: boolean;
    permissions: any;
  }>;
}

interface TransactionContextType {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  transactions: Transaction[];
  dayRecords: Record<string, DayRecord>;
  shopProfile: ShopProfile;
  categories: CategoriesState;
  branding: AppBranding;
  auditLogs: AuditLogEntry[];
  backupMetadata: BackupMetadata;
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
  updateBranding: (
    branding: Partial<AppBranding>,
    logoBlob?: string | null,
    bannerBlob?: string | null
  ) => Promise<void>;
  addCategory: (type: TransactionType, name: string) => void;
  getSummaryForDate: (date: string) => DailySummary;
  addAuditLog: (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => void;
  resetToSampleData: () => void;
  exportDataJson: () => string;
  exportCompleteBackup: () => Promise<string>;
  validateBackupFile: (jsonStr: string) => {
    isValid: boolean;
    error?: string;
    preview?: {
      exportedAt: string;
      transactionsCount: number;
      dayRecordsCount: number;
      shopName: string;
      hasLogo: boolean;
      hasBanner: boolean;
    };
  };
  restoreCompleteBackup: (jsonStr: string) => Promise<{ success: boolean; error?: string }>;
  rollbackSafetySnapshot: () => Promise<boolean>;
  importDataJson: (jsonStr: string) => boolean;
}

// STORAGE KEYS: MUST PRESERVE ALL EXISTING KEYS FOR BACKWARD COMPATIBILITY
const STORAGE_KEYS = {
  TRANSACTIONS: 'bg_transactions_v1',
  DAY_RECORDS: 'bg_day_records_v1',
  SHOP_PROFILE: 'bg_shop_profile_v1',
  CATEGORIES: 'bg_categories_v1',
  BRANDING: 'bg_branding_v1',
  AUDIT_LOGS: 'bg_audit_logs_v1',
  BACKUP_META: 'bg_backup_metadata_v1',
  SAFETY_SNAPSHOT: 'bg_safety_snapshot_v1',
};

const DEFAULT_BRANDING: AppBranding = {
  bannerPosition: 'center',
  bannerScale: 100,
  bannerOverlayOpacity: 0.45,
  brandColor: '#e11d48',
};

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser, isOwner, hasPermission } = useAuth();
  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr);

  // Shop Profile (preserved key)
  const [shopProfile, setShopProfile] = useState<ShopProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SHOP_PROFILE);
      return saved ? JSON.parse(saved) : DEFAULT_SHOP_PROFILE;
    } catch {
      return DEFAULT_SHOP_PROFILE;
    }
  });

  // Categories (preserved key)
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

  // Transactions (preserved key)
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

  // Day Records (preserved key)
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

  // Branding config (stored in bg_branding_v1, large image data stored in IndexedDB)
  const [branding, setBranding] = useState<AppBranding>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BRANDING);
      return saved ? JSON.parse(saved) : DEFAULT_BRANDING;
    } catch {
      return DEFAULT_BRANDING;
    }
  });

  // Audit Logs (bg_audit_logs_v1)
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      if (saved) return JSON.parse(saved);
      // Pre-seed initial log
      return [
        {
          id: 'log-init-01',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          userId: 'usr-owner-01',
          userName: 'Mrs. Jayashree Sharma (Owner)',
          userRole: 'owner',
          action: 'SYSTEM_INITIALIZE',
          resource: 'DailyRegister',
          details: 'Blouse Gallery Daily Cash Register initialized with audit log protection.',
          result: 'success',
        },
      ];
    } catch {
      return [];
    }
  });

  // Backup Metadata
  const [backupMetadata, setBackupMetadata] = useState<BackupMetadata>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BACKUP_META);
      const hasSnapshot = Boolean(localStorage.getItem(STORAGE_KEYS.SAFETY_SNAPSHOT));
      if (saved) {
        return { ...JSON.parse(saved), hasSafetySnapshot: hasSnapshot };
      }
      return { hasSafetySnapshot: hasSnapshot };
    } catch {
      return {};
    }
  });

  // Load logo and banner images from IndexedDB on startup
  useEffect(() => {
    async function loadBrandingImages() {
      try {
        const logo = await getImageFromIndexedDB('shop_logo');
        const banner = await getImageFromIndexedDB('shop_banner');

        setBranding((prev) => ({
          ...prev,
          logoUrl: logo || prev.logoUrl,
          bannerUrl: banner || prev.bannerUrl,
        }));
      } catch (err) {
        console.warn('Could not load branding images from IndexedDB', err);
      }
    }
    loadBrandingImages();
  }, []);

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

  useEffect(() => {
    try {
      // Never store full raw base64 data URLs in localStorage! Strip them out of localStorage branding config
      const { logoUrl, bannerUrl, ...cleanConfig } = branding;
      localStorage.setItem(STORAGE_KEYS.BRANDING, JSON.stringify(cleanConfig));
    } catch (e) {
      console.error('Failed to save branding config', e);
    }
  }, [branding]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs.slice(0, 500)));
    } catch (e) {
      console.error('Failed to save audit logs', e);
    }
  }, [auditLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BACKUP_META, JSON.stringify(backupMetadata));
    } catch (e) {
      console.error('Failed to save backup meta', e);
    }
  }, [backupMetadata]);

  // Helper to append audit log
  const addAuditLog = (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  // Find prior day closing balance to auto-suggest opening balance if today's record doesn't exist
  const getPriorClosingBalances = (targetDate: string): { cash: number; online: number } => {
    const dates = Object.keys(dayRecords)
      .filter((d) => d < targetDate)
      .sort((a, b) => b.localeCompare(a));

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
    const closingCashCalculated = openingCash + cashReceipts - cashExpenses - ownerCashPayouts;
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

  // Data-access authorization checks
  const addTransaction = (txData: Omit<Transaction, 'id' | 'createdAt'>) => {
    // Permission enforcement
    if (txData.type === 'receipt' && !hasPermission('canManageSales')) {
      throw new Error('Access Denied: You do not have permission to record sales receipts.');
    }
    if (txData.type === 'expense' && !hasPermission('canManageExpenses')) {
      throw new Error('Access Denied: You do not have permission to record shop expenses.');
    }
    if (txData.type === 'owner_payout' && !isOwner && !hasPermission('canManageCashDrawer')) {
      throw new Error('Access Denied: Only authorized users can record payouts to owner.');
    }

    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now(),
    };

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

    addAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'TRANSACTION_CREATE',
      resource: txData.type.toUpperCase(),
      details: `Created ${txData.type} of ${shopProfile.currencySymbol}${txData.amount} (${txData.mode}) for "${txData.partyName}"`,
      result: 'success',
    });
  };

  const updateTransaction = (id: string, updatedFields: Partial<Transaction>) => {
    const existing = transactions.find((t) => t.id === id);
    if (!existing) return;

    if (existing.type === 'expense' && !hasPermission('canManageExpenses')) {
      throw new Error('Access Denied: You do not have permission to edit expenses.');
    }
    if (existing.type === 'receipt' && !hasPermission('canManageSales')) {
      throw new Error('Access Denied: You do not have permission to edit sales.');
    }

    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, ...updatedFields } : tx))
    );

    addAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'TRANSACTION_UPDATE',
      resource: existing.type.toUpperCase(),
      details: `Updated transaction ${id} for "${existing.partyName}"`,
      result: 'success',
    });
  };

  const deleteTransaction = (id: string) => {
    const existing = transactions.find((t) => t.id === id);
    if (!existing) return;

    if (!isOwner && !hasPermission('canManageCashDrawer')) {
      throw new Error('Access Denied: Only owner or authorized staff can delete transactions.');
    }

    setTransactions((prev) => prev.filter((tx) => tx.id !== id));

    addAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'TRANSACTION_DELETE',
      resource: existing.type.toUpperCase(),
      details: `Deleted ${existing.type} of ${shopProfile.currencySymbol}${existing.amount} (${existing.partyName})`,
      result: 'success',
    });
  };

  const setOpeningBalance = (dateStr: string, cash: number, online: number) => {
    if (!hasPermission('canManageCashDrawer')) {
      throw new Error('Access Denied: You do not have permission to modify opening cash drawer float.');
    }

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

    addAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'OPENING_BALANCE_SET',
      resource: 'CashRegister',
      details: `Opening balances set for ${dateStr}: Cash ₹${cash}, Online ₹${online}`,
      result: 'success',
    });
  };

  const closeDay = (
    dateStr: string,
    denominations: DenominationCount,
    actualPhysicalCash: number,
    notes?: string
  ) => {
    if (!hasPermission('canManageCashDrawer')) {
      throw new Error('Access Denied: You do not have permission to close day or tally cash.');
    }

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

    addAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'DAY_CLOSE_TALLY',
      resource: 'DaySheet',
      details: `Day closed for ${dateStr}. Counted Cash ₹${actualPhysicalCash}, Variance ₹${variance}`,
      result: 'success',
    });
  };

  const reopenDay = (dateStr: string) => {
    if (!isOwner) {
      throw new Error('Access Denied: Only the shop owner can reopen a finalized register day.');
    }

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

    addAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'DAY_REOPEN',
      resource: 'DaySheet',
      details: `Register reopened for date ${dateStr} by owner.`,
      result: 'success',
    });
  };

  const updateShopProfile = (newProfile: Partial<ShopProfile>) => {
    if (!isOwner) {
      throw new Error('Access Denied: Only the shop owner can modify boutique profile settings.');
    }

    setShopProfile((prev) => ({ ...prev, ...newProfile }));

    addAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'SHOP_PROFILE_UPDATE',
      resource: 'ShopSettings',
      details: `Updated shop information: ${newProfile.shopName || shopProfile.shopName}`,
      result: 'success',
    });
  };

  // FEATURE 1: Custom Dashboard Branding Management
  const updateBranding = async (
    updates: Partial<AppBranding>,
    logoBlob?: string | null,
    bannerBlob?: string | null
  ) => {
    if (!isOwner) {
      throw new Error('Access Denied: Only the shop owner can modify store branding.');
    }

    // Save logo image in IndexedDB if provided or deleted
    if (logoBlob !== undefined) {
      if (logoBlob === null) {
        await deleteImageFromIndexedDB('shop_logo');
        updates.logoUrl = undefined;
      } else {
        await saveImageToIndexedDB('shop_logo', logoBlob);
        updates.logoUrl = logoBlob;
      }
    }

    // Save banner image in IndexedDB if provided or deleted
    if (bannerBlob !== undefined) {
      if (bannerBlob === null) {
        await deleteImageFromIndexedDB('shop_banner');
        updates.bannerUrl = undefined;
      } else {
        await saveImageToIndexedDB('shop_banner', bannerBlob);
        updates.bannerUrl = bannerBlob;
      }
    }

    setBranding((prev) => ({
      ...prev,
      ...updates,
      updatedAt: Date.now(),
    }));

    addAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'BRANDING_UPDATE',
      resource: 'AppBranding',
      details: `Updated dashboard branding: Logo ${logoBlob ? 'changed' : logoBlob === null ? 'removed' : 'kept'}, Banner ${bannerBlob ? 'changed' : bannerBlob === null ? 'removed' : 'kept'}`,
      result: 'success',
    });
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
    if (!isOwner) {
      throw new Error('Access Denied: Only the shop owner can reset demo data.');
    }

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

    addAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'RESET_SAMPLE_DATA',
      resource: 'Database',
      details: 'Reset system to initial sample dataset.',
      result: 'success',
    });
  };

  // FEATURE 2: Complete Versioned Backup & Restore Engine
  const exportCompleteBackup = async (): Promise<string> => {
    if (!isOwner) {
      throw new Error('Access Denied: Only the shop owner can create and export business backups.');
    }

    // Retrieve all images from IndexedDB
    const images = await getAllImagesFromIndexedDB();

    // Sanitize users list (NEVER export passwords, OTPs, session tokens, or authentication secrets)
    const savedUsers = localStorage.getItem('bg_users_v1');
    const parsedUsers = savedUsers ? JSON.parse(savedUsers) : [];
    const sanitizedUsers = parsedUsers.map((u: any) => ({
      id: u.id,
      name: u.name,
      phone: u.phone,
      role: u.role,
      isActive: u.isActive,
      permissions: u.permissions,
    }));

    const backupPackage: BackupPackage = {
      format: 'BLOUSE_GALLERY_BACKUP',
      schemaVersion: '2.0',
      exportedAt: new Date().toISOString(),
      appVersion: '1.2.0',
      recordsCount: {
        transactions: transactions.length,
        dayRecords: Object.keys(dayRecords).length,
        auditLogs: auditLogs.length,
        images: Object.keys(images).length,
      },
      shopProfile,
      branding: {
        ...branding,
        logoUrl: undefined, // images are packaged in the images map
        bannerUrl: undefined,
      },
      images,
      categories,
      dayRecords,
      transactions,
      auditLogs,
      usersSanitized: sanitizedUsers,
    };

    const jsonStr = JSON.stringify(backupPackage, null, 2);

    // Record last backup metadata
    const nowIso = new Date().toISOString();
    const sizeBytes = new Blob([jsonStr]).size;
    setBackupMetadata((prev) => ({
      ...prev,
      lastBackupDate: nowIso,
      lastBackupSize: sizeBytes,
      lastBackupRecordsCount: transactions.length,
    }));

    addAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'BACKUP_CREATE',
      resource: 'BackupSystem',
      details: `Created version 2.0 backup with ${transactions.length} transactions (${(sizeBytes / 1024).toFixed(1)} KB)`,
      result: 'success',
    });

    return jsonStr;
  };

  const validateBackupFile = (
    jsonStr: string
  ): {
    isValid: boolean;
    error?: string;
    preview?: {
      exportedAt: string;
      transactionsCount: number;
      dayRecordsCount: number;
      shopName: string;
      hasLogo: boolean;
      hasBanner: boolean;
    };
  } => {
    try {
      const data = JSON.parse(jsonStr);

      // Check required collections
      if (!data.transactions || !Array.isArray(data.transactions)) {
        return { isValid: false, error: 'Missing or invalid "transactions" array.' };
      }
      if (!data.dayRecords || typeof data.dayRecords !== 'object') {
        return { isValid: false, error: 'Missing or invalid "dayRecords" collection.' };
      }
      if (!data.shopProfile || typeof data.shopProfile !== 'object') {
        return { isValid: false, error: 'Missing or invalid "shopProfile" object.' };
      }

      const hasLogo = Boolean(data.images?.shop_logo || data.branding?.logoUrl);
      const hasBanner = Boolean(data.images?.shop_banner || data.branding?.bannerUrl);

      return {
        isValid: true,
        preview: {
          exportedAt: data.exportedAt || 'Unknown Date',
          transactionsCount: data.transactions.length,
          dayRecordsCount: Object.keys(data.dayRecords).length,
          shopName: data.shopProfile.shopName || 'Blouse Gallery',
          hasLogo,
          hasBanner,
        },
      };
    } catch (e: any) {
      return { isValid: false, error: `Invalid JSON syntax: ${e.message}` };
    }
  };

  const restoreCompleteBackup = async (
    jsonStr: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isOwner) {
      throw new Error('Access Denied: Only the shop owner can restore business data.');
    }

    const validation = validateBackupFile(jsonStr);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    try {
      const data: BackupPackage = JSON.parse(jsonStr);

      // STEP 1: Create an atomic safety snapshot of CURRENT state before applying any change!
      const currentImages = await getAllImagesFromIndexedDB();
      const safetySnapshot = {
        savedAt: new Date().toISOString(),
        transactions,
        dayRecords,
        shopProfile,
        categories,
        branding,
        images: currentImages,
      };
      localStorage.setItem(STORAGE_KEYS.SAFETY_SNAPSHOT, JSON.stringify(safetySnapshot));
      setBackupMetadata((prev) => ({ ...prev, hasSafetySnapshot: true }));

      // STEP 2: Restore images to IndexedDB
      if (data.images && typeof data.images === 'object') {
        await importImagesToIndexedDB(data.images);
      }

      // STEP 3: Apply state
      setTransactions(data.transactions);
      setDayRecords(data.dayRecords);
      setShopProfile((prev) => ({ ...prev, ...data.shopProfile }));
      if (data.categories) setCategories(data.categories);

      // Restore branding
      if (data.branding) {
        const logo = data.images?.shop_logo || (await getImageFromIndexedDB('shop_logo')) || undefined;
        const banner = data.images?.shop_banner || (await getImageFromIndexedDB('shop_banner')) || undefined;

        setBranding({
          ...DEFAULT_BRANDING,
          ...data.branding,
          logoUrl: logo,
          bannerUrl: banner,
        });
      }

      // Restore sanitized users safely if present
      if (data.usersSanitized && Array.isArray(data.usersSanitized)) {
        localStorage.setItem('bg_users_v1', JSON.stringify(data.usersSanitized));
      }

      addAuditLog({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'BACKUP_RESTORE',
        resource: 'BackupSystem',
        details: `Restored backup from ${data.exportedAt} (${data.transactions.length} transactions, safety snapshot created)`,
        result: 'success',
      });

      return { success: true };
    } catch (err: any) {
      console.error('Failed to restore backup', err);
      return { success: false, error: err.message || 'Restoration failed' };
    }
  };

  const rollbackSafetySnapshot = async (): Promise<boolean> => {
    if (!isOwner) {
      throw new Error('Access Denied: Only the shop owner can rollback restores.');
    }

    try {
      const rawSnapshot = localStorage.getItem(STORAGE_KEYS.SAFETY_SNAPSHOT);
      if (!rawSnapshot) return false;

      const snapshot = JSON.parse(rawSnapshot);
      if (snapshot.images) {
        await importImagesToIndexedDB(snapshot.images);
      }

      setTransactions(snapshot.transactions);
      setDayRecords(snapshot.dayRecords);
      setShopProfile(snapshot.shopProfile);
      setCategories(snapshot.categories);
      setBranding(snapshot.branding);

      addAuditLog({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        action: 'SAFETY_ROLLBACK',
        resource: 'BackupSystem',
        details: `Rolled back to safety snapshot from ${snapshot.savedAt}`,
        result: 'success',
      });

      return true;
    } catch (e) {
      console.error('Failed to rollback safety snapshot', e);
      return false;
    }
  };

  // Legacy export / import for backward compatibility
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
        branding,
        auditLogs,
        backupMetadata,
        currentSummary,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        setOpeningBalance,
        closeDay,
        reopenDay,
        updateShopProfile,
        updateBranding,
        addCategory,
        getSummaryForDate,
        addAuditLog,
        resetToSampleData,
        exportDataJson,
        exportCompleteBackup,
        validateBackupFile,
        restoreCompleteBackup,
        rollbackSafetySnapshot,
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
