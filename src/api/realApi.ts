/**
 * realApi.ts
 *
 * Real backend API calls using axios.
 * Every function signature is identical to mockApi.ts — switching between
 * mock and real requires only changing USE_MOCK in src/constants/config.ts.
 *
 * Expected API base URL: Config.API_BASE_URL (e.g. https://api.silcharmunicipal.gov.in/safai)
 *
 * Auth flow:
 *   - loginUser / signupUser return a User + token from the backend.
 *   - The token is stored via saveToken() and attached to all subsequent
 *     requests automatically by the axios request interceptor in client.ts.
 */

import { AxiosError } from 'axios';
import client, { saveToken } from './client';
import { User, AttendanceRecord, WorkPhoto, LocationCoords, AdminWorkerSummary } from '../types';

function isNotFound(error: unknown): boolean {
  return (error as AxiosError)?.response?.status === 404;
}

// ─── Auth ──────────────────────────────────────────────────────────────────

export async function loginUser(mobile: string): Promise<User | null> {
  try {
    const res = await client.post<{ user: User; token: string }>('/auth/login', { mobile });
    await saveToken(res.data.token);
    return res.data.user;
  } catch (error: unknown) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

export async function signupUser(data: {
  mobile: string;
  name: string;
  address: string;
}): Promise<User> {
  const res = await client.post<{ user: User; token: string }>('/auth/signup', data);
  await saveToken(res.data.token);
  return res.data.user;
}

// ─── Attendance ────────────────────────────────────────────────────────────

export async function markAttendanceLogin(
  userId: string,
  location: LocationCoords,
  imageUri: string
): Promise<AttendanceRecord> {
  const formData = new FormData();
  formData.append('userId', userId);
  formData.append('latitude', String(location.latitude));
  formData.append('longitude', String(location.longitude));
  formData.append('accuracy', String(location.accuracy ?? 0));

  const filename = imageUri.split('/').pop() ?? 'checkin.jpg';
  const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
  formData.append('photo', {
    uri: imageUri,
    name: filename,
    type: ext === 'png' ? 'image/png' : 'image/jpeg',
  } as any);

  const res = await client.post<AttendanceRecord>('/attendance/login', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function markAttendanceLogout(
  userId: string,
  location: LocationCoords,
  imageUri: string
): Promise<AttendanceRecord> {
  const formData = new FormData();
  formData.append('userId', userId);
  formData.append('latitude', String(location.latitude));
  formData.append('longitude', String(location.longitude));
  formData.append('accuracy', String(location.accuracy ?? 0));

  const filename = imageUri.split('/').pop() ?? 'checkout.jpg';
  const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
  formData.append('photo', {
    uri: imageUri,
    name: filename,
    type: ext === 'png' ? 'image/png' : 'image/jpeg',
  } as any);

  const res = await client.post<AttendanceRecord>('/attendance/logout', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function getTodayAttendance(userId: string): Promise<AttendanceRecord | null> {
  try {
    const res = await client.get<AttendanceRecord>(`/attendance/today/${userId}`);
    return res.data;
  } catch (error: unknown) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

export async function getAttendanceHistory(userId: string): Promise<AttendanceRecord[]> {
  const res = await client.get<AttendanceRecord[]>(`/attendance/history/${userId}`);
  return res.data;
}

// ─── Work Photos ───────────────────────────────────────────────────────────

export async function uploadWorkPhoto(
  userId: string,
  imageUri: string,
  notes: string,
  location: LocationCoords
): Promise<WorkPhoto> {
  // Use multipart/form-data to send the image file
  const formData = new FormData();
  formData.append('userId', userId);
  formData.append('notes', notes);
  formData.append('latitude', String(location.latitude));
  formData.append('longitude', String(location.longitude));
  formData.append('accuracy', String(location.accuracy ?? 0));

  const filename = imageUri.split('/').pop() ?? 'photo.jpg';
  const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
  const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

  formData.append('photo', {
    uri: imageUri,
    name: filename,
    type: mimeType,
  } as any);

  const res = await client.post<WorkPhoto>('/photos/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function getTodayPhotos(userId: string): Promise<WorkPhoto[]> {
  const res = await client.get<WorkPhoto[]>(`/photos/today/${userId}`);
  return res.data;
}

// ─── Admin ─────────────────────────────────────────────────────────────────

export async function getAllWorkers(): Promise<User[]> {
  const res = await client.get<User[]>('/admin/workers');
  return res.data;
}

export async function getTodayAllAttendance(): Promise<AdminWorkerSummary[]> {
  const res = await client.get<AdminWorkerSummary[]>('/admin/attendance/today');
  return res.data;
}
