# SMC Karmachari — Attendance Tracker

Mobile app for **Silchar Municipal Corporation** sanitation workers (Safai Karmacharis) to mark daily GPS attendance and upload work-progress photos. Admins monitor all workers from the same app.

**Platform:** Android + iOS (Expo managed workflow)
**Stack:** React Native · Expo SDK 54 · TypeScript · React Native Paper (MD3)

---

## Features

- GPS-tagged attendance check-in
- Work photo upload with location tagging (camera or gallery)
- Attendance and photo history per worker
- Admin dashboard — view all workers, attendance records, and photos
- Secure JWT session storage (iOS Keychain / Android Keystore)
- Mock backend for offline development — one flag switches to real API

---

## Requirements

- Node 20 (`nvm use 20`)
- Expo Go app on your test device ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779))
- Same Wi-Fi network as your development machine (or use tunnel mode)

---

## Getting Started

```bash
# 1. Clone the repo
git clone https://github.com/sudarshans-in/smc-attendance.git
cd smc-attendance

# 2. Switch to Node 20
nvm use 20

# 3. Install dependencies
npm install

# 4. Start the dev server
npx expo start --clear

# 5. Scan the QR code with Expo Go on your device
```

If your phone and Mac are on different networks (e.g. mobile data):

```bash
npx expo start --tunnel
```

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
src/
  api/
    index.ts                   API switch: USE_MOCK ? mockApi : realApi
    client.ts                  Axios instance + JWT interceptors
    realApi.ts                 Real API functions (identical signatures to mock)
  mock/
    mockApi.ts                 AsyncStorage-backed mock with simulated delay
    data.ts                    5 seed workers, attendance records, photos
  constants/
    config.ts                  USE_MOCK flag, API_BASE_URL, storage keys
    colors.ts                  Brand colour palette — always use Colors.*
    strings.ts                 All user-facing text — never hardcode in JSX
  context/
    AuthContext.tsx             Auth state, login/logout, SecureStore session
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
    useLocation.ts             GPS permission + fetch with all error states
    useCamera.ts               Camera/gallery permission + image URI
  types/
    index.ts                   All interfaces: User, AttendanceRecord, WorkPhoto
doc/
  requirements.md              Functional + non-functional requirements
  architecture.md              Architecture diagrams and design decisions
  api-contract.md              REST API spec for the backend team
  security.md                  Security audit findings and backend responsibilities
  tech-stack-decisions.md      Framework comparison: Expo vs Ionic vs Flutter vs PWA
```

---

## Sharing the App

**For a remote tester or someone in another location:**

```bash
# Build a shareable APK (requires EAS account)
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

EAS builds in the cloud and returns a download link. Send the link — they install it like any APK. No Expo Go, no account, no QR code required.

Add `eas.json` to the project root:

```json
{
  "build": {
    "preview": {
      "android": { "buildType": "apk" }
    },
    "production": {
      "android": { "buildType": "app-bundle" }
    }
  }
}
```

---

## Common Errors

| Error | Fix |
|-------|-----|
| `toReversed is not a function` | `nvm use 20` — wrong Node version |
| `SDK mismatch` in Expo Go | `npx expo install --fix` then `npx expo start --clear` |
| `EMFILE: too many open files` | `brew install watchman` |
| `failed to download` on Android | `npx expo start --tunnel` |
| `Invariant Violation / runtime not ready` | Check `import 'react-native-gesture-handler'` is first line of `App.tsx` |
| `Cannot find module 'node:assert'` | `nvm use 20` — wrong Node version |
| Package version mismatch warning | `npx expo install --fix` |

---

## Documentation

| File | Contents |
|------|----------|
| [doc/requirements.md](doc/requirements.md) | Full functional and non-functional requirements |
| [doc/architecture.md](doc/architecture.md) | Architecture diagrams, navigation tree, state design |
| [doc/api-contract.md](doc/api-contract.md) | REST API spec — 10 endpoints with request/response shapes |
| [doc/security.md](doc/security.md) | Security audit, fixes applied, backend responsibilities |
| [doc/tech-stack-decisions.md](doc/tech-stack-decisions.md) | Why Expo, framework comparison, future migration paths |
| [CLAUDE.md](CLAUDE.md) | AI assistant context — critical rules and project conventions |

---

## Security Notes

- JWT tokens stored in `expo-secure-store` (hardware-encrypted) — never AsyncStorage
- Admin screens have two independent access guards (navigation + component level)
- All user inputs sanitized before API calls via `src/utils/sanitize.ts`
- See [doc/security.md](doc/security.md) for full audit and backend responsibilities

---

## Production Costs

| Scenario | Monthly |
|----------|---------|
| Android-only, NIC government hosting, free EAS | ₹0 |
| Android-only, DigitalOcean backend | ~₹500 |
| Android + iOS, Railway backend | ~₹1,000 |

Google Play Developer account: $25 one-time
Apple Developer Program: $99/year (iOS only)

See [doc/tech-stack-decisions.md](doc/tech-stack-decisions.md) §9 for full breakdown.
