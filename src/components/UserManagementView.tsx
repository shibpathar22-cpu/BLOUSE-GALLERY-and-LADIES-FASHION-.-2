import React, { useState, useMemo } from 'react';
import {
  Users,
  ShieldCheck,
  UserPlus,
  Lock,
  Check,
  X,
  Search,
  Filter,
  Phone,
  Clock,
  AlertCircle,
  Sparkles,
  KeyRound,
  FileCheck2,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTransactions } from '../context/TransactionContext';
import { StaffPermissions } from '../types';

export const UserManagementView: React.FC = () => {
  const {
    currentUser,
    users,
    isOwner,
    createStaff,
    updateStaff,
    toggleStaffStatus,
    switchUserForDemo,
  } = useAuth();

  const { auditLogs, shopProfile } = useTransactions();

  // Create Staff Form State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newStaffName, setNewStaffName] = useState<string>('');
  const [newStaffPhone, setNewStaffPhone] = useState<string>('');
  const [newPermissions, setNewPermissions] = useState<StaffPermissions>({
    canManageSales: true,
    canManageExpenses: false,
    canManageCashDrawer: false,
    canViewReports: true,
    canManageStock: true,
  });
  const [formError, setFormError] = useState<string>('');
  const [formSuccess, setFormSuccess] = useState<string>('');

  // Audit Log search & filter
  const [logFilterAction, setLogFilterAction] = useState<string>('all');
  const [logSearchQuery, setLogSearchQuery] = useState<string>('');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((entry) => {
      if (logFilterAction !== 'all' && entry.action !== logFilterAction) {
        return false;
      }
      if (logSearchQuery.trim()) {
        const query = logSearchQuery.toLowerCase();
        return (
          entry.userName.toLowerCase().includes(query) ||
          entry.action.toLowerCase().includes(query) ||
          entry.resource.toLowerCase().includes(query) ||
          entry.details.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [auditLogs, logFilterAction, logSearchQuery]);

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newStaffName.trim() || !newStaffPhone.trim()) {
      setFormError('Please enter both staff member name and phone number.');
      return;
    }

    try {
      createStaff({
        name: newStaffName,
        phone: newStaffPhone,
        permissions: newPermissions,
      });

      setFormSuccess(`Staff account for "${newStaffName}" created successfully!`);
      setNewStaffName('');
      setNewStaffPhone('');
      setShowAddModal(false);
      setTimeout(() => setFormSuccess(''), 4000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create staff account.');
    }
  };

  const handleTogglePermission = (userId: string, permKey: keyof StaffPermissions) => {
    if (!isOwner) return;
    const target = users.find((u) => u.id === userId);
    if (!target || target.role === 'owner') return;

    updateStaff(userId, {
      permissions: {
        ...target.permissions,
        [permKey]: !target.permissions[permKey],
      },
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Page Header */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 mb-1">
            <Users className="w-3.5 h-3.5 text-purple-600" />
            <span>Role-Based Access Control</span>
          </div>
          <h2 className="text-xl font-bold text-neutral-900 font-serif-title">
            User Management & Security Audit Log
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage owner & staff permissions, phone-number OTP authentication, and audit trails.
          </p>
        </div>

        {/* Current User Session & Quick Switcher */}
        <div className="flex items-center gap-3 bg-neutral-50 p-2 rounded-xl border border-neutral-200 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold">
              {currentUser.role === 'owner' ? '👑' : '👤'}
            </div>
            <div>
              <div className="font-bold text-neutral-800 flex items-center gap-1.5">
                <span>{currentUser.name}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold uppercase ${
                    currentUser.role === 'owner'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-blue-100 text-blue-900'
                  }`}
                >
                  {currentUser.role}
                </span>
              </div>
              <div className="text-[11px] text-neutral-400 font-mono">{currentUser.phone}</div>
            </div>
          </div>

          {/* Quick User Switcher for Testing Role Access */}
          <select
            value={currentUser.id}
            onChange={(e) => switchUserForDemo(e.target.value)}
            className="text-xs font-semibold px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg text-neutral-800"
            title="Switch authenticated profile to test permission limits"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                Switch to: {u.name} ({u.role})
              </option>
            ))}
          </select>
        </div>
      </div>

      {formSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{formSuccess}</span>
        </div>
      )}

      {/* User Accounts Roster */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50/50">
          <div>
            <h3 className="font-bold text-neutral-900 text-sm font-serif-title flex items-center gap-2">
              <span>Boutique Staff & Authorized Accounts</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-700 font-sans font-semibold">
                {users.length} accounts
              </span>
            </h3>
            <p className="text-xs text-neutral-500">
              Only the shop owner can create staff accounts and assign granular permissions.
            </p>
          </div>

          {isOwner && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add Staff Account</span>
            </button>
          )}
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/70 text-neutral-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Account / User</th>
                <th className="py-3 px-4">Phone (OTP Login)</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Permissions Matrix</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-medium">
              {users.map((u) => {
                const isItemOwner = u.role === 'owner';
                return (
                  <tr key={u.id} className="hover:bg-neutral-50/70 transition-colors">
                    
                    {/* Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-neutral-900 flex items-center gap-1.5">
                        <span>{u.name}</span>
                        {isItemOwner && <span className="text-amber-500">👑</span>}
                      </div>
                      <span className="text-[10px] text-neutral-400 font-mono">ID: {u.id}</span>
                    </td>

                    {/* Phone */}
                    <td className="py-3.5 px-4 font-mono text-neutral-600">
                      {u.phone}
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                          isItemOwner
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-blue-100 text-blue-900 border border-blue-200'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    {/* Granular Permissions Chips */}
                    <td className="py-3.5 px-4">
                      {isItemOwner ? (
                        <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Full Store Ownership Privileges
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {[
                            { key: 'canManageSales', label: 'Sales' },
                            { key: 'canManageExpenses', label: 'Expenses' },
                            { key: 'canManageCashDrawer', label: 'Cash Drawer' },
                            { key: 'canViewReports', label: 'Reports' },
                          ].map(({ key, label }) => {
                            const isGranted = Boolean(u.permissions[key as keyof StaffPermissions]);
                            return (
                              <button
                                key={key}
                                type="button"
                                disabled={!isOwner}
                                onClick={() => handleTogglePermission(u.id, key as keyof StaffPermissions)}
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors flex items-center gap-1 ${
                                  isGranted
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                                    : 'bg-neutral-100 text-neutral-400 border border-neutral-200 line-through'
                                } ${isOwner ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                                title={isOwner ? `Click to toggle ${label} permission` : ''}
                              >
                                {isGranted ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                                <span>{label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      {isItemOwner ? (
                        <span className="text-[10px] text-neutral-400 italic">Protected</span>
                      ) : isOwner ? (
                        <button
                          type="button"
                          onClick={() => toggleStaffStatus(u.id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                            u.isActive
                              ? 'text-rose-600 hover:bg-rose-50'
                              : 'text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {u.isActive ? 'Deactivate' : 'Reactivate'}
                        </button>
                      ) : (
                        <span className="text-[10px] text-neutral-400">View only</span>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-neutral-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-neutral-50/50">
          <div>
            <h3 className="font-bold text-neutral-900 text-sm font-serif-title flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-neutral-700" />
              <span>Immutable Security Audit Log</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-700 font-sans font-semibold">
                {filteredLogs.length} events
              </span>
            </h3>
            <p className="text-xs text-neutral-500">
              Tracks logins, transactions, database restores, branding changes, and permission adjustments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by Action */}
            <select
              value={logFilterAction}
              onChange={(e) => setLogFilterAction(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg text-neutral-700"
            >
              <option value="all">All Event Actions</option>
              <option value="TRANSACTION_CREATE">Transactions Created</option>
              <option value="TRANSACTION_DELETE">Transactions Deleted</option>
              <option value="DAY_CLOSE_TALLY">Day-End Register Closures</option>
              <option value="BRANDING_UPDATE">Branding Changes</option>
              <option value="BACKUP_CREATE">Backups Created</option>
              <option value="BACKUP_RESTORE">Backups Restored</option>
            </select>

            {/* Search Input */}
            <div className="relative w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
              <input
                type="text"
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                placeholder="Search log records..."
                className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Audit Log Table */}
        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-xs text-neutral-400">
            No audit log entries match your filter.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-neutral-50/90 backdrop-blur-xs">
                <tr className="border-b border-neutral-100 text-neutral-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">User</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Resource</th>
                  <th className="py-2.5 px-4">Audit Details</th>
                  <th className="py-2.5 px-4 text-center">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-2.5 px-4 whitespace-nowrap text-neutral-500 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-neutral-800">{log.userName}</span>
                      <span className="text-[10px] text-neutral-400 block uppercase font-mono">
                        ({log.userRole})
                      </span>
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-800 font-mono">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap text-neutral-600">
                      {log.resource}
                    </td>
                    <td className="py-2.5 px-4 text-neutral-600 text-[11px] max-w-sm truncate">
                      {log.details}
                    </td>
                    <td className="py-2.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.result === 'success'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {log.result.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE STAFF MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-neutral-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/70">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-neutral-900 font-serif-title">
                  Add New Boutique Staff
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-semibold">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
                  Staff Member Name *
                </label>
                <input
                  type="text"
                  required
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="e.g. Kavya S. (Senior Counter Staff)"
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
                  Phone Number (for OTP Login) *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    required
                    value={newStaffPhone}
                    onChange={(e) => setNewStaffPhone(e.target.value)}
                    placeholder="+91 98765 00000"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Permissions Checklist */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-2">
                  Granular Permissions Allowed
                </label>
                <div className="space-y-2 bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                  {[
                    {
                      key: 'canManageSales',
                      title: 'Manage Sales & Receipts',
                      desc: 'Record customer payments, custom orders, advances',
                    },
                    {
                      key: 'canManageExpenses',
                      title: 'Manage Shop Expenses',
                      desc: 'Record tailor wages and raw material purchases',
                    },
                    {
                      key: 'canManageCashDrawer',
                      title: 'Cash Drawer Operations',
                      desc: 'Adjust opening float and close day register count',
                    },
                    {
                      key: 'canViewReports',
                      title: 'View Financial Reports',
                      desc: 'Access day summaries and export CSV spreadsheets',
                    },
                  ].map(({ key, title, desc }) => (
                    <label key={key} className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(newPermissions[key as keyof StaffPermissions])}
                        onChange={(e) =>
                          setNewPermissions((prev) => ({
                            ...prev,
                            [key]: e.target.checked,
                          }))
                        }
                        className="mt-0.5 rounded accent-purple-600 w-4 h-4 cursor-pointer"
                      />
                      <div>
                        <span className="font-bold text-neutral-800">{title}</span>
                        <span className="text-[10px] text-neutral-400 block">{desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-bold text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl shadow-md shadow-purple-200 transition-colors flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Staff Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
