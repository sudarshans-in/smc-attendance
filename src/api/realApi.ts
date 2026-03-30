/**
 * realApi.ts
 *
 * Real backend API calls using axios.
 * Every function signature is identical to mockApi.ts — switching between
 * mock and real requires only changing USE_MOCK in src/constants/config.ts.
 *
 * Base URL: https://world-of-dc-election.onrender.com  (no /api prefix)
 * Backend:  Spring Boot 2.7 · MongoDB Atlas
 * Source:   https://github.com/Stormtrooper089/world_of_dc
 *
 * Known backend issue: WorkPhoto.imageUri is returned as http://localhost:8080/...
 * normalizeImageUri() replaces this with the real public URL until backend is fixed.
 */

import { AxiosError } from 'axios';
import client, { saveToken } from './client';
import { Config } from '../constants/config';
import { User, AttendanceRecord, WorkPhoto, LocationCoords, AdminWorkerSummary } from '../types';

// Workaround: backend constructs imageUri using localhost instead of the public domain.
// Replace localhost:8080 with the actual base URL so images load on real devices.
function normalizeImageUri(uri: string): string {
  return uri.replace(/^http:\/\/localhost:\d+/, Config.API_BASE_URL);
}

function normalizePhoto(photo: WorkPhoto): WorkPhoto {
  return { ...photo, imageUri: normalizeImageUri(photo.imageUri) };
}

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
  _imageUri: string   // photo captured for UX verification; not accepted by this endpoint
): Promise<AttendanceRecord> {
  const res = await client.post<AttendanceRecord>('/attendance/login', { userId, location });
  return res.data;
}

export async function markAttendanceLogout(
  userId: string,
  location: LocationCoords,
  _imageUri: string   // photo captured for UX verification; not accepted by this endpoint
): Promise<AttendanceRecord> {
  const res = await client.post<AttendanceRecord>('/attendance/logout', { userId, location });
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
  return normalizePhoto(res.data);
}

export async function getTodayPhotos(userId: string): Promise<WorkPhoto[]> {
  const res = await client.get<WorkPhoto[]>(`/photos/today/${userId}`);
  return res.data.map(normalizePhoto);
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
