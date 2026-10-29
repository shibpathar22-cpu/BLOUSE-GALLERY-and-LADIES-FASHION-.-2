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
  BarChart3,
  BookOpen,
  Palette,
  Database,
  Users,
  LogIn,
} from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { useAuth } from '../context/AuthContext';

export type NavTab = 'register' | 'owner' | 'reports' | 'branding' | 'backup' | 'users' | 'print';

interface HeaderProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onOpenDayClose: () => void;
  onOpenSettings: () => void;
  onOpenOpeningBalance: () => void;
  onOpenLogin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenDayClose,
  onOpenSettings,
  onOpenOpeningBalance,
  onOpenLogin,
}) => {
  const {
    shopProfile,
    selectedDate,
    setSelectedDate,
    currentSummary,
    reopenDay,
    branding,
  } = useTransactions();

  const { currentUser, isOwner } = useAuth();

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

  const hasCustomBanner = Boolean(branding.bannerUrl);

  return (
    <header className="bg-white border-b border-rose-100 shadow-xs sticky top-0 z-30 no-print transition-all">
      
      {/* Top Banner Area with Custom Header Banner Background */}
      <div className="relative overflow-hidden border-b border-neutral-100">
        {/* Banner Background Image */}
        {hasCustomBanner && (
          <img
            src={branding.bannerUrl}
            alt="Header Banner"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300"
            style={{
              objectPosition: branding.bannerPosition || 'center',
              transform: `scale(${(branding.bannerScale || 100) / 100})`,
            }}
          />
        )}

        {/* Readability Scrim Overlay (Guarantees 100% text readability over any custom photo) */}
        {hasCustomBanner && (
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: '#000000',
              opacity: branding.bannerOverlayOpacity ?? 0.45,
            }}
          />
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            
            {/* Shop Identity: Logo & Name */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 via-pink-600 to-amber-600 flex items-center justify-center text-white shadow-md shadow-rose-200 shrink-0 overflow-hidden border border-white/30">
                {branding.logoUrl ? (
                  <img
                    src={branding.logoUrl}
                    alt="Boutique Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Scissors className="w-6 h-6 rotate-45 transform" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1
                    className={`text-xl sm:text-2xl font-bold tracking-tight font-serif-title transition-colors ${
                      hasCustomBanner ? 'text-white drop-shadow-sm' : 'text-neutral-900'
                    }`}
                  >
                    {shopProfile.shopName}
                  </h1>
                  <span
                    className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      hasCustomBanner
                        ? 'bg-black/40 text-rose-200 border border-white/20 backdrop-blur-xs'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    Daily Cash Register
                  </span>
                </div>
                <p
                  className={`text-xs flex items-center gap-2 mt-0.5 ${
                    hasCustomBanner ? 'text-white/80 drop-shadow-2xs' : 'text-neutral-500'
                  }`}
                >
                  <span>{shopProfile.tagline}</span>
                  <span className="opacity-40">•</span>
                  <span className="hidden md:inline font-medium">{shopProfile.phone}</span>
                </p>
              </div>
            </div>

            {/* Date Selector, Day Close, and User Info */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Date Switcher */}
              <div
                className={`flex items-center p-1 rounded-xl border ${
                  hasCustomBanner
                    ? 'bg-white/90 backdrop-blur-xs border-white/40 shadow-xs'
                    : 'bg-neutral-100/80 border-neutral-200'
                }`}
              >
                <button
                  type="button"
                  onClick={handlePrevDay}
                  className="p-1.5 hover:bg-white rounded-lg text-neutral-600 hover:text-neutral-900 transition-colors"
                  title="Previous Day"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 px-2 py-1">
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
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    hasCustomBanner
                      ? 'bg-white/90 text-neutral-800 hover:bg-white shadow-xs'
                      : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  Today
                </button>
              )}

              {/* Day Status Badge & Close Day trigger */}
              {currentSummary.isClosed ? (
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    Day Closed
                  </span>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => reopenDay(selectedDate)}
                      className={`text-xs underline px-1 ${
                        hasCustomBanner ? 'text-white hover:text-rose-200' : 'text-neutral-500 hover:text-neutral-800'
                      }`}
                      title="Reopen registers to edit entries"
                    >
                      Reopen
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onOpenDayClose}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                >
                  <LockOpen className="w-3.5 h-3.5" />
                  <span>Close Day</span>
                </button>
              )}

              {/* User Account / Login Button */}
              <button
                type="button"
                onClick={onOpenLogin}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                  hasCustomBanner
                    ? 'bg-white/90 text-neutral-800 border-white/50 hover:bg-white'
                    : 'bg-white text-neutral-800 border-neutral-200 hover:bg-neutral-50'
                }`}
                title="Account & OTP Authentication"
              >
                <span>{currentUser.role === 'owner' ? '👑' : '👤'}</span>
                <span className="hidden sm:inline">{currentUser.name.split(' ')[0]}</span>
                <span className="text-[10px] text-neutral-500 uppercase font-mono">
                  ({currentUser.role})
                </span>
              </button>

              {/* Settings button */}
              <button
                type="button"
                onClick={onOpenSettings}
                className={`p-2 rounded-xl border transition-colors ${
                  hasCustomBanner
                    ? 'bg-white/90 text-neutral-800 border-white/50 hover:bg-white'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 border-neutral-200'
                }`}
                title="Boutique Information Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 bg-white">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          {/* Register */}
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'register'
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-200'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Daily Register</span>
          </button>

          {/* Owner Payouts */}
          <button
            type="button"
            onClick={() => setActiveTab('owner')}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'owner'
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-200'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
            }`}
          >
            <Crown className="w-4 h-4 text-amber-400" />
            <span>Owner Drawings</span>
            {currentSummary.totalOwnerPayouts > 0 && (
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'owner' ? 'bg-rose-700 text-rose-100' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {shopProfile.currencySymbol}
                {currentSummary.totalOwnerPayouts.toLocaleString('en-IN')}
              </span>
            )}
          </button>

          {/* Reports */}
          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'reports'
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-200'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Reports & Flow</span>
          </button>

          {/* FEATURE 1: App Branding */}
          <button
            type="button"
            onClick={() => setActiveTab('branding')}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'branding'
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-200'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
            }`}
          >
            <Palette className="w-4 h-4 text-pink-500" />
            <span>App Branding</span>
          </button>

          {/* FEATURE 2: Backup & Restore */}
          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'backup'
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-200'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-500" />
            <span>Backup & Restore</span>
          </button>

          {/* FEATURE 4: User Management & Audit */}
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'users'
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-200'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
            }`}
          >
            <Users className="w-4 h-4 text-purple-500" />
            <span>User Management</span>
          </button>

          {/* Printable Slip */}
          <button
            type="button"
            onClick={() => setActiveTab('print')}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'print'
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-200'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Print Slip</span>
          </button>

          <div className="ml-auto hidden xl:flex items-center gap-2 text-xs text-neutral-500">
            <button
              type="button"
              onClick={onOpenOpeningBalance}
              className="text-neutral-600 hover:text-rose-700 font-medium underline px-1"
            >
              Adjust Float
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
