import { User, AttendanceRecord, WorkPhoto } from '../types';

export const SEED_WORKERS: User[] = [
  {
    id: 'w001',
    mobile: '9876543210',
    name: 'Raju Das',
    address: 'Ward 12, Premtola, Silchar',
    createdAt: '2024-01-15T08:00:00.000Z',
    isAdmin: true,
  },
  {
    id: 'w002',
    mobile: '9876543211',
    name: 'Mina Begum',
    address: 'Tarapur Road, Silchar',
    createdAt: '2024-01-16T09:00:00.000Z',
    isAdmin: false,
  },
  {
    id: 'w003',
    mobile: '9876543212',
    name: 'Suresh Nath',
    address: 'Rangirkhari, Silchar',
    createdAt: '2024-01-17T10:00:00.000Z',
    isAdmin: false,
  },
  {
    id: 'w004',
    mobile: '9876543213',
    name: 'Anita Roy',
    address: 'Meherpur, Silchar',
    createdAt: '2024-01-18T08:30:00.000Z',
    isAdmin: false,
  },
  {
    id: 'w005',
    mobile: '9876543214',
    name: 'Kamal Singh',
    address: 'Udharbond, Silchar',
    createdAt: '2024-01-20T09:30:00.000Z',
    isAdmin: false,
  },
];

const TODAY = new Date().toISOString().split('T')[0];

const makeDate = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

const makeDateTime = (daysAgo: number, hour: number, minute: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

const silcharCoords = { latitude: 24.8333, longitude: 92.7789, accuracy: 12 };
const slightVariance = (base: number, range = 0.005) =>
  base + (Math.random() - 0.5) * range;

export const SEED_ATTENDANCE_RECORDS: AttendanceRecord[] = [
  // Worker w001 - last 7 days
  ...Array.from({ length: 7 }, (_, i) => ({
    id: `att_w001_${i}`,
    userId: 'w001',
    date: makeDate(i),
    loginTime: makeDateTime(i, 7, 30),
    logoutTime: i < 6 ? makeDateTime(i, 16, 15) : null,
    loginLocation: { ...silcharCoords, latitude: slightVariance(silcharCoords.latitude), longitude: slightVariance(silcharCoords.longitude) },
    logoutLocation: i < 6 ? { ...silcharCoords, latitude: slightVariance(silcharCoords.latitude), longitude: slightVariance(silcharCoords.longitude) } : null,
    loginPhotoUri: `https://picsum.photos/seed/att_w001_${i}/400/300`,
  })),
  // Worker w002 - last 5 days (absent 2 days)
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `att_w002_${i}`,
    userId: 'w002',
    date: makeDate(i),
    loginTime: makeDateTime(i, 8, 0),
    logoutTime: makeDateTime(i, 16, 30),
    loginLocation: silcharCoords,
    logoutLocation: silcharCoords,
    loginPhotoUri: `https://picsum.photos/seed/att_w002_${i}/400/300`,
  })),
  // Worker w003 - 4 of last 7 days
  ...[0, 1, 3, 5].map((i) => ({
    id: `att_w003_${i}`,
    userId: 'w003',
    date: makeDate(i),
    loginTime: makeDateTime(i, 7, 45),
    logoutTime: makeDateTime(i, 15, 45),
    loginLocation: silcharCoords,
    logoutLocation: silcharCoords,
    loginPhotoUri: `https://picsum.photos/seed/att_w003_${i}/400/300`,
  })),
];

export const SEED_WORK_PHOTOS: WorkPhoto[] = [
  {
    id: 'photo_001',
    userId: 'w001',
    imageUri: 'https://picsum.photos/seed/street1/400/300',
    notes: 'Street cleaning completed near market area',
    location: silcharCoords,
    uploadedAt: makeDateTime(0, 9, 15),
  },
  {
    id: 'photo_002',
    userId: 'w001',
    imageUri: 'https://picsum.photos/seed/drain1/400/300',
    notes: 'Drain cleared at Ward 12',
    location: silcharCoords,
    uploadedAt: makeDateTime(0, 11, 45),
  },
  {
    id: 'photo_003',
    userId: 'w002',
    imageUri: 'https://picsum.photos/seed/garbage1/400/300',
    notes: 'Garbage collection from Tarapur Road',
    location: silcharCoords,
    uploadedAt: makeDateTime(0, 10, 0),
  },
];

export const getTodayKey = () => new Date().toISOString().split('T')[0];
