import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Clock,
  Database,
  Lock,
  Layers,
  Sparkles,
  X,
} from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { useAuth } from '../context/AuthContext';

export const BackupRestoreView: React.FC = () => {
  const {
    backupMetadata,
    transactions,
    dayRecords,
    shopProfile,
    exportCompleteBackup,
    validateBackupFile,
    restoreCompleteBackup,
    rollbackSafetySnapshot,
  } = useTransactions();

  const { isOwner, currentUser } = useAuth();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Pre-restore confirmation preview modal state
  const [restoreModalOpen, setRestoreModalOpen] = useState<boolean>(false);
  const [pendingRestoreJson, setPendingRestoreJson] = useState<string>('');
  const [restorePreview, setRestorePreview] = useState<{
    exportedAt: string;
    transactionsCount: number;
    dayRecordsCount: number;
    shopName: string;
    hasLogo: boolean;
    hasBanner: boolean;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOwner) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-neutral-200 shadow-xs text-center max-w-2xl mx-auto my-12">
        <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 font-serif-title">Owner Privileges Required</h2>
        <p className="text-sm text-neutral-600 mt-2 max-w-md mx-auto">
          Business Backup and Data Restoration are strictly protected. Only the store owner (
          <strong>{shopProfile.ownerName}</strong>) can create backups or apply restorations.
        </p>
      </div>
    );
  }

  // Create & Download complete backup package
  const handleCreateBackup = async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');
      const jsonStr = await exportCompleteBackup();

      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
      const filename = `BlouseGallery_Backup_${dateStr}_${timeStr}.json`;

      // Check if Android Web Share is available
      if (
        typeof navigator !== 'undefined' &&
        navigator.canShare &&
        navigator.canShare({ files: [new File([blob], filename, { type: 'application/json' })] })
      ) {
        const fileObj = new File([blob], filename, { type: 'application/json' });
        await navigator.share({
          title: 'Blouse Gallery Data Backup',
          text: `Business database backup (${transactions.length} transactions, records and branding images).`,
          files: [fileObj],
        });
      } else {
        // Standard browser / Android download fallback
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      setSuccessMessage(
        `Backup created successfully (${(blob.size / 1024).toFixed(1)} KB, ${transactions.length} transactions). Stored on device.`
      );
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create backup.');
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger file selection for restore
  const handleSelectRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const validation = validateBackupFile(content);

      if (!validation.isValid) {
        setErrorMessage(
          `Backup File Validation Failed: ${validation.error || 'The file is corrupted or not a valid Blouse Gallery backup.'}`
        );
        return;
      }

      // Open confirmation preview modal
      setPendingRestoreJson(content);
      setRestorePreview(validation.preview || null);
      setRestoreModalOpen(true);
      setErrorMessage('');
    };

    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Confirm and execute atomic restore
  const handleConfirmRestore = async () => {
    try {
      setIsLoading(true);
      setRestoreModalOpen(false);

      const result = await restoreCompleteBackup(pendingRestoreJson);
      if (result.success) {
        setSuccessMessage(
          'Backup successfully restored! High-resolution branding images and business registers have been synced. An automatic safety snapshot was created in case you need to undo.'
        );
        setTimeout(() => setSuccessMessage(''), 6000);
      } else {
        setErrorMessage(`Restore failed: ${result.error}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to apply restore.');
    } finally {
      setIsLoading(false);
      setPendingRestoreJson('');
      setRestorePreview(null);
    }
  };

  // Rollback to pre-restore safety snapshot
  const handleRollback = async () => {
    if (
      window.confirm(
        'Are you sure you want to rollback to the safety snapshot taken right before your last restore? Current data will be reverted.'
      )
    ) {
      try {
        setIsLoading(true);
        const success = await rollbackSafetySnapshot();
        if (success) {
          setSuccessMessage('Successfully rolled back to pre-restore state!');
          setTimeout(() => setSuccessMessage(''), 5000);
        } else {
          setErrorMessage('No safety snapshot available to rollback.');
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to rollback.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Encrypted Data Protection</span>
          </div>
          <h2 className="text-xl font-bold text-neutral-900 font-serif-title">
            Business Backup & Atomic Restore
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Export complete verified records, customers, tailor accounts, transactions, and branding images.
          </p>
        </div>

        {backupMetadata.hasSafetySnapshot && (
          <button
            type="button"
            onClick={handleRollback}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl transition-colors shrink-0"
            title="Rollback to state before last restore"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
            <span>Undo / Rollback Restore</span>
          </button>
        )}
      </div>

      {/* Status Notifications */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Operations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Create Backup */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-neutral-900 text-sm">Create New Backup</h3>
                <span className="text-[11px] text-emerald-700 font-medium">Version 2.0 Comprehensive Bundle</span>
              </div>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Generates an offline JSON archive containing:
            </p>
            <ul className="text-xs text-neutral-500 mt-2 space-y-1 list-disc list-inside">
              <li>All sales receipts, custom blouse orders, and advance bookings</li>
              <li>Tailor piece-rate wages and boutique operating expenses</li>
              <li>Payments made to shop owner (both cash and online)</li>
              <li>Daily opening & closing balances and denomination counts</li>
              <li>High-res shop logo & banner images (packaged safely)</li>
              <li>Sanitized staff roles & permissions (no secrets or passwords)</li>
              <li>Complete immutable audit trail logs</li>
            </ul>
          </div>

          <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
            <div className="text-[11px] text-neutral-400">
              Total records: <strong>{transactions.length}</strong> txns
            </div>
            <button
              type="button"
              disabled={isLoading}
              onClick={handleCreateBackup}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-200 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>{isLoading ? 'Packaging...' : 'Export Backup File'}</span>
            </button>
          </div>
        </div>

        {/* Card 2: Restore Backup */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-neutral-900 text-sm">Restore from Backup</h3>
                <span className="text-[11px] text-blue-700 font-medium">Safe Verification & Rollback Protected</span>
              </div>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Select a previously saved <code>.json</code> backup file from your Android phone storage.
            </p>
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 mt-3 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-800">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Zero-Loss Guarantee</span>
              </div>
              <p className="text-[11px] text-amber-800/90">
                The app will validate file integrity, show you a confirmation preview, and automatically take an emergency snapshot of your current data before applying changes.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
            <span className="text-[11px] text-neutral-400">Supported: v1.0 and v2.0 JSON</span>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-200 transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Select File to Restore</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleSelectRestoreFile}
              className="hidden"
            />
          </div>
        </div>

      </div>

      {/* Last Backup Information Panel */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-neutral-400" />
          <span>Last Backup Metadata</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
            <span className="text-neutral-500 block mb-0.5">Last Created On:</span>
            <span className="font-bold text-neutral-800 font-mono">
              {backupMetadata.lastBackupDate
                ? new Date(backupMetadata.lastBackupDate).toLocaleString('en-IN')
                : 'Never in this session'}
            </span>
          </div>

          <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
            <span className="text-neutral-500 block mb-0.5">Backup Package Size:</span>
            <span className="font-bold text-neutral-800 font-mono">
              {backupMetadata.lastBackupSize
                ? `${(backupMetadata.lastBackupSize / 1024).toFixed(1)} KB`
                : '—'}
            </span>
          </div>

          <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
            <span className="text-neutral-500 block mb-0.5">Safety Snapshot Status:</span>
            <span
              className={`font-bold ${
                backupMetadata.hasSafetySnapshot ? 'text-emerald-700' : 'text-neutral-500'
              }`}
            >
              {backupMetadata.hasSafetySnapshot ? 'Active (Rollback Ready)' : 'None needed'}
            </span>
          </div>
        </div>
      </div>

      {/* PRE-RESTORE PREVIEW & CONFIRMATION MODAL */}
      {restoreModalOpen && restorePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-neutral-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/70">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-neutral-900 font-serif-title">
                  Confirm Data Restoration
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRestoreModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900">
                <strong>Warning:</strong> Restoring this backup will replace current ledger transactions with the ones inside the backup file. A safety copy of your current data will be saved automatically.
              </div>

              <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200 space-y-2">
                <div className="font-bold text-neutral-700 uppercase tracking-wider text-[10px]">
                  Backup File Inspection Details:
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-200">
                  <span className="text-neutral-500">Shop Name:</span>
                  <span className="font-bold text-neutral-900">{restorePreview.shopName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-200">
                  <span className="text-neutral-500">Backup Exported At:</span>
                  <span className="font-mono text-neutral-800">{restorePreview.exportedAt}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-200">
                  <span className="text-neutral-500">Transactions Count:</span>
                  <span className="font-bold font-mono text-emerald-700">
                    {restorePreview.transactionsCount} records
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-200">
                  <span className="text-neutral-500">Day Sheets Count:</span>
                  <span className="font-bold font-mono text-blue-700">
                    {restorePreview.dayRecordsCount} days
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-neutral-500">Branding Included:</span>
                  <span className="font-semibold text-neutral-800">
                    {restorePreview.hasLogo ? 'Logo (Yes) ' : 'No logo '} •{' '}
                    {restorePreview.hasBanner ? 'Banner (Yes)' : 'No banner'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRestoreModalOpen(false)}
                  className="px-4 py-2 text-neutral-600 font-bold hover:bg-neutral-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRestore}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md shadow-rose-200 transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Apply & Restore Data</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
