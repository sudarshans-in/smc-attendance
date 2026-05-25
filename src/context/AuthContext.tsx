import React, { createContext, useContext, useReducer, useEffect, useRef, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Keychain from 'react-native-keychain';
import { User } from '../types';
import { clearToken } from '../api/client';

const SESSION_SERVICE = 'safai_karmachari';
const SESSION_ACCOUNT = 'auth_user';

// Lock app after this many ms in background (30 seconds)
const LOCK_AFTER_MS = 30_000;

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isLocked: boolean;
}

type AuthAction =
  | { type: 'SET_USER'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_LOCKED'; payload: boolean };

interface AuthContextValue extends AuthState {
  login: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  unlock: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, isAuthenticated: true, isLoading: false, isLocked: false };
    case 'LOGOUT':
      return { ...state, user: null, isAuthenticated: false, isLoading: false, isLocked: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_LOCKED':
      return { ...state, isLocked: action.payload };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isLoading: true,
    isAuthenticated: false,
    isLocked: false,
  });

  const backgroundedAt = useRef<number | null>(null);
  const isAuthenticatedRef = useRef(false);
  isAuthenticatedRef.current = state.isAuthenticated;

  // Restore session from Keychain on startup
  useEffect(() => {
    (async () => {
      try {
        const credentials = await Keychain.getGenericPassword({ service: SESSION_SERVICE });
        if (credentials && credentials.password) {
          dispatch({ type: 'SET_USER', payload: JSON.parse(credentials.password) });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    })();
  }, []);

  // Lock app when it goes to background and resumes after LOCK_AFTER_MS
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        backgroundedAt.current = Date.now();
      } else if (nextState === 'active') {
        if (
          isAuthenticatedRef.current &&
          backgroundedAt.current !== null &&
          Date.now() - backgroundedAt.current > LOCK_AFTER_MS
        ) {
          dispatch({ type: 'SET_LOCKED', payload: true });
        }
        backgroundedAt.current = null;
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, []);

  const login = async (user: User) => {
    await Keychain.setGenericPassword(SESSION_ACCOUNT, JSON.stringify(user), {
      service: SESSION_SERVICE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    dispatch({ type: 'SET_USER', payload: user });
  };

  const logout = async () => {
    await Keychain.resetGenericPassword({ service: SESSION_SERVICE });
    await clearToken();
    dispatch({ type: 'LOGOUT' });
  };

  // Unlock using device biometric / PIN via Keychain
  const unlock = async (): Promise<boolean> => {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: SESSION_SERVICE,
        authenticationPrompt: {
          title: 'Verify your identity',
          subtitle: 'Use fingerprint, face, or PIN to unlock',
          cancel: 'Cancel',
        },
      });
      if (credentials && credentials.password) {
        dispatch({ type: 'SET_USER', payload: JSON.parse(credentials.password) });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, unlock }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
