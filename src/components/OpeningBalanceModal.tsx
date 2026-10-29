import React, { useState, useEffect } from 'react';
import { X, Banknote, QrCode, ArrowRight, RotateCcw, Check } from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';

interface OpeningBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OpeningBalanceModal: React.FC<OpeningBalanceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    selectedDate,
    dayRecords,
    currentSummary,
    setOpeningBalance,
    shopProfile,
    getSummaryForDate,
  } = useTransactions();

  const [cashVal, setCashVal] = useState<string>('');
  const [onlineVal, setOnlineVal] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setCashVal(String(currentSummary.openingCash || 0));
      setOnlineVal(String(currentSummary.openingOnline || 0));
    }
  }, [isOpen, currentSummary]);

  // Calculate prior day date
  const getPriorDate = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  const priorDate = getPriorDate();
  const priorSummary = getSummaryForDate(priorDate);

  const handleCopyFromPrior = () => {
    setCashVal(String(priorSummary.closingCashCalculated || 0));
    setOnlineVal(String(priorSummary.closingOnlineCalculated || 0));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cash = parseFloat(cashVal) || 0;
    const online = parseFloat(onlineVal) || 0;
    setOpeningBalance(selectedDate, cash, online);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-neutral-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/60">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 font-serif-title">
              Opening Balances
            </h2>
            <p className="text-xs text-neutral-500">
              For {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
                dateStyle: 'medium',
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

        <form onSubmit={handleSave} className="p-6 space-y-4">
          
          {/* Prior Day Rollover Suggestion Banner */}
          <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-3 text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-rose-900">Yesterday's Closing Balances</span>
              <button
                type="button"
                onClick={handleCopyFromPrior}
                className="text-[11px] font-bold text-rose-700 hover:text-rose-800 underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Auto-fill from Yesterday</span>
              </button>
            </div>
            <div className="flex items-center justify-between text-neutral-600">
              <span>Cash: {shopProfile.currencySymbol} {priorSummary.closingCashCalculated.toLocaleString('en-IN')}</span>
              <span>Online: {shopProfile.currencySymbol} {priorSummary.closingOnlineCalculated.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Opening Cash Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5 flex items-center gap-1.5">
              <Banknote className="w-4 h-4 text-emerald-600" />
              <span>Opening Cash in Till (Float)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">
                {shopProfile.currencySymbol}
              </span>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={cashVal}
                onChange={(e) => setCashVal(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-base font-mono font-bold text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              Physical cash float kept in drawer at shop opening for change.
            </p>
          </div>

          {/* Opening Online / UPI Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1.5 flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-blue-600" />
              <span>Opening Online / Bank Balance</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">
                {shopProfile.currencySymbol}
              </span>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={onlineVal}
                onChange={(e) => setOnlineVal(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-base font-mono font-bold text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              Opening balance in boutique UPI / Bank account starting the day.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 hover:bg-neutral-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-200 flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Save Opening Balances</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
