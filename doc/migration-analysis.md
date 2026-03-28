# Migration Analysis — Expo → Bare React Native

**Version:** 2.0.0
**Last Updated:** March 2026
**Status:** COMPLETED — project is now running on bare React Native

---

## Summary

The SMC Karmachari app was fully migrated from Expo managed workflow to bare React Native in March 2026. This document records the analysis that led to the decision and the complete change log.

**Outcome:** Zero Expo dependencies remain. APKs are built locally with Gradle. No EAS account, no build quota, no Expo SDK upgrade cycle.

---

## 1. Why We Migrated

Expo is three separate things. The concerns applied differently to each:

| Component | License | Cost | Lock-in Risk |
|-----------|---------|------|-------------|
| Expo SDK packages (`expo-location`, `expo-image-picker`, `expo-secure-store`) | MIT | Free | None — open source |
| EAS Build (cloud build service) | Proprietary SaaS | Free: 30 builds/month · $99/month paid | **Medium** — can bypass with local builds |
| Expo Go + SDK version matching | Proprietary | Free | **Medium** — forced upgrades caused the 51→54 migration |
| React Native (underlying runtime) | MIT | Free | None |

The two real concerns were:
1. **EAS Build** — cloud service required to build APKs without setting up Android Studio locally
2. **Expo Go SDK cycle** — the app must be upgraded every ~6 months when Expo releases a new SDK, or Expo Go stops running it (this caused our forced SDK 51→54 upgrade)

---

## 2. What Was Changed

### Package replacements

| Removed (Expo) | Replaced with | License | Notes |
|---------------|--------------|---------|-------|
| `expo-location` | `react-native-geolocation-service` | MIT | Same API shape, `PermissionsAndroid` for permissions |
| `expo-image-picker` | `react-native-image-picker` | MIT | `launchCamera` / `launchImageLibrary` functions |
| `expo-secure-store` | `react-native-keychain` | MIT | `getGenericPassword` / `setGenericPassword` / `resetGenericPassword` |
| `@expo/vector-icons` | `react-native-vector-icons` | MIT | Same icon names — just an import path change |
| `expo-status-bar` | `react-native` StatusBar | MIT | Built into React Native core |
| Expo managed build | Gradle local build | — | `./gradlew assembleDebug` |

### Files rewritten

| File | Change | Lines affected |
|------|--------|---------------|
| `src/hooks/useLocation.ts` | `expo-location` → `react-native-geolocation-service` + `PermissionsAndroid` | Full rewrite (~40 lines) |
| `src/hooks/useCamera.ts` | `expo-image-picker` → `react-native-image-picker` + `PermissionsAndroid` | Full rewrite (~40 lines) |
| `src/context/AuthContext.tsx` | `expo-secure-store` → `react-native-keychain` (3 calls) | 3 lines changed |
| `src/api/client.ts` | `expo-secure-store` → `react-native-keychain` (3 calls) | 3 lines changed |
| `App.tsx` | `expo-status-bar` → `react-native` StatusBar | 1 line changed |
| 9 screens/components | `@expo/vector-icons` → `react-native-vector-icons` | 1 import line each |

### Files created (bare RN requires these)

| File | Purpose |
|------|---------|
| `index.js` | AppRegistry entry point (gesture-handler must be first import) |
| `metro.config.js` | Metro bundler config using `@react-native/metro-config` |
| `android/local.properties` | Android SDK path for local builds (gitignored) |

### Files updated

| File | What changed |
|------|-------------|
| `package.json` | Removed all `expo-*` packages; added community replacements; changed scripts to `react-native start` / `react-native run-android` |
| `babel.config.js` | `babel-preset-expo` → `@react-native/babel-preset` |
| `tsconfig.json` | Removed `extends: expo/tsconfig.base`; standalone config |
| `android/settings.gradle` | Added RN Gradle plugin + autolinking via `autolinkLibrariesFromCommand()` |
| `android/build.gradle` | Removed Expo classpath; standard RN project-level Gradle |
| `android/app/build.gradle` | Standard RN app Gradle; added vector icons font link; fixed `entryFile` to `../../index.js` |
| `android/app/src/main/java/.../MainActivity.kt` | Removed `expo.modules.ReactActivityDelegateWrapper`; standard `DefaultReactActivityDelegate` |
| `android/app/src/main/java/.../MainApplication.kt` | Removed `expo.modules.ReactNativeHostWrapper` + `ApplicationLifecycleDispatcher`; standard `DefaultReactNativeHost`; fixed `getJSMainModuleName` from `.expo/.virtual-metro-entry` → `index` |
| `android/app/src/main/AndroidManifest.xml` | Removed Expo Updates meta-data; changed `MainActivity` theme to `AppTheme` |

### Files unchanged

