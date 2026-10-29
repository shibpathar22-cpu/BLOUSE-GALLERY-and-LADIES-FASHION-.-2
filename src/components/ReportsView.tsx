import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Banknote,
  QrCode,
  ArrowDownRight,
  ArrowUpRight,
  Crown,
  Wallet,
  TrendingUp,
  PieChart,
} from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';

export const ReportsView: React.FC = () => {
  const { transactions, selectedDate, shopProfile } = useTransactions();
  const [period, setPeriod] = useState<'today' | '7days' | 'month' | 'all'>('month');

  const symbol = shopProfile.currencySymbol || '₹';

  // Filter transactions based on chosen period
  const filteredTransactions = useMemo(() => {
    const today = selectedDate;
    const currentMonth = today.substring(0, 7);

    return transactions.filter((tx) => {
      if (period === 'today') return tx.date === today;
      if (period === 'month') return tx.date.startsWith(currentMonth);
      if (period === '7days') {
        const dTx = new Date(tx.date).getTime();
        const dToday = new Date(today).getTime();
        const diffDays = (dToday - dTx) / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays <= 7;
      }
      return true; // all
    });
  }, [transactions, selectedDate, period]);

  // Calculations
  const stats = useMemo(() => {
    let cashReceipts = 0;
    let onlineReceipts = 0;
    let cashExpenses = 0;
    let onlineExpenses = 0;
    let cashOwner = 0;
    let onlineOwner = 0;

    const receiptCategories: Record<string, number> = {};
    const expenseCategories: Record<string, number> = {};

    filteredTransactions.forEach((tx) => {
      const amt = tx.amount || 0;
      if (tx.type === 'receipt') {
        if (tx.mode === 'cash') cashReceipts += amt;
        else onlineReceipts += amt;
        receiptCategories[tx.category] = (receiptCategories[tx.category] || 0) + amt;
      } else if (tx.type === 'expense') {
        if (tx.mode === 'cash') cashExpenses += amt;
        else onlineExpenses += amt;
        expenseCategories[tx.category] = (expenseCategories[tx.category] || 0) + amt;
      } else if (tx.type === 'owner_payout') {
        if (tx.mode === 'cash') cashOwner += amt;
        else onlineOwner += amt;
      }
    });

    const totalReceipts = cashReceipts + onlineReceipts;
    const totalExpenses = cashExpenses + onlineExpenses;
    const totalOwner = cashOwner + onlineOwner;
    const netRetained = totalReceipts - totalExpenses - totalOwner;

    const netCashFlow = cashReceipts - cashExpenses - cashOwner;
    const netOnlineFlow = onlineReceipts - onlineExpenses - onlineOwner;

    const sortedReceiptCats = Object.entries(receiptCategories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    const sortedExpenseCats = Object.entries(expenseCategories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    return {
      cashReceipts,
      onlineReceipts,
      totalReceipts,
      cashExpenses,
      onlineExpenses,
      totalExpenses,
      cashOwner,
      onlineOwner,
      totalOwner,
      netRetained,
      netCashFlow,
      netOnlineFlow,
      sortedReceiptCats,
      sortedExpenseCats,
    };
  }, [filteredTransactions]);

  // CSV export handler
  const handleExportCSV = () => {
    const headers = [
      'Transaction ID',
      'Date',
      'Time',
      'Type',
      'Payment Mode',
      'Category',
      'Party / Customer / Vendor',
      'Reference Number',
      'Amount',
      'Notes',
    ];

    const rows = filteredTransactions.map((tx) => [
      tx.id,
      tx.date,
      tx.time,
      tx.type.toUpperCase(),
      tx.mode.toUpperCase(),
      `"${(tx.category || '').replace(/"/g, '""')}"`,
      `"${(tx.partyName || '').replace(/"/g, '""')}"`,
      `"${(tx.referenceNumber || '').replace(/"/g, '""')}"`,
      tx.amount,
      `"${(tx.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `BlouseGallery_Report_${period}_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 font-serif-title flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-rose-600" />
            <span>Financial Reports & Cash Flow Analytics</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Audit separate cash and online streams, expenses, and owner draw balances.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Period selector */}
          <div className="flex items-center bg-neutral-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setPeriod('today')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                period === 'today' ? 'bg-white shadow-xs text-neutral-900' : 'text-neutral-500'
              }`}
            >
              Selected Day
            </button>
            <button
              type="button"
              onClick={() => setPeriod('7days')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                period === '7days' ? 'bg-white shadow-xs text-neutral-900' : 'text-neutral-500'
              }`}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => setPeriod('month')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                period === 'month' ? 'bg-white shadow-xs text-neutral-900' : 'text-neutral-500'
              }`}
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => setPeriod('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                period === 'all' ? 'bg-white shadow-xs text-neutral-900' : 'text-neutral-500'
              }`}
            >
              All Time
            </button>
          </div>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-neutral-900 text-white hover:bg-neutral-800 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 4 Main Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inflow */}
        <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span className="font-semibold text-emerald-800 flex items-center gap-1">
              <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
              Total Inflow (Receipts)
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-950 mt-1.5">
            {symbol} {stats.totalReceipts.toLocaleString('en-IN')}
          </div>
          <div className="mt-2.5 pt-2 border-t border-neutral-100 text-[11px] text-neutral-600 space-y-0.5">
            <div className="flex justify-between">
              <span>Cash:</span>
              <span className="font-semibold">{symbol}{stats.cashReceipts.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Online/UPI:</span>
              <span className="font-semibold">{symbol}{stats.onlineReceipts.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-xs">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span className="font-semibold text-rose-800 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
              Shop Expenses
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-rose-950 mt-1.5">
            {symbol} {stats.totalExpenses.toLocaleString('en-IN')}
          </div>
          <div className="mt-2.5 pt-2 border-t border-neutral-100 text-[11px] text-neutral-600 space-y-0.5">
            <div className="flex justify-between">
              <span>Cash:</span>
              <span className="font-semibold">{symbol}{stats.cashExpenses.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Online/UPI:</span>
              <span className="font-semibold">{symbol}{stats.onlineExpenses.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Payments to Owner */}
        <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-xs">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span className="font-semibold text-purple-800 flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-purple-600" />
              Paid to Owner
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-purple-950 mt-1.5">
            {symbol} {stats.totalOwner.toLocaleString('en-IN')}
          </div>
          <div className="mt-2.5 pt-2 border-t border-neutral-100 text-[11px] text-neutral-600 space-y-0.5">
            <div className="flex justify-between">
              <span>Cash Drawings:</span>
              <span className="font-semibold">{symbol}{stats.cashOwner.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Online Transfers:</span>
              <span className="font-semibold">{symbol}{stats.onlineOwner.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Net Retained */}
        <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 text-white rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-neutral-300">
            <span className="font-semibold text-rose-300 flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5 text-rose-400" />
              Net Retained Fund
            </span>
          </div>
          <div
            className={`text-2xl font-black font-mono mt-1.5 ${
              stats.netRetained >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {stats.netRetained >= 0 ? '+' : ''}
            {symbol} {stats.netRetained.toLocaleString('en-IN')}
          </div>
          <div className="mt-2.5 pt-2 border-t border-neutral-700 text-[11px] text-neutral-300 space-y-0.5">
            <div className="flex justify-between">
              <span>Net Cash Drawer Flow:</span>
              <span className="font-semibold">{symbol}{stats.netCashFlow.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Net Online Register Flow:</span>
              <span className="font-semibold">{symbol}{stats.netOnlineFlow.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cash vs Online Stream Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cash Stream Box */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-xs">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-neutral-100">
            <Banknote className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-neutral-900 text-sm">Physical Cash Stream Audit</h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-neutral-50">
              <span className="text-neutral-600">Total Cash Inflow (Receipts):</span>
              <span className="font-bold text-emerald-700">+{symbol}{stats.cashReceipts.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-50">
              <span className="text-neutral-600">Total Cash Outflow (Shop Expenses):</span>
              <span className="font-bold text-rose-700">-{symbol}{stats.cashExpenses.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-50">
              <span className="text-neutral-600">Cash Withdrawn by Owner:</span>
              <span className="font-bold text-purple-700">-{symbol}{stats.cashOwner.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between pt-2 font-bold text-sm">
              <span className="text-neutral-900">Net Period Cash Movement:</span>
              <span className={stats.netCashFlow >= 0 ? 'text-emerald-700 font-mono' : 'text-rose-700 font-mono'}>
                {stats.netCashFlow >= 0 ? '+' : ''}{symbol}{stats.netCashFlow.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Online / UPI Stream Box */}
        <div className="bg-white rounded-2xl p-5 border border-blue-100 shadow-xs">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-neutral-100">
            <QrCode className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-neutral-900 text-sm">Online & UPI Stream Audit</h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-neutral-50">
              <span className="text-neutral-600">Total Online Receipts (GPay/UPI/Card):</span>
              <span className="font-bold text-blue-700">+{symbol}{stats.onlineReceipts.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-50">
              <span className="text-neutral-600">Total Online Expenses (Suppliers/Bills):</span>
              <span className="font-bold text-rose-700">-{symbol}{stats.onlineExpenses.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-50">
              <span className="text-neutral-600">Online Transfers to Owner:</span>
              <span className="font-bold text-purple-700">-{symbol}{stats.onlineOwner.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between pt-2 font-bold text-sm">
              <span className="text-neutral-900">Net Period Online Movement:</span>
              <span className={stats.netOnlineFlow >= 0 ? 'text-blue-700 font-mono' : 'text-rose-700 font-mono'}>
                {stats.netOnlineFlow >= 0 ? '+' : ''}{symbol}{stats.netOnlineFlow.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Receipts Category Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-xs">
          <h3 className="font-bold text-neutral-900 text-sm mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Top Revenue Sources</span>
          </h3>
          {stats.sortedReceiptCats.length === 0 ? (
            <p className="text-xs text-neutral-400 py-6 text-center">No receipt data for this period.</p>
          ) : (
            <div className="space-y-3">
              {stats.sortedReceiptCats.map(([cat, amt]) => {
                const percent = stats.totalReceipts > 0 ? Math.round((amt / stats.totalReceipts) * 100) : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-800">{cat}</span>
                      <span className="font-mono font-bold text-emerald-700">
                        {symbol}{amt.toLocaleString('en-IN')} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Expenses Category Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-xs">
          <h3 className="font-bold text-neutral-900 text-sm mb-3 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-rose-600" />
            <span>Top Operational Expenses</span>
          </h3>
          {stats.sortedExpenseCats.length === 0 ? (
            <p className="text-xs text-neutral-400 py-6 text-center">No expense data for this period.</p>
          ) : (
            <div className="space-y-3">
              {stats.sortedExpenseCats.map(([cat, amt]) => {
                const percent = stats.totalExpenses > 0 ? Math.round((amt / stats.totalExpenses) * 100) : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-800">{cat}</span>
                      <span className="font-mono font-bold text-rose-700">
                        {symbol}{amt.toLocaleString('en-IN')} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-rose-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
