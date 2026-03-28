# CLAUDE.md — SMC Karmachari Attendance App

This file tells Claude Code everything important about this project.
Read this before making any changes.

---

## What This App Does

Mobile attendance and work-photo tracking app for **Silchar Municipal Corporation** sanitation workers (SMC Karmacharis). Field workers mark daily GPS attendance and upload work-progress photos. Admins monitor all workers.

**App name:** SMC Karmachari
**Platform:** Android + iOS (Expo managed, no native code)
**Current state:** Frontend complete with mock backend. Real API not yet integrated.

---

## How to Run

```bash
# Node 20 is required — switch if needed
nvm use 20

# Install dependencies
npm install

# Start dev server
npx expo start --clear

# Test on device — install Expo Go app, scan QR code
# Tunnel mode if phone and Mac are on different networks:
npx expo start --tunnel
```

---

## The Single Most Important Switch

**`src/constants/config.ts` → `USE_MOCK`**

```ts
USE_MOCK: true   // uses AsyncStorage mock — no network needed
USE_MOCK: false  // uses real axios API → Config.API_BASE_URL
```

When backend is ready: set `USE_MOCK: false` and update `API_BASE_URL`. Nothing else changes. Every screen imports only from `src/api/index.ts` which routes automatically.

---

## Tech Stack

| What | Choice | Why |
|------|--------|-----|
| Framework | Expo SDK 54 (managed) | No native code, deploys to both platforms |
| Language | TypeScript strict mode | Enforced throughout |
| UI | React Native Paper v5 (MD3) | Accessible, Material Design, closest to React Bootstrap |
| Navigation | React Navigation v6 | Stack (auth) + Bottom Tabs (app) |
| State | React Context + useReducer | Sufficient for scope, zero extra deps |
| HTTP | Axios + `src/api/client.ts` | Interceptors, auto JWT attachment |
| Secure Storage | `expo-secure-store` | iOS Keychain / Android Keystore — **never AsyncStorage for secrets** |
| Mock Storage | AsyncStorage | Only for mock API data (not tokens or session) |
| Icons | `@expo/vector-icons` MaterialCommunityIcons | DO NOT use `react-native-vector-icons` — conflicts with Expo |

---

## Project Layout — Critical Files

```
App.tsx                         Entry point — providers only, no logic
src/
  api/
    index.ts                    THE switch: USE_MOCK ? mockApi : realApi
    client.ts                   Axios instance, JWT interceptors, SecureStore token helpers
    realApi.ts                  Real API functions — identical signatures to mockApi
  mock/
    data.ts                     5 seed workers, 7 days attendance, 3 photos
    mockApi.ts                  AsyncStorage-backed mock — simulates 300-800ms delay
  constants/
    config.ts                   USE_MOCK flag, API_BASE_URL, storage keys ← READ THIS FIRST
    colors.ts                   Brand palette — always use Colors.* never hardcode hex
    strings.ts                  ALL user-facing text — never hardcode strings in JSX
  context/
    AuthContext.tsx              Auth state + login/logout — stores in expo-secure-store
    AppContext.tsx               Session data (attendance, photos) — reset on logout
  utils/
    sanitize.ts                 sanitizeText, sanitizeNotes, isValidMobile — use before any API call
  navigation/
    RootNavigator.tsx           Auth guard — shows Auth or App stack based on isAuthenticated
    AppNavigator.tsx            Bottom tabs — Admin tab only shown when user.isAdmin === true
  screens/
    auth/                       LoginScreen, SignupScreen
    home/                       HomeScreen — attendance card + upload shortcut
    upload/                     UploadScreen — camera/gallery + geo-tag + notes
    history/                    HistoryScreen — segmented tabs: photos | attendance records
    admin/                      AdminScreen — admin only, has BOTH nav guard and screen guard
  hooks/
    useLocation.ts              GPS permission + fetch — handles all error states
    useCamera.ts                Camera/gallery permission + image URI — no base64
  types/
    index.ts                    All interfaces — User, AttendanceRecord, WorkPhoto, etc.
doc/
    requirements.md             Functional + non-functional requirements with status
    architecture.md             Full architecture diagrams and design decisions
    api-contract.md             REST API spec for backend team
    security.md                 Security audit findings, fixes, and backend responsibilities
```

---

## User Roles

```ts
User.isAdmin: boolean

true  → sees 4 tabs: Home, Upload, History, Admin
false → sees 3 tabs: Home, Upload, History
```

- Role is set at registration (`isAdmin: false` for new signups)
- Seed admin: mobile `9876543210` (Raju Das) — `isAdmin: true`
- Two guards on AdminScreen: navigation level + component level (defense in depth)
- **Backend must also enforce this** — frontend guard is convenience only

---

## Security Rules — Never Break These

1. **Never use AsyncStorage for tokens or user session** — use `expo-secure-store`
2. **Always sanitize inputs** before API calls using `src/utils/sanitize.ts`
3. **Always import from `src/api/index.ts`** — never directly from `mockApi` or `realApi`
4. **Never hardcode strings in JSX** — use `src/constants/strings.ts`
5. **Never hardcode colors** — use `src/constants/colors.ts`
6. **Never store images as base64** — use file URI (crashes AsyncStorage on old devices)

---

## UI Rules — Field Workers Use This App

- Minimum button height: **56dp** (thumb-friendly, workers may wear gloves)
- Minimum body font size: **16sp**
- Forced **light mode only** — readable in direct sunlight outdoors
- Max **2–3 actions per screen** — low-tech users, older Android devices
- Every button needs `accessibilityLabel`
- All text through `Strings.*` from `strings.ts` — Bengali/Assamese can be added later without code changes

---

## Mock Test Accounts

| Mobile | Name | isAdmin |
|--------|------|---------|
| 9876543210 | Raju Das | ✅ Yes |
| 9876543211 | Mina Begum | No |
| 9876543212 | Suresh Nath | No |
| 9876543213 | Anita Roy | No |
| 9876543214 | Kamal Singh | No |

Any other 10-digit mobile → redirects to Signup screen.

---

## Common Issues & Fixes

| Error | Fix |
|-------|-----|
| `toReversed is not a function` | `nvm use 20` — wrong Node version |
| `SDK mismatch` in Expo Go | Run `npx expo install --fix` then `npx expo start --clear` |
| `EMFILE: too many open files` | `brew install watchman` |
| `failed to download` on Android | `npx expo start --tunnel` |
| `Invariant Violation / runtime not ready` | Check `import 'react-native-gesture-handler'` is first line of App.tsx |
| `Cannot find module 'node:assert'` | `nvm use 20` — wrong Node version |
| Package version mismatch warning | `npx expo install --fix` |

---

## What NOT to Do

- Do not install `react-native-vector-icons` — use `@expo/vector-icons` only
- Do not use `base64: true` in `launchCameraAsync` — memory crash on old devices
- Do not import directly from `mockApi.ts` in screens
- Do not add role logic beyond `isAdmin` without updating `doc/requirements.md`
- Do not commit `.env` files — check `.gitignore`
- Do not run `npm install` on Node 14 — upgrade to Node 20 first
