# SMC Karmachari App — Setup Guide

This is the quick-start setup guide. For a detailed walkthrough including explanations of the codebase, read [doc/fresher-guide.md](doc/fresher-guide.md).

---

## Prerequisites

### 1. Install Node 20

```bash
# Install nvm if not already installed
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Open a new terminal, then:
nvm install 20
nvm use 20
nvm alias default 20

# Verify
node --version   # v20.x.x
npm --version    # 10.x
```

### 2. Install Android Studio

Download from https://developer.android.com/studio
- Installation type: **Standard**
- During setup, install: Android SDK, Android Emulator, Android Virtual Device

After installation:
- Open **More Actions → SDK Manager**
- Install **Android 14 (API 35)** — check the box and click Apply

### 3. Set Android SDK path

Create the file `android/local.properties` in this project:

```
sdk.dir=/Users/<your-username>/Library/Android/sdk
```

Replace `<your-username>` with your macOS username (run `echo $HOME` to find it).

### 4. Install Watchman (recommended)

```bash
brew install watchman
```

---

## Running the App

### Install dependencies

```bash
nvm use 20
cd mobile-attendance
npm install
```

### Terminal 1 — Start Metro bundler

```bash
nvm use 20
npx react-native start --reset-cache
```

### Terminal 2 — Build and run on device/emulator

```bash
export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"
cd android
./gradlew installDebug
```

Or using the React Native CLI (requires device connected):

```bash
nvm use 20
npx react-native run-android
```

---

## Build a shareable APK

No cloud service needed. Build locally:

```bash
# Debug APK (for testing)
export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"
cd android && ./gradlew assembleDebug
# → android/app/build/outputs/apk/debug/app-debug.apk

# Release APK (for distribution)
export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"
cd android && ./gradlew assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk
```

Share the APK file directly — no Expo account, no Play Store, no QR code required.

---

## Switching to Real Backend

When the backend API is ready:

1. Open `src/constants/config.ts`
2. Change `USE_MOCK: true` → `USE_MOCK: false`
3. Update `API_BASE_URL` to the real server URL
4. Implement `src/api/realApi.ts` to match the signatures in `doc/api-contract.md`

---

## Test Login (Mock Data)

| Mobile | Name | isAdmin |
|--------|------|---------|
| 9876543210 | Raju Das | Yes |
| 9876543211 | Mina Begum | No |
| 9876543212 | Suresh Nath | No |
| 9876543213 | Anita Roy | No |
| 9876543214 | Kamal Singh | No |

Any other 10-digit number will redirect to the Signup screen.
