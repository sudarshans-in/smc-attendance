# SMC Karmachari — Security Review

**Version:** 1.2.0
**Last Updated:** May 2026
**Scope:** React Native frontend + backend + connection layer

---

## 1. Threat Model

| Actor | Capability | Risk |
|-------|-----------|------|
| Remote attacker | Knows any worker's mobile number | **Full login bypass via static OTP (see §2.5)** |
| Casual attacker | Steals unlocked phone | Access to session data |
| Network attacker | Intercepts HTTP traffic | Reads API tokens / data |
| Malicious worker | Abuses app on own device | Marks fake attendance, accesses others' data |
| Automated bot | Submits signup/login requests | Creates fake accounts |

---

## 2. Security Findings & Status

> **Legend:** ✅ Fixed · ⚠️ Open — action required · 🔵 Deferred (accepted risk)

## 2.0 Summary

| # | Severity | Finding | Status |
|---|----------|---------|--------|
| 2.1 | HIGH | Token & session storage | ✅ Fixed |
| 2.2 | MEDIUM | Admin access control | ✅ Fixed |
| 2.3 | MEDIUM | Input sanitization | ✅ Fixed |
| 2.4 | LOW | Error handling in API client | ✅ Fixed |
| **2.5** | **HIGH** | **Static OTP — full auth bypass** | **⚠️ Open** |
| **2.6** | **MEDIUM** | **Unauthenticated photo file download** | **⚠️ Open** |

---

### 2.1 Token & Session Storage ✅ Fixed

| Before | After |
|--------|-------|
| JWT token stored in `AsyncStorage` (unencrypted plaintext on disk) | Stored in `react-native-keychain` → Android Keystore (hardware-backed encryption) |
| User session object stored in `AsyncStorage` | Stored in `react-native-keychain` |

**Files changed:** `src/api/client.ts`, `src/context/AuthContext.tsx`

**Why it matters:** AsyncStorage files are readable by anyone with physical access to an unencrypted Android device or a jailbroken iPhone. `react-native-keychain` uses the Android Keystore system — keys are hardware-backed and tied to the app's identity. Other apps and physical attackers without root cannot read them.

---

### 2.2 Admin Access Control ✅ Fixed

| Before | After |
|--------|-------|
| AdminScreen made API calls with no role check | Navigation guard (`user?.isAdmin` in AppNavigator) + screen-level guard in AdminScreen |

**Files changed:** `src/screens/admin/AdminScreen.tsx`, `src/navigation/AppNavigator.tsx`

**Defense in depth:** Two independent layers — if the navigation guard is bypassed, the screen renders an "Access denied" message and never calls admin API endpoints.

> **Backend must also enforce this.** Admin endpoints (`/admin/*`) must verify `isAdmin: true` from the JWT payload server-side. The frontend guard is convenience, not a security boundary.

---

### 2.3 Input Sanitization ✅ Fixed

| Input | Before | After |
|-------|--------|-------|
| Mobile number | Regex strip only | `isValidMobile()` — validates Indian mobile format (starts with 6–9) |
| Name / Address | Length check only | `sanitizeText()` — trims, collapses whitespace |
| Photo notes | None | `sanitizeNotes()` — strips HTML tags, removes `< > ' "`, caps at 500 chars |

**File added:** `src/utils/sanitize.ts`

**Files changed:** `src/screens/auth/LoginScreen.tsx`, `src/screens/auth/SignupScreen.tsx`, `src/screens/upload/UploadScreen.tsx`

> **Backend must also sanitize and validate.** Client-side sanitization improves UX and reduces noise — it is not a security guarantee. A determined attacker can bypass the app entirely and call APIs directly.

---

### 2.4 Error Handling in API Client ✅ Fixed

| Before | After |
|--------|-------|
| 404 detection via `error.message.includes('not found')` — fragile string matching | Uses `error.response.status === 404` — reliable HTTP status code check |
| Error messages could leak internal detail | Response interceptor maps all status codes to safe user-facing messages |

**Files changed:** `src/api/realApi.ts`, `src/api/client.ts`

---

### 2.5 Static OTP — Full Authentication Bypass ⚠️ Open (HIGH)

**Discovered:** May 2026 · **Must fix before production launch**

