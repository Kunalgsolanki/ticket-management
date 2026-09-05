import { AuthResponse, User, UserRole, LoginResult } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function loginUser(email: string, password: string): Promise<LoginResult> {
  const res = await fetch(`${API_BASE}/user/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to login');
  return data;
}

export async function verifyOtp(email: string, otp: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/user/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to verify code');
  return data;
}

export async function resendOtp(email: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/user/resend-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to resend code');
  return data;
}

export async function signupUser(
  name: string,
  email: string,
  password: string,
  role: UserRole = 'USER'
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/user/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to sign up');
  return data;
}

export async function fetchAllUsers(): Promise<User[]> {
  const res = await fetch(`${API_BASE}/user`);
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

// ── Admin-only APIs (require JWT Authorization header) ────────────────────

export async function adminCreateUser(
  token: string,
  payload: { name: string; email: string; password: string; role: UserRole }
): Promise<User> {
  const res = await fetch(`${API_BASE}/user/admin/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create user');
  return data;
}

export async function updateUserRole(
  token: string,
  userId: number,
  role: UserRole
): Promise<User> {
  const res = await fetch(`${API_BASE}/user/${userId}/role`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update role');
  return data;
}

export async function adminDeleteUser(token: string, userId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/user/${userId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 204) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete user');
  }
}

// ── Role & Permission APIs ────────────────────────────────────────────────

export async function fetchRoles(token: string): Promise<import('./types').RoleDefinition[]> {
  const res = await fetch(`${API_BASE}/role`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch roles');
  return data;
}

export async function createRole(
  token: string,
  payload: { name: string; description?: string; permissions: string[] }
): Promise<import('./types').RoleDefinition> {
  const res = await fetch(`${API_BASE}/role`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create role');
  return data;
}

export async function updateRole(
  token: string,
  roleId: number,
  payload: { name?: string; description?: string; permissions?: string[] }
): Promise<import('./types').RoleDefinition> {
  const res = await fetch(`${API_BASE}/role/${roleId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update role');
  return data;
}

export async function deleteRole(token: string, roleId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/role/${roleId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 204) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete role');
  }
}

export async function updateUserPermissions(
  token: string,
  userId: number,
  permissions: string[]
): Promise<User> {
  const res = await fetch(`${API_BASE}/user/${userId}/permissions`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ permissions }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update user permissions');
  return data;
}

