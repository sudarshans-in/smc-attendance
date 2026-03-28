import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Config } from '../constants/config';

const TOKEN_KEY = 'safai_auth_token';

// ─── Token helpers — stored in hardware-backed encrypted storage ───────────
// expo-secure-store uses iOS Keychain and Android Keystore.
// Never use AsyncStorage for tokens — it is unencrypted plaintext.

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

// ─── Axios instance ────────────────────────────────────────────────────────

const client: AxiosInstance = axios.create({
  baseURL: Config.API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─── Request interceptor: attach Bearer token ──────────────────────────────

client.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ─── Response interceptor: normalize errors using HTTP status codes ────────

client.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (!error.response) {
      return Promise.reject(new Error('Network error. Please check your internet connection.'));
    }

    const status = error.response.status;
    const data = error.response.data as any;
    // Use server-provided message if available, never expose raw stack traces
    const message = data?.message ?? data?.detail ?? null;

    switch (true) {
      case status === 401:
        clearToken();
        return Promise.reject(new Error('Session expired. Please login again.'));
      case status === 403:
        return Promise.reject(new Error('You do not have permission to perform this action.'));
      case status === 404:
        // Let callers handle 404 via the AxiosError status, not a thrown Error
        return Promise.reject(error);
      case status === 409:
        return Promise.reject(new Error(message ?? 'This record already exists.'));
      case status >= 500:
        return Promise.reject(new Error('Server error. Please try again later.'));
      default:
        return Promise.reject(new Error(message ?? 'Something went wrong.'));
    }
  }
);

export default client;