#### What the problem is

The worker login flow uses a two-step process: `POST /auth/send-otp` (requests OTP) → `POST /auth/login` (verifies OTP). The send-otp step is a **no-op** — it never sends an SMS. The OTP is a static, hardcoded string `"24052026"` on the backend (`WorkerService.STATIC_OTP`). It never changes, never expires, and is not tied to a session or device.

This means **any person who knows a worker's registered mobile number can log in as that worker** by posting the known static OTP to the public `/auth/login` endpoint.

The mobile app's comment in `src/api/realApi.ts` line 38 also embeds the OTP value in the APK bundle:

```ts
// Backend sends OTP to this mobile number (currently hardcoded to 24052026).
```

The backend is publicly accessible at `https://world-of-dc-election.onrender.com`. The login endpoint has no rate limiting and no IP restrictions.

#### Impact

- Fraudulent attendance records (fake clock-in / clock-out with real GPS coordinates from spoofed location)
- Fabricated work photos uploaded on behalf of any worker
- If a supervisor account (`isAdmin: true`) is compromised, the attacker can enumerate the entire squad

#### Attack path (confirmed)

```
curl -X POST https://world-of-dc-election.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"mobile": "<any registered worker number>", "otp": "24052026"}'

# → Returns: { "user": {...}, "token": "<valid JWT>" }
```

Worker mobile numbers may be publicly discoverable: `/api/tracking/**` is fully unauthenticated on the backend, which likely exposes member phone numbers.

#### Remediation — Backend (primary fix, `world_of_dc`)

The two-step API contract is already correct — only the `sendOtp()` body needs to be replaced:

**Step 1 — Integrate an SMS OTP provider**

The backend `WorkerService.java` `sendOtp()` method is a documented stub:

```java
public void sendOtp(String mobile) {
    logger.info("OTP requested for mobile: {} (static OTP in use)", mobile);
    // TODO: integrate SMS provider here
}
```

Replace the body with a real SMS dispatch. Recommended Indian SMS providers:
- **MSG91** (most common in Indian gov projects) — `https://msg91.com/`
- **Twilio** — reliable, international, good Java SDK
- **AWS SNS** — if already using AWS

**Step 2 — Generate and store a per-session OTP server-side**

```java
// In WorkerService — replace STATIC_OTP with this pattern:
private static final int OTP_EXPIRY_MINUTES = 5;
private final Map<String, OtpEntry> otpStore = new ConcurrentHashMap<>();

public void sendOtp(String mobile) {
    String otp = String.format("%06d", new SecureRandom().nextInt(1_000_000));
    otpStore.put(mobile, new OtpEntry(otp, Instant.now().plusSeconds(OTP_EXPIRY_MINUTES * 60)));
    smsProvider.send(mobile, "Your SMC Karmachari OTP is: " + otp + ". Valid for 5 minutes.");
}

public Map<String, Object> login(String mobile, String otp) {
    OtpEntry entry = otpStore.get(mobile);
    if (entry == null || Instant.now().isAfter(entry.expiresAt()) || !entry.otp().equals(otp)) {
        throw new IllegalArgumentException("INVALID_OTP");
    }
    otpStore.remove(mobile); // single-use
    // ... rest of login
}
```

For production, replace the in-memory `otpStore` with a MongoDB or Redis-backed TTL store so OTPs survive server restarts.

**Step 3 — Add rate limiting**

Add to `SecurityConfig` or via an NGINX rule:
- Max 5 OTP send requests per mobile number per 10 minutes
- Max 5 login attempts per mobile number per 10 minutes
- Lockout after 10 consecutive failures

#### Remediation — Mobile app (cleanup, `mobile-attendance`)

**Remove the OTP value comment from `src/api/realApi.ts` line 38:**

```ts
// Before:
// Backend sends OTP to this mobile number (currently hardcoded to 24052026).

// After:
// Backend sends OTP via SMS to this mobile number.
```

**Remove mock code from production bundle** — `src/mock/mockApi.ts` is imported unconditionally and ships in the APK even when `USE_MOCK: false`. Add a Metro config to exclude mock files from release builds:

