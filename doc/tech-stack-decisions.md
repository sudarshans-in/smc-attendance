# Tech Stack Decisions — SMC Karmachari

**Version:** 1.0.0
**Last Updated:** March 2026
**Scope:** Mobile framework selection, trade-offs, and future migration paths

---

## 1. The Mobile Framework Landscape

There are fundamentally two architectural approaches to cross-platform mobile development:

```
Web-based (WebView)                   Native-bridge / Compiled
──────────────────────────────        ──────────────────────────────────
Code runs inside a browser            Code compiles to / drives actual
embedded in the app shell             native UI components

Ionic, Capacitor, Cordova             React Native, Expo
                                      Flutter (compiled to native canvas)
                                      .NET MAUI (compiled)
```

**Where Expo sits:** React Native renders actual native Android/iOS components (not a browser). Expo is a framework and toolchain on top of React Native that hides all native build complexity behind a JavaScript API.

```
Our TypeScript code
        ↓
   React Native (JS bridge)
        ↓
 Expo native modules (expo-location, expo-image-picker, expo-secure-store)
        ↓
  Android / iOS native APIs
```

---

## 2. Why Expo Was Chosen for SMC Karmachari

### 2.1 One-day build constraint

Native development requires: Xcode (macOS only), Android Studio, provisioning profiles, signing certificates, ~20 GB of SDK installs, and two separate codebases (Swift for iOS, Kotlin for Android).

With Expo: `npx create-expo-app` → install packages → `npx expo start` → scan QR code. Running on device in under 10 minutes.

### 2.2 Single codebase for both platforms

Field workers use Android. Supervisors or admin staff may use iPhones. One TypeScript codebase in Expo targets both. Without Expo, maintaining feature parity across two native codebases requires double the development effort.

### 2.3 Pre-built native modules match all requirements exactly

| Feature | Expo Package | What it replaces |
|---------|-------------|-----------------|
| GPS attendance | `expo-location` | 200+ lines of Swift + Kotlin location APIs |
| Camera / gallery | `expo-image-picker` | Native camera permissions + system UI |
| Encrypted token storage | `expo-secure-store` | iOS Keychain + Android Keystore APIs |

Without Expo, integrating each of these requires editing `Podfile`, `build.gradle`, `AndroidManifest.xml`, and `Info.plist` — each a potential build-breaking mistake.

### 2.4 Expo Go — instant device testing

During development, field workers or testers scan a QR code from `npx expo start` and run the app immediately — no APK install, no App Store review, no ADB cable. This is how the entire app was tested throughout development.

### 2.5 No macOS required for Android builds

Bare React Native requires Android Studio on any OS, but Xcode (for iOS) requires macOS. Expo's **EAS Build** runs both Android and iOS builds in the cloud — the developer never needs Xcode installed locally.

---

## 3. Trade-offs Accepted

| Limitation | Impact on SMC Karmachari |
|------------|--------------------------|
| Cannot write custom native code | **Low** — `expo-location`, `expo-image-picker`, `expo-secure-store` cover all features in `doc/requirements.md` |
| Larger APK (~60 MB vs ~15 MB bare) | **Acceptable** — field workers install once; storage is not the bottleneck |
| Expo SDK must match Expo Go version | **Caused the 51→54 upgrade** — resolved; `npx expo install --fix` prevents recurrence |
| Certificate pinning unavailable in managed workflow | **Deferred** — noted in `doc/security.md` §3.3; HTTPS is sufficient for current threat model |
| Slower iteration on native features | **Low** — Expo SDK releases are 2–3x per year; we have not hit a gap yet |

---

## 4. Full Framework Comparison

| Factor | **Expo** ✅ | **Ionic + Capacitor** | **Flutter** | **PWA** | **Bare React Native** |
|--------|-----------|----------------------|-------------|---------|----------------------|
| Language | TypeScript | TypeScript / HTML / CSS | **Dart** | TypeScript | TypeScript |
| UI rendering | Native components | **WebView (browser)** | Custom canvas (Skia) | Browser | Native components |
| Performance on budget Android | Good | Moderate — WebView lag | Excellent | Poor | Good |
| GPS support | expo-location ✅ | @capacitor/geolocation ✅ | geolocator ✅ | Limited — no background | react-native-geolocation ✅ |
| Camera support | expo-image-picker ✅ | @capacitor/camera ✅ | image_picker ✅ | Limited | react-native-camera ✅ |
| Secure storage | expo-secure-store ✅ | Community plugin ⚠️ | flutter_secure_storage ✅ | ❌ Not available | react-native-keychain ✅ |
| App Store deployable | ✅ | ✅ | ✅ | ❌ | ✅ |
| Code reuse from current app | 100% | ~60% (UI rewrite) | 0% (full rewrite) | ~70% | 100% |
| Learning curve | Low (React) | Low (web dev) | High (learn Dart) | Lowest | Low + native config |
| Looks/feels native | ✅ | ❌ looks like a website | Close | ❌ | ✅ |
| macOS required for iOS | Via EAS cloud | Via EAS or local | Via EAS or local | No | Via EAS or local |

