# Fresher's Guide — SMC Karmachari App

Welcome to the project. This guide explains everything you need to know to set up your machine, understand the codebase, and start contributing — even if this is your first React Native project.

**Read this entire document before writing any code.**

---

## 1. What This App Does

The **SMC Karmachari** app is used by sanitation workers (Safai Karmacharis) of Silchar Municipal Corporation. Every day, workers:

1. Open the app and tap **Mark Attendance** — this records their GPS location and time
2. Take photos of completed work and upload them with location and notes
3. Tap **End Shift** at end of day

Admins (supervisors) use the same app to:
- See all workers and their attendance status
- Review uploaded work photos

The app works offline with mock data. The real backend API is not yet connected.

---

## 2. Technology Stack

| Layer | What we use | Why |
|-------|-------------|-----|
| Framework | React Native 0.81 (bare) | Native Android components, no browser/WebView |
| Language | TypeScript | Catches bugs before runtime |
| UI | React Native Paper v5 | Material Design 3, accessible, thumb-friendly |
| Navigation | React Navigation v6 | Stack (login flow) + Bottom Tabs (main app) |
| HTTP | Axios | JWT auth interceptors, clean error handling |
| State | React Context + useReducer | Simple, no extra libraries |
| Secure Storage | react-native-keychain | Uses Android Keystore hardware encryption for tokens |
| GPS | react-native-geolocation-service | Android fine location |
| Camera | react-native-image-picker | Camera and gallery with permissions |
| Icons | react-native-vector-icons | MaterialCommunityIcons |
| Build system | Gradle (Android) | Standard Android build tool |

**This is a bare React Native project** — it has a real `android/` folder with Kotlin and Gradle files. There is no Expo, no Expo Go, and no EAS Build required.

---

## 3. Setting Up Your Machine

### Step 1 — Install nvm and Node 20

```bash
# Install nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Close and reopen terminal, then:
nvm install 20
nvm use 20
nvm alias default 20

# Verify
node --version   # must be v20.x.x
```

> If you ever see the error `toReversed is not a function` or `Cannot find module 'node:assert'`, it means you're on the wrong Node version. Run `nvm use 20` and try again.

### Step 2 — Install Android Studio

1. Download from https://developer.android.com/studio
2. Run the installer → choose **Standard** installation
3. Wait for Android Studio to finish downloading SDK components (this takes 10–20 minutes)

After installation:
- Open Android Studio
- Click **More Actions → SDK Manager**
- Under **SDK Platforms**, tick **Android 14 (API Level 35)**
- Click **Apply** → **OK** to download

### Step 3 — Tell the project where your Android SDK is

Find your Android SDK path. On Mac it is usually:
```
/Users/YOUR_USERNAME/Library/Android/sdk
```