```js
// metro.config.js — add to blockList for release builds
const isRelease = process.env.NODE_ENV === 'production';
config.resolver.blockList = isRelease
  ? [/src\/mock\/.*/]
  : [];
```

#### Verification checklist

- [ ] Backend: `sendOtp()` dispatches a real SMS to the mobile number
- [ ] Backend: OTP is randomly generated (6 digits, `SecureRandom`)
- [ ] Backend: OTP expires after 5 minutes
- [ ] Backend: OTP is single-use (deleted from store after successful verification)
- [ ] Backend: `STATIC_OTP` constant removed from `WorkerService.java`
- [ ] Backend: Rate limiting on `/auth/send-otp` and `/auth/login`
- [ ] Mobile: OTP value comment removed from `realApi.ts`
- [ ] Mobile: Mock files excluded from release bundle
- [ ] Test: Verify that using `"24052026"` as OTP now returns 400 / INVALID_OTP

---

### 2.6 Unauthenticated Photo File Download ⚠️ Open (MEDIUM)

**Discovered:** May 2026

#### What the problem is

The backend serves uploaded photos at:
```
GET /api/files/download/<path>
```

This endpoint is listed as `permitAll()` in `SecurityConfig.java` — **no JWT required**. Any uploaded photo can be downloaded by anyone who knows its URL path. The path is UUID-based (not guessable), but:
- A photo URL intercepted from network traffic (e.g. on a shared Wi-Fi) gives permanent read access
- A compromised worker account could enumerate photo paths from the API and share them externally
- Photos in the admin view are loaded by the `<Image>` component without an Authorization header

#### Impact
Work photos and attendance selfies (if wired up) containing GPS-tagged images of field workers and their locations could be accessed without authentication.

#### Remediation — Backend (`world_of_dc`)

Remove `/api/files/download/**` from `permitAll()` in `SecurityConfig.java` and require a valid JWT:

```java
// Before:
.antMatchers(HttpMethod.GET, "/api/files/download/**").permitAll()

// After: remove the above line — falls through to anyRequest().authenticated()
```

Alternatively, generate short-lived signed URLs (e.g. 15-minute expiry) for photo access instead of permanent paths.

---

## 3. Remaining Risks & Responsibilities

### 3.1 Backend Must Enforce (Frontend Cannot)

| Risk | Required Backend Action |
|------|------------------------|
| **Admin endpoint access** | Validate JWT and `isAdmin` claim on every `/admin/*` request |
| **Cross-user data access** | Verify that `userId` in request body matches the authenticated user in the JWT |
| **Rate limiting** | Limit login/signup attempts per IP/mobile (e.g. 5 attempts per 10 minutes) |
| **Input validation** | Validate all field types, lengths, formats server-side regardless of client |
| **Photo file validation** | Verify MIME type and file size server-side; reject non-images |
| **SQL / NoSQL injection** | Use parameterized queries / ORM — never concatenate user input into queries |
| **Token expiry** | Issue short-lived JWTs (e.g. 8-hour expiry); implement refresh token rotation |

### 3.2 GPS Spoofing

GPS coordinates sent by the app can be spoofed by rooted Android devices using mock location apps. The backend can reduce this risk by:
- Cross-checking coordinates against the worker's registered ward/zone
- Flagging attendance records where coordinates are impossibly far from the previous record
- Logging device metadata (device ID, app version) alongside each attendance record

This is an inherent limitation of GPS-based attendance on consumer devices.

### 3.3 Certificate Pinning (Not Implemented — Accepted Risk)

Certificate pinning would prevent man-in-the-middle attacks even when an attacker installs a custom root CA on the device. It is not implemented because:
- Render renews TLS certificates automatically — a pinned certificate would break the app on every renewal without an app update
- Android's default TLS validation (against the system trust store) is sufficient for this threat model
- Field workers are unlikely to be on corporate MITM proxy networks

Revisit if the app ever handles financial or medical data.

### 3.4 Photo Metadata (EXIF)

Photos taken with `react-native-image-picker` (camera mode) may retain EXIF metadata including device GPS coordinates embedded in the image file. The backend should strip EXIF data before storing or serving photos to prevent unintended location disclosure beyond what is already captured in the attendance record.

---

## 3.5 Connection Security Audit (May 2026)

