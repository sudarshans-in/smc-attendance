# SMC Karmachari — Architecture Document

**Version:** 2.0.0
**Last Updated:** March 2026
**Breaking change from v1:** Migrated from Expo managed workflow to bare React Native. See `doc/migration-analysis.md`.

---

## 1. Technology Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Framework | Bare React Native | 0.81.5 | Full native Android build — no Expo |
| Language | TypeScript | ^5.3.0 | Strict mode enabled |
| UI Library | React Native Paper (MD3) | ^5.12.3 | Material Design 3, accessible |
| Navigation | React Navigation | v6 | Stack + Bottom Tabs |
| HTTP Client | Axios | ^1.7.2 | Interceptors, JWT auth |
| State Management | React Context + useReducer | — | No external library |
| Local Storage | AsyncStorage | 2.2.0 | Mock data only — not for secrets |
| Secure Storage | react-native-keychain | ^9.2.2 | Android Keystore hardware encryption |
| Location | react-native-geolocation-service | ^5.3.1 | GPS for attendance/photos |
| Camera/Gallery | react-native-image-picker | ^7.1.2 | Work photo capture |
| Icons | react-native-vector-icons | ^10.2.0 | MaterialCommunityIcons |
| Build tool | Gradle | 8.7.3 | Local Android builds — no cloud service |
| Runtime | React Native | 0.81.5 | |
| Min Android | API 24 (Android 7.0) | | 2016 onwards |

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     SMC Karmachari App                      │
│                    (Bare React Native)                      │
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

## 3. Native Layer (Android)

```
android/
├── build.gradle               Project-level: buildscript, repositories
├── settings.gradle            React Native Gradle Plugin + autolinking
├── gradle.properties          Build flags (IS_NEW_ARCHITECTURE_ENABLED, etc.)
└── app/
    ├── build.gradle           App-level: compileSdk, versionCode, signingConfigs
    └── src/main/
        ├── AndroidManifest.xml   Permissions + activity config
        ├── java/com/smc/karmachari/
        │   ├── MainActivity.kt     Standard ReactActivity
        │   └── MainApplication.kt  Standard ReactApplication (no Expo wrappers)
        └── res/
            ├── values/strings.xml  App name
            ├── values/styles.xml   AppTheme
            └── mipmap-*/           App icon
```

### Autolinking

React Native packages declare themselves via `react-native.config.js`. The Gradle plugin reads these during the build via `autolinkLibrariesFromCommand()` in `settings.gradle`:

```groovy
extensions.configure(com.facebook.react.ReactSettingsExtension) { ex ->
  ex.autolinkLibrariesFromCommand(
    ["/usr/local/bin/npx", "@react-native-community/cli", "config"],
    rootDir.parentFile
  )
}
```

You never need to manually link packages — `npm install` + rebuild is sufficient.

---

## 4. Navigation Architecture

```
RootNavigator (Stack)
│
├── [isLoading = true]
│       └── LoadingOverlay  ← reads Keychain on cold start
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

## 5. State Management

### 5.1 AuthContext

Manages authentication lifecycle. Persists session to react-native-keychain.

```
AuthState
├── user: User | null
├── isLoading: boolean        ← true during cold-start Keychain read
└── isAuthenticated: boolean

AuthActions
├── SET_USER  → set user + isAuthenticated=true + isLoading=false
├── LOGOUT    → clear user + isAuthenticated=false
└── SET_LOADING → toggle isLoading

Exposed functions
├── login(user: User)   → saves to Keychain, dispatches SET_USER
└── logout()            → removes from Keychain, dispatches LOGOUT
```

**Keychain storage:** Uses `react-native-keychain` with:
- `service: 'safai_karmachari'` for user session
- `service: 'safai_karmachari_token'` for JWT token

### 5.2 AppContext

Manages in-session data for the authenticated worker. Reset on logout (AppProvider unmounts).

```
AppState
├── todayAttendance: AttendanceRecord | null
├── todayPhotos: WorkPhoto[]
├── attendanceHistory: AttendanceRecord[]
└── isRefreshing: boolean
```

---

## 6. API Layer Architecture

### 6.1 Switch Mechanism

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

### 6.2 Real API Client (client.ts)

```
axios instance
├── baseURL: Config.API_BASE_URL
├── timeout: 15000ms
├── headers: Content-Type: application/json
│
├── Request Interceptor
│       └── Reads token from react-native-keychain (service: safai_karmachari_token)
│           Attaches: Authorization: Bearer <token>
│
└── Response Interceptor
        ├── 401 → clearToken() + throw "Session expired"
        ├── 403 → throw "No permission"
        ├── 404 → throw "Not found"
        ├── 500+ → throw "Server error"
        └── Network error → throw "Check internet connection"
