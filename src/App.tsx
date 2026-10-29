/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { TransactionProvider } from './context/TransactionContext';
import { Header, NavTab } from './components/Header';
import { BalanceSummaryCards } from './components/BalanceSummaryCards';
import { TransactionList } from './components/TransactionList';
import { OwnerPayoutsView } from './components/OwnerPayoutsView';
import { ReportsView } from './components/ReportsView';
import { BrandingSettingsView } from './components/BrandingSettingsView';
import { BackupRestoreView } from './components/BackupRestoreView';
import { UserManagementView } from './components/UserManagementView';
import { PrintDaySheet } from './components/PrintDaySheet';
import { TransactionModal } from './components/TransactionModal';
import { OpeningBalanceModal } from './components/OpeningBalanceModal';
import { DayCloseModal } from './components/DayCloseModal';
import { SettingsModal } from './components/SettingsModal';
import { LoginModal } from './components/LoginModal';
import { Transaction, TransactionType, PaymentMode } from './types';

function MainApp() {
  const [activeTab, setActiveTab] = useState<NavTab>('register');

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalType, setTxModalType] = useState<TransactionType>('receipt');
  const [txModalMode, setTxModalMode] = useState<PaymentMode>('cash');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [isOpeningModalOpen, setIsOpeningModalOpen] = useState(false);
  const [isDayCloseModalOpen, setIsDayCloseModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleOpenCreate = (type: TransactionType, mode: PaymentMode) => {
    setEditingTransaction(null);
    setTxModalType(type);
    setTxModalMode(mode);
    setIsTxModalOpen(true);
  };

  const handleOpenEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setTxModalType(tx.type);
    setTxModalMode(tx.mode);
    setIsTxModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf7f5] text-neutral-900">
      {/* Top Application Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenDayClose={() => setIsDayCloseModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenOpeningBalance={() => setIsOpeningModalOpen(true)}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'register' && (
          <div>
            {/* 3 Prominent Cash vs Online Balance Cards */}
            <BalanceSummaryCards
              onOpenOpeningBalance={() => setIsOpeningModalOpen(true)}
              onOpenDayClose={() => setIsDayCloseModalOpen(true)}
            />

            {/* Daily Ledger Table and Operations */}
            <TransactionList
              onOpenCreate={handleOpenCreate}
              onEdit={handleOpenEdit}
            />
          </div>
        )}

        {activeTab === 'owner' && (
          <OwnerPayoutsView
            onOpenCreate={handleOpenCreate}
            onEdit={handleOpenEdit}
          />
        )}

        {activeTab === 'reports' && <ReportsView />}

        {/* FEATURE 1: App Branding */}
        {activeTab === 'branding' && <BrandingSettingsView />}

        {/* FEATURE 2: Backup & Restore */}
        {activeTab === 'backup' && <BackupRestoreView />}

        {/* FEATURE 3 & 4: User Management, Roles & Audit Logs */}
        {activeTab === 'users' && <UserManagementView />}

        {activeTab === 'print' && <PrintDaySheet />}
      </main>

      {/* Footer */}
      <footer className="no-print border-t border-neutral-200/80 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-neutral-500">
          <div>
            <strong className="text-neutral-800 font-serif-title">
              Blouse Gallery & Ladies Fashion
            </strong>{' '}
            • Specialized Daily Cash Register & Accounting Tally
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] bg-neutral-100 px-2 py-0.5 rounded text-neutral-600">
              v1.2.0 • Android & Web
            </span>
            <span>Cash & Online tracked independently</span>
          </div>
        </div>
      </footer>

      {/* Interactive Dialogs & Modals */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTransaction(null);
        }}
        initialType={txModalType}
        initialMode={txModalMode}
        editTransaction={editingTransaction}
      />

      <OpeningBalanceModal
        isOpen={isOpeningModalOpen}
        onClose={() => setIsOpeningModalOpen(false)}
      />

      <DayCloseModal
        isOpen={isDayCloseModalOpen}
        onClose={() => setIsDayCloseModalOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <TransactionProvider>
        <MainApp />
      </TransactionProvider>
    </AuthProvider>
  );
}
