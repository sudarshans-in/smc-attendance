# SMC Karmachari — Architecture Document

**Version:** 1.0.0
**Last Updated:** March 2026

---

## 1. Technology Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Framework | Expo (managed workflow) | ~54.0.0 | No native code required |
| Language | TypeScript | ^5.3.0 | Strict mode enabled |
| UI Library | React Native Paper (MD3) | ^5.12.3 | Material Design 3, accessible |
| Navigation | React Navigation | v6 | Stack + Bottom Tabs |
| HTTP Client | Axios | ^1.7.2 | Interceptors, JWT auth |
| State Management | React Context + useReducer | — | No external library |
| Local Storage | AsyncStorage | 2.2.0 | Session + mock data persistence |
| Location | expo-location | ~19.0.8 | GPS for attendance/photos |
| Camera/Gallery | expo-image-picker | ~17.0.10 | Work photo capture |
| Icons | @expo/vector-icons | ^15.0.3 | MaterialCommunityIcons |
| Runtime | React Native | 0.81.5 | |
| Min Android | API 24 (Android 7.0) | | 2016 onwards |
| Min iOS | 15.1 | | |

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     SMC Karmachari App                      │
│                    (React Native / Expo)                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌──────────────┐        ┌──────────────────────────────┐ │
│   │  Auth Layer  │        │        App Layer             │ │
│   │              │        │                              │ │
│   │  LoginScreen │        │  HomeScreen   UploadScreen  │ │
│   │ SignupScreen  │        │  HistoryScreen AdminScreen  │ │
│   └──────┬───────┘        └─────────────┬────────────────┘ │
│          │                              │                   │
│   ┌──────▼──────────────────────────────▼────────────────┐ │
│   │               Context Layer                          │ │
│   │   AuthContext (user, isAdmin, login, logout)         │ │
│   │   AppContext  (attendance, photos, history)          │ │
│   └──────────────────────────┬───────────────────────────┘ │
│                              │                              │
│   ┌──────────────────────────▼───────────────────────────┐ │
│   │                  API Switch Layer                    │ │
│   │            src/api/index.ts                          │ │
│   │         USE_MOCK ? mockApi : realApi                 │ │
│   └──────────┬────────────────────────┬──────────────────┘ │
│              │                        │                     │
│   ┌──────────▼──────┐      ┌──────────▼──────────────────┐ │
│   │    Mock API     │      │        Real API              │ │
│   │  (AsyncStorage) │      │  (Axios → REST Backend)      │ │
│   │   mockApi.ts    │      │  realApi.ts + client.ts      │ │
│   └─────────────────┘      └─────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────▼──────────────────┐
                    │     Backend (Separate Service)    │
                    │  FastAPI / REST                   │
                    │  https://api.silcharmunicipal...  │
                    └──────────────────────────────────┘
```

---

## 3. Navigation Architecture

```
RootNavigator (Stack)
│
├── [isLoading = true]
│       └── LoadingOverlay  ← reads AsyncStorage on cold start
│
├── [isAuthenticated = false]
│       └── AuthNavigator (Stack, no header)
│               ├── LoginScreen   ← initial route
│               └── SignupScreen  ← receives { mobile } param
│
└── [isAuthenticated = true]
        └── AppProvider (wraps AppNavigator)
                └── AppNavigator (Bottom Tabs)
                        ├── Tab: Home      → HomeScreen
                        ├── Tab: Upload    → UploadScreen
                        ├── Tab: History   → HistoryScreen
                        └── Tab: Admin     → AdminScreen  [isAdmin only]
```

---

## 4. State Management

### 4.1 AuthContext

Manages authentication lifecycle. Persists to AsyncStorage key `@safai_auth_user`.

```
AuthState
├── user: User | null
├── isLoading: boolean        ← true during cold-start AsyncStorage read
└── isAuthenticated: boolean

AuthActions
├── SET_USER  → set user + isAuthenticated=true + isLoading=false
├── LOGOUT    → clear user + isAuthenticated=false
└── SET_LOADING → toggle isLoading

