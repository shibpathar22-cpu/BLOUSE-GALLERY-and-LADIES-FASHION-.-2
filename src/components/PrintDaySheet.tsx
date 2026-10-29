import React from 'react';
import {
  Printer,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Banknote,
  QrCode,
  Scissors,
  Crown,
} from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';

export const PrintDaySheet: React.FC = () => {
  const {
    shopProfile,
    selectedDate,
    currentSummary,
    transactions,
    dayRecords,
  } = useTransactions();

  const symbol = shopProfile.currencySymbol || '₹';
  const dayRecord = dayRecords[selectedDate];

  const dayTransactions = transactions.filter((tx) => tx.date === selectedDate);
  const cashTransactions = dayTransactions.filter((tx) => tx.mode === 'cash');
  const onlineTransactions = dayTransactions.filter((tx) => tx.mode === 'online');

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      
      {/* Action banner (hidden during actual print) */}
      <div className="no-print bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-neutral-900 font-serif-title">
            Printable Daily Day Sheet Slip
          </h3>
          <p className="text-xs text-neutral-500">
            Official daily accounts summary for physical records, CA audit, or store file.
          </p>
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-200 transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save as PDF</span>
        </button>
      </div>

      {/* The Printable Paper Sheet */}
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-neutral-300 shadow-sm max-w-4xl mx-auto print:border-none print:shadow-none print:p-2 text-neutral-900">
        
        {/* Boutique Header */}
        <div className="text-center pb-6 border-b-2 border-neutral-900">
          <div className="inline-flex items-center justify-center gap-2 mb-1">
            <Scissors className="w-5 h-5 text-rose-600 rotate-45 transform" />
            <h1 className="text-2xl sm:text-3xl font-bold font-serif-title uppercase tracking-wide">
              {shopProfile.shopName}
            </h1>
          </div>
          <p className="text-xs font-medium text-neutral-600">{shopProfile.tagline}</p>
          <p className="text-xs text-neutral-500 mt-1">
            {shopProfile.address} • Tel: {shopProfile.phone} • UPI ID: {shopProfile.upiId}
          </p>
          <div className="inline-block mt-3 px-4 py-1 bg-neutral-100 rounded-full text-xs font-bold tracking-wider uppercase border border-neutral-300">
            DAILY CASH & ONLINE TRANSACTION DAY SHEET
          </div>
        </div>

        {/* Date and Metadata Bar */}
        <div className="flex flex-wrap items-center justify-between py-3 border-b border-neutral-200 text-xs">
          <div>
            <span className="font-semibold text-neutral-500">Date: </span>
            <span className="font-bold text-neutral-900">{formattedDate} ({selectedDate})</span>
          </div>
          <div>
            <span className="font-semibold text-neutral-500">Register Status: </span>
            <span className="font-bold uppercase">
              {currentSummary.isClosed ? 'CLOSED & TALLIED' : 'OPEN / IN-PROGRESS'}
            </span>
          </div>
          <div>
            <span className="font-semibold text-neutral-500">Owner: </span>
            <span className="font-bold">{shopProfile.ownerName}</span>
          </div>
        </div>

        {/* 1. MASTER SUMMARY RECONCILIATION TABLE */}
        <div className="mt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
            1. Master Accounts Reconciliation (Cash vs Online Accounted Separately)
          </h3>
          <table className="w-full text-xs border border-neutral-300 border-collapse">
            <thead>
              <tr className="bg-neutral-100 border-b border-neutral-300 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3 text-left">Particulars</th>
                <th className="py-2.5 px-3 text-right">Cash Drawer (₹)</th>
                <th className="py-2.5 px-3 text-right">Online / UPI (₹)</th>
                <th className="py-2.5 px-3 text-right bg-neutral-200">Combined Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 font-mono">
              <tr>
                <td className="py-2 px-3 font-sans font-medium">Opening Balance</td>
                <td className="py-2 px-3 text-right">{currentSummary.openingCash.toLocaleString('en-IN')}</td>
                <td className="py-2 px-3 text-right">{currentSummary.openingOnline.toLocaleString('en-IN')}</td>
                <td className="py-2 px-3 text-right bg-neutral-50 font-bold">
                  {(currentSummary.openingCash + currentSummary.openingOnline).toLocaleString('en-IN')}
                </td>
              </tr>
              <tr className="text-emerald-800 bg-emerald-50/30">
                <td className="py-2 px-3 font-sans font-medium">(+) Daily Receipts (Sales & Advances)</td>
                <td className="py-2 px-3 text-right">+{currentSummary.cashReceipts.toLocaleString('en-IN')}</td>
                <td className="py-2 px-3 text-right">+{currentSummary.onlineReceipts.toLocaleString('en-IN')}</td>
                <td className="py-2 px-3 text-right bg-emerald-100/50 font-bold">
                  +{currentSummary.totalReceipts.toLocaleString('en-IN')}
                </td>
              </tr>
              <tr className="text-rose-800 bg-rose-50/30">
                <td className="py-2 px-3 font-sans font-medium">(-) Daily Expenses (Tailor Wages, Materials, etc.)</td>
                <td className="py-2 px-3 text-right">-{currentSummary.cashExpenses.toLocaleString('en-IN')}</td>
                <td className="py-2 px-3 text-right">-{currentSummary.onlineExpenses.toLocaleString('en-IN')}</td>
                <td className="py-2 px-3 text-right bg-rose-100/50 font-bold">
                  -{currentSummary.totalExpenses.toLocaleString('en-IN')}
                </td>
              </tr>
              <tr className="text-purple-800 bg-purple-50/30">
                <td className="py-2 px-3 font-sans font-medium">(-) Payments to Shop Owner (Drawings / Bank Transfers)</td>
                <td className="py-2 px-3 text-right">-{currentSummary.ownerCashPayouts.toLocaleString('en-IN')}</td>
                <td className="py-2 px-3 text-right">-{currentSummary.ownerOnlinePayouts.toLocaleString('en-IN')}</td>
                <td className="py-2 px-3 text-right bg-purple-100/50 font-bold">
                  -{currentSummary.totalOwnerPayouts.toLocaleString('en-IN')}
                </td>
              </tr>
              <tr className="bg-neutral-900 text-white font-bold text-xs border-t-2 border-neutral-900">
                <td className="py-2.5 px-3 font-sans uppercase">CALCULATED CLOSING BALANCE</td>
                <td className="py-2.5 px-3 text-right">{symbol} {currentSummary.closingCashCalculated.toLocaleString('en-IN')}</td>
                <td className="py-2.5 px-3 text-right">{symbol} {currentSummary.closingOnlineCalculated.toLocaleString('en-IN')}</td>
                <td className="py-2.5 px-3 text-right bg-neutral-800 text-rose-200">
                  {symbol} {currentSummary.totalClosingCalculated.toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 2. PHYSICAL CASH DENOMINATION AUDIT (IF AVAILABLE) */}
        {dayRecord?.closingDenominations && (
          <div className="mt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
              2. Physical Cash Drawer Denominations & Tally
            </h3>
            <div className="border border-neutral-300 p-3 rounded-lg text-xs">
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 font-mono text-center">
                <div className="bg-neutral-50 p-1.5 border border-neutral-200 rounded">
                  <span className="text-[10px] text-neutral-500 block">₹500</span>
                  <span className="font-bold">x {dayRecord.closingDenominations['500'] || 0}</span>
                </div>
                <div className="bg-neutral-50 p-1.5 border border-neutral-200 rounded">
                  <span className="text-[10px] text-neutral-500 block">₹200</span>
                  <span className="font-bold">x {dayRecord.closingDenominations['200'] || 0}</span>
                </div>
                <div className="bg-neutral-50 p-1.5 border border-neutral-200 rounded">
                  <span className="text-[10px] text-neutral-500 block">₹100</span>
                  <span className="font-bold">x {dayRecord.closingDenominations['100'] || 0}</span>
                </div>
                <div className="bg-neutral-50 p-1.5 border border-neutral-200 rounded">
                  <span className="text-[10px] text-neutral-500 block">₹50</span>
                  <span className="font-bold">x {dayRecord.closingDenominations['50'] || 0}</span>
                </div>
                <div className="bg-neutral-50 p-1.5 border border-neutral-200 rounded">
                  <span className="text-[10px] text-neutral-500 block">₹20</span>
                  <span className="font-bold">x {dayRecord.closingDenominations['20'] || 0}</span>
                </div>
                <div className="bg-neutral-50 p-1.5 border border-neutral-200 rounded">
                  <span className="text-[10px] text-neutral-500 block">₹10</span>
                  <span className="font-bold">x {dayRecord.closingDenominations['10'] || 0}</span>
                </div>
                <div className="bg-neutral-50 p-1.5 border border-neutral-200 rounded">
                  <span className="text-[10px] text-neutral-500 block">₹5</span>
                  <span className="font-bold">x {dayRecord.closingDenominations['5'] || 0}</span>
                </div>
                <div className="bg-neutral-50 p-1.5 border border-neutral-200 rounded">
                  <span className="text-[10px] text-neutral-500 block">Coins</span>
                  <span className="font-bold">₹{dayRecord.closingDenominations.coins || 0}</span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-neutral-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-neutral-500 font-medium">Actual Physical Cash Counted: </span>
                  <span className="font-bold font-mono">
                    {symbol} {dayRecord.actualPhysicalCash?.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 font-medium">Variance (Shortage/Surplus): </span>
                  <span
                    className={`font-bold font-mono ${
                      dayRecord.cashVariance === 0
                        ? 'text-emerald-700'
                        : dayRecord.cashVariance && dayRecord.cashVariance < 0
                        ? 'text-rose-700'
                        : 'text-blue-700'
                    }`}
                  >
                    {dayRecord.cashVariance === 0
                      ? 'NIL (EXACT MATCH)'
                      : `${symbol} ${dayRecord.cashVariance?.toLocaleString('en-IN')}`}
                  </span>
                </div>
              </div>
              {dayRecord.closingNotes && (
                <div className="mt-1 text-[11px] text-neutral-500 italic">
                  Note: {dayRecord.closingNotes}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. ITEM-BY-ITEM TRANSACTION BREAKDOWNS */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Cash Ledger */}
          <div className="border border-neutral-200 rounded-lg p-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2 flex items-center gap-1.5">
              <Banknote className="w-3.5 h-3.5" />
              <span>Cash Transactions ({cashTransactions.length})</span>
            </h4>
            {cashTransactions.length === 0 ? (
              <p className="text-[11px] text-neutral-400 py-3 text-center">No cash entries today.</p>
            ) : (
              <div className="space-y-1.5 text-[11px]">
                {cashTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between py-1 border-b border-neutral-100"
                  >
                    <div>
                      <span className="font-bold text-neutral-800">{tx.partyName}</span>
                      <span className="text-neutral-500 text-[10px] block">
                        {tx.category} • {tx.time}
                      </span>
                    </div>
                    <span
                      className={`font-mono font-bold ${
                        tx.type === 'receipt'
                          ? 'text-emerald-700'
                          : tx.type === 'expense'
                          ? 'text-rose-700'
                          : 'text-purple-700'
                      }`}
                    >
                      {tx.type === 'receipt' ? '+' : '-'} {symbol}
                      {tx.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Online Ledger */}
          <div className="border border-neutral-200 rounded-lg p-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800 mb-2 flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5" />
              <span>Online / UPI Transactions ({onlineTransactions.length})</span>
            </h4>
            {onlineTransactions.length === 0 ? (
              <p className="text-[11px] text-neutral-400 py-3 text-center">No online entries today.</p>
            ) : (
              <div className="space-y-1.5 text-[11px]">
                {onlineTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between py-1 border-b border-neutral-100"
                  >
                    <div>
                      <span className="font-bold text-neutral-800">{tx.partyName}</span>
                      <span className="text-neutral-500 text-[10px] block">
                        {tx.category} • Ref: {tx.referenceNumber || 'UPI'}
                      </span>
                    </div>
                    <span
                      className={`font-mono font-bold ${
                        tx.type === 'receipt'
                          ? 'text-blue-700'
                          : tx.type === 'expense'
                          ? 'text-rose-700'
                          : 'text-purple-700'
                      }`}
                    >
                      {tx.type === 'receipt' ? '+' : '-'} {symbol}
                      {tx.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* 4. SIGNATURE AUTHORIZATION BLOCK */}
        <div className="mt-12 pt-6 border-t border-neutral-300 grid grid-cols-2 gap-8 text-center text-xs">
          <div>
            <div className="h-10 border-b border-dashed border-neutral-400 mb-2" />
            <span className="font-bold text-neutral-800 block">Cashier / Shop Manager Signature</span>
            <span className="text-[10px] text-neutral-400">Verified cash in register</span>
          </div>

          <div>
            <div className="h-10 border-b border-dashed border-neutral-400 mb-2" />
            <span className="font-bold text-neutral-800 block">
              Shop Owner Signature ({shopProfile.ownerName})
            </span>
            <span className="text-[10px] text-neutral-400">Accepted closing balances & drawings</span>
          </div>
        </div>

        <div className="mt-6 text-center text-[10px] text-neutral-400 print-only">
          Blouse Gallery & Ladies Fashion Daily Cash Register • Generated on {new Date().toLocaleString('en-IN')}
        </div>

      </div>

    </div>
  );
};
