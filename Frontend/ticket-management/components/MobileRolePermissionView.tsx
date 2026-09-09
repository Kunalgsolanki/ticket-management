'use client';

import React from 'react';
import { Check, ChevronRight, KeyRound, Search, Shield, Users, X } from 'lucide-react';
import { Permission, RoleDefinition, User } from '../lib/types';
import { SYSTEM_PERMISSIONS } from '../lib/permissions';

type MobileRoleTab = 'roles' | 'users';

interface MobileRolePermissionViewProps {
  activeTab: MobileRoleTab;
  onTabChange: (tab: MobileRoleTab) => void;
  roles: RoleDefinition[];
  users: User[];
  selectedRole: RoleDefinition | null;
  editedPermissions: Permission[];
  onSelectRole: (role: RoleDefinition) => void;
  onTogglePermission: (permission: Permission) => void;
  onSaveRolePermissions: () => void;
  isSavingRole: boolean;
  userSearch: string;
  onUserSearchChange: (value: string) => void;
  filteredUsers: User[];
  currentUser: User;
  onUserRoleChange: (userId: number, roleName: string) => void;
  onOpenUserPerms: (user: User) => void;
  selectedUserForPerms: User | null;
  userCustomPerms: Permission[];
  onToggleUserPerm: (permission: Permission) => void;
  onSaveUserPerms: () => void;
  isSavingUserPerms: boolean;
  onCloseUserPerms: () => void;
  onClose: () => void;
  error: string | null;
  success: string | null;
}

export const MobileRolePermissionView: React.FC<MobileRolePermissionViewProps> = ({
  activeTab,
  onTabChange,
  roles,
  users,
  selectedRole,
  editedPermissions,
  onSelectRole,
  onTogglePermission,
  onSaveRolePermissions,
  isSavingRole,
  userSearch,
  onUserSearchChange,
  filteredUsers,
  currentUser,
  onUserRoleChange,
  onOpenUserPerms,
  selectedUserForPerms,
  userCustomPerms,
  onToggleUserPerm,
  onSaveUserPerms,
  isSavingUserPerms,
  onCloseUserPerms,
  onClose,
  error,
  success,
}) => (
  <div className="mobile-role-page md:hidden">
    <header className="mobile-role-header">
      <div className="mobile-role-heading">
        <div className="mobile-role-icon"><KeyRound className="h-5 w-5" /></div>
        <div className="min-w-0">
          <h2>Role & Permission Management</h2>
          <p>Granular access control</p>
        </div>
      </div>
      <button type="button" onClick={onClose} className="mobile-role-close" aria-label="Close role management">
        <X className="h-4 w-4" />
      </button>
    </header>

    <div className="mobile-role-tabs">
      <button type="button" className={activeTab === 'roles' ? 'active' : ''} onClick={() => onTabChange('roles')}>
        <Shield className="h-4 w-4" />
        <span>Roles & Permissions</span>
        <strong>{roles.length}</strong>
      </button>
      <button type="button" className={activeTab === 'users' ? 'active' : ''} onClick={() => onTabChange('users')}>
        <Users className="h-4 w-4" />
        <span>User Role Assignments</span>
        <strong>{users.length}</strong>
      </button>
    </div>

    {(error || success) && <div className={error ? 'mobile-role-alert error' : 'mobile-role-alert success'}>{error || success}</div>}

    {activeTab === 'roles' ? (
      <div className="mobile-role-content">
        <div className="mobile-role-section-title">
          <div>
            <span>Roles</span>
            <small>Select a role to manage permissions</small>
          </div>
        </div>
        <div className="mobile-role-list">
          {roles.map((role) => (
            <button
              type="button"
              key={role.id}
              onClick={() => onSelectRole(role)}
              className={selectedRole?.id === role.id ? 'mobile-role-card selected' : 'mobile-role-card'}
            >
              <span>
                <strong>{role.name}</strong>
                <small>{role.description || 'No description provided'}</small>
              </span>
              <span className="mobile-role-card-meta">{role.permissions.length} permissions <ChevronRight className="h-4 w-4" /></span>
            </button>
          ))}
        </div>

        {selectedRole && (
          <section className="mobile-permission-panel">
            <div className="mobile-permission-heading">
              <div>
                <span>{selectedRole.name} permissions</span>
                <small>{selectedRole.name === 'ADMIN' ? 'Admin includes all permissions.' : 'Tap a permission to toggle access.'}</small>
              </div>
              {selectedRole.name !== 'ADMIN' && (
                <button type="button" onClick={onSaveRolePermissions} disabled={isSavingRole} className="mobile-save-button">
                  <Check className="h-3.5 w-3.5" /> {isSavingRole ? 'Saving' : 'Save'}
                </button>
              )}
            </div>
            {SYSTEM_PERMISSIONS.map((permission) => {
              const checked = selectedRole.name === 'ADMIN' || editedPermissions.includes(permission.id);
              return (
                <button
                  type="button"
                  key={permission.id}
                  onClick={() => onTogglePermission(permission.id)}
                  className={checked ? 'mobile-permission-row checked' : 'mobile-permission-row'}
                  disabled={selectedRole.name === 'ADMIN'}
                >
                  <span><strong>{permission.label}</strong><small>{permission.description}</small></span>
                  <span className="mobile-permission-switch"><span /></span>
                </button>
              );
            })}
          </section>
        )}
      </div>
    ) : (
      <div className="mobile-role-content">
        <label className="mobile-role-search">
          <Search className="h-4 w-4" />
          <input value={userSearch} onChange={(event) => onUserSearchChange(event.target.value)} placeholder="Search users" />
        </label>
        {selectedUserForPerms && (
          <section className="mobile-user-permissions">
            <div className="mobile-permission-heading">
              <div><span>{selectedUserForPerms.name}</span><small>Custom permission overrides</small></div>
              <button type="button" onClick={onCloseUserPerms} aria-label="Close permissions"><X className="h-4 w-4" /></button>
            </div>
            {SYSTEM_PERMISSIONS.map((permission) => {
              const checked = userCustomPerms.includes(permission.id);
              return (
                <button type="button" key={permission.id} onClick={() => onToggleUserPerm(permission.id)} className={checked ? 'mobile-permission-row checked' : 'mobile-permission-row'}>
                  <span><strong>{permission.label}</strong><small>{permission.id}</small></span>
                  <span className="mobile-permission-switch"><span /></span>
                </button>
              );
            })}
            <button type="button" onClick={onSaveUserPerms} disabled={isSavingUserPerms} className="mobile-save-button wide">{isSavingUserPerms ? 'Saving...' : 'Save permissions'}</button>
          </section>
        )}
        <div className="mobile-user-list">
          {filteredUsers.map((user) => {
            const isCurrentUser = user.id === currentUser.id;
            return (
              <article key={user.id} className="mobile-user-card">
                <div className="min-w-0"><strong>{user.name} {isCurrentUser && <em>You</em>}</strong><small>{user.email}</small></div>
                <select value={user.role || 'USER'} disabled={isCurrentUser} onChange={(event) => onUserRoleChange(user.id, event.target.value)} aria-label={`Role for ${user.name}`}>
                  {roles.map((role) => <option key={role.id} value={role.name}>{role.name}</option>)}
                </select>
                <button type="button" onClick={() => onOpenUserPerms(user)} className="mobile-user-permission-button">Permissions</button>
              </article>
            );
          })}
        </div>
      </div>
    )}
  </div>
);
