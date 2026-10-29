import React, { useState, useMemo } from 'react';
import {
  Crown,
  Banknote,
  QrCode,
  Plus,
  Calendar,
  Filter,
  ArrowUpRight,
  Sparkles,
  Info,
  Building,
  UserCheck,
} from 'lucide-react';
import { Transaction, PaymentMode } from '../types';
import { useTransactions } from '../context/TransactionContext';

interface OwnerPayoutsViewProps {
  onOpenCreate: (type: 'owner_payout', mode: PaymentMode) => void;
  onEdit: (tx: Transaction) => void;
}

export const OwnerPayoutsView: React.FC<OwnerPayoutsViewProps> = ({
  onOpenCreate,
  onEdit,
}) => {
  const {
    transactions,
    selectedDate,
    currentSummary,
    shopProfile,
  } = useTransactions();

  const [dateScope, setDateScope] = useState<'today' | 'this_month' | 'all'>('this_month');
  const [modeFilter, setModeFilter] = useState<'all' | 'cash' | 'online'>('all');

  const symbol = shopProfile.currencySymbol || '₹';

  // Filter transactions where type === 'owner_payout'
  const ownerPayouts = useMemo(() => {
    return transactions.filter((tx) => tx.type === 'owner_payout');
  }, [transactions]);

  // Apply scope
  const filteredPayouts = useMemo(() => {
    const selectedMonth = selectedDate.substring(0, 7); // YYYY-MM
    return ownerPayouts.filter((tx) => {
      if (dateScope === 'today' && tx.date !== selectedDate) return false;
      if (dateScope === 'this_month' && !tx.date.startsWith(selectedMonth)) return false;
      if (modeFilter !== 'all' && tx.mode !== modeFilter) return false;
      return true;
    });
  }, [ownerPayouts, dateScope, selectedDate, modeFilter]);

  // Aggregate metrics
  const todayCashPayout = currentSummary.ownerCashPayouts;
  const todayOnlinePayout = currentSummary.ownerOnlinePayouts;
  const todayTotalPayout = currentSummary.totalOwnerPayouts;

  const currentMonth = selectedDate.substring(0, 7);
  const monthPayouts = ownerPayouts.filter((tx) => tx.date.startsWith(currentMonth));
  const monthCashPayout = monthPayouts
    .filter((tx) => tx.mode === 'cash')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const monthOnlinePayout = monthPayouts
    .filter((tx) => tx.mode === 'online')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const monthTotalPayout = monthCashPayout + monthOnlinePayout;

  return (
    <div className="space-y-6">
      
      {/* Banner / Philosophy */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-neutral-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-200 border border-purple-500/30 mb-2">
              <Crown className="w-3.5 h-3.5 text-amber-300" />
              <span>Owner Financial Drawings Ledger</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif-title">
              Payments to Shop Owner ({shopProfile.ownerName})
            </h2>
            <p className="text-xs text-purple-200/80 mt-1 leading-relaxed">
              Every payout directly reduces the respective closing register balance—Cash drawings subtract from the physical cash drawer closing, while online payouts subtract from the UPI/bank closing balance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenCreate('owner_payout', 'cash')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-purple-900 hover:bg-purple-50 shadow-md transition-all shrink-0"
            >
              <Banknote className="w-4 h-4 text-emerald-600" />
              <span>+ Pay Cash to Owner</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenCreate('owner_payout', 'online')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-700 hover:bg-purple-600 text-white border border-purple-500/50 transition-all shrink-0"
            >
              <QrCode className="w-4 h-4 text-blue-300" />
              <span>+ Online Transfer to Owner</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Today's Owner Drawings */}
        <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">
            Selected Day's Total Drawings
          </span>
          <div className="text-2xl font-black font-mono text-purple-950 mt-1">
            {symbol} {todayTotalPayout.toLocaleString('en-IN')}
          </div>
          <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-600">
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <Banknote className="w-3.5 h-3.5" /> Cash: {symbol}{todayCashPayout.toLocaleString('en-IN')}
            </span>
            <span className="flex items-center gap-1 text-blue-700 font-semibold">
              <QrCode className="w-3.5 h-3.5" /> Online: {symbol}{todayOnlinePayout.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Month to Date Total */}
        <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">
            This Month Total Drawings
          </span>
          <div className="text-2xl font-black font-mono text-neutral-900 mt-1">
            {symbol} {monthTotalPayout.toLocaleString('en-IN')}
          </div>
          <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-600">
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <Banknote className="w-3.5 h-3.5" /> Cash: {symbol}{monthCashPayout.toLocaleString('en-IN')}
            </span>
            <span className="flex items-center gap-1 text-blue-700 font-semibold">
              <QrCode className="w-3.5 h-3.5" /> Online: {symbol}{monthOnlinePayout.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Impact on Closing Formula */}
        <div className="bg-purple-50/50 rounded-2xl p-5 border border-purple-200/60 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-900">
            <Info className="w-4 h-4 text-purple-600 shrink-0" />
            <span>Accounting Closing Formula</span>
          </div>
          <div className="text-xs text-neutral-600 space-y-1 mt-2">
            <div>
              • <strong>Cash Closing</strong> = Opening + Inflows - Expenses - <span className="text-purple-700 font-bold">Owner Cash</span>
            </div>
            <div>
              • <strong>Online Closing</strong> = Opening + Inflows - Expenses - <span className="text-purple-700 font-bold">Owner Online</span>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-neutral-400">
            Separately accounted to maintain audit trial.
          </div>
        </div>
      </div>

      {/* Filter and Historical List */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50/50">
          <div>
            <h3 className="font-bold text-neutral-900 text-sm font-serif-title">
              Owner Payment Records ({filteredPayouts.length})
            </h3>
            <p className="text-xs text-neutral-500">
              Personal drawings, household withdrawals, and cash deposits to owner account.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Scope tabs */}
            <div className="flex items-center bg-neutral-200/70 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setDateScope('today')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  dateScope === 'today' ? 'bg-white shadow-2xs text-neutral-900' : 'text-neutral-600'
                }`}
              >
                Selected Day
              </button>
              <button
                type="button"
                onClick={() => setDateScope('this_month')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  dateScope === 'this_month' ? 'bg-white shadow-2xs text-neutral-900' : 'text-neutral-600'
                }`}
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => setDateScope('all')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  dateScope === 'all' ? 'bg-white shadow-2xs text-neutral-900' : 'text-neutral-600'
                }`}
              >
                All History
              </button>
            </div>

            {/* Mode filter */}
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value as any)}
              className="text-xs font-semibold px-2.5 py-1 bg-white border border-neutral-200 rounded-lg text-neutral-700"
            >
              <option value="all">All Modes</option>
              <option value="cash">Cash Only</option>
              <option value="online">Online Only</option>
            </select>
          </div>
        </div>

        {filteredPayouts.length === 0 ? (
          <div className="py-12 text-center">
            <Crown className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-neutral-700">No owner payments found</h4>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto mt-1 mb-4">
              No payments have been recorded to {shopProfile.ownerName} for this period.
            </p>
            <button
              type="button"
              onClick={() => onOpenCreate('owner_payout', 'cash')}
              className="px-3.5 py-1.5 text-xs font-bold bg-purple-700 text-white rounded-xl hover:bg-purple-800 transition-colors"
            >
              + Record Owner Payout
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/70 text-neutral-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Payment Mode</th>
                  <th className="py-3 px-4">Paid To / Recipient</th>
                  <th className="py-3 px-4">Category / Purpose</th>
                  <th className="py-3 px-4">Reference #</th>
                  <th className="py-3 px-4">Remarks</th>
                  <th className="py-3 px-4 text-right">Amount Drawn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium">
                {filteredPayouts.map((tx) => (
                  <tr key={tx.id} className="hover:bg-purple-50/30 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap text-neutral-600 font-mono">
                      {tx.date} <span className="text-neutral-400 text-[11px]">{tx.time}</span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {tx.mode === 'cash' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <Banknote className="w-3 h-3 text-emerald-600" />
                          Cash Drawing
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          <QrCode className="w-3 h-3 text-blue-600" />
                          Online Transfer
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-neutral-900">
                      {tx.partyName || shopProfile.ownerName}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-700 whitespace-nowrap">
                      <span className="px-2 py-0.5 bg-neutral-100 rounded text-[11px]">
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-500">
                      {tx.referenceNumber || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-500 max-w-xs truncate">
                      {tx.notes || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-extrabold text-sm text-purple-800 whitespace-nowrap">
                      {symbol} {tx.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
