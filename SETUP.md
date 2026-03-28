# SMC Karmachari App — Setup Guide

## Prerequisites

### 1. Install Node 18 (required by Expo SDK 51)

```bash
# Install nvm if not already installed
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Open a new terminal, then:
nvm install 18
nvm use 18
nvm alias default 18

# Verify
node --version   # v18.x.x
npm --version    # 9.x or 10.x
```

### 2. Install Expo CLI

```bash
npm install -g expo-cli
```

---

## Running the App

### Install dependencies

```bash
cd mobile-attendance
npm install
```

### Start the dev server

```bash
npm start
# or
npx expo start
```

### Run on Android

```bash
npm run android
# Requires: Android Studio + emulator, OR Expo Go app on a real device
```

### Run on iOS (macOS only)

```bash
npm run ios
# Requires: Xcode + iOS Simulator, OR Expo Go app on iPhone
```

### Run on real device (easiest)

1. Install **Expo Go** from Play Store / App Store
2. Run `npm start`
3. Scan the QR code shown in the terminal

---

## Project Structure

```
src/
├── constants/    # Colors, strings, config (change USE_MOCK here)
├── types/        # TypeScript interfaces
├── mock/         # Mock API data + functions
├── api/          # API switch layer (mock ↔ real)
├── context/      # Auth + App state
├── hooks/        # useLocation, useCamera
├── navigation/   # Root, Auth, App navigators
├── screens/      # All app screens
└── components/   # Reusable UI components
```

---

## Switching to Real Backend

When the backend API is ready:

1. Open `src/constants/config.ts`
2. Change `USE_MOCK: true` → `USE_MOCK: false`
3. Update `API_BASE_URL` to the real server URL
4. Implement `src/api/realApi.ts` with fetch calls to match the mock API signatures

---

## Test Login (Mock Data)

The following mobile numbers are pre-seeded and work for login:

| Mobile | Name |
|--------|------|
| 9876543210 | Raju Das |
| 9876543211 | Mina Begum |
| 9876543212 | Suresh Nath |
| 9876543213 | Anita Roy |
| 9876543214 | Kamal Singh |

Any other 10-digit number will redirect to the Signup screen.

---

## Build for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Configure project
eas build:configure

# Build Android APK
eas build --platform android --profile preview

# Build iOS IPA
eas build --platform ios
```
