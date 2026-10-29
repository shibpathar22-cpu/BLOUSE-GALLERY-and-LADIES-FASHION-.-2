import React from 'react';
import {
  Scissors,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Lock,
  LockOpen,
  Printer,
  Settings,
  Sparkles,
  Crown,
  FileSpreadsheet,
  BarChart3,
  BookOpen,
} from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';

interface HeaderProps {
  activeTab: 'register' | 'owner' | 'reports' | 'print';
  setActiveTab: (tab: 'register' | 'owner' | 'reports' | 'print') => void;
  onOpenDayClose: () => void;
  onOpenSettings: () => void;
  onOpenOpeningBalance: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenDayClose,
  onOpenSettings,
  onOpenOpeningBalance,
}) => {
  const {
    shopProfile,
    selectedDate,
    setSelectedDate,
    currentSummary,
    reopenDay,
  } = useTransactions();

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  const formattedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header className="bg-white border-b border-rose-100 shadow-xs sticky top-0 z-30 no-print">
      {/* Top Boutique Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Shop Identity */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 via-pink-600 to-amber-600 flex items-center justify-center text-white shadow-md shadow-rose-200 shrink-0">
              <Scissors className="w-6 h-6 rotate-45 transform" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 font-serif-title">
                  {shopProfile.shopName}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Daily Cash Register
                </span>
              </div>
              <p className="text-xs text-neutral-500 flex items-center gap-2 mt-0.5">
                <span>{shopProfile.tagline}</span>
                <span className="text-neutral-300">•</span>
                <span className="hidden md:inline text-neutral-600 font-medium">{shopProfile.phone}</span>
              </p>
            </div>
          </div>

          {/* Date Selector and Fast Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Date Switcher */}
            <div className="flex items-center bg-neutral-100/80 p-1 rounded-xl border border-neutral-200">
              <button
                type="button"
                onClick={handlePrevDay}
                className="p-1.5 hover:bg-white rounded-lg text-neutral-600 hover:text-neutral-900 transition-colors"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 px-2.5 py-1">
                <Calendar className="w-4 h-4 text-rose-600" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                  className="bg-transparent text-sm font-semibold text-neutral-800 focus:outline-none cursor-pointer"
                />
                <span className="text-xs text-neutral-500 font-medium hidden sm:inline">
                  ({formattedDate})
                </span>
              </div>

              <button
                type="button"
                onClick={handleNextDay}
                className="p-1.5 hover:bg-white rounded-lg text-neutral-600 hover:text-neutral-900 transition-colors"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {!isToday && (
              <button
                type="button"
                onClick={handleToday}
                className="px-2.5 py-1.5 text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors"
              >
                Go to Today
              </button>
            )}

            {/* Day Status Badge & Close Day trigger */}
            {currentSummary.isClosed ? (
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  Day Closed
                </span>
                <button
                  type="button"
                  onClick={() => reopenDay(selectedDate)}
                  className="text-xs text-neutral-500 hover:text-neutral-800 underline px-1"
                  title="Click to reopen registers if you need to add or modify transactions"
                >
                  Reopen
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenDayClose}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
              >
                <LockOpen className="w-3.5 h-3.5" />
                <span>Close Day & Tally</span>
              </button>
            )}

            {/* Settings button */}
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl border border-neutral-200 transition-colors"
              title="Shop Settings & Data Backup"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-neutral-100 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ${
              activeTab === 'register'
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-200'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Daily Register (Day Sheet)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('owner')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ${
              activeTab === 'owner'
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-200'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
            }`}
          >
            <Crown className="w-4 h-4 text-amber-300" />
            <span>Owner Payouts & Drawings</span>
            {currentSummary.totalOwnerPayouts > 0 && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  activeTab === 'owner'
                    ? 'bg-rose-700 text-rose-100'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {shopProfile.currencySymbol}
                {currentSummary.totalOwnerPayouts.toLocaleString('en-IN')}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ${
              activeTab === 'reports'
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-200'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Reports & Cash Flow</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('print')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ${
              activeTab === 'print'
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-200'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Print Day Slip</span>
          </button>

          <div className="ml-auto hidden lg:flex items-center gap-2 text-xs text-neutral-500">
            <button
              type="button"
              onClick={onOpenOpeningBalance}
              className="text-neutral-600 hover:text-rose-700 font-medium underline px-1"
            >
              Adjust Opening Balances
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
