import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import * as Keychain from 'react-native-keychain';
import { User } from '../types';
import { clearToken } from '../api/client';

// User session stored in hardware-backed encrypted storage (Android Keystore)
// Never use AsyncStorage for session data — it is unencrypted plaintext.
const SESSION_SERVICE = 'safai_karmachari';
const SESSION_ACCOUNT = 'auth_user';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: 'SET_USER'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean };

interface AuthContextValue extends AuthState {
  login: (user: User) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, isAuthenticated: true, isLoading: false };
    case 'LOGOUT':
      return { ...state, user: null, isAuthenticated: false, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

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

  const login = async (user: User) => {
    await Keychain.setGenericPassword(SESSION_ACCOUNT, JSON.stringify(user), { service: SESSION_SERVICE });
    dispatch({ type: 'SET_USER', payload: user });
  };

  const logout = async () => {
    await Keychain.resetGenericPassword({ service: SESSION_SERVICE });
    await clearToken(); // also wipe the JWT from secure storage
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
