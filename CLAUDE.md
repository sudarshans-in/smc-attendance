# CLAUDE.md — SMC Karmachari Attendance App

This file tells Claude Code everything important about this project.
Read this before making any changes.

---

## What This App Does

Mobile attendance and work-photo tracking app for **Silchar Municipal Corporation** workers (SMC Karmacharis). Field workers mark daily GPS attendance and upload work-progress photos. Admins monitor all workers.

**App name:** SMC Karmachari
**Package name:** `com.smc.karmachari`
**Platform:** Android only (bare React Native — no Expo, no EAS Build)
**Current state:** Frontend complete with mock backend. Real API not yet integrated.

---

## How to Run

```bash
# Node 20 is required — switch if needed
nvm use 20

# Install dependencies
npm install

# Terminal 1 — Start Metro bundler
npx react-native start --reset-cache

# Terminal 2 — Build and install on connected Android device
export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"
cd android && ./gradlew installDebug

# OR using react-native CLI
npx react-native run-android
```

### Build APK

```bash
# Step 1 — Switch to Node 20 (required before every build)
nvm use 20

# Step 2 — Export Node to PATH so Gradle can find it (Gradle doesn't inherit nvm PATH)
export PATH="$(dirname $(which node)):$PATH"

# Step 3 — Build

# Debug APK
cd android && ./gradlew assembleDebug
# → android/app/build/outputs/apk/debug/app-debug.apk

# Release APK
cd android && ./gradlew assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk
```

> `export PATH="$(dirname $(which node)):$PATH"` dynamically resolves whichever Node version nvm has active — no hardcoded path needed.

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
| Framework | Bare React Native 0.81 | Full native control, no Expo SDK cycle, local APK builds |
| Language | TypeScript strict mode | Enforced throughout |
| UI | Pure React Native `StyleSheet` + `src/constants/theme.ts` | Zero UI library deps — Tamagui (RC) had react-dom prod build issue; NativeWind required Reanimated. Bootstrap 5-inspired light/dark token system. |
| Navigation | React Navigation v6 | Stack (auth) + Bottom Tabs (app) |
| State | React Context + useReducer | Sufficient for scope, zero extra deps |
| HTTP | Axios + `src/api/client.ts` | Interceptors, auto JWT attachment |
| Secure Storage | `react-native-keychain` | iOS Keychain / Android Keystore — **never AsyncStorage for secrets** |
| Mock Storage | AsyncStorage `1.23.1` | Only for mock API data (not tokens or session). Pinned to 1.23.1 — v2/v3 have CMake/Maven build issues |
| Icons | `react-native-vector-icons` MaterialCommunityIcons | DO NOT use `@expo/vector-icons` — Expo is removed |
| GPS | `react-native-geolocation-service` | Android fine location |
| Camera | `react-native-image-picker` | Camera-only (no gallery). `launchCamera` only — gallery removed intentionally |
| Build | Gradle (local) | No cloud service needed — `./gradlew assembleDebug` / `assembleRelease` |

---

## Expo Migration Summary

This project was migrated from Expo managed workflow to bare React Native. Key replacements:

| Removed (Expo) | Replaced with |
|---------------|--------------|
| `expo-location` | `react-native-geolocation-service` |
| `expo-image-picker` | `react-native-image-picker` |
| `expo-secure-store` | `react-native-keychain` |
| `@expo/vector-icons` | `react-native-vector-icons` |
| `expo-status-bar` | React Native built-in `StatusBar` |
| `npx expo start` | `npx react-native start` |
| EAS Build (cloud) | `./gradlew assembleDebug` (local) |

See `doc/migration-analysis.md` for full details.

---

## Project Layout — Critical Files

