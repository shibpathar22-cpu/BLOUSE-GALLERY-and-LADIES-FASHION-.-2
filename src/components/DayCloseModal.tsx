import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Coins,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  FileText,
} from 'lucide-react';
import { DenominationCount } from '../types';
import { useTransactions } from '../context/TransactionContext';

interface DayCloseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_DENOMINATIONS: DenominationCount = {
  '500': 0,
  '200': 0,
  '100': 0,
  '50': 0,
  '20': 0,
  '10': 0,
  '5': 0,
  'coins': 0,
};

export const DayCloseModal: React.FC<DayCloseModalProps> = ({ isOpen, onClose }) => {
  const {
    selectedDate,
    currentSummary,
    dayRecords,
    closeDay,
    shopProfile,
  } = useTransactions();

  const [denominations, setDenominations] = useState<DenominationCount>(DEFAULT_DENOMINATIONS);
  const [closingNotes, setClosingNotes] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const existing = dayRecords[selectedDate];
      if (existing?.closingDenominations) {
        setDenominations(existing.closingDenominations);
        setClosingNotes(existing.closingNotes || '');
      } else {
        // Auto estimate denominations matching calculated closing cash if possible, or start zero
        setDenominations(DEFAULT_DENOMINATIONS);
        setClosingNotes('');
      }
    }
  }, [isOpen, selectedDate, dayRecords]);

  // Calculate physical cash total from denomination counts
  const calculatedPhysicalCash =
    (denominations['500'] || 0) * 500 +
    (denominations['200'] || 0) * 200 +
    (denominations['100'] || 0) * 100 +
    (denominations['50'] || 0) * 50 +
    (denominations['20'] || 0) * 20 +
    (denominations['10'] || 0) * 10 +
    (denominations['5'] || 0) * 5 +
    (denominations['coins'] || 0);

  const calculatedSystemCash = currentSummary.closingCashCalculated;
  const variance = calculatedPhysicalCash - calculatedSystemCash;

  const handleDenomChange = (key: keyof DenominationCount, valStr: string) => {
    const val = parseInt(valStr, 10);
    setDenominations((prev) => ({
      ...prev,
      [key]: isNaN(val) ? 0 : Math.max(0, val),
    }));
  };

  const handleAutoFillMatch = () => {
    // Break down system cash into standard Indian notes
    let rem = Math.max(0, calculatedSystemCash);
    const n500 = Math.floor(rem / 500);
    rem %= 500;
    const n200 = Math.floor(rem / 200);
    rem %= 200;
    const n100 = Math.floor(rem / 100);
    rem %= 100;
    const n50 = Math.floor(rem / 50);
    rem %= 50;
    const n20 = Math.floor(rem / 20);
    rem %= 20;
    const n10 = Math.floor(rem / 10);
    rem %= 10;
    const n5 = Math.floor(rem / 5);
    rem %= 5;
    const coins = rem;

    setDenominations({
      '500': n500,
      '200': n200,
      '100': n100,
      '50': n50,
      '20': n20,
      '10': n10,
      '5': n5,
      coins,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    closeDay(selectedDate, denominations, calculatedPhysicalCash, closingNotes);
    onClose();
  };

  if (!isOpen) return null;

  const symbol = shopProfile.currencySymbol || '₹';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-neutral-200 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/60">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 font-serif-title flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-600" />
              <span>Day-End Register Closure & Cash Tally</span>
            </h2>
            <p className="text-xs text-neutral-500">
              For {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
                dateStyle: 'full',
              })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Target closing cash banner */}
          <div className="bg-neutral-900 text-white p-4 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-neutral-400 block font-semibold">
                Expected System Cash Closing
              </span>
              <span className="text-2xl font-black font-mono text-emerald-400 mt-0.5 block">
                {symbol} {calculatedSystemCash.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-neutral-400">
                Opening ({symbol}{currentSummary.openingCash}) + Receipts ({symbol}{currentSummary.cashReceipts}) - Expenses ({symbol}{currentSummary.cashExpenses}) - Owner Drawings ({symbol}{currentSummary.ownerCashPayouts})
              </span>
            </div>
            <button
              type="button"
              onClick={handleAutoFillMatch}
              className="text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-3 py-1.5 rounded-xl border border-neutral-700 transition-colors shrink-0"
              title="Auto-fill denominations to match expected cash"
            >
              Fill Match
            </button>
          </div>

          {/* Physical Cash Denomination Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-600 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-600" />
                <span>Count Physical Currency in Till</span>
              </label>
              <button
                type="button"
                onClick={() => setDenominations(DEFAULT_DENOMINATIONS)}
                className="text-[11px] text-neutral-500 hover:text-neutral-800 underline"
              >
                Reset All
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-neutral-50 p-3 rounded-2xl border border-neutral-200 text-xs">
              {[
                { denom: '500', label: '₹ 500 Note' },
                { denom: '200', label: '₹ 200 Note' },
                { denom: '100', label: '₹ 100 Note' },
                { denom: '50', label: '₹ 50 Note' },
                { denom: '20', label: '₹ 20 Note' },
                { denom: '10', label: '₹ 10 Note' },
                { denom: '5', label: '₹ 5 Note' },
              ].map(({ denom, label }) => {
                const count = denominations[denom as keyof DenominationCount] || 0;
                const subtotal = count * parseInt(denom, 10);
                return (
                  <div
                    key={denom}
                    className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-xl border border-neutral-200 shadow-2xs"
                  >
                    <span className="font-semibold text-neutral-700">{label}:</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        value={count === 0 ? '' : count}
                        onChange={(e) =>
                          handleDenomChange(denom as keyof DenominationCount, e.target.value)
                        }
                        placeholder="0"
                        className="w-12 text-center py-0.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <span className="text-[11px] font-mono text-neutral-400 w-12 text-right">
                        = {subtotal}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Coins Input */}
              <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-xl border border-neutral-200 shadow-2xs">
                <span className="font-semibold text-neutral-700">Coins Value (₹):</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    value={denominations.coins === 0 ? '' : denominations.coins}
                    onChange={(e) => handleDenomChange('coins', e.target.value)}
                    placeholder="0"
                    className="w-16 text-center py-0.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Reconciliation / Variance Box */}
          <div className="p-4 rounded-2xl border transition-all">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-neutral-500 font-medium">Total Physical Counted:</span>
                <div className="text-xl font-extrabold font-mono text-neutral-900 mt-0.5">
                  {symbol} {calculatedPhysicalCash.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-neutral-500 font-medium">Variance (Difference):</span>
                <div
                  className={`text-lg font-extrabold font-mono mt-0.5 ${
                    variance === 0
                      ? 'text-emerald-600'
                      : variance < 0
                      ? 'text-rose-600'
                      : 'text-blue-600'
                  }`}
                >
                  {variance > 0 ? `+${symbol}` : variance < 0 ? `-${symbol}` : `${symbol}`}
                  {Math.abs(variance).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-neutral-200">
              {variance === 0 ? (
                <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 px-3 py-2 rounded-xl text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Perfect Match! Physical cash exactly tallies with register books.</span>
                </div>
              ) : variance < 0 ? (
                <div className="flex items-center gap-2 text-rose-800 bg-rose-50 px-3 py-2 rounded-xl text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    Cash Shortage: Drawer has {symbol}
                    {Math.abs(variance).toLocaleString('en-IN')} less than system records.
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-blue-800 bg-blue-50 px-3 py-2 rounded-xl text-xs font-semibold">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    Cash Surplus: Drawer has +{symbol}
                    {variance.toLocaleString('en-IN')} extra cash.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Closing Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-neutral-400" />
              <span>Closing Notes & Remarks</span>
            </label>
            <input
              type="text"
              value={closingNotes}
              onChange={(e) => setClosingNotes(e.target.value)}
              placeholder="e.g. Verified by Mrs. Jayashree Sharma, ready for tomorrow's opening float."
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-neutral-600 hover:bg-neutral-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-200 flex items-center gap-1.5 transition-colors"
            >
              <Lock className="w-4 h-4" />
              <span>Save & Finalize Day Close</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
