# SMC Karmachari — Google Play Store Publication Guide

**App ID:** `com.smc.karmachari`  
**App name:** SMC Karmachari  
**Version:** 1.0.0 (versionCode 1)  
**AAB:** `android/app/build/outputs/bundle/release/app-release.aab` (23 MB)  
**Privacy policy:** `https://world-of-dc-election.onrender.com/privacy-policy.html`

---

## Status at a Glance

| Item | Status |
|------|--------|
| Release keystore | ✅ Done |
| Signed .aab bundle | ✅ Done |
| Privacy policy URL | ✅ Live |
| Permissions cleaned | ✅ Done |
| Code minification | ✅ Done |
| `allowBackup=false` | ✅ Done |
| Google Developer account | ⬜ You do this |
| Store assets (icon, screenshots) | ⬜ You do this |
| Static OTP fix | ⚠️ Before real users |

---

## Phase 1 — Create Google Play Developer Account

> One-time setup. Takes 1–2 days for verification. Cost: **$25 USD** (one-time, non-refundable).

- [ ] **1.1** Go to `play.google.com/console`
- [ ] **1.2** Sign in with a Google account
  - Use a dedicated organisational account (e.g. `smckarmachari.app@gmail.com`) rather than a personal one — this account owns the app permanently
- [ ] **1.3** Click **Get started** → choose **Organization** as the account type (not Individual — this is a government/municipal app)
- [ ] **1.4** Fill in organisation details:
  - Organisation name: `Silchar Municipal Corporation`
  - Website: your official SMC website URL (or leave the Render URL)
  - Address: SMC office address, Silchar, Assam
- [ ] **1.5** Pay the **$25 registration fee** via credit/debit card
- [ ] **1.6** Complete **identity verification** — Google may ask for:
  - Government photo ID (passport, Aadhaar, or driving licence)
  - A selfie or video confirmation
  - This step can take **24–48 hours**
- [ ] **1.7** Accept the **Google Play Developer Distribution Agreement**
- [ ] **1.8** Account is now active — you'll see the Play Console dashboard

---

## Phase 2 — Prepare Store Assets

> Create these before going to Play Console. You cannot save the store listing without them.

### 2.1 App Icon — 512 × 512 PNG
Generate at 512px from the same icon script:

```bash
cd /path/to/mobile-attendance
source /tmp/icon_venv2/bin/activate   # or recreate the venv
python3 /tmp/generate_icon_v3.py      # edit SIZES to add 512px output
```

Or open `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` (192px) in any image editor and upscale to 512×512 with no background — Play Console accepts it.

- [ ] Icon is exactly 512×512 px
- [ ] PNG format, no transparency (must have solid background)
- [ ] File size under 1 MB

### 2.2 Feature Graphic — 1024 × 500 PNG
This is the banner shown at the top of your store listing. Use any image editor (Canva, Figma, etc.):

