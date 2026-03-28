# SMC Karmachari — Security Review

**Version:** 1.0.0
**Last Updated:** March 2026
**Scope:** React Native frontend only

---

## 1. Threat Model

| Actor | Capability | Risk |
|-------|-----------|------|
| Casual attacker | Steals unlocked phone | Access to session data |
| Network attacker | Intercepts HTTP traffic | Reads API tokens / data |
| Malicious worker | Abuses app on own device | Marks fake attendance, accesses others' data |
| Automated bot | Submits signup/login requests | Creates fake accounts |

---

## 2. Security Findings & Fixes

### 2.1 Token & Session Storage — FIXED

| Before | After |
|--------|-------|
| JWT token stored in `AsyncStorage` (unencrypted plaintext on disk) | Stored in `expo-secure-store` → iOS Keychain / Android Keystore (hardware-backed encryption) |
| User session object stored in `AsyncStorage` | Stored in `expo-secure-store` |

**Files changed:** `src/api/client.ts`, `src/context/AuthContext.tsx`

**Why it matters:** AsyncStorage files are readable by anyone with physical access to an unencrypted Android device or a jailbroken iPhone. SecureStore encrypts data with keys tied to the device hardware and the app's identity — other apps and physical attackers cannot read it.

---

### 2.2 Admin Access Control — FIXED

| Before | After |
|--------|-------|
| AdminScreen made API calls with no role check | Navigation guard (`user?.isAdmin` in AppNavigator) + screen-level guard in AdminScreen |

**Files changed:** `src/screens/admin/AdminScreen.tsx`, `src/navigation/AppNavigator.tsx`

**Defense in depth:** Two independent layers — if the navigation guard is bypassed, the screen renders an "Access denied" message and never calls admin API endpoints.

> **Backend must also enforce this.** Admin endpoints (`/admin/*`) must verify `isAdmin: true` from the JWT payload server-side. The frontend guard is convenience, not a security boundary.

---

### 2.3 Input Sanitization — FIXED

| Input | Before | After |
|-------|--------|-------|
| Mobile number | Regex strip only | `isValidMobile()` — validates Indian mobile format (starts with 6–9) |
| Name / Address | Length check only | `sanitizeText()` — trims, collapses whitespace |
| Photo notes | None | `sanitizeNotes()` — strips HTML tags, removes `< > ' "`, caps at 500 chars |

**File added:** `src/utils/sanitize.ts`

**Files changed:** `src/screens/auth/LoginScreen.tsx`, `src/screens/auth/SignupScreen.tsx`, `src/screens/upload/UploadScreen.tsx`

> **Backend must also sanitize and validate.** Client-side sanitization improves UX and reduces noise — it is not a security guarantee. A determined attacker can bypass the app entirely and call APIs directly.

---

### 2.4 Error Handling in API Client — FIXED

| Before | After |
|--------|-------|
| 404 detection via `error.message.includes('not found')` — fragile string matching | Uses `error.response.status === 404` — reliable HTTP status code check |
| Error messages could leak internal detail | Response interceptor maps all status codes to safe user-facing messages |

**Files changed:** `src/api/realApi.ts`, `src/api/client.ts`

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

### 3.3 Certificate Pinning (Not Implemented)

SSL certificate pinning would prevent man-in-the-middle attacks even when an attacker installs a custom root CA on the device. It is not implemented because:
- It adds significant operational overhead (pin must be updated on every certificate renewal)
- HTTPS alone is sufficient for most threat models
- Expo managed workflow makes custom native TLS configuration complex

Revisit this for production if the app handles financial or medical data.

### 3.4 Photo Metadata (EXIF)

Photos taken with `expo-image-picker` retain EXIF metadata including the device's GPS coordinates embedded in the image file. The backend should strip EXIF data before storing or serving photos to prevent unintended location disclosure.

---

## 4. Security Checklist

### Frontend (this app)
- [x] Tokens stored in SecureStore (hardware encrypted)
- [x] User session stored in SecureStore
- [x] Admin screen has two independent access guards
- [x] Input sanitization on all user-facing text fields
- [x] Mobile number validated against Indian format
- [x] Notes field stripped of HTML/script tags
- [x] Error responses use HTTP status codes, not string matching
- [x] JWT cleared from SecureStore on logout
- [x] Location permission denied → user-friendly message, no crash
- [x] Camera/gallery permission denied → user-friendly message, no crash
- [x] HTTPS enforced via API base URL (no HTTP fallback)
- [ ] Certificate pinning (deferred — see §3.3)
- [ ] Token expiry check on app resume (deferred — requires refresh token flow)

### Backend (separate team)
- [ ] Server-side admin role validation on `/admin/*` endpoints
- [ ] JWT user claim matches request userId
- [ ] Rate limiting on `/auth/login` and `/auth/signup`
- [ ] Server-side input validation (length, type, format)
- [ ] MIME type + size validation on photo uploads
- [ ] EXIF stripping before photo storage
- [ ] Short-lived JWTs with refresh token rotation
- [ ] Request logging with device metadata for audit trail

---

## 5. Key Security Files

| File | Purpose |
|------|---------|
| `src/api/client.ts` | Axios instance, SecureStore token management, error interceptor |
| `src/context/AuthContext.tsx` | User session in SecureStore, clears both session + token on logout |
| `src/utils/sanitize.ts` | Input sanitization helpers — `sanitizeText`, `sanitizeNotes`, `isValidMobile` |
| `src/screens/admin/AdminScreen.tsx` | Screen-level `isAdmin` guard (defense in depth) |
| `src/navigation/AppNavigator.tsx` | Navigation-level `isAdmin` guard (first layer) |
