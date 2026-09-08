'use client';

import React, { useState, useEffect } from 'react';
import { User, UserRole, Ticket, RoleDefinition } from '../lib/types';
import { adminCreateUser, updateUserRole, adminDeleteUser, fetchRoles } from '../lib/api';
import {
  X,
  UserPlus,
  Shield,
  User as UserIcon,
  Trash2,
  Mail,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Crown,
} from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  embedded?: boolean;
  onClose: () => void;
  currentUser: User;
  users: User[];
  tickets: Ticket[];
  token: string;
  onUsersUpdated: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  embedded = false,
  onClose,
  currentUser,
  users,
  tickets,
  token,
  onUsersUpdated,
}) => {
  // Create user form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState<UserRole>('USER');
  const [isCreating, setIsCreating] = useState(false);

  // Delete confirmation
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<RoleDefinition[]>([]);

  // Feedback
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && token) {
      fetchRoles(token)
        .then((roles) => setAvailableRoles(roles))
        .catch((err) => console.error('Failed to load roles in UserManagementModal:', err));
    }
  }, [isOpen, token]);

  if (!isOpen) return null;

  const clearFeedback = () => { setError(null); setSuccess(null); };

  const resetCreateForm = () => {
    setCreateName('');
    setCreateEmail('');
    setCreatePassword('');
    setCreateRole('USER');
    setShowCreateForm(false);
  };

  // ── CREATE USER ───────────────────────────────────────────────
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    setIsCreating(true);
    try {
      await adminCreateUser(token, {
        name: createName,
        email: createEmail,
        password: createPassword,
        role: createRole,
      });
      setSuccess(`User "${createName}" created as ${createRole}`);
      resetCreateForm();
      onUsersUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

  // ── CHANGE ROLE ───────────────────────────────────────────────
  const handleRoleChange = async (userId: number, newRole: UserRole) => {
    clearFeedback();
    try {
      await updateUserRole(token, userId, newRole);
      setSuccess(`Role updated to ${newRole}`);
      onUsersUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to update role');
    }
  };

  // ── DELETE USER ───────────────────────────────────────────────
  const handleDeleteUser = async (userId: number) => {
    clearFeedback();
    setIsDeleting(true);
    try {
      await adminDeleteUser(token, userId);
      setSuccess('User deleted successfully');
      setDeletingUserId(null);
      onUsersUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  const getUserStats = (userId: number) => ({
    created: tickets.filter((t) => t.createdById === userId).length,
    assigned: tickets.filter((t) => t.assignedToId === userId).length,
  });

  return (
    <div className={embedded ? 'animate-fadeIn' : 'fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm'}>
      <div className={`w-full ${embedded ? 'max-w-5xl' : 'max-w-3xl'} max-h-[85vh] flex flex-col rounded-xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden`}>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Crown className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">User Management</h2>
              <p className="text-xs text-slate-400">{users.length} team members • Permission-based access</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!showCreateForm && (
              <button
                onClick={() => { clearFeedback(); setShowCreateForm(true); }}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Add User
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 text-xs text-rose-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-rose-400 hover:text-rose-200"><X className="h-3 w-3" /></button>
          </div>
        )}
        {success && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{success}</span>
            <button onClick={() => setSuccess(null)} className="ml-auto text-emerald-400 hover:text-emerald-200"><X className="h-3 w-3" /></button>
          </div>
        )}

        {/* Create User Form (collapsible) */}
        {showCreateForm && (
          <form onSubmit={handleCreateUser} className="mx-6 mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-white flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-indigo-400" />
                Create New User
              </span>
              <button type="button" onClick={resetCreateForm} className="text-slate-500 hover:text-white"><X className="h-4 w-4" /></button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text" required value={createName} onChange={(e) => setCreateName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="email" required value={createEmail} onChange={(e) => setCreateEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="password" required minLength={4} value={createPassword} onChange={(e) => setCreatePassword(e.target.value)}
                    placeholder="••••••"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Role</label>
                <select
                  value={createRole} onChange={(e) => setCreateRole(e.target.value as UserRole)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  {availableRoles.length > 0 ? (
                    availableRoles.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name === 'ADMIN' ? '🛡️ Admin' : r.name === 'USER' ? '👤 User' : `⭐ ${r.name}`}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="USER">👤 User</option>
                      <option value="ADMIN">🛡️ Admin</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={resetCreateForm}
                className="rounded-lg border border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
              >Cancel</button>
              <button type="submit" disabled={isCreating}
                className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
              >{isCreating ? 'Creating...' : 'Create User'}</button>
            </div>
          </form>
        )}

        {/* Users Table */}
        <div className="flex-1 overflow-auto px-6 py-4">
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/50">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-950/80 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3 text-center">Created</th>
                  <th className="px-4 py-3 text-center">Assigned</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => {
                  const stats = getUserStats(u.id);
                  const isSelf = u.id === currentUser.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Name + Email */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-white text-xs font-bold">
                            {u.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-white text-sm leading-none">
                              {u.name}
                              {isSelf && <span className="ml-1.5 text-[9px] text-indigo-400 font-medium">(You)</span>}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role Dropdown */}
                      <td className="px-4 py-3">
                        {isSelf ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                            <Shield className="h-3 w-3" />
                            {u.role}
                          </span>
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                            className="rounded-lg border border-slate-700 px-2 py-1 text-[11px] font-semibold bg-slate-950 text-slate-200 focus:outline-none cursor-pointer"
                          >
                            {availableRoles.length > 0 ? (
                              availableRoles.map((r) => (
                                <option key={r.id} value={r.name}>
                                  {r.name === 'ADMIN' ? '🛡️ Admin' : r.name === 'USER' ? '👤 User' : `⭐ ${r.name}`}
                                </option>
                              ))
                            ) : (
                              <>
                                <option value="USER">👤 User</option>
                                <option value="ADMIN">🛡️ Admin</option>
                              </>
                            )}
                          </select>
                        )}
                      </td>

                      {/* Stats */}
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-white">{stats.created}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-white">{stats.assigned}</span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        {isSelf ? (
                          <span className="text-[10px] text-slate-600">—</span>
                        ) : (
                          <button
                            onClick={() => setDeletingUserId(u.id)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                            title="Delete user"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        {deletingUserId !== null && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-4">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-white">Delete User #{deletingUserId}?</h3>
              <p className="mt-1.5 text-xs text-slate-400">
                This will permanently remove the user. Tickets created or assigned to them will remain in the system.
              </p>
              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setDeletingUserId(null)}
                  className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                >Cancel</button>
                <button
                  onClick={() => handleDeleteUser(deletingUserId)}
                  disabled={isDeleting}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-50 shadow-lg shadow-rose-600/25 transition-colors"
                >{isDeleting ? 'Deleting...' : 'Confirm Delete'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
