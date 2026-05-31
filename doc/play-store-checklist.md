# SMC Karmachari — Google Play Store Release Checklist

**App ID:** `com.smc.karmachari`
**Current version:** 1.0.0 (versionCode 1)
**Last audited:** May 2026

---

## Legend
- ✅ Done
- 🔧 Code change applied (this session)
- 🔴 Blocker — cannot submit without this
- 🟡 Important — fix before real-user rollout
- 📋 One-time setup in Play Console (no code change)

---

## 🔴 Blockers

### 1. Release Keystore — NOT done
The release build is currently signed with `debug.keystore`. Play Store rejects debug-signed builds.
**The key you upload is permanent for this app ID — never lose it.**

```bash
# Generate once, store the .keystore file safely (outside the repo)
keytool -genkey -v -keystore smc-karmachari-release.keystore \
  -alias smc-karmachari -keyalg RSA -keysize 2048 -validity 10000
```

Then add to `android/app/build.gradle`:
```gradle
signingConfigs {
    release {
        storeFile     file('/path/to/smc-karmachari-release.keystore')
        storePassword System.getenv("KEYSTORE_PASS")
        keyAlias      'smc-karmachari'
        keyPassword   System.getenv("KEY_PASS")
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        ...
    }
}
```

Store passwords in environment variables, never commit them.

---

### 2. Android App Bundle (.aab) — NOT done
Since August 2021, Google Play **requires** new apps as `.aab`, not `.apk`.

```bash
nvm use 20
export PATH="$(dirname $(which node)):$PATH"
cd android && ./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

Upload `app-release.aab` to Play Console (not the .apk).

---

### 3. Privacy Policy URL ✅ (page created — needs deployment)
The policy page is hosted at:
```
public/privacy-policy.html  (in world_of_dc_ui)
```
Once the web UI is deployed, the URL will be:
```
https://<web-ui-domain>/privacy-policy.html
```
Paste this URL in Play Console → **App Content → Privacy Policy**.

Covers: data collected, purpose, access levels, storage security, permissions, retention, and contact.

---

### 4. Static OTP Authentication Bypass — NOT done
**See `doc/security.md §2.5` for full details.**

Backend accepts OTP `"24052026"` for any mobile number permanently. Any person who knows a worker's phone number can log in as that worker. Must fix before real workers use the app.

**Action:** Integrate a real SMS OTP provider in `WorkerService.java` (`world_of_dc` backend). The two-step API contract (`/auth/send-otp` → `/auth/login`) is already in place — only the `sendOtp()` body needs replacing.

---

## 🔧 Code Changes Applied

### 5. Remove Unused Permissions ✅ (applied this session)
Removed three permissions that were declared but never used (gallery access was intentionally removed from the app):
- `WRITE_EXTERNAL_STORAGE`
- `READ_EXTERNAL_STORAGE`
- `READ_MEDIA_IMAGES`

**File:** `android/app/src/main/AndroidManifest.xml`

---

### 6. Fix `allowBackup` + Remove Stale Expo Strings ✅ (applied this session)
- `android:allowBackup="false"` — prevents ADB and Google Auto Backup of app data
- Removed leftover Expo strings (`expo_splash_screen_*`) from `strings.xml`

**Files:** `AndroidManifest.xml`, `res/values/strings.xml`

---

### 7. Enable Code Minification ✅ (applied this session)
Enabled R8 minification and resource shrinking for release builds.
Reduces APK/bundle size and obfuscates the JS bundle.

**File:** `android/gradle.properties`

---

## 📋 Play Console Setup (one-time, no code changes)

| Item | Notes |
|------|-------|
| App icon (512×512 PNG) | Export from `mipmap-xxxhdpi/ic_launcher.png` and scale up, or regenerate at 512px |
| Feature graphic (1024×500 PNG) | Banner image shown on store listing — create separately |
| Phone screenshots (min 2) | Take from physical device or emulator after final build |
| Short description (≤ 80 chars) | e.g. "GPS attendance & work photo tracking for SMC field workers" |
| Full description | Explain purpose, features, who it's for |
| Content rating | Complete the questionnaire → will be rated "Everyone" |
| Category | `Business` or `Tools` |
| Privacy policy URL | See blocker #3 above |
| Target audience | Adults (government employee app) |
| App access | Explain that login requires an account created by an SMC supervisor |

---

## ✅ Already Good — No Action Needed

| Check | Detail |
|-------|--------|
| `USE_MOCK: false` | Production API is active |
| `targetSdkVersion 35` | Meets Play Store requirement (API 34+) |
| `minSdkVersion 24` (Android 7.0) | ~99% device coverage |
| Hermes JS engine | Enabled — better performance and startup |
| HTTPS-only API | `https://world-of-dc-election.onrender.com` |
| Portrait orientation locked | No landscape edge cases |
| No `console.log` in source | Clean production output |
| Package ID `com.smc.karmachari` | Unique, follows reverse-domain convention |
| App name `SMC Karmachari` | Set in `strings.xml` |
| Signup removed | Accounts created by supervisor via web UI only |
| `versionCode 1`, `versionName "1.0.0"` | Valid for first release |
| `newArchEnabled=false` | Stable React Native architecture |

---

## Pre-submission Build Checklist

Run these steps in order before uploading to Play Console:

```bash
# 1. Switch to correct Node version
nvm use 20
export PATH="$(dirname $(which node)):$PATH"

# 2. Clean previous build
cd android && ./gradlew clean

# 3. Build the release bundle (not APK)
./gradlew bundleRelease

# 4. Verify the output exists
ls -lh app/build/outputs/bundle/release/app-release.aab

# 5. (Optional) Test the release APK on a device first
./gradlew assembleRelease
adb install app/build/outputs/apk/release/app-release.apk
```

Verify on device before uploading:
- [ ] Login works with a real worker mobile number
- [ ] Attendance mark-in captures GPS and photo
- [ ] Attendance mark-out works
- [ ] Work photo upload works
- [ ] Admin tab shows for admin users, hidden for regular workers
- [ ] No-squad warning banner shows for unassigned workers
- [ ] Dark mode toggle works
- [ ] App locks after 30s in background (biometric unlock)

---

## Version History

| versionCode | versionName | Notes |
|-------------|-------------|-------|
| 1 | 1.0.0 | Initial release — internal testing only |

*Increment `versionCode` by 1 for every upload to Play Console. `versionName` follows semver.*
