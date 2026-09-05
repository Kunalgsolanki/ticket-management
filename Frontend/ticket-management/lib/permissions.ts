import { User, Permission, PermissionMeta } from './types';

export const SYSTEM_PERMISSIONS: PermissionMeta[] = [
  {
    id: 'ticket:create',
    label: 'Create Tickets',
    description: 'Create new support and issue tickets',
    category: 'Tickets',
  },
  {
    id: 'ticket:edit',
    label: 'Edit Tickets',
    description: 'Update ticket title, description, and priority',
    category: 'Tickets',
  },
  {
    id: 'ticket:delete',
    label: 'Delete Tickets',
    description: 'Permanently remove tickets from the system',
    category: 'Tickets',
  },
  {
    id: 'ticket:assign',
    label: 'Assign Tickets',
    description: 'Assign or reassign tickets to other users',
    category: 'Tickets',
  },
  {
    id: 'ticket:change_status',
    label: 'Change Status',
    description: 'Move tickets through lifecycle (Open, In Progress, Resolved, Closed)',
    category: 'Tickets',
  },
  {
    id: 'ticket:view_all',
    label: 'View All Tickets',
    description: 'Access all organization tickets rather than just assigned/created ones',
    category: 'Tickets',
  },
  {
    id: 'user:manage',
    label: 'Manage Users',
    description: 'Create new users, modify accounts, and delete team members',
    category: 'Administration',
  },
  {
    id: 'role:manage',
    label: 'Manage Roles & Permissions',
    description: 'Create roles, configure role permissions, and assign user permissions',
    category: 'Administration',
  },
];

export function hasPermission(user: User | null | undefined, permission: Permission): boolean {
  if (!user) return false;

  // System admin role always has all permissions
  if (user.role === 'ADMIN' || user.baseRole === 'ADMIN' || user.customRole === 'ADMIN') {
    return true;
  }

  // Check user permissions array
  if (Array.isArray(user.permissions)) {
    const list = user.permissions as string[];
    return list.includes(permission) || list.includes('*');
  }

  return false;
}

export function getPermissionMeta(id: Permission): PermissionMeta | undefined {
  return SYSTEM_PERMISSIONS.find((p) => p.id === id);
}
