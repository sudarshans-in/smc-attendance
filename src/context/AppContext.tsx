import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { AttendanceRecord, WorkPhoto } from '../types';

interface AppState {
  todayAttendance: AttendanceRecord | null;
  todayPhotos: WorkPhoto[];
  attendanceHistory: AttendanceRecord[];
  isRefreshing: boolean;
}

type AppAction =
  | { type: 'SET_TODAY_ATTENDANCE'; payload: AttendanceRecord | null }
  | { type: 'ADD_PHOTO'; payload: WorkPhoto }
  | { type: 'SET_TODAY_PHOTOS'; payload: WorkPhoto[] }
  | { type: 'SET_HISTORY'; payload: AttendanceRecord[] }
  | { type: 'SET_REFRESHING'; payload: boolean };

interface AppContextValue extends AppState {
  setTodayAttendance: (record: AttendanceRecord | null) => void;
  addPhoto: (photo: WorkPhoto) => void;
  setTodayPhotos: (photos: WorkPhoto[]) => void;
  setAttendanceHistory: (history: AttendanceRecord[]) => void;
  setRefreshing: (v: boolean) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_TODAY_ATTENDANCE':
      return { ...state, todayAttendance: action.payload };
    case 'ADD_PHOTO':
      return { ...state, todayPhotos: [action.payload, ...state.todayPhotos] };
    case 'SET_TODAY_PHOTOS':
      return { ...state, todayPhotos: action.payload };
    case 'SET_HISTORY':
      return { ...state, attendanceHistory: action.payload };
    case 'SET_REFRESHING':
      return { ...state, isRefreshing: action.payload };
    default:
      return state;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, {
    todayAttendance: null,
    todayPhotos: [],
    attendanceHistory: [],
    isRefreshing: false,
  });

  const value: AppContextValue = {
    ...state,
    setTodayAttendance: (r) => dispatch({ type: 'SET_TODAY_ATTENDANCE', payload: r }),
    addPhoto: (p) => dispatch({ type: 'ADD_PHOTO', payload: p }),
    setTodayPhotos: (photos) => dispatch({ type: 'SET_TODAY_PHOTOS', payload: photos }),
    setAttendanceHistory: (h) => dispatch({ type: 'SET_HISTORY', payload: h }),
    setRefreshing: (v) => dispatch({ type: 'SET_REFRESHING', payload: v }),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