A full audit of the Android app ↔ Spring Boot backend connection was conducted. Findings below.

### Transport Layer (TLS / HTTPS)

| Check | Result |
|-------|--------|
| All API calls use HTTPS | ✅ `https://world-of-dc-election.onrender.com` hardcoded — no HTTP fallback |
| `android:usesCleartextTraffic` | ✅ Not set — Android 9+ blocks HTTP by default |
| No cleartext traffic permission in manifest | ✅ Confirmed |
| TLS certificate issuer | ✅ Google Trust Services (WE1) — trusted globally |
| Certificate validity | ✅ Valid until Aug 24 2026 (Render auto-renews) |
| TLS 1.2 | ✅ Supported and working (HTTP 200 confirmed) |
| TLS 1.3 | ⚠️ Not supported by current Render deployment (connection failed) |
| SSL bypass code in Android native layer | ✅ None — no `TrustAllCerts`, `ALLOW_ALL_HOSTNAME_VERIFIER`, or custom `X509TrustManager` |
| SSL bypass code in JS/TS layer | ✅ None — no `rejectUnauthorized: false` or equivalent |
| Image URI rewriting (`normalizeImageUri`) | ✅ Rewrites `http://localhost:8080/...` to HTTPS base URL before any network call |

**TLS 1.3 note:** TLS 1.2 is still considered secure by NIST, PCI DSS, and Google Play standards. No action required — Render may upgrade its infrastructure automatically over time.

---

### Authentication & Token Security

| Check | Result |
|-------|--------|
| JWT signing algorithm | ✅ HS256 (HMAC-SHA256) — standard for single-backend systems |
| JWT secret in production | ✅ `${JWT_SECRET}` environment variable — not hardcoded |
| JWT expiry | ✅ 1 hour (`jwt.expiration-ms=3600000`) |
| Token storage on device | ✅ Android Keystore via `react-native-keychain` — hardware-backed, not extractable without root |
| Token transmitted as | ✅ `Authorization: Bearer <token>` header on every request |
| Token cleared on 401 | ✅ Axios interceptor calls `clearToken()` → re-login required |
| Token cleared on logout | ✅ Both JWT and user session cleared from Keychain |
| Fallback JWT secret | ⚠️ Defaults to `"change-me-very-secret"` if `JWT_SECRET` not set — ensure Render env var is always set and is 32+ random characters |

---

### On-Device Data Security

| Check | Result |
|-------|--------|
| JWT token | ✅ Android Keystore (hardware-backed) |
| User session object | ✅ Android Keystore (hardware-backed) |
| Attendance / photo data | ✅ Server-side only in production (`USE_MOCK: false`) |
| `android:allowBackup` | ✅ `false` — ADB backup and Google Auto Backup blocked |
| AsyncStorage usage (production) | ✅ None — only used in mock mode |
| Mock code ships in release bundle | ⚠️ `src/mock/mockApi.ts` is bundled even when `USE_MOCK: false`. Add Metro blockList to exclude it (see §2.5) |

---

### CORS Policy (Backend)

| Check | Result |
|-------|--------|
| `allowedOrigins` | ⚠️ `"*"` — any web origin can call the API from a browser |
| Impact on mobile app | ✅ None — CORS is a browser security concept, not enforced in React Native |
| Impact on web endpoints | ⚠️ Any website can make cross-origin requests to protected endpoints using a user's browser cookies/tokens |

**Recommendation:** Restrict `allowedOrigins` to the DC office web UI domain once it has a fixed deployment URL.

---

### Overall Connection Security Rating

| Layer | Rating | Notes |
|-------|--------|-------|
| Transport (HTTPS/TLS) | **Strong** | TLS 1.2 with trusted CA, no cleartext, no bypass |
| Token handling | **Strong** | Hardware Keystore, 1h expiry, auto-cleared on 401 |
| On-device storage | **Strong** | Keystore + allowBackup=false |
| Authentication logic | **Weak** | Static OTP undermines all transport security (§2.5) |
| File download endpoint | **Gap** | No auth required to download any photo by URL (§2.6) |
| CORS policy | **Permissive** | Acceptable for now; tighten before adding sensitive browser-facing features |
| Certificate pinning | **Not implemented** | Accepted risk — see §3.3 |

