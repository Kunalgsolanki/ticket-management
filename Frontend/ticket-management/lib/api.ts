import { AuthResponse, User } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/user/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to login');
  }

  return data;
}

export async function signupUser(
  name: string,
  email: string,
  password: string,
  role: 'USER' | 'ADMIN' = 'USER'
): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/user/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to sign up');
  }

  return data;
}

export async function fetchAllUsers(): Promise<User[]> {
  const res = await fetch(`${API_BASE}/user`);
  if (!res.ok) {
    throw new Error('Failed to fetch users');
  }
  return res.json();
}