Exposed functions
├── login(user: User)   → saves to AsyncStorage, dispatches SET_USER
└── logout()            → removes from AsyncStorage, dispatches LOGOUT
```

### 4.2 AppContext

Manages in-session data for the authenticated worker. Reset on logout (AppProvider unmounts).

```
AppState
├── todayAttendance: AttendanceRecord | null
├── todayPhotos: WorkPhoto[]
├── attendanceHistory: AttendanceRecord[]
└── isRefreshing: boolean

AppActions
├── SET_TODAY_ATTENDANCE  → replace today's attendance record
├── ADD_PHOTO             → prepend new photo to todayPhotos
├── SET_TODAY_PHOTOS      → replace entire photos list (on refresh)
├── SET_HISTORY           → replace attendance history list
└── SET_REFRESHING        → toggle pull-to-refresh indicator
```

---

## 5. API Layer Architecture

### 5.1 Switch Mechanism

```
src/api/index.ts
│
├── import * as mockApi from '../mock/mockApi'
├── import * as realApi from './realApi'
│
└── export const api = Config.USE_MOCK ? mockApi : realApi
                                ▲
                    src/constants/config.ts
                    USE_MOCK: true  ← change to false for real backend
                    API_BASE_URL: 'https://...'
```

All screens import only `api` from `src/api/index.ts`. Neither mockApi nor realApi is ever imported directly in UI code.

### 5.2 Real API Client (client.ts)

```
axios instance
├── baseURL: Config.API_BASE_URL
├── timeout: 15000ms
├── headers: Content-Type: application/json
│
├── Request Interceptor
│       └── Reads token from AsyncStorage (@safai_auth_token)
│           Attaches: Authorization: Bearer <token>
│
└── Response Interceptor
        ├── 401 → clearToken() + throw "Session expired"
        ├── 403 → throw "No permission"
        ├── 404 → throw "Not found"
        ├── 500+ → throw "Server error"
        └── Network error → throw "Check internet connection"
```

### 5.3 Mock API (mockApi.ts)

```
AsyncStorage Keys
├── @safai_registered_users    ← User[] (seeded + newly registered)
├── @safai_attendance_records  ← AttendanceRecord[] (seeded + new)
├── @safai_work_photos         ← WorkPhoto[] (seeded + uploaded)
└── @safai_auth_user           ← logged-in User (managed by AuthContext)

Seed Data (first launch only)
├── 5 workers (w001–w005), one admin (w001)
├── 7 days of attendance records per worker
└── 3 sample work photos

Mock delay: 300–800ms (configurable in Config)
```

---

## 6. Data Models

```
User
├── id: string
├── mobile: string          ← 10-digit, used as login identifier
├── name: string
├── address: string
├── createdAt: string       ← ISO datetime
└── isAdmin: boolean        ← controls Admin tab visibility

AttendanceRecord
├── id: string
├── userId: string
├── date: string            ← "YYYY-MM-DD"
├── loginTime: string|null  ← ISO datetime
├── logoutTime: string|null ← ISO datetime
├── loginLocation: LocationCoords|null
└── logoutLocation: LocationCoords|null

WorkPhoto
├── id: string
├── userId: string
├── imageUri: string        ← local file URI (mock) or server URL (real)
├── notes: string
├── location: LocationCoords
└── uploadedAt: string      ← ISO datetime