Everything else — all screens, navigation, context, types, utilities, components, API layer, mock data — was completely untouched. ~95% code reuse.

---

## 3. Keychain API Reference

The `expo-secure-store` API was replaced with `react-native-keychain`. The mapping:

**Session storage (AuthContext.tsx):**
```ts
// Before (expo-secure-store)
await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(user));
const value = await SecureStore.getItemAsync(SESSION_KEY);
await SecureStore.deleteItemAsync(SESSION_KEY);

// After (react-native-keychain)
const SESSION_SERVICE = 'safai_karmachari';
const SESSION_ACCOUNT = 'auth_user';
await Keychain.setGenericPassword(SESSION_ACCOUNT, JSON.stringify(user), { service: SESSION_SERVICE });
const creds = await Keychain.getGenericPassword({ service: SESSION_SERVICE });
const value = creds ? creds.password : null;
await Keychain.resetGenericPassword({ service: SESSION_SERVICE });
```

**Token storage (client.ts):**
```ts
// Before (expo-secure-store)
await SecureStore.setItemAsync(TOKEN_KEY, token);
const token = await SecureStore.getItemAsync(TOKEN_KEY);
await SecureStore.deleteItemAsync(TOKEN_KEY);

// After (react-native-keychain)
const TOKEN_SERVICE = 'safai_karmachari_token';
const TOKEN_ACCOUNT = 'auth_token';
await Keychain.setGenericPassword(TOKEN_ACCOUNT, token, { service: TOKEN_SERVICE });
const creds = await Keychain.getGenericPassword({ service: TOKEN_SERVICE });
const token = creds ? creds.password : null;
await Keychain.resetGenericPassword({ service: TOKEN_SERVICE });
```

---

## 4. Build Commands After Migration

### Development

```bash
# Terminal 1 — Metro bundler
nvm use 20
npx react-native start --reset-cache

# Terminal 2 — Install on device
export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"
cd android && ./gradlew installDebug
```

### APK builds (no cloud service)

```bash
# Debug APK
export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"
cd android && ./gradlew assembleDebug
# → android/app/build/outputs/apk/debug/app-debug.apk

# Release APK (requires signing keystore — see doc/fresher-guide.md §8)
export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"
cd android && ./gradlew assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk
```

---

## 5. Known Issues Resolved During Migration

| Issue | Root cause | Fix |
|-------|-----------|-----|
| `autolinkLibrariesFromCommand()` wrong signature | Method takes `List<String>` command + `File` workingDirectory | Pass npx as list: `["/usr/local/bin/npx", "@react-native-community/cli", "config"]` |
| Gradle picks up Node 14 | Gradle subprocess doesn't inherit nvm PATH | `export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"` before Gradle |
| `compileSdk` not resolved | `rootProject.ext.*` variables not available yet | Hardcode values directly in `android/app/build.gradle` |
| `Plugin 'com.facebook.react.rootproject' not found` | Applied via `apply plugin:` instead of `plugins {}` block | Use `plugins { id("com.facebook.react.rootproject") }` |
| MainActivity.kt compilation error | Expo `ReactActivityDelegateWrapper` import | Replaced with standard `DefaultReactActivityDelegate` |
| MainApplication.kt compilation error | Expo `ReactNativeHostWrapper` + `ApplicationLifecycleDispatcher` imports | Replaced with standard `DefaultReactNativeHost` + `DefaultReactHost.getDefaultReactHost()` |
| Wrong JS entry module | `getJSMainModuleName()` returned `.expo/.virtual-metro-entry` | Changed to `"index"` |

---

## 6. Options That Were Considered But Not Taken

### Ionic + Capacitor

Would require rewriting all 6 screens (React Native Paper → Ionic components), both hooks, and navigation. ~40% code reuse. WebView rendering is worse on the target hardware (₹5,000–7,000 budget Android). Community-maintained secure storage plugin is a risk. **Not recommended for mobile field app.**

Best use: a browser-based supervisor dashboard built alongside this app, sharing the `src/api/`, `src/types/`, and `src/utils/sanitize.ts` layers.

### Flutter

Full rewrite in Dart — 0% code reuse, 3–4 months effort including Dart learning. Best performance ceiling. **Only viable for a v2.0 rebuild with full team commitment to Dart.**

---

## 7. Related Documents

| Document | Relevance |
|----------|-----------|
| `doc/tech-stack-decisions.md` | Original framework comparison and why Expo was initially chosen |
| `doc/architecture.md` | Updated architecture reflecting bare React Native |
| `doc/security.md` | Secure storage requirements — drove choice of react-native-keychain |
| `doc/api-contract.md` | REST API spec — unchanged by this migration |
| `doc/fresher-guide.md` | Setup and development guide for new team members |