```

### 6.3 Mock API (mockApi.ts)

```
AsyncStorage Keys
├── @safai_registered_users    ← User[] (seeded + newly registered)
├── @safai_attendance_records  ← AttendanceRecord[] (seeded + new)
└── @safai_work_photos         ← WorkPhoto[] (seeded + uploaded)

Seed Data (first launch only)
├── 5 workers (w001–w005), one admin (w001)
├── 7 days of attendance records per worker
└── 3 sample work photos

Mock delay: 300–800ms (configurable in Config)
```

---

## 7. Data Models

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

## 8. Screen Inventory

| Screen | File | Role | Key Dependencies |
|--------|------|------|-----------------|
| LoginScreen | screens/auth/LoginScreen.tsx | Enter mobile, route to signup | AuthContext, api.loginUser |
| SignupScreen | screens/auth/SignupScreen.tsx | Register name + address | AuthContext, api.signupUser |
| HomeScreen | screens/home/HomeScreen.tsx | Attendance mark + upload shortcut | AppContext, useLocation, api |
| UploadScreen | screens/upload/UploadScreen.tsx | Photo capture + geo-tag + submit | AppContext, useCamera, useLocation, api |
| HistoryScreen | screens/history/HistoryScreen.tsx | Photos + attendance tabs | AppContext, api |
| AdminScreen | screens/admin/AdminScreen.tsx | All workers + today's attendance | api (admin only) |

---

## 9. Custom Hooks

| Hook | File | Purpose |
|------|------|---------|
| useLocation | hooks/useLocation.ts | Requests GPS permission via PermissionsAndroid, fetches coords |
| useCamera | hooks/useCamera.ts | Requests camera/gallery permission, returns image URI |
| useAuth | context/AuthContext.tsx | Access auth state and login/logout functions |
| useAppContext | context/AppContext.tsx | Access and update session data |

---

## 10. Project Directory Structure

```
mobile-attendance/
├── index.js                  ← Entry point (gesture-handler must be first import)
├── App.tsx                   ← Providers setup only
├── app.json                  ← App name, package name, version
├── package.json
├── babel.config.js
├── metro.config.js
├── tsconfig.json
├── assets/                   ← icon.png, adaptive-icon.png
├── android/                  ← Native Android project
│   ├── build.gradle
│   ├── settings.gradle
│   ├── gradle.properties
│   └── app/
│       ├── build.gradle
│       └── src/main/
│           ├── AndroidManifest.xml
│           ├── java/com/smc/karmachari/
│           │   ├── MainActivity.kt
│           │   └── MainApplication.kt
│           └── res/
├── doc/                      ← All documentation
└── src/
    ├── api/
    ├── constants/
    ├── context/
    ├── hooks/
    ├── mock/
    ├── navigation/
    ├── screens/
    ├── components/
    └── types/
```

---

## 11. Design Decisions & Rationale

| Decision | Rationale |
|----------|-----------|
| Bare React Native (migrated from Expo) | Eliminates EAS Build cloud dependency; APKs built locally with Gradle; no Expo SDK upgrade cycle |
| React Native Paper | Most accessible MD3 library for RN; matches the spirit of React Bootstrap |
| Context + useReducer (no Redux) | Sufficient for MVP scope; zero extra dependencies |
| Mock/Real API switch | Backend team works independently; frontend ships before API is ready |
| Axios over fetch | Interceptors for auth token injection; better error normalization |
| react-native-keychain | Hardware-backed encryption (Android Keystore); replaces expo-secure-store |
| `isAdmin` boolean on User | Simplest role model for two-role system; easy to extend later |
| Forced light mode | Field workers use phones outdoors in direct sunlight |
| 56dp minimum button height | Thumb-friendly for workers in gloves or with rough hands |
| Strings centralized in strings.ts | Enables Bengali/Assamese translation without code changes |
| File URI (not base64) for photos | Base64 in AsyncStorage causes memory crashes on older devices |
| Android-only target | All field workers use Android; iOS adds signing cost + macOS build requirement |