- Background: `#1A3C6E` (the app's civic blue)
- App name: **SMC Karmachari** in white, large
- Tagline: **"GPS Attendance & Work Tracking"** in smaller white text
- App icon centred or right-aligned
- No rounded corners — Play Console clips it

- [ ] Feature graphic is exactly 1024×500 px
- [ ] PNG or JPG, under 1 MB

### 2.3 Phone Screenshots — minimum 2, maximum 8
Take screenshots from your test device (the APK you already installed):

Suggested screens to capture:
1. Login screen
2. Home screen (attendance card — before login)
3. Home screen (after marking attendance — showing green status)
4. Upload photo screen
5. History screen
6. Admin screen (attendance view)
7. Admin screen (photo grid)

- [ ] At least 2 screenshots captured
- [ ] PNG or JPG
- [ ] Between 320px and 3840px on any side
- [ ] Aspect ratio between 16:9 and 2:1

### 2.4 Store Description Text

**Short description (max 80 characters):**
```
GPS attendance & work photo tracking for SMC field workers
```
(58 characters — fits)

**Full description (max 4000 characters):**
```
SMC Karmachari is the official attendance and work-tracking app for 
Silchar Municipal Corporation (SMC) field workers and Safai Karmacharis.

FEATURES FOR FIELD WORKERS
• Mark daily attendance with GPS location verification
• Upload work-progress photos with automatic geo-tagging
• View personal attendance history and work photo log
• Secure login via mobile number OTP

FEATURES FOR SUPERVISORS
• View squad attendance status in real time
• Browse today's work photos uploaded by squad members
• Tap any photo for full-screen view with uploader name and timestamp

SECURITY
• All data transmitted over HTTPS (TLS encrypted)
• Session tokens stored in Android Keystore (hardware-encrypted)
• Biometric app lock — automatically locks after 30 seconds in background

ACCESS
This app is for registered SMC employees only. Accounts are created 
by supervisors through the DC Office web portal. Download the app and 
contact your supervisor to receive your registered mobile number.

Developed for the Cachar District Office, Government of Assam.
```

- [ ] Short description written (≤ 80 chars)
- [ ] Full description written (≤ 4000 chars)

---

## Phase 3 — Create the App in Play Console

- [ ] **3.1** In Play Console, click **Create app**
- [ ] **3.2** Fill in:
  - App name: `SMC Karmachari`
  - Default language: `English (India) - en-IN`
  - App or game: **App**
  - Free or paid: **Free**
- [ ] **3.3** Accept the declarations (no malware, accurate metadata)
- [ ] **3.4** Click **Create app** — you are now on the app's dashboard

---

## Phase 4 — Store Listing

> Dashboard → **Grow** → **Store presence** → **Main store listing**

- [ ] **4.1** Upload app icon (512×512 PNG)
- [ ] **4.2** Upload feature graphic (1024×500 PNG)
- [ ] **4.3** Upload at least 2 phone screenshots
- [ ] **4.4** Enter short description
- [ ] **4.5** Enter full description
- [ ] **4.6** Save — green tick appears on Store listing in the left menu

---

## Phase 5 — App Content & Compliance

> Dashboard → **Policy** → **App content**

Work through each section:

### 5.1 Privacy Policy
- [ ] Enter URL: `https://world-of-dc-election.onrender.com/privacy-policy.html`

### 5.2 App Access
- [ ] Select: **All or some functionality is restricted**
- [ ] Add instructions:
  ```
  This app requires an account created by an SMC supervisor.
  Test credentials: Mobile: 9876543210 | OTP: 24052026
  (These are test accounts pre-loaded for review purposes)
  ```

### 5.3 Ads
- [ ] Select: **No, my app does not contain ads**

### 5.4 Content Rating
- [ ] Click **Start questionnaire**
- [ ] Category: **Utilities**
- [ ] Answer all questions (violence: No, sexual content: No, language: No, etc.)
- [ ] Submit → rating will be **Everyone (E)**

### 5.5 Target Audience
- [ ] Age group: **18 and over**
- [ ] Confirm: app is not designed for children

### 5.6 Data Safety
This is the most important section — Google will flag if it doesn't match your privacy policy.

- [ ] **Location** → Yes, collected → Approximate + Precise → Required → Not shared with 3rd parties → Encrypted in transit → User can request deletion
- [ ] **Photos and videos** → Yes, collected → Photos → Required → Not shared → Encrypted → User can request deletion
- [ ] **Personal info** → Yes → Name, Phone number → Required → Not shared → Encrypted → User can request deletion
- [ ] **App activity** → Yes → App interactions (attendance records) → Required → Not shared → Encrypted → User can request deletion
- [ ] No financial info, health info, contacts, SMS, or browser history collected
- [ ] Save

### 5.7 Government Apps Declaration
- [ ] If prompted, confirm this is a **government-affiliated app** (municipal corporation)

---

## Phase 6 — Upload the App Bundle

> Dashboard → **Release** → **Testing** → **Internal testing** → **Create new release**

Start with **Internal testing** — fastest review (no Google review required), lets you test the Play Store flow end-to-end before going to production.

- [ ] **6.1** Click **Create new release**
- [ ] **6.2** Under **App bundles**, click **Upload**
  - Upload: `android/app/build/outputs/bundle/release/app-release.aab`
- [ ] **6.3** Play App Signing:
  - Google will prompt to opt in to **Play App Signing**
  - **Strongly recommended**: opt in — Google securely stores your upload key and can re-sign if you lose your keystore
  - Click **Continue** to accept
- [ ] **6.4** Release name: `1.0.0 (internal test)`
- [ ] **6.5** Release notes: `Initial internal test build`
- [ ] **6.6** Click **Save** → **Review release** → **Start rollout to Internal testing**

### 6.7 Add Internal Testers
- [ ] Go to **Internal testing** → **Testers** tab
- [ ] Create a tester list with your email addresses
- [ ] Share the opt-in URL with testers — they install from Play Store directly
- [ ] Test on real devices, confirm login + attendance + photos work

---

## Phase 7 — Production Release

> Only after internal testing passes. This goes through Google review (1–7 days).

- [ ] **7.1** Go to **Release** → **Production** → **Create new release**
- [ ] **7.2** Upload the same `.aab` (or rebuild a new one)
- [ ] **7.3** Release name: `1.0.0`
- [ ] **7.4** Release notes (shown to users in Play Store):
  ```
  Initial release of SMC Karmachari — GPS attendance and work photo 
  tracking for Silchar Municipal Corporation field workers.
  ```
- [ ] **7.5** Roll out to **100%** (it's an internal app with limited user base)
- [ ] **7.6** Click **Review release** → **Start rollout to Production**
- [ ] **7.7** Google review typically takes **1–3 days** for new apps

---

## Phase 8 — After Publishing

- [ ] Share the Play Store link with SMC supervisors
- [ ] Supervisors create worker accounts via the DC web portal before workers install
- [ ] Workers search `SMC Karmachari` on Play Store or use direct link
- [ ] Monitor **Android vitals** in Play Console for crashes

### For future updates:
1. Increment `versionCode` by 1 and update `versionName` in `android/app/build.gradle`
2. Rebuild: `./gradlew bundleRelease`
3. Upload new `.aab` to Play Console → Production → Create new release

---

## ⚠️ Before Rolling Out to Real Workers

- [ ] Fix static OTP — integrate real SMS provider (`doc/security.md §2.5`)
- [ ] Protect photo download endpoint with JWT auth (`doc/security.md §2.6`)
- [ ] Ensure `JWT_SECRET` on Render is 32+ random characters

---

## Key Files — Keep Backed Up Separately

| File | Why critical |
|------|-------------|
| `android/app/smc-karmachari-release.keystore` | Losing this = can never update the app on Play Store |
| `android/keystore.properties` | Contains keystore passwords |

Back these up to a USB drive and a password manager. They are in `.gitignore` — not in the repo.

---

## Version History

| versionCode | versionName | Date | Notes |
|-------------|-------------|------|-------|
| 1 | 1.0.0 | Jun 2026 | Initial release — internal testing |

*Every upload to Play Console must increment `versionCode` by at least 1.*