LocationCoords
├── latitude: number
├── longitude: number
└── accuracy: number|null
```

---

## 7. Screen Inventory

| Screen | File | Role | Key Dependencies |
|--------|------|------|-----------------|
| LoginScreen | screens/auth/LoginScreen.tsx | Enter mobile, route to signup | AuthContext, api.loginUser |
| SignupScreen | screens/auth/SignupScreen.tsx | Register name + address | AuthContext, api.signupUser |
| HomeScreen | screens/home/HomeScreen.tsx | Attendance mark + upload shortcut | AppContext, useLocation, api |
| UploadScreen | screens/upload/UploadScreen.tsx | Photo capture + geo-tag + submit | AppContext, useCamera, useLocation, api |
| HistoryScreen | screens/history/HistoryScreen.tsx | Photos + attendance tabs | AppContext, api |
| AdminScreen | screens/admin/AdminScreen.tsx | All workers + today's attendance | api (admin only) |

---

## 8. Reusable Components

| Component | File | Purpose |
|-----------|------|---------|
| AttendanceCard | components/AttendanceCard.tsx | 3-state card (not started / logged in / complete) |
| PhotoCard | components/PhotoCard.tsx | Image + time + notes + coords |
| WorkerRow | components/WorkerRow.tsx | Worker name, mobile, optional attendance badge |
| StatusBadge | components/StatusBadge.tsx | Present / Absent chip |
| LoadingOverlay | components/LoadingOverlay.tsx | Full-screen spinner with message |

---

## 9. Custom Hooks

| Hook | File | Purpose |
|------|------|---------|
| useLocation | hooks/useLocation.ts | Requests GPS permission, fetches coords, handles all error states |
| useCamera | hooks/useCamera.ts | Requests camera/gallery permission, returns image URI |
| useAuth | context/AuthContext.tsx | Access auth state and login/logout functions |
| useAppContext | context/AppContext.tsx | Access and update session data |

---

## 10. Project Directory Structure

```
mobile-attendance/
├── App.tsx                   ← Entry point, providers setup
├── app.json                  ← Expo config, permissions, bundle IDs
├── package.json
├── babel.config.js
├── tsconfig.json
├── assets/                   ← icon.png, splash.png, adaptive-icon.png
├── doc/                      ← Design and requirements documentation
└── src/
    ├── api/
    │   ├── index.ts           ← USE_MOCK switch
    │   ├── client.ts          ← Axios instance, interceptors, token management
    │   └── realApi.ts         ← Real backend API functions
    ├── constants/
    │   ├── colors.ts          ← Brand palette
    │   ├── strings.ts         ← All UI strings (multilingual-ready)
    │   └── config.ts          ← USE_MOCK flag, API_BASE_URL, storage keys
    ├── context/
    │   ├── AuthContext.tsx
    │   └── AppContext.tsx
    ├── hooks/
    │   ├── useLocation.ts
    │   └── useCamera.ts
    ├── mock/
    │   ├── data.ts            ← Seed workers, attendance, photos
    │   └── mockApi.ts         ← AsyncStorage-backed mock functions
    ├── navigation/
    │   ├── RootNavigator.tsx
    │   ├── AuthNavigator.tsx
    │   └── AppNavigator.tsx
    ├── screens/
    │   ├── auth/              ← LoginScreen, SignupScreen
    │   ├── home/              ← HomeScreen
    │   ├── upload/            ← UploadScreen
    │   ├── history/           ← HistoryScreen
    │   └── admin/             ← AdminScreen
    ├── components/            ← AttendanceCard, PhotoCard, WorkerRow, etc.
    └── types/
        └── index.ts           ← All TypeScript interfaces
```

---

## 11. Design Decisions & Rationale

| Decision | Rationale |
|----------|-----------|
| Expo managed workflow | No native code setup; deploys to Android + iOS with one command |
| React Native Paper | Most accessible MD3 library for RN; matches the spirit of React Bootstrap |
| Context + useReducer (no Redux) | Sufficient for MVP scope; zero extra dependencies |
| Mock/Real API switch | Backend team works independently; frontend ships before API is ready |
| Axios over fetch | Interceptors for auth token injection; better error normalization |
| `isAdmin` boolean on User | Simplest role model for two-role system; easy to extend later |
| Forced light mode | Field workers use phones outdoors in direct sunlight |
| 56dp minimum button height | Thumb-friendly for workers in gloves or with rough hands |
| Strings centralized in strings.ts | Enables Bengali/Assamese translation without code changes |
| File URI (not base64) for photos | Base64 in AsyncStorage causes memory crashes on older devices |
