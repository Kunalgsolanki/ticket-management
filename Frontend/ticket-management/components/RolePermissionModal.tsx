'use client';

import React, { useState, useEffect } from 'react';
import { User, RoleDefinition, Permission } from '../lib/types';
import { SYSTEM_PERMISSIONS } from '../lib/permissions';
import {
  fetchRoles,
  createRole,
  updateRole,
  deleteRole,
  updateUserRole,
  updateUserPermissions,
} from '../lib/api';
import {
  X,
  Shield,
  Plus,
  Trash2,
  Check,
  Search,
  Users,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Lock,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface RolePermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  users: User[];
  token: string;
  onUsersUpdated: () => void;
}

export const RolePermissionModal: React.FC<RolePermissionModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  token,
  onUsersUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'roles' | 'users'>('roles');
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleDefinition | null>(null);
  const [editedPermissions, setEditedPermissions] = useState<Permission[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [isSavingRole, setIsSavingRole] = useState(false);

  // New role form
  const [showCreateRoleForm, setShowCreateRoleForm] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRolePermissions, setNewRolePermissions] = useState<Permission[]>([
    'ticket:create',
    'ticket:edit',
  ]);
  const [isCreatingRole, setIsCreatingRole] = useState(false);

  // User management tab
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserForPerms, setSelectedUserForPerms] = useState<User | null>(null);
  const [userCustomPerms, setUserCustomPerms] = useState<Permission[]>([]);
  const [isSavingUserPerms, setIsSavingUserPerms] = useState(false);

  // Feedback alerts
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const clearFeedback = () => {
    setError(null);
    setSuccess(null);
  };

  // Load roles on mount or when modal opens
  const loadRoles = async () => {
    if (!token) return;
    setIsLoadingRoles(true);
    try {
      const data = await fetchRoles(token);
      setRoles(data);
      if (data.length > 0) {
        // Keep current selected role or select first
        setSelectedRole((prev) => {
          if (prev) {
            const match = data.find((r) => r.id === prev.id);
            if (match) {
              setEditedPermissions(match.permissions);
              return match;
            }
          }
          setEditedPermissions(data[0].permissions);
          return data[0];
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load roles');
    } finally {
      setIsLoadingRoles(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      clearFeedback();
      loadRoles();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ── Handle Selecting a Role ──────────────────────────────────
  const handleSelectRole = (role: RoleDefinition) => {
    clearFeedback();
    setSelectedRole(role);
    setEditedPermissions([...role.permissions]);
  };

  // ── Toggle Permission for Selected Role ───────────────────────
  const handleTogglePermission = (permId: Permission) => {
    if (selectedRole?.name === 'ADMIN') {
      return; // ADMIN always retains full permissions
    }
    setEditedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  // ── Save Role Permissions ─────────────────────────────────────
  const handleSaveRolePermissions = async () => {
    if (!selectedRole) return;
    clearFeedback();
    setIsSavingRole(true);
    try {
      const updated = await updateRole(token, selectedRole.id, {
        permissions: editedPermissions,
      });
      setSuccess(`Permissions updated for role ${updated.name}`);
      await loadRoles();
      onUsersUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to update role permissions');
    } finally {
      setIsSavingRole(false);
    }
  };

  // ── Create New Role ───────────────────────────────────────────
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    clearFeedback();
    setIsCreatingRole(true);
    try {
      const created = await createRole(token, {
        name: newRoleName.trim(),
        description: newRoleDesc.trim(),
        permissions: newRolePermissions,
      });
      setSuccess(`Custom role "${created.name}" created successfully!`);
      setNewRoleName('');
      setNewRoleDesc('');
      setNewRolePermissions(['ticket:create', 'ticket:edit']);
      setShowCreateRoleForm(false);
      await loadRoles();
      handleSelectRole(created);
    } catch (err: any) {
      setError(err.message || 'Failed to create role');
    } finally {
      setIsCreatingRole(false);
    }
  };

  // ── Delete Role ───────────────────────────────────────────────
  const handleDeleteRole = async (roleId: number, roleName: string) => {
    if (!confirm(`Are you sure you want to delete role "${roleName}"? Users with this role will revert to USER.`)) {
      return;
    }
    clearFeedback();
    try {
      await deleteRole(token, roleId);
      setSuccess(`Role "${roleName}" deleted`);
      await loadRoles();
      onUsersUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to delete role');
    }
  };

  // ── Change User Role ──────────────────────────────────────────
  const handleUserRoleChange = async (userId: number, roleName: string) => {
    clearFeedback();
    try {
      await updateUserRole(token, userId, roleName);
      setSuccess(`User role updated to ${roleName}`);
      onUsersUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to update user role');
    }
  };

  // ── User Custom Permissions ───────────────────────────────────
  const handleOpenUserPerms = (user: User) => {
    setSelectedUserForPerms(user);
    const existingPerms = Array.isArray(user.permissions)
      ? (user.permissions as Permission[])
      : [];
    setUserCustomPerms([...existingPerms]);
  };

  const handleToggleUserPerm = (permId: Permission) => {
    setUserCustomPerms((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const handleSaveUserPerms = async () => {
    if (!selectedUserForPerms) return;
    clearFeedback();
    setIsSavingUserPerms(true);
    try {
      await updateUserPermissions(token, selectedUserForPerms.id, userCustomPerms);
      setSuccess(`Permissions updated for ${selectedUserForPerms.name}`);
      setSelectedUserForPerms(null);
      onUsersUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to update user permissions');
    } finally {
      setIsSavingUserPerms(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto backdrop-blur-md bg-slate-950/70 animate-fade-in">
      <div className="relative w-full max-w-5xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/25">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                Role & Permission Management
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  RBAC
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Create custom roles, define granular permissions, and manage user access rights
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6">
          <button
            onClick={() => {
              setActiveTab('roles');
              clearFeedback();
            }}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'roles'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            Roles & Permissions Matrix
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {roles.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('users');
              clearFeedback();
            }}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'users'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            User Role Assignments
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {users.length}
            </span>
          </button>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Tab 1: Roles & Permissions Matrix */}
        {activeTab === 'roles' && (
          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            {/* Top Action Row */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">System & Custom Roles</h3>
                <p className="text-xs text-slate-400">
                  Select a role on the left to review or edit its assigned permissions
                </p>
              </div>
              <button
                onClick={() => setShowCreateRoleForm(!showCreateRoleForm)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-violet-600/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                {showCreateRoleForm ? 'Cancel' : 'Create Custom Role'}
              </button>
            </div>

            {/* Create Role Form Card */}
            {showCreateRoleForm && (
              <form
                onSubmit={handleCreateRole}
                className="p-5 rounded-xl bg-slate-950/60 border border-violet-500/30 space-y-4 animate-fade-in shadow-inner"
              >
                <div className="flex items-center gap-2 text-violet-400 font-semibold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Define New Role</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Role Name (e.g. MANAGER, QA_TESTER, SUPPORT_LEAD) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. OPERATIONS_LEAD"
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 uppercase tracking-wider"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Role Description
                    </label>
                    <input
                      type="text"
                      placeholder="Brief description of role responsibilities"
                      value={newRoleDesc}
                      onChange={(e) => setNewRoleDesc(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                {/* Permissions for new role */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2">
                    Initial Permissions for this Role:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                    {SYSTEM_PERMISSIONS.map((p) => {
                      const checked = newRolePermissions.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all select-none ${
                            checked
                              ? 'bg-violet-500/10 border-violet-500/40 text-violet-200'
                              : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setNewRolePermissions((prev) =>
                                prev.includes(p.id)
                                  ? prev.filter((id) => id !== p.id)
                                  : [...prev, p.id]
                              );
                            }}
                            className="mt-0.5 rounded text-violet-600 focus:ring-violet-500 bg-slate-800 border-slate-700"
                          />
                          <div>
                            <span className="font-semibold block">{p.label}</span>
                            <span className="text-[10px] text-slate-400 line-clamp-1">{p.id}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateRoleForm(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingRole}
                    className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold disabled:opacity-50"
                  >
                    {isCreatingRole ? 'Creating...' : 'Save Role'}
                  </button>
                </div>
              </form>
            )}

            {/* Split View: Role Cards on Left, Permission Checklist on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Roles List */}
              <div className="lg:col-span-5 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
                  Roles ({roles.length})
                </div>

                {isLoadingRoles && roles.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">Loading roles...</div>
                ) : (
                  roles.map((role) => {
                    const isSelected = selectedRole?.id === role.id;
                    const isSystemCore = role.name === 'ADMIN' || role.name === 'USER';
                    const permCount = role.permissions.length;

                    return (
                      <div
                        key={role.id}
                        onClick={() => handleSelectRole(role)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between group ${
                          isSelected
                            ? 'bg-gradient-to-r from-violet-950/40 to-slate-900 border-violet-500/60 shadow-lg shadow-violet-500/10'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-100 group-hover:text-violet-300 transition-colors">
                                {role.name}
                              </span>
                              {role.name === 'ADMIN' && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  SUPERADMIN
                                </span>
                              )}
                              {!isSystemCore && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                  CUSTOM
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                              {role.description || 'No description provided'}
                            </p>
                          </div>

                          {!isSystemCore && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteRole(role.id, role.name);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Delete Role"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/80 text-xs">
                          <span className="text-slate-400">
                            Permissions:{' '}
                            <strong className="text-violet-400 font-semibold">
                              {permCount} / {SYSTEM_PERMISSIONS.length}
                            </strong>
                          </span>
                          <span className="flex items-center gap-1 text-slate-400 group-hover:text-violet-400 text-xs transition-colors">
                            Manage <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Right Column: Permission Matrix for Selected Role */}
              <div className="lg:col-span-7 bg-slate-950/50 rounded-xl border border-slate-800 p-5 space-y-5">
                {selectedRole ? (
                  <>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-100 text-base">
                            Permissions for <span className="text-violet-400">{selectedRole.name}</span>
                          </h4>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {selectedRole.name === 'ADMIN'
                            ? 'Admin role automatically includes all system permissions.'
                            : 'Check or uncheck permissions to grant or revoke access for this role.'}
                        </p>
                      </div>

                      {selectedRole.name !== 'ADMIN' && (
                        <button
                          onClick={handleSaveRolePermissions}
                          disabled={isSavingRole}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
                        >
                          <Check className="w-4 h-4" />
                          {isSavingRole ? 'Saving...' : 'Save Changes'}
                        </button>
                      )}
                    </div>

                    {/* Permissions list grouped by Category */}
                    {['Tickets', 'Administration'].map((cat) => {
                      const permsInCat = SYSTEM_PERMISSIONS.filter((p) => p.category === cat);
                      return (
                        <div key={cat} className="space-y-2">
                          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            {cat} Permissions
                          </div>

                          <div className="space-y-2">
                            {permsInCat.map((perm) => {
                              const isChecked =
                                selectedRole.name === 'ADMIN' ||
                                editedPermissions.includes(perm.id);

                              return (
                                <div
                                  key={perm.id}
                                  onClick={() => handleTogglePermission(perm.id)}
                                  className={`p-3 rounded-xl border transition-all flex items-center justify-between select-none ${
                                    selectedRole.name === 'ADMIN'
                                      ? 'bg-slate-900/40 border-slate-800/80 opacity-80 cursor-not-allowed'
                                      : isChecked
                                      ? 'bg-violet-950/20 border-violet-500/40 cursor-pointer hover:border-violet-500'
                                      : 'bg-slate-900/60 border-slate-800 cursor-pointer hover:border-slate-700 hover:bg-slate-900'
                                  }`}
                                >
                                  <div className="flex-1 pr-4">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`font-semibold text-sm ${
                                          isChecked ? 'text-slate-100' : 'text-slate-400'
                                        }`}
                                      >
                                        {perm.label}
                                      </span>
                                      <code className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                                        {perm.id}
                                      </code>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                      {perm.description}
                                    </p>
                                  </div>

                                  {/* Toggle Switch */}
                                  <div
                                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                                      isChecked ? 'bg-violet-600' : 'bg-slate-700'
                                    }`}
                                  >
                                    <div
                                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                                        isChecked ? 'translate-x-5' : 'translate-x-0'
                                      }`}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <div className="p-12 text-center text-slate-500 text-sm">
                    Select a role on the left to configure its permissions.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: User Role Assignments */}
        {activeTab === 'users' && (
          <div className="p-6 flex-1 overflow-y-auto space-y-5">
            {/* Search & Stats */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user by name, email, or role..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="text-xs text-slate-400">
                Showing <strong className="text-slate-200">{filteredUsers.length}</strong> of{' '}
                {users.length} registered users
              </div>
            </div>

            {/* User Custom Permissions Sub-Modal/Editor */}
            {selectedUserForPerms && (
              <div className="p-5 rounded-xl bg-violet-950/20 border border-violet-500/30 space-y-4 animate-fade-in shadow-inner">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-violet-400" />
                    <span className="font-bold text-slate-100 text-sm">
                      Custom Permission Overrides for: {selectedUserForPerms.name} ({selectedUserForPerms.email})
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedUserForPerms(null)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Close
                  </button>
                </div>

                <p className="text-xs text-slate-400">
                  Grant or revoke specific individual permissions regardless of role defaults:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                  {SYSTEM_PERMISSIONS.map((p) => {
                    const checked = userCustomPerms.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all select-none ${
                          checked
                            ? 'bg-violet-500/10 border-violet-500/40 text-violet-200'
                            : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleUserPerm(p.id)}
                          className="mt-0.5 rounded text-violet-600 focus:ring-violet-500 bg-slate-800 border-slate-700"
                        />
                        <div>
                          <span className="font-semibold block">{p.label}</span>
                          <span className="text-[10px] text-slate-400 line-clamp-1">{p.id}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUserForPerms(null)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveUserPerms}
                    disabled={isSavingUserPerms}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold disabled:opacity-50"
                  >
                    {isSavingUserPerms ? 'Saving...' : 'Save User Permissions'}
                  </button>
                </div>
              </div>
            )}

            {/* Users Table */}
            <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/50">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3">User</th>
                    <th className="px-5 py-3">Assigned Role</th>
                    <th className="px-5 py-3">Active Permissions</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-slate-500">
                        No users match the search filter.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const isCurrentUser = user.id === currentUser.id;
                      const activeRole = user.role || 'USER';
                      const userPerms = Array.isArray(user.permissions) ? user.permissions : [];

                      return (
                        <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-5 py-4">
                            <div className="font-semibold text-slate-100 flex items-center gap-2">
                              {user.name}
                              {isCurrentUser && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 font-medium">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400">{user.email}</div>
                          </td>

                          <td className="px-5 py-4">
                            <select
                              value={activeRole}
                              disabled={isCurrentUser}
                              onChange={(e) => handleUserRoleChange(user.id, e.target.value)}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold focus:outline-none focus:border-violet-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                              {roles.map((r) => (
                                <option key={r.id} value={r.name}>
                                  {r.name}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {userPerms.length === 0 ? (
                                <span className="text-xs text-slate-500 italic">
                                  Default role permissions
                                </span>
                              ) : (
                                userPerms.slice(0, 3).map((p) => (
                                  <span
                                    key={p}
                                    className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono"
                                  >
                                    {p}
                                  </span>
                                ))
                              )}
                              {userPerms.length > 3 && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 font-semibold">
                                  +{userPerms.length - 3} more
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => handleOpenUserPerms(user)}
                              className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-medium transition-colors"
                            >
                              Custom Permissions
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
