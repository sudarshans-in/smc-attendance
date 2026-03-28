export interface User {
  id: string;
  mobile: string;
  name: string;
  address: string;
  createdAt: string;
  isAdmin: boolean;
}

export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  loginTime: string | null;
  logoutTime: string | null;
  loginLocation: LocationCoords | null;
  logoutLocation: LocationCoords | null;
}

export interface WorkPhoto {
  id: string;
  userId: string;
  imageUri: string;
  notes: string;
  location: LocationCoords;
  uploadedAt: string;
}

export interface TodayStats {
  photosCount: number;
  attendance: AttendanceRecord | null;
}

export interface AdminWorkerSummary {
  user: User;
  todayAttendance: AttendanceRecord | null;
}

export type AttendanceStatus = 'not_started' | 'logged_in' | 'completed';

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: { mobile: string };
};

export type AppTabParamList = {
  Home: undefined;
  Upload: undefined;
  History: undefined;
  Admin: undefined;
};
