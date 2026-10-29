import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Crown,
  Banknote,
  QrCode,
  Edit2,
  Trash2,
  Filter,
  Clock,
  Tag,
  Hash,
  FileSpreadsheet,
} from 'lucide-react';
import { Transaction, TransactionType, PaymentMode } from '../types';
import { useTransactions } from '../context/TransactionContext';

interface TransactionListProps {
  onOpenCreate: (type: TransactionType, mode: PaymentMode) => void;
  onEdit: (tx: Transaction) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  onOpenCreate,
  onEdit,
}) => {
  const {
    transactions,
    selectedDate,
    deleteTransaction,
    shopProfile,
  } = useTransactions();

  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [modeFilter, setModeFilter] = useState<'all' | PaymentMode>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const symbol = shopProfile.currencySymbol || '₹';

  // Filter transactions for selected date
  const dayTransactions = useMemo(() => {
    return transactions.filter((tx) => tx.date === selectedDate);
  }, [transactions, selectedDate]);

  // Apply search & type/mode filters
  const filteredTransactions = useMemo(() => {
    return dayTransactions.filter((tx) => {
      // Type match
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      // Mode match
      if (modeFilter !== 'all' && tx.mode !== modeFilter) return false;
      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const party = (tx.partyName || '').toLowerCase();
        const category = (tx.category || '').toLowerCase();
        const ref = (tx.referenceNumber || '').toLowerCase();
        const notes = (tx.notes || '').toLowerCase();
        return (
          party.includes(query) ||
          category.includes(query) ||
          ref.includes(query) ||
          notes.includes(query)
        );
      }
      return true;
    });
  }, [dayTransactions, typeFilter, modeFilter, searchQuery]);

  const counts = useMemo(() => {
    const total = dayTransactions.length;
    const receipts = dayTransactions.filter((t) => t.type === 'receipt').length;
    const expenses = dayTransactions.filter((t) => t.type === 'expense').length;
    const ownerPayouts = dayTransactions.filter((t) => t.type === 'owner_payout').length;
    const cash = dayTransactions.filter((t) => t.mode === 'cash').length;
    const online = dayTransactions.filter((t) => t.mode === 'online').length;
    return { total, receipts, expenses, ownerPayouts, cash, online };
  }, [dayTransactions]);

  const handleDelete = (tx: Transaction) => {
    if (
      window.confirm(
        `Are you sure you want to delete this ${tx.type.replace('_', ' ')} of ${symbol}${tx.amount.toLocaleString(
          'en-IN'
        )} for "${tx.partyName}"?`
      )
    ) {
      deleteTransaction(tx.id);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden mb-8">
      
      {/* Top Action Bar */}
      <div className="p-4 sm:p-5 border-b border-neutral-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-neutral-50/50">
        <div>
          <h2 className="text-base font-bold text-neutral-900 font-serif-title flex items-center gap-2">
            <span>Daily Transactions Ledger</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-neutral-200 text-neutral-700 font-sans">
              {filteredTransactions.length} of {dayTransactions.length} entries
            </span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Record all cash/online inflows, tailor wages, shop expenses, and owner drawings.
          </p>
        </div>

        {/* 3 Prominent Quick Add Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenCreate('receipt', 'cash')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>New Receipt</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenCreate('expense', 'cash')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>New Expense</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenCreate('owner_payout', 'cash')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-colors"
          >
            <Crown className="w-3.5 h-3.5 text-amber-300" />
            <span>Pay Owner</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="px-4 py-3 border-b border-neutral-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white">
        
        {/* Type Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
              typeFilter === 'all'
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            All Types ({counts.total})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('receipt')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
              typeFilter === 'receipt'
                ? 'bg-emerald-700 text-white'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            Receipts ({counts.receipts})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('expense')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
              typeFilter === 'expense'
                ? 'bg-rose-700 text-white'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            Expenses ({counts.expenses})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('owner_payout')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
              typeFilter === 'owner_payout'
                ? 'bg-purple-700 text-white'
                : 'text-purple-700 hover:bg-purple-50'
            }`}
          >
            Owner Payouts ({counts.ownerPayouts})
          </button>
        </div>

        {/* Mode Selector and Search Input */}
        <div className="flex items-center gap-2">
          {/* Mode Pill Filter */}
          <div className="flex items-center bg-neutral-100 p-0.5 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setModeFilter('all')}
              className={`px-2 py-1 rounded-md transition-colors ${
                modeFilter === 'all' ? 'bg-white shadow-2xs text-neutral-900' : 'text-neutral-500'
              }`}
            >
              All Modes
            </button>
            <button
              type="button"
              onClick={() => setModeFilter('cash')}
              className={`px-2 py-1 rounded-md transition-colors flex items-center gap-1 ${
                modeFilter === 'cash' ? 'bg-white shadow-2xs text-emerald-800' : 'text-neutral-500'
              }`}
            >
              <Banknote className="w-3 h-3 text-emerald-600" />
              <span>Cash ({counts.cash})</span>
            </button>
            <button
              type="button"
              onClick={() => setModeFilter('online')}
              className={`px-2 py-1 rounded-md transition-colors flex items-center gap-1 ${
                modeFilter === 'online' ? 'bg-white shadow-2xs text-blue-800' : 'text-neutral-500'
              }`}
            >
              <QrCode className="w-3 h-3 text-blue-600" />
              <span>Online ({counts.online})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-44 sm:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer, bill..."
              className="w-full pl-8 pr-3 py-1.5 bg-neutral-100 border border-transparent rounded-lg text-xs focus:bg-white focus:border-rose-400 focus:outline-none"
            />
          </div>
        </div>

      </div>

      {/* Transactions Table */}
      {filteredTransactions.length === 0 ? (
        <div className="py-12 px-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-neutral-800">No transactions found</h3>
          <p className="text-xs text-neutral-500 max-w-xs mx-auto mt-1 mb-4">
            {dayTransactions.length === 0
              ? 'No transactions have been recorded for this date yet. Start by recording a receipt, expense, or owner payment.'
              : 'No entries match your search and filter criteria.'}
          </p>
          {dayTransactions.length === 0 && (
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => onOpenCreate('receipt', 'cash')}
                className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
              >
                + Record First Receipt
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/70 text-neutral-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Type & Mode</th>
                <th className="py-3 px-4">Particulars / Party</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Ref / Bill #</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-medium">
              {filteredTransactions.map((tx) => {
                const isReceipt = tx.type === 'receipt';
                const isExpense = tx.type === 'expense';
                const isOwner = tx.type === 'owner_payout';

                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-neutral-50/70 transition-colors group"
                  >
                    {/* Time */}
                    <td className="py-3.5 px-4 text-neutral-500 font-mono whitespace-nowrap">
                      {tx.time || '12:00'}
                    </td>

                    {/* Type & Mode Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {/* Type Badge */}
                        {isReceipt ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <ArrowDownRight className="w-3 h-3 text-emerald-600" />
                            Receipt
                          </span>
                        ) : isExpense ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                            <ArrowUpRight className="w-3 h-3 text-rose-600" />
                            Expense
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                            <Crown className="w-3 h-3 text-purple-600" />
                            To Owner
                          </span>
                        )}

                        {/* Mode Badge (Cash vs Online) */}
                        {tx.mode === 'cash' ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100/60 text-emerald-900 border border-emerald-300">
                            <Banknote className="w-3 h-3 text-emerald-700" />
                            CASH
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100/60 text-blue-900 border border-blue-300">
                            <QrCode className="w-3 h-3 text-blue-700" />
                            ONLINE
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Party Name & Notes */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-neutral-900">
                        {tx.partyName || (isOwner ? shopProfile.ownerName : 'Counter Customer')}
                      </div>
                      {tx.notes && (
                        <div className="text-[11px] text-neutral-500 truncate max-w-xs mt-0.5">
                          {tx.notes}
                        </div>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 text-neutral-700 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[11px] bg-neutral-100 text-neutral-700 border border-neutral-200">
                        {tx.category}
                      </span>
                    </td>

                    {/* Reference # */}
                    <td className="py-3.5 px-4 text-neutral-500 font-mono text-[11px] whitespace-nowrap">
                      {tx.referenceNumber || '—'}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span
                        className={`font-mono text-sm font-extrabold ${
                          isReceipt
                            ? 'text-emerald-700'
                            : isExpense
                            ? 'text-rose-700'
                            : 'text-purple-700'
                        }`}
                      >
                        {isReceipt ? '+' : '-'} {symbol} {tx.amount.toLocaleString('en-IN')}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => onEdit(tx)}
                          className="p-1.5 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors"
                          title="Edit transaction"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(tx)}
                          className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Subtotals */}
      <div className="p-4 border-t border-neutral-100 bg-neutral-50/50 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 text-neutral-500">
          <span>
            Cash Flow:{' '}
            <strong className="text-emerald-800">
              +{symbol}{filteredTransactions
                .filter((t) => t.mode === 'cash' && t.type === 'receipt')
                .reduce((a, b) => a + b.amount, 0)
                .toLocaleString('en-IN')}
            </strong>{' '}
            /{' '}
            <strong className="text-rose-800">
              -{symbol}{filteredTransactions
                .filter((t) => t.mode === 'cash' && (t.type === 'expense' || t.type === 'owner_payout'))
                .reduce((a, b) => a + b.amount, 0)
                .toLocaleString('en-IN')}
            </strong>
          </span>

          <span className="text-neutral-300">•</span>

          <span>
            Online Flow:{' '}
            <strong className="text-blue-800">
              +{symbol}{filteredTransactions
                .filter((t) => t.mode === 'online' && t.type === 'receipt')
                .reduce((a, b) => a + b.amount, 0)
                .toLocaleString('en-IN')}
            </strong>{' '}
            /{' '}
            <strong className="text-rose-800">
              -{symbol}{filteredTransactions
                .filter((t) => t.mode === 'online' && (t.type === 'expense' || t.type === 'owner_payout'))
                .reduce((a, b) => a + b.amount, 0)
                .toLocaleString('en-IN')}
            </strong>
          </span>
        </div>

        <div className="text-neutral-600">
          Filtered Subtotal:{' '}
          <span className="font-bold font-mono text-neutral-900">
            {symbol}{' '}
            {filteredTransactions
              .reduce((acc, t) => (t.type === 'receipt' ? acc + t.amount : acc - t.amount), 0)
              .toLocaleString('en-IN')}
          </span>
        </div>
      </div>

    </div>
  );
};
