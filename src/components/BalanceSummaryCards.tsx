import React from 'react';
import {
  Banknote,
  QrCode,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Crown,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';

interface BalanceSummaryCardsProps {
  onOpenOpeningBalance: () => void;
  onOpenDayClose: () => void;
}

export const BalanceSummaryCards: React.FC<BalanceSummaryCardsProps> = ({
  onOpenOpeningBalance,
  onOpenDayClose,
}) => {
  const { currentSummary, shopProfile } = useTransactions();
  const symbol = shopProfile.currencySymbol || '₹';

  const formatCurr = (num: number) => {
    return `${symbol} ${Number(num || 0).toLocaleString('en-IN')}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      
      {/* 1. CASH IN HAND (DRAWER / TILL) */}
      <div className="bg-white rounded-2xl border border-emerald-100 shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute -right-8 -top-8 w-28 h-28 bg-emerald-50 rounded-full blur-2xl pointer-events-none" />

        <div>
          {/* Card Header */}
          <div className="flex items-center justify-between pb-3 border-b border-emerald-50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-neutral-900 text-sm">Cash in Register (Till)</h3>
                <span className="text-[11px] text-emerald-700 font-medium">Physical Drawer Cash</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenOpeningBalance}
              className="p-1 text-neutral-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
              title="Edit Opening Cash"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Opening Cash */}
          <div className="mt-3.5 flex items-center justify-between text-xs text-neutral-600 bg-neutral-50 px-3 py-2 rounded-xl">
            <span className="font-medium text-neutral-500">Opening Cash:</span>
            <span className="font-bold text-neutral-900">{formatCurr(currentSummary.openingCash)}</span>
          </div>

          {/* Breakdown Rows */}
          <div className="mt-3 space-y-2 text-xs">
            <div className="flex items-center justify-between text-neutral-600">
              <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
                (+) Cash Receipts:
              </span>
              <span className="font-semibold text-emerald-700">
                +{formatCurr(currentSummary.cashReceipts)}
              </span>
            </div>

            <div className="flex items-center justify-between text-neutral-600">
              <span className="flex items-center gap-1.5 text-rose-700 font-medium">
                <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
                (-) Cash Expenses:
              </span>
              <span className="font-semibold text-rose-700">
                -{formatCurr(currentSummary.cashExpenses)}
              </span>
            </div>

            <div className="flex items-center justify-between text-neutral-600">
              <span className="flex items-center gap-1.5 text-purple-700 font-medium">
                <Crown className="w-3.5 h-3.5 text-purple-600" />
                (-) Paid to Owner (Cash):
              </span>
              <span className="font-semibold text-purple-700">
                -{formatCurr(currentSummary.ownerCashPayouts)}
              </span>
            </div>
          </div>
        </div>

        {/* Calculated Cash Closing Total */}
        <div className="mt-4 pt-3 border-t border-dashed border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                Calculated Cash Closing
              </span>
              <div className="text-xl font-extrabold text-emerald-900 font-mono tracking-tight mt-0.5">
                {formatCurr(currentSummary.closingCashCalculated)}
              </div>
            </div>

            {currentSummary.isClosed ? (
              <div className="text-right">
                <span className="text-[10px] uppercase font-semibold text-neutral-400 block">
                  Actual Counted
                </span>
                <span className="text-sm font-bold text-neutral-800">
                  {formatCurr(currentSummary.actualPhysicalCash || 0)}
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenDayClose}
                className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors"
              >
                Tally Cash
              </button>
            )}
          </div>

          {/* Variance message if closed */}
          {currentSummary.isClosed && currentSummary.cashVariance !== undefined && (
            <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px]">
              {currentSummary.cashVariance === 0 ? (
                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Drawer Matches Perfectly
                </span>
              ) : currentSummary.cashVariance < 0 ? (
                <span className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Cash Shortage: {formatCurr(Math.abs(currentSummary.cashVariance))}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  Cash Surplus: +{formatCurr(currentSummary.cashVariance)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. ONLINE / UPI / BANK */}
      <div className="bg-white rounded-2xl border border-blue-100 shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute -right-8 -top-8 w-28 h-28 bg-blue-50 rounded-full blur-2xl pointer-events-none" />

        <div>
          {/* Card Header */}
          <div className="flex items-center justify-between pb-3 border-b border-blue-50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-neutral-900 text-sm">Online & UPI Register</h3>
                <span className="text-[11px] text-blue-700 font-medium">GPay • PhonePe • QR • Bank</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenOpeningBalance}
              className="p-1 text-neutral-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit Opening Online Balance"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Opening Online */}
          <div className="mt-3.5 flex items-center justify-between text-xs text-neutral-600 bg-neutral-50 px-3 py-2 rounded-xl">
            <span className="font-medium text-neutral-500">Opening Balance:</span>
            <span className="font-bold text-neutral-900">{formatCurr(currentSummary.openingOnline)}</span>
          </div>

          {/* Breakdown Rows */}
          <div className="mt-3 space-y-2 text-xs">
            <div className="flex items-center justify-between text-neutral-600">
              <span className="flex items-center gap-1.5 text-blue-700 font-medium">
                <ArrowDownRight className="w-3.5 h-3.5 text-blue-600" />
                (+) Online Receipts:
              </span>
              <span className="font-semibold text-blue-700">
                +{formatCurr(currentSummary.onlineReceipts)}
              </span>
            </div>

            <div className="flex items-center justify-between text-neutral-600">
              <span className="flex items-center gap-1.5 text-rose-700 font-medium">
                <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
                (-) Online Expenses:
              </span>
              <span className="font-semibold text-rose-700">
                -{formatCurr(currentSummary.onlineExpenses)}
              </span>
            </div>

            <div className="flex items-center justify-between text-neutral-600">
              <span className="flex items-center gap-1.5 text-purple-700 font-medium">
                <Crown className="w-3.5 h-3.5 text-purple-600" />
                (-) Transferred to Owner:
              </span>
              <span className="font-semibold text-purple-700">
                -{formatCurr(currentSummary.ownerOnlinePayouts)}
              </span>
            </div>
          </div>
        </div>

        {/* Calculated Online Closing Total */}
        <div className="mt-4 pt-3 border-t border-dashed border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                Calculated Online Closing
              </span>
              <div className="text-xl font-extrabold text-blue-900 font-mono tracking-tight mt-0.5">
                {formatCurr(currentSummary.closingOnlineCalculated)}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-neutral-500 font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                {shopProfile.upiId}
              </span>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-neutral-100 text-[11px] text-neutral-500 flex items-center justify-between">
            <span>Net online change today:</span>
            <span
              className={`font-semibold ${
                currentSummary.onlineReceipts -
                  currentSummary.onlineExpenses -
                  currentSummary.ownerOnlinePayouts >=
                0
                  ? 'text-emerald-700'
                  : 'text-rose-700'
              }`}
            >
              {currentSummary.onlineReceipts -
                currentSummary.onlineExpenses -
                currentSummary.ownerOnlinePayouts >=
              0
                ? '+'
                : ''}
              {formatCurr(
                currentSummary.onlineReceipts -
                  currentSummary.onlineExpenses -
                  currentSummary.ownerOnlinePayouts
              )}
            </span>
          </div>
        </div>
      </div>

      {/* 3. COMBINED TOTALS & NET BUSINESS CLOSING */}
      <div className="bg-gradient-to-br from-neutral-900 via-neutral-850 to-neutral-900 text-white rounded-2xl shadow-md p-5 flex flex-col justify-between relative overflow-hidden">
        {/* Decorative corner accent */}
        <div className="absolute right-0 top-0 w-32 h-32 bg-rose-600/20 rounded-full blur-2xl pointer-events-none" />

        <div>
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold border border-rose-500/30">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Combined Day Position</h3>
                <span className="text-[11px] text-rose-300 font-medium">Cash + Online Unified</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-neutral-400 block">Total Inflow</span>
              <span className="text-xs font-bold text-emerald-400">
                +{formatCurr(currentSummary.totalReceipts)}
              </span>
            </div>
          </div>

          <div className="mt-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between text-neutral-300">
              <span className="text-neutral-400">Combined Opening:</span>
              <span className="font-semibold text-neutral-200">
                {formatCurr(currentSummary.openingCash + currentSummary.openingOnline)}
              </span>
            </div>

            <div className="flex items-center justify-between text-neutral-300">
              <span className="text-neutral-400">Total Shop Expenses:</span>
              <span className="font-semibold text-rose-300">
                -{formatCurr(currentSummary.totalExpenses)}
              </span>
            </div>

            <div className="flex items-center justify-between text-neutral-300">
              <span className="text-neutral-400 flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-400" />
                Total Paid to Owner:
              </span>
              <span className="font-semibold text-amber-300">
                -{formatCurr(currentSummary.totalOwnerPayouts)}
              </span>
            </div>
          </div>
        </div>

        {/* Total Combined Closing */}
        <div className="mt-4 pt-3 border-t border-neutral-800">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Total Closing Balance
              </span>
              <div className="text-2xl font-black text-rose-100 font-mono tracking-tight mt-0.5">
                {formatCurr(currentSummary.totalClosingCalculated)}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-neutral-400 block">Day Net Flow</span>
              <span
                className={`text-xs font-bold ${
                  currentSummary.netDayCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {currentSummary.netDayCashFlow >= 0 ? '+' : ''}
                {formatCurr(currentSummary.netDayCashFlow)}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
            <span>Cash Share: {currentSummary.totalClosingCalculated > 0 ? Math.round((currentSummary.closingCashCalculated / currentSummary.totalClosingCalculated) * 100) : 0}%</span>
            <span>Online Share: {currentSummary.totalClosingCalculated > 0 ? Math.round((currentSummary.closingOnlineCalculated / currentSummary.totalClosingCalculated) * 100) : 0}%</span>
          </div>
        </div>
      </div>

    </div>
  );
};