Create the file `android/local.properties` in this project (it's already gitignored):
```
sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
```

Replace `YOUR_USERNAME` with your actual username. Run `echo $HOME` if unsure.

### Step 4 — Install Watchman

Watchman watches files for changes and speeds up the Metro bundler:

```bash
brew install watchman
```

### Step 5 — Install project dependencies

```bash
cd mobile-attendance
nvm use 20
npm install
```

---

## 4. Running the App in Development

You need **two terminal windows** open at the same time.

### Terminal 1 — Metro bundler (JavaScript server)

```bash
nvm use 20
npx react-native start --reset-cache
```

Leave this running. It serves your JavaScript to the Android app. When you save a file, the app reloads automatically.

### Terminal 2 — Build and install on Android

If you have a physical phone connected via USB:

```bash
export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"
cd android
./gradlew installDebug
```

Or using the React Native CLI:

```bash
nvm use 20
npx react-native run-android
```

The first build takes 3–5 minutes (Gradle downloads dependencies). Subsequent builds are faster.

> **Why `export PATH` before Gradle?** Gradle runs as a background process that doesn't automatically inherit nvm's Node path. The export command ensures Gradle finds Node 20, not the system Node 14.

### Connecting a physical Android phone

1. On your phone: **Settings → About phone → tap "Build number" 7 times** → "You are now a developer"
2. **Settings → Developer options → enable USB Debugging**
3. Connect phone via USB cable (use a data cable, not charge-only)
4. On the phone: tap **Allow** on the USB debugging popup
5. Verify: `~/Library/Android/sdk/platform-tools/adb devices` should show your device

If you see `unauthorized` instead of `device`, check your phone screen for the Allow popup.

---

## 5. Understanding the Codebase

### The single most important file

Open `src/constants/config.ts`. It has one flag that controls everything:

```ts
USE_MOCK: true   // ← the app uses fake data, no server needed
USE_MOCK: false  // ← the app talks to the real backend API
```

Leave it as `true` while developing. When the backend is ready, flip it to `false`.

### How data flows through the app

```
Screen (e.g. HomeScreen.tsx)
    ↓ calls
src/api/index.ts  ← this is the ONLY place screens talk to data
    ↓ routes to
mockApi.ts   (if USE_MOCK = true)  → reads/writes AsyncStorage
realApi.ts   (if USE_MOCK = false) → makes HTTP calls via client.ts
```

**Never import from `mockApi.ts` or `realApi.ts` directly in screens.** Always go through `src/api/index.ts`.

### How login/session works

```
User logs in → LoginScreen calls api.loginUser()
    → AuthContext stores user in react-native-keychain (hardware-encrypted)
    → isAuthenticated becomes true
    → RootNavigator switches from Auth stack to App tabs
```

The token (JWT) is stored by `src/api/client.ts` using react-native-keychain. It's automatically attached to every API request via the Axios interceptor.

### Navigation structure

```
RootNavigator
├── [loading]         LoadingOverlay (reading saved session)
├── [not logged in]   AuthNavigator
│                        ├── LoginScreen
│                        └── SignupScreen
└── [logged in]       AppNavigator (Bottom Tabs)
                         ├── Home
                         ├── Upload
                         ├── History
                         └── Admin  ← only visible if user.isAdmin = true
```

### User roles

There are only two roles:

| `user.isAdmin` | What they see |
|----------------|---------------|
| `false` | 3 tabs: Home, Upload, History |
| `true` | 4 tabs: Home, Upload, History, Admin |

The Admin tab has **two guards** — one in the navigator (hides the tab) and one in the screen itself (blocks rendering). Both must pass. The backend also enforces this — the frontend guard is just convenience.

---

## 6. Key Rules — Never Break These

These rules exist for security and reliability. Breaking them can cause data loss or security holes.

| Rule | Why |
|------|-----|
| Never use `AsyncStorage` for tokens or user session | Unencrypted — anyone with root access can read it |
| Always sanitize inputs before API calls | Use `src/utils/sanitize.ts` — prevents injection attacks |
| Always import API functions from `src/api/index.ts` | Maintains the mock/real switch |
| Never hardcode strings in JSX | Use `src/constants/strings.ts` — required for future translation |
| Never hardcode colours | Use `src/constants/colors.ts` — required for brand consistency |
| Never store images as base64 | Memory crash on old Android devices — use file URI |

---

## 7. Making Changes

### Changing UI text

All user-visible text lives in `src/constants/strings.ts`. Find the key there and update it. Never write a string directly in a `.tsx` file.

### Adding a new screen

1. Create the file in `src/screens/<section>/YourScreen.tsx`
2. Add it to the navigator in `src/navigation/AppNavigator.tsx` (or `AuthNavigator.tsx`)
3. Add any navigation types to the existing navigator types

### Adding a new API function

1. Add the mock version to `src/mock/mockApi.ts`
2. Add the real version to `src/api/realApi.ts` (same function signature)
3. Both are automatically available via `src/api/index.ts` — no changes needed there

### Changing colours

Only edit `src/constants/colors.ts`. Every screen and component uses `Colors.*`.

---

## 8. Building an APK to Share

You don't need any cloud service, Expo account, or EAS CLI. Build locally:

### Debug APK (for testing)

```bash
export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"
cd android
./gradlew assembleDebug
```

The APK is at: `android/app/build/outputs/apk/debug/app-debug.apk`

Share it via Google Drive, WhatsApp, email — anyone can install it on Android.

To install: copy APK to phone → open it → **Settings → Security → Install from unknown sources** if prompted.

### Release APK (for final distribution)

You need a signing keystore. Generate one:

```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore android/app/smc-karmachari.keystore \
  -alias smc-karmachari \
  -keyalg RSA -keysize 2048 -validity 10000
```

Then add to `android/app/build.gradle` under `signingConfigs`:

```groovy
release {
    storeFile file('smc-karmachari.keystore')
    storePassword 'YOUR_STORE_PASSWORD'
    keyAlias 'smc-karmachari'
    keyPassword 'YOUR_KEY_PASSWORD'
}
```

Then build:

```bash
export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"
cd android
./gradlew assembleRelease
```

> Keep the keystore file and passwords safe. You need the same keystore for every future update — losing it means you cannot update the app on devices that have the old version installed.

---

## 9. Common Errors and Fixes

| Error message | What it means | Fix |
|---------------|---------------|-----|
| `toReversed is not a function` | Wrong Node version | `nvm use 20` |
| `Cannot find module 'node:assert'` | Wrong Node version | `nvm use 20` |
| `SDK location not found` | `local.properties` missing | Create `android/local.properties` with your SDK path |
| `No connected devices!` | Phone not detected | Check USB debugging; run `adb devices` |
| `EMFILE: too many open files` | Watchman not installed | `brew install watchman` |
| `error: unknown command 'start'` | Using old Expo command | Use `npx react-native start`, not `npx expo start` |
| `Invariant Violation` | gesture-handler not first | Check `react-native-gesture-handler` is imported first in `index.js` |
| Gradle picks up Node 14 | nvm not on Gradle's PATH | Add `export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"` before Gradle |
| `adb: command not found` | ADB not on PATH | Use full path: `~/Library/Android/sdk/platform-tools/adb devices` |

---

## 10. Project Conventions

- **TypeScript strict mode** is on — no `any` types, no ignoring errors
- **Minimum button height: 56dp** — field workers may wear gloves
- **Minimum font size: 16sp** — readable in outdoor sunlight
- **Light mode only** — forced, no dark mode toggle
- **Max 2–3 actions per screen** — simple UI for low-tech users
- All buttons need `accessibilityLabel` prop

---

## 11. Where Things Live

| I want to... | Look in... |
|-------------|-----------|
| Change a UI string | `src/constants/strings.ts` |
| Change a colour | `src/constants/colors.ts` |
| Change API URL or switch mock/real | `src/constants/config.ts` |
| Add or change an API function | `src/mock/mockApi.ts` AND `src/api/realApi.ts` |
| Change navigation or add a screen | `src/navigation/AppNavigator.tsx` |
| Change login flow | `src/context/AuthContext.tsx` |
| Change GPS logic | `src/hooks/useLocation.ts` |
| Change camera logic | `src/hooks/useCamera.ts` |
| Change Android permissions | `android/app/src/main/AndroidManifest.xml` |
| Change app icon or name | `android/app/src/main/res/` |
| Read the API spec | `doc/api-contract.md` |
| Understand the architecture | `doc/architecture.md` |

---

## 12. Getting Help

- Read `CLAUDE.md` — the AI assistant file, but it's also the best single-page project reference
- Read `doc/architecture.md` for design decisions and diagrams
- Read `doc/api-contract.md` before working on anything that talks to the backend
- Read `doc/security.md` before changing anything related to login, tokens, or permissions
