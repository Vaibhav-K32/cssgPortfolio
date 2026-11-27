import { supabase } from './supabase';

// Base URL of the backend. VITE_API_URL is set in .env (local) or Vercel (deployed).
export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const CATEGORIES = ['food', 'education', 'environment', 'health', 'animals', 'community', 'other'] as const;

export type Opportunity = {
  id: number;
  organizer_id: string;
  title: string;
  description: string | null;
  category: string;
  location: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  spots_taken: number;
  created_at: string;
  organizer?: { full_name: string } | null;
};

export type Profile = {
  id: string;
  full_name: string;
  role: 'volunteer' | 'organizer';
  email: string;
};

export type MyRegistration = {
  id: number;
  created_at: string;
  opportunity: Opportunity;
};

export type Attendee = {
  id: number;
  created_at: string;
  volunteer: { full_name: string } | null;
};

export type NewOpportunity = {
  title: string;
  description: string;
  category: string;
  location: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
};

// One helper for every request: adds the login token and turns errors into exceptions.
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
  });

  if (res.status === 204) return undefined as T; // 204 = success with no body
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data as T;
}

export function getOpportunities(category: string, search: string) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (search.trim()) params.set('search', search.trim());
  const qs = params.toString();
  return request<Opportunity[]>(`/api/opportunities${qs ? `?${qs}` : ''}`);
}

export function getOpportunity(id: number) {
  return request<Opportunity>(`/api/opportunities/${id}`);
}

export function createOpportunity(body: NewOpportunity) {
  return request<Opportunity>('/api/opportunities', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function deleteOpportunity(id: number) {
  return request<void>(`/api/opportunities/${id}`, { method: 'DELETE' });
}

export function getAttendees(id: number) {
  return request<Attendee[]>(`/api/opportunities/${id}/registrations`);
}

export function register(id: number) {
  return request<{ ok: true }>(`/api/opportunities/${id}/register`, { method: 'POST' });
}

export function cancelRegistration(id: number) {
  return request<void>(`/api/opportunities/${id}/register`, { method: 'DELETE' });
}

export function getMe() {
  return request<Profile>('/api/me');
}

export function getMyRegistrations() {
  return request<MyRegistration[]>('/api/me/registrations');
}

export function getMyOpportunities() {
  return request<Opportunity[]>('/api/me/opportunities');
}

// "food" -> "Food"
export function label(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Shows times in the viewer's own time zone, e.g. "Sat, Dec 5, 2026, 9:00 AM – 12:00 PM"
export function formatWhen(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const day = s.toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
  const time = (d: Date) => d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${day}, ${time(s)} – ${time(e)}`;
}