export type TransactionType = 'receipt' | 'expense' | 'owner_payout';

export type PaymentMode = 'cash' | 'online';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  type: TransactionType;
  mode: PaymentMode;
  amount: number;
  category: string;
  partyName: string; // Customer, Tailor/Karigar, Vendor, or Owner
  referenceNumber?: string; // Bill #, Order ID, UPI Ref ID
  notes?: string;
  createdAt: number;
}

export interface DenominationCount {
  '500': number;
  '200': number;
  '100': number;
  '50': number;
  '20': number;
  '10': number;
  '5': number;
  'coins': number;
}

export interface DayRecord {
  date: string; // YYYY-MM-DD
  openingCash: number;
  openingOnline: number;
  isClosed: boolean;
  closedAt?: string;
  closingDenominations?: DenominationCount;
  actualPhysicalCash?: number;
  cashVariance?: number; // actualPhysicalCash - calculatedCashClosing
  closingNotes?: string;
}

export interface ShopProfile {
  shopName: string;
  tagline: string;
  ownerName: string;
  phone: string;
  address: string;
  upiId: string;
  currencySymbol: string;
}

export interface DailySummary {
  date: string;
  openingCash: number;
  openingOnline: number;
  cashReceipts: number;
  onlineReceipts: number;
  totalReceipts: number;
  cashExpenses: number;
  onlineExpenses: number;
  totalExpenses: number;
  ownerCashPayouts: number;
  ownerOnlinePayouts: number;
  totalOwnerPayouts: number;
  closingCashCalculated: number;
  closingOnlineCalculated: number;
  totalClosingCalculated: number;
  netDayCashFlow: number; // totalReceipts - totalExpenses - totalOwnerPayouts
  isClosed: boolean;
  actualPhysicalCash?: number;
  cashVariance?: number;
}