```
index.js                        Entry point — gesture-handler must be first import
App.tsx                         Providers only, no logic
src/
  api/
    index.ts                    THE switch: USE_MOCK ? mockApi : realApi
    client.ts                   Axios instance, JWT interceptors, Keychain token helpers
    realApi.ts                  Real API functions — identical signatures to mockApi
  mock/
    data.ts                     5 seed workers, 7 days attendance, 3 photos
    mockApi.ts                  AsyncStorage-backed mock — simulates 300-800ms delay
  constants/
    config.ts                   USE_MOCK flag, API_BASE_URL, storage keys ← READ THIS FIRST
    theme.ts                    Bootstrap 5-inspired light/dark theme tokens — use getTheme(isDark) everywhere
    strings.ts                  ALL user-facing text — never hardcode strings in JSX
  context/
    AuthContext.tsx              Auth state + login/logout — stores in react-native-keychain
    AppContext.tsx               Session data (attendance, photos) — reset on logout
    ThemeContext.tsx             isDark state + toggle(); wraps useColorScheme with manual override
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
android/
  app/build.gradle              App-level Gradle (versionCode, signingConfigs, vector icons font)
  build.gradle                  Project-level Gradle (buildscript, repositories)
  settings.gradle               RN Gradle plugin + autolinking config
  app/src/main/
    AndroidManifest.xml         Permissions + activity config
    java/com/smc/karmachari/
      MainActivity.kt           Standard bare RN activity
      MainApplication.kt        Standard bare RN application
    res/values/
      strings.xml               App name
      styles.xml                AppTheme
doc/
  fresher-guide.md              Complete guide for new developers ← START HERE if new
  requirements.md               Functional + non-functional requirements with status
  architecture.md               Full architecture diagrams and design decisions
  api-contract.md               REST API spec for backend team
  security.md                   Security audit findings, fixes, and backend responsibilities
  migration-analysis.md         Expo → Bare React Native migration log
  tech-stack-decisions.md       Framework comparison and rationale
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

1. **Never use AsyncStorage for tokens or user session** — use `react-native-keychain`
2. **Always sanitize inputs** before API calls using `src/utils/sanitize.ts`
3. **Always import from `src/api/index.ts`** — never directly from `mockApi` or `realApi`
4. **Never hardcode strings in JSX** — use `src/constants/strings.ts`
5. **Never hardcode colors or theme values** — use `getTheme(isDark)` from `src/constants/theme.ts`
6. **Never store images as base64** — use file URI (crashes AsyncStorage on old devices)
7. **`USE_MOCK` must be `false` in every release build** — mock code ships in the bundle but must never be active in production

### Open Security Issue — HIGH (must fix before production)

**Static OTP auth bypass** — the backend uses a hardcoded OTP `"24052026"` that never changes and is never sent via SMS. Any attacker who knows a worker's phone number can log in as that worker. See `doc/security.md §2.5` for the full attack path, backend remediation steps (SMS provider integration), and the verification checklist.

Immediate 1-line fix for the mobile app: remove the OTP comment from `src/api/realApi.ts` line 38.

---

## UI Rules — Field Workers Use This App

- Minimum button height: **56dp** (thumb-friendly, workers may wear gloves)
- Minimum body font size: **16sp**
- **Light mode is default** (readable in direct sunlight); dark mode toggle available for indoor/night use
- Max **2–3 actions per screen** — low-tech users, older Android devices
- Every button needs `accessibilityLabel`
- All text through `Strings.*` from `strings.ts` — Bengali/Assamese can be added later without code changes
- All screens must use `<SafeAreaView edges={['top']}>` — prevents overlap with front camera/notch
- Theme colors via `const t = getTheme(isDark)` at top of every component — never inline hex values

---

## Mock Test Accounts

| Mobile | Name | isAdmin |
|--------|------|---------|
| 9876543210 | Raju Das | Yes |
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
| `Cannot find module 'node:assert'` | `nvm use 20` — wrong Node version |
| `SDK location not found` | Create `android/local.properties` with `sdk.dir=<path>` |
| `No connected devices` | Enable USB Debugging; `adb devices` to verify |
| `EMFILE: too many open files` | `brew install watchman` |
| `error: unknown command 'start'` | Use `npx react-native start` not `npx expo start` |
| `Invariant Violation / runtime not ready` | Check `import 'react-native-gesture-handler'` is first line of `index.js` |
| Gradle picks up Node 14 | `nodeExecutableAndArgs` is set in `android/app/build.gradle` to point to nvm Node 20. If you move to a different Node version, update that line. |
| `autolinking.json` missing | Check `settings.gradle` has `autolinkLibrariesFromCommand()` with full npx path |
| `CMake error react_codegen_rnasyncstorage` | async-storage v2/v3 codegen issue. Pin to `1.23.1` + `newArchEnabled=false` in gradle.properties |
| async-storage `GitHub Packages 401` | v3.x requires Maven auth for `org.asyncstorage.shared_storage`. Pin to `1.23.1`. |
| JS bundle fails with `Cannot find module 'react-dom'` | A UI library (was Tamagui) is importing web internals. Remove the library and its babel plugin. |
| `react-native-worklets` not found | NativeWind 4.2.x requires Reanimated worklets. Either install Reanimated or remove NativeWind. |

---

## What NOT to Do

- Do not install or use `@expo/vector-icons` — use `react-native-vector-icons` only
- Do not install or use any `expo-*` packages — the project is fully migrated off Expo
- Do not install `tamagui`, `@tamagui/*`, `nativewind`, `tailwindcss`, or `react-native-paper` — these caused blocking build failures (Tamagui: react-dom in prod bundle; NativeWind: requires Reanimated)
- Do not use `base64: true` in image picker options — memory crash on old devices
- Do not import directly from `mockApi.ts` in screens
- Do not add role logic beyond `isAdmin` without updating `doc/requirements.md`
- Do not commit `.env` files — check `.gitignore`
- Do not run `npm install` on Node 14 — upgrade to Node 20 first
- Do not run `npx expo start` — use `npx react-native start`
- Do not upgrade `@react-native-async-storage/async-storage` above `1.23.1` — v2 and v3 have native build failures (see Common Issues)
- Do not hardcode theme colors in StyleSheet — always use `getTheme(isDark)` so dark mode works
- Do not use `launchImageLibrary` in useCamera — gallery is intentionally removed