---

## 5. Ionic + Capacitor — Deep Dive

### Architecture

```
Your Code (HTML + CSS + TypeScript)
        ↓
    WebView (Safari Engine on iOS, Chrome Engine on Android)
        ↓
Capacitor plugin bridge
        ↓
Native OS APIs (GPS, camera, storage, etc.)
```

### Strengths
- Any web developer (HTML/CSS/JS) can contribute — largest available talent pool
- Same codebase can run as a native app **and** as a browser PWA simultaneously
- Strong ecosystem: Angular, React, or Vue all work with Capacitor
- Useful for supervisor dashboards that need to run in a desktop browser

### Key weakness for SMC Karmachari field workers

Budget Android phones (Redmi 9A ~₹6,000, Samsung M02 ~₹7,000, old Realme) have weak GPUs. The WebView rendering layer adds a visible performance penalty — scroll jitter, slower transitions, slightly laggy touch response. For workers who may be older or less tech-comfortable, this friction matters.

React Native (Expo) renders actual native Android `View` components, so it performs identically to a native app on the same hardware.

### Capacitor plugin equivalents

| Feature | Our Expo Package | Capacitor Equivalent |
|---------|-----------------|---------------------|
| GPS | `expo-location` | `@capacitor/geolocation` |
| Camera | `expo-image-picker` | `@capacitor/camera` |
| Secure storage | `expo-secure-store` | `@capacitor-community/secure-storage` ⚠️ community-maintained |

The secure storage plugin is not officially maintained by the Capacitor core team — a risk for a security-critical feature.

---

## 6. Flutter — Deep Dive

### Architecture

```
Dart code
    ↓
Flutter framework
    ↓
Skia / Impeller rendering engine  ← draws everything itself (like a game engine)
    ↓
GPU
```

Flutter does not use native UI components or a WebView. It draws every pixel itself, which gives it the highest performance ceiling of any cross-platform framework.

### Strengths
- Best performance on all devices including very old hardware
- Pixel-perfect UI that looks identical on Android and iOS
- Strong Google backing — used by BMW, eBay, Alibaba in production
- Large and growing ecosystem

### Hard blockers for current migration
- **Full rewrite** — all TypeScript/React code is thrown away; zero code reuse
- **Learn Dart** — a language used almost nowhere outside Flutter; 4–8 weeks to proficiency
- **Timeline:** 3–4 months for a feature-equivalent rewrite
- `src/api/`, `src/context/`, `src/utils/sanitize.ts` — none of this transfers

Flutter is the best long-term technical choice if the team commits to it from the start of a new project.

---

## 7. PWA (Progressive Web App) — Hard Blockers

A PWA is a web app with a `manifest.json` and service worker that can be "installed" from a browser. It is **not viable** for SMC Karmachari:

| Requirement | PWA Status |
|-------------|-----------|
| Background GPS tracking | ❌ Not supported on iOS Safari |
| Hardware-backed secure token storage | ❌ No Keychain/Keystore equivalent — Web Crypto API exists but is not hardware-backed |
| App Store distribution | ❌ Users must know to visit a URL; no Play Store listing |
| Offline attendance submission | ⚠️ Partial — requires service worker caching strategy |
| Camera access | ⚠️ Works but limited file format control |

PWA works well for content apps and supervisor dashboards (read-only, desktop-first). It is not appropriate as the primary interface for field workers who need reliable GPS, camera, and secure credential storage.

---

## 8. Future Migration Paths

### Path A — Eject to Bare React Native

**When to do it:**
- You need a native SDK that has no Expo equivalent (e.g. custom BLE hardware, NFC, advanced biometrics beyond Face ID)
- APK size (~60 MB) becomes a real device storage problem on very old phones
- You need custom Gradle build flavors (e.g. different API URLs per district/ward)

**How:**
```bash
npx expo prebuild
```
This generates `android/` and `ios/` folders. All JavaScript code in `src/` is unchanged — screens, hooks, API layer, context all stay the same. Only the native build config is new.

**New overhead after ejecting:**
- Must edit `AndroidManifest.xml` and `Info.plist` manually for permission strings
- Gradle and CocoaPods maintenance falls to your team
- macOS required for local iOS builds (or continue using EAS cloud builds)
- `npx expo install --fix` no longer works — version compatibility managed manually

**Cost impact:** None (EAS still works for cloud builds). Developer time increases slightly per release.

---

