import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Crown,
  Banknote,
  QrCode,
  Check,
  Tag,
  User,
  Hash,
  FileText,
} from 'lucide-react';
import { Transaction, TransactionType, PaymentMode } from '../types';
import { useTransactions } from '../context/TransactionContext';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: TransactionType;
  initialMode?: PaymentMode;
  editTransaction?: Transaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  initialType = 'receipt',
  initialMode = 'cash',
  editTransaction = null,
}) => {
  const {
    selectedDate,
    categories,
    addCategory,
    addTransaction,
    updateTransaction,
    shopProfile,
  } = useTransactions();

  const [type, setType] = useState<TransactionType>(initialType);
  const [mode, setMode] = useState<PaymentMode>(initialMode);
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [newCategoryInput, setNewCategoryInput] = useState<string>('');
  const [showAddCategory, setShowAddCategory] = useState<boolean>(false);
  const [partyName, setPartyName] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [txDate, setTxDate] = useState<string>(selectedDate);
  const [txTime, setTxTime] = useState<string>('12:00');

  useEffect(() => {
    if (editTransaction) {
      setType(editTransaction.type);
      setMode(editTransaction.mode);
      setAmount(editTransaction.amount.toString());
      setCategory(editTransaction.category);
      setPartyName(editTransaction.partyName || '');
      setReferenceNumber(editTransaction.referenceNumber || '');
      setNotes(editTransaction.notes || '');
      setTxDate(editTransaction.date);
      setTxTime(editTransaction.time || '12:00');
    } else {
      setType(initialType);
      setMode(initialMode);
      setAmount('');
      setTxDate(selectedDate);
      const now = new Date();
      setTxTime(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      );
      setReferenceNumber('');
      setNotes('');
      setShowAddCategory(false);

      if (initialType === 'owner_payout') {
        setPartyName(shopProfile.ownerName || 'Shop Owner');
        setCategory(categories.ownerPayouts[0] || 'Owner Cash Drawing (Personal)');
      } else if (initialType === 'receipt') {
        setPartyName('');
        setCategory(categories.receipts[0] || 'Designer Blouse Stitching');
      } else {
        setPartyName('');
        setCategory(categories.expenses[0] || 'Tailor / Karigar Wages');
      }
    }
  }, [isOpen, editTransaction, initialType, initialMode, selectedDate, shopProfile]);

  // When type changes on create, sync default category and party
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setShowAddCategory(false);
    if (newType === 'owner_payout') {
      setPartyName(shopProfile.ownerName || 'Shop Owner');
      setCategory(categories.ownerPayouts[0] || 'Owner Cash Drawing (Personal)');
    } else if (newType === 'receipt') {
      if (type === 'owner_payout') setPartyName('');
      setCategory(categories.receipts[0] || 'Designer Blouse Stitching');
    } else {
      if (type === 'owner_payout') setPartyName('');
      setCategory(categories.expenses[0] || 'Tailor / Karigar Wages');
    }
  };

  const currentCategoryList =
    type === 'receipt'
      ? categories.receipts
      : type === 'expense'
      ? categories.expenses
      : categories.ownerPayouts;

  const handleAddCustomCategory = () => {
    if (newCategoryInput.trim()) {
      addCategory(type, newCategoryInput.trim());
      setCategory(newCategoryInput.trim());
      setNewCategoryInput('');
      setShowAddCategory(false);
    }
  };

  const handleAddAmount = (addVal: number) => {
    const current = Number(amount) || 0;
    setAmount(String(current + addVal));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return;
    }

    const finalPartyName = partyName.trim()
      ? partyName.trim()
      : type === 'owner_payout'
      ? shopProfile.ownerName || 'Shop Owner'
      : type === 'receipt'
      ? 'Counter Customer'
      : 'General Expense';

    if (editTransaction) {
      updateTransaction(editTransaction.id, {
        type,
        mode,
        amount: numAmount,
        category: category || currentCategoryList[0] || 'General',
        partyName: finalPartyName,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        date: txDate,
        time: txTime,
      });
    } else {
      addTransaction({
        date: txDate,
        time: txTime,
        type,
        mode,
        amount: numAmount,
        category: category || currentCategoryList[0] || 'General',
        partyName: finalPartyName,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-neutral-200 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/60">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 font-serif-title">
              {editTransaction ? 'Edit Transaction' : 'Record New Transaction'}
            </h2>
            <p className="text-xs text-neutral-500">
              Blouse Gallery & Ladies Fashion Daily Book
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
          {/* 1. Transaction Type Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
              Transaction Nature
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange('receipt')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  type === 'receipt'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                    : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <ArrowDownRight className="w-4 h-4 mb-1 text-emerald-600" />
                <span>Receipt (Inflow)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  type === 'expense'
                    ? 'bg-rose-50 border-rose-500 text-rose-800 shadow-xs'
                    : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 mb-1 text-rose-600" />
                <span>Shop Expense</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('owner_payout')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  type === 'owner_payout'
                    ? 'bg-purple-50 border-purple-500 text-purple-800 shadow-xs'
                    : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <Crown className="w-4 h-4 mb-1 text-purple-600" />
                <span>Pay to Owner</span>
              </button>
            </div>
          </div>

          {/* 2. Payment Mode Selector (Cash vs Online) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                Payment Mode (Tracked Separately)
              </label>
              <span className="text-[11px] text-neutral-400 font-medium">
                {mode === 'cash' ? 'Affects Physical Till' : 'Affects UPI / Bank Register'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('cash')}
                className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border font-bold text-sm transition-all ${
                  mode === 'cash'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-200'
                    : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>CASH</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('online')}
                className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border font-bold text-sm transition-all ${
                  mode === 'online'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200'
                    : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>ONLINE / UPI</span>
              </button>
            </div>
          </div>

          {/* 3. Amount Field with Quick Quick-Add buttons */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
              Amount ({shopProfile.currencySymbol}) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-neutral-400">
                {shopProfile.currencySymbol}
              </span>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-11 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-2xl font-mono font-bold text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] text-neutral-400">Quick add:</span>
              {[100, 500, 1000, 2000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleAddAmount(val)}
                  className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors"
                >
                  +{val}
                </button>
              ))}
              {amount && (
                <button
                  type="button"
                  onClick={() => setAmount('')}
                  className="text-xs text-rose-600 hover:underline ml-auto"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* 4. Category Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                Category
              </label>
              <button
                type="button"
                onClick={() => setShowAddCategory(!showAddCategory)}
                className="text-xs text-rose-600 font-semibold hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>{showAddCategory ? 'Cancel' : 'New Category'}</span>
              </button>
            </div>

            {showAddCategory ? (
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  placeholder="Enter category name..."
                  className="flex-1 px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
                <button
                  type="button"
                  onClick={handleAddCustomCategory}
                  className="px-3 py-2 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 transition-colors"
                >
                  Add
                </button>
              </div>
            ) : null}

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium text-neutral-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              {currentCategoryList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Party Name (Customer, Karigar, Vendor, Owner) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                {type === 'owner_payout'
                  ? 'Owner / Account'
                  : type === 'receipt'
                  ? 'Customer Name'
                  : 'Tailor / Vendor Name'}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  placeholder={
                    type === 'owner_payout'
                      ? shopProfile.ownerName
                      : type === 'receipt'
                      ? 'e.g. Priya Sharma'
                      : 'e.g. Master Tailor / Fabric Shop'
                  }
                  className="w-full pl-9 pr-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Reference Number / Order / Bill / UPI Ref */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                Bill / Order / UPI Ref
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder={
                    mode === 'online'
                      ? 'e.g. UPI-981240'
                      : 'e.g. ORD-1094 / BILL-202'
                  }
                  className="w-full pl-9 pr-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>
          </div>

          {/* 6. Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                Date
              </label>
              <input
                type="date"
                required
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                Time
              </label>
              <input
                type="time"
                value={txTime}
                onChange={(e) => setTxTime(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          {/* 7. Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
              Item Details & Notes
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Maggam work blouse delivery, Princess cut with matching tassels"
                className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-neutral-600 hover:bg-neutral-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center gap-1.5 ${
                type === 'receipt'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                  : type === 'expense'
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                  : 'bg-purple-600 hover:bg-purple-700 shadow-purple-200'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{editTransaction ? 'Save Changes' : 'Record Transaction'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
