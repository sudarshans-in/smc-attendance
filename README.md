# SMC Karmachari — Attendance Tracker

Mobile app for **Silchar Municipal Corporation** sanitation workers (Safai Karmacharis) to mark daily GPS attendance and upload work-progress photos. Admins monitor all workers from the same app.

**Platform:** Android (bare React Native — no Expo dependency)
**Stack:** React Native 0.81 · TypeScript · React Native Paper (MD3)
**Package name:** `com.smc.karmachari`

---

## Features

- GPS-tagged attendance check-in
- Work photo upload with location tagging (camera or gallery)
- Attendance and photo history per worker
- Admin dashboard — view all workers, attendance records, and photos
- Secure JWT session storage (Android Keystore via react-native-keychain)
- Mock backend for offline development — one flag switches to real API

---

## Requirements

- Node 20 (`nvm use 20`)
- Android Studio (Ladybug / Panda 2 or newer) with Android SDK 35
- A physical Android device or emulator (API 24+)

---

## Getting Started

```bash
# 1. Clone the repo
git clone <repo-url>
cd mobile-attendance

# 2. Switch to Node 20
nvm use 20

# 3. Install dependencies
npm install

# 4. Start the Metro bundler (Terminal 1)
npx react-native start --reset-cache

# 5. Build and install on connected device (Terminal 2)
npx react-native run-android
```

> New to the project? Read [doc/fresher-guide.md](doc/fresher-guide.md) first.

---

## Mock vs Real Backend

The app ships with a fully working mock backend — no server needed.

**`src/constants/config.ts`**

```ts
USE_MOCK: true   // uses AsyncStorage mock — works offline
USE_MOCK: false  // uses real Axios API → Config.API_BASE_URL
```

When the backend is ready: set `USE_MOCK: false` and update `API_BASE_URL`. No other changes needed.

---

## Test Accounts (Mock Mode)

| Mobile | Name | Role |
|--------|------|------|
| `9876543210` | Raju Das | Admin |
| `9876543211` | Mina Begum | Worker |
| `9876543212` | Suresh Nath | Worker |
| `9876543213` | Anita Roy | Worker |
| `9876543214` | Kamal Singh | Worker |

Any other 10-digit mobile number → redirected to Signup screen.

---

## Project Structure

```
App.tsx                        Entry point — providers only
index.js                       AppRegistry entry (react-native-gesture-handler first)
src/
  api/
    index.ts                   API switch: USE_MOCK ? mockApi : realApi
    client.ts                  Axios instance + JWT interceptors (react-native-keychain)
    realApi.ts                 Real API functions (identical signatures to mock)
  mock/
    mockApi.ts                 AsyncStorage-backed mock with simulated delay
    data.ts                    5 seed workers, attendance records, photos
  constants/
    config.ts                  USE_MOCK flag, API_BASE_URL, storage keys
    colors.ts                  Brand colour palette — always use Colors.*
    strings.ts                 All user-facing text — never hardcode in JSX
  context/
    AuthContext.tsx             Auth state, login/logout, Keychain session
    AppContext.tsx              Attendance + photo session state
  utils/
    sanitize.ts                sanitizeText, sanitizeNotes, isValidMobile
  navigation/
    RootNavigator.tsx           Auth guard (Auth stack vs App tabs)
    AppNavigator.tsx            Bottom tabs — Admin tab only for isAdmin users
  screens/
    auth/                      LoginScreen, SignupScreen
    home/                      HomeScreen — attendance card + upload shortcut
    upload/                    UploadScreen — camera/gallery + GPS + notes
    history/                   HistoryScreen — photos and attendance tabs
    admin/                     AdminScreen — admin only (dual access guard)
  hooks/
    useLocation.ts             GPS permission + fetch (react-native-geolocation-service)
    useCamera.ts               Camera/gallery permission + image URI (react-native-image-picker)
  types/
    index.ts                   All interfaces: User, AttendanceRecord, WorkPhoto
android/
  app/build.gradle             App-level Gradle config
  build.gradle                 Project-level Gradle config
  settings.gradle              RN Gradle plugin + autolinking
doc/
  requirements.md              Functional + non-functional requirements
  architecture.md              Architecture diagrams and design decisions
  api-contract.md              REST API spec for the backend team
  security.md                  Security audit findings and backend responsibilities
  tech-stack-decisions.md      Framework comparison: Expo vs Ionic vs Flutter vs Bare RN
  migration-analysis.md        Expo → Bare React Native migration log
  fresher-guide.md             Step-by-step guide for new developers
```

---

## Building an APK

### Debug APK (for testing)

```bash
export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"
cd android && ./gradlew assembleDebug
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

### Release APK (for distribution)

```bash
export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"
cd android && ./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

> For release you need a signing keystore. See [doc/fresher-guide.md](doc/fresher-guide.md) §5.

---

## Common Errors

| Error | Fix |
|-------|-----|
| `toReversed is not a function` | `nvm use 20` — wrong Node version |
| `SDK location not found` | Create `android/local.properties` with `sdk.dir=/Users/<you>/Library/Android/sdk` |
| `No connected devices` | Enable USB Debugging on phone; run `adb devices` to verify |
| `EMFILE: too many open files` | `brew install watchman` |
| `Invariant Violation / runtime not ready` | Check `import 'react-native-gesture-handler'` is first line of `index.js` |
| `Cannot find module 'node:assert'` | `nvm use 20` — wrong Node version |
| Gradle picks up wrong Node | `export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"` before Gradle |
| `error: unknown command 'start'` | Use `npx react-native start`, not `npx expo start` |

---

## Security Notes

- JWT tokens stored in react-native-keychain (Android Keystore hardware encryption) — never AsyncStorage
- Admin screens have two independent access guards (navigation + component level)
- All user inputs sanitized before API calls via `src/utils/sanitize.ts`
- See [doc/security.md](doc/security.md) for full audit and backend responsibilities

---

## Documentation

| File | Contents |
|------|----------|
| [doc/fresher-guide.md](doc/fresher-guide.md) | Complete setup and workflow guide for new developers |
| [doc/requirements.md](doc/requirements.md) | Full functional and non-functional requirements |
| [doc/architecture.md](doc/architecture.md) | Architecture diagrams, navigation tree, state design |
| [doc/api-contract.md](doc/api-contract.md) | REST API spec — 10 endpoints with request/response shapes |
| [doc/security.md](doc/security.md) | Security audit, fixes applied, backend responsibilities |
| [doc/tech-stack-decisions.md](doc/tech-stack-decisions.md) | Framework comparison and migration rationale |
| [doc/migration-analysis.md](doc/migration-analysis.md) | Expo → Bare React Native migration log |
| [CLAUDE.md](CLAUDE.md) | AI assistant context — critical rules and project conventions |
