export type UserRole = 'USER' | 'ADMIN' | string;

export type Permission =
  | 'ticket:create'
  | 'ticket:edit'
  | 'ticket:delete'
  | 'ticket:assign'
  | 'ticket:change_status'
  | 'ticket:view_all'
  | 'user:manage'
  | 'role:manage';

export interface PermissionMeta {
  id: Permission;
  label: string;
  description: string;
  category: 'Tickets' | 'Administration';
}

export interface RoleDefinition {
  id: number;
  name: string;
  description?: string;
  permissions: Permission[];
  createdAt?: string;
  updatedAt?: string;
}

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  baseRole?: string;
  customRole?: string | null;
  permissions?: Permission[] | string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdById: number;
  assignedToId: number | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: number;
    name: string;
    email: string;
  };
  assignedTo?: {
    id: number;
    name: string;
    email: string;
  } | null;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginOtpResponse {
  requireOtp: true;
  email: string;
  message: string;
}

export type LoginResult = AuthResponse | LoginOtpResponse;