---

## 4. Security Checklist

### Frontend (this app)
- [x] Tokens stored in `react-native-keychain` (Android Keystore, hardware encrypted)
- [x] User session stored in `react-native-keychain`
- [x] Admin screen has two independent access guards (navigation + component)
- [x] Input sanitization on all user-facing text fields
- [x] Mobile number validated against Indian format (starts with 6–9, 10 digits)
- [x] Notes field stripped of HTML/script tags, capped at 500 chars
- [x] Error responses use HTTP status codes, not string matching
- [x] JWT cleared from Keychain on logout
- [x] Location permission denied → user-friendly message, no crash
- [x] Camera permission denied → user-friendly message, no crash
- [x] HTTPS enforced via API base URL (no HTTP fallback)
- [x] Biometric app lock (locks after 30s background, requires biometric/PIN to resume)
- [ ] **OTP comment removed from `realApi.ts:38`** ← do this now, 1-line fix
- [ ] **Mock files excluded from release bundle** (see §2.5 Metro config)
- [ ] Certificate pinning (deferred — see §3.3)
- [ ] Token expiry check on app resume (deferred — requires refresh token flow)

### Backend (`world_of_dc` — must complete before production)
- [ ] **Real SMS OTP integration — replaces static OTP `"24052026"`** ← HIGH PRIORITY (§2.5)
- [ ] **Rate limiting on `/auth/send-otp` and `/auth/login`** ← HIGH PRIORITY (§2.5)
- [ ] **`STATIC_OTP` constant removed from `WorkerService.java`** ← HIGH PRIORITY (§2.5)
- [ ] **Require JWT on `/api/files/download/**`** ← MEDIUM PRIORITY (§2.6)
- [ ] Server-side admin role validation on `/admin/*` endpoints
- [ ] JWT user claim (`sub`) verified against `userId` in request body
- [ ] Restrict CORS `allowedOrigins` to specific DC web UI domain (§3.5)
- [ ] Ensure `JWT_SECRET` env var is 32+ random characters on Render (§3.5)
- [ ] Server-side input validation (length, type, format)
- [ ] MIME type + file size validation on photo uploads
- [ ] EXIF stripping before photo storage
- [ ] Short-lived JWTs (8h max) with refresh token rotation
- [ ] Request logging with device metadata for audit trail

---

## 5. Key Security Files

| File | Purpose |
|------|---------|
| `src/api/client.ts` | Axios instance, Keychain token management, error interceptor |
| `src/api/realApi.ts` | Real API calls — **line 38 has OTP comment to remove** |
| `src/context/AuthContext.tsx` | User session in Keychain, biometric lock logic, clears both session + token on logout |
| `src/utils/sanitize.ts` | Input sanitization helpers — `sanitizeText`, `sanitizeNotes`, `isValidMobile` |
| `src/screens/admin/AdminScreen.tsx` | Screen-level `isAdmin` guard (defense in depth) |
| `src/navigation/AppNavigator.tsx` | Navigation-level `isAdmin` guard (first layer) |
| `src/navigation/RootNavigator.tsx` | Biometric lock screen — shown when `isAuthenticated && isLocked` |
| `src/constants/config.ts` | `USE_MOCK` flag — must be `false` in all release builds |
| `android/app/src/main/AndroidManifest.xml` | Permissions + `allowBackup` — review before Play Store submission |

---

## 6. Backend Integration Notes (for `world_of_dc` team)

When implementing real OTP (§2.5), the mobile app requires no changes to the API contract — only the backend `sendOtp()` body and OTP validation logic change. The two endpoints and their request/response shapes stay the same:

```
POST /auth/send-otp    { mobile: string }              → 200 OK
POST /auth/login       { mobile: string, otp: string } → { user: WorkerUserDto, token: string }
```

The app already handles `400 / INVALID_OTP` responses — they surface as "Invalid OTP" in the login screen.

Worker `userId` is sent explicitly in attendance and photo request bodies by the mobile app. The backend **must** verify that this `userId` matches the `sub` claim in the JWT — otherwise any authenticated worker can mark attendance for any other worker by modifying the request body.