### Path B — Add Ionic for Web Supervisor Portal

**When to do it:**
- Supervisors and ward officers need a desktop browser interface to monitor workers
- You want to avoid building and maintaining a separate React web admin panel

**How it works:**
The current codebase has a clean API layer that can be shared directly:

```
Mobile app (Expo)                   Web supervisor portal (Ionic + React)
─────────────────                   ──────────────────────────────────────
src/api/index.ts      ←─ shared ─→  src/api/index.ts
src/api/client.ts     ←─ shared ─→  src/api/client.ts
src/types/index.ts    ←─ shared ─→  src/types/index.ts
src/utils/sanitize.ts ←─ shared ─→  src/utils/sanitize.ts
                                    (new) Ionic UI components for desktop
```

The mobile app is **not rewritten**. A new Ionic + React project imports the shared business logic, and only the UI layer is new (Ionic components render well in desktop browsers).

**Cost:** Zero additional infrastructure — same backend API, same `USE_MOCK` flag, same `src/constants/config.ts` switch.

---

### Path C — Migrate to Flutter

**When to do it:**
- Team commits to Dart as the primary mobile language
- Starting a v2.0 rewrite with new requirements that justify the investment
- Performance on very old devices becomes unacceptable even with optimisation

**Realistic timeline:**
- Dart + Flutter learning: 4–8 weeks
- Feature-equivalent rewrite of all screens + API layer: 8–12 weeks
- Testing, QA, App Store submission: 2–4 weeks
- **Total: ~3–4 months**

**What transfers:** Nothing from the codebase. The `doc/api-contract.md` backend API spec transfers fully — the same REST endpoints are called from Dart using the `http` or `dio` package.

---

## 9. Production Cost Summary

| Scenario | Monthly | Annual | Notes |
|----------|---------|--------|-------|
| Android-only, NIC hosting, free EAS | ₹0 | ₹0 | Recommended for government apps |
| Android-only, DigitalOcean (1 GB droplet) | ~₹500 | ~₹6,000 | Self-managed, reliable |
| Android + iOS, Railway Hobby backend | ~₹1,000 | ~₹20,400 | Includes Apple $99/yr |
| Full production, AWS, EAS Production plan | ~₹10,000 | ~₹1,20,000 | Enterprise scale |

**One-time costs:**
- Google Play Developer account: $25 (~₹2,100) — no annual renewal
- Apple Developer Program: $99/year (~₹8,400) — required for iOS App Store only

**NIC government cloud (MeghRaj)** is the recommended backend hosting for Indian municipal corporation apps. It is subsidised or free for government bodies and eliminates the recurring backend cost entirely.

**EAS Free plan** (30 builds/month, 1 concurrent build) is sufficient for SMC Karmachari. You only build a new binary when adding a new native package. Routine JavaScript updates go via **EAS Update** (over-the-air) and never require a new build or App Store submission.

---

## 10. Decision Matrix — SMC Karmachari

| Requirement | Expo | Ionic | Flutter | PWA | Bare RN |
|-------------|:----:|:-----:|:-------:|:---:|:-------:|
| Works on ₹5,000–7,000 budget Android phones | ✅ | ⚠️ | ✅ | ❌ | ✅ |
| GPS attendance with error handling | ✅ | ✅ | ✅ | ❌ | ✅ |
| Camera + gallery photo upload | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| Hardware-encrypted token storage | ✅ | ⚠️ | ✅ | ❌ | ✅ |
| Full code reuse from current app | ✅ | ⚠️ 60% | ❌ | ⚠️ 70% | ✅ |
| Can build and ship today | ✅ | ✅ | ❌ | ✅ | ✅ |
| Looks and feels native | ✅ | ❌ | ✅ | ❌ | ✅ |
| App Store distributable | ✅ | ✅ | ✅ | ❌ | ✅ |
| No macOS required (Android builds) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Zero new learning curve | ✅ | ⚠️ | ❌ | ✅ | ⚠️ |

**Verdict:** Expo is the correct choice for SMC Karmachari v1.0. No other option satisfies all requirements without a significant rewrite, learning investment, or unacceptable performance on target hardware.

---

## 11. Key Files Referenced

| File | Relevance |
|------|-----------|
| `src/constants/config.ts` | `USE_MOCK` flag — the one-line switch to activate real backend |
| `src/api/client.ts` | Axios instance + SecureStore token management — reusable in a future Ionic web portal |
| `src/api/index.ts` | The single switch: `USE_MOCK ? mockApi : realApi` |
| `src/utils/sanitize.ts` | Input sanitization — shareable across mobile and any future web portal |
| `doc/security.md` | Certificate pinning deferral (§3.3), backend responsibilities |
| `doc/api-contract.md` | REST API spec — unchanged regardless of which framework calls it |
