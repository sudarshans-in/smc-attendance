import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AttendanceRecord, WorkPhoto, LocationCoords, AdminWorkerSummary } from '../types';
import { Config } from '../constants/config';
import { SEED_WORKERS, SEED_ATTENDANCE_RECORDS, SEED_WORK_PHOTOS, getTodayKey } from './data';

const { STORAGE_KEYS, MOCK_DELAY_MIN, MOCK_DELAY_MAX } = Config;

const delay = () =>
  new Promise((res) =>
    setTimeout(res, Math.random() * (MOCK_DELAY_MAX - MOCK_DELAY_MIN) + MOCK_DELAY_MIN)
  );

const generateId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

// --- Helpers ---

async function getUsers(): Promise<User[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
  if (raw) return JSON.parse(raw);
  // First run: seed workers
  await AsyncStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(SEED_WORKERS));
  return SEED_WORKERS;
}

async function saveUsers(users: User[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(users));
}

async function getAttendanceRecords(): Promise<AttendanceRecord[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.ATTENDANCE_RECORDS);
  if (raw) return JSON.parse(raw);
  await AsyncStorage.setItem(STORAGE_KEYS.ATTENDANCE_RECORDS, JSON.stringify(SEED_ATTENDANCE_RECORDS));
  return SEED_ATTENDANCE_RECORDS;
}

async function saveAttendanceRecords(records: AttendanceRecord[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.ATTENDANCE_RECORDS, JSON.stringify(records));
}

async function getWorkPhotos(): Promise<WorkPhoto[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.WORK_PHOTOS);
  if (raw) return JSON.parse(raw);
  await AsyncStorage.setItem(STORAGE_KEYS.WORK_PHOTOS, JSON.stringify(SEED_WORK_PHOTOS));
  return SEED_WORK_PHOTOS;
}

async function saveWorkPhotos(photos: WorkPhoto[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.WORK_PHOTOS, JSON.stringify(photos));
}

// --- Auth API ---

export async function loginUser(mobile: string): Promise<User | null> {
  await delay();
  const users = await getUsers();
  return users.find((u) => u.mobile === mobile) ?? null;
}

export async function signupUser(data: {
  mobile: string;
  name: string;
  address: string;
}): Promise<User> {
  await delay();
  const users = await getUsers();
  const existing = users.find((u) => u.mobile === data.mobile);
  if (existing) return existing;

  const newUser: User = {
    id: generateId(),
    mobile: data.mobile,
    name: data.name.trim(),
    address: data.address.trim(),
    createdAt: new Date().toISOString(),
    isAdmin: false,
  };
  await saveUsers([...users, newUser]);
  return newUser;
}

// --- Attendance API ---

export async function markAttendanceLogin(
  userId: string,
  location: LocationCoords
): Promise<AttendanceRecord> {
  await delay();
  const today = getTodayKey();
  const records = await getAttendanceRecords();

  const existing = records.find((r) => r.userId === userId && r.date === today);
  if (existing) return existing;

  const newRecord: AttendanceRecord = {
    id: generateId(),
    userId,
    date: today,
    loginTime: new Date().toISOString(),
    logoutTime: null,
    loginLocation: location,
    logoutLocation: null,
  };
  await saveAttendanceRecords([...records, newRecord]);
  return newRecord;
}

export async function markAttendanceLogout(
  userId: string,
  location: LocationCoords
): Promise<AttendanceRecord> {
  await delay();
  const today = getTodayKey();
  const records = await getAttendanceRecords();

  const idx = records.findIndex((r) => r.userId === userId && r.date === today);
  if (idx === -1) {
    throw new Error('No attendance login found for today. Please mark attendance first.');
  }

  const existing = records[idx];
  if (existing.logoutTime) return existing;

  const updated: AttendanceRecord = {
    ...existing,
    logoutTime: new Date().toISOString(),
    logoutLocation: location,
  };
  const newRecords = [...records];
  newRecords[idx] = updated;
  await saveAttendanceRecords(newRecords);
  return updated;
}

export async function getTodayAttendance(userId: string): Promise<AttendanceRecord | null> {
  await delay();
  const today = getTodayKey();
  const records = await getAttendanceRecords();
  return records.find((r) => r.userId === userId && r.date === today) ?? null;
}

export async function getAttendanceHistory(userId: string): Promise<AttendanceRecord[]> {
  await delay();
  const records = await getAttendanceRecords();
  return records
    .filter((r) => r.userId === userId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

// --- Work Photos API ---

export async function uploadWorkPhoto(
  userId: string,
  imageUri: string,
  notes: string,
  location: LocationCoords
): Promise<WorkPhoto> {
  await delay();
  const photos = await getWorkPhotos();

  const newPhoto: WorkPhoto = {
    id: generateId(),
    userId,
    imageUri,
    notes: notes.trim(),
    location,
    uploadedAt: new Date().toISOString(),
  };
  await saveWorkPhotos([...photos, newPhoto]);
  return newPhoto;
}

export async function getTodayPhotos(userId: string): Promise<WorkPhoto[]> {
  await delay();
  const today = getTodayKey();
  const photos = await getWorkPhotos();
  return photos
    .filter((p) => p.userId === userId && p.uploadedAt.startsWith(today))
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

// --- Admin API ---

export async function getAllWorkers(): Promise<User[]> {
  await delay();
  return getUsers();
}

export async function getTodayAllAttendance(): Promise<AdminWorkerSummary[]> {
  await delay();
  const today = getTodayKey();
  const [users, records] = await Promise.all([getUsers(), getAttendanceRecords()]);
  return users.map((user) => ({
    user,
    todayAttendance: records.find((r) => r.userId === user.id && r.date === today) ?? null,
  }));
}
