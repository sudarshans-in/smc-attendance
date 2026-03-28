# SMC Karmachari — Requirements Document

**Project:** SMC Karmachari Attendance & Work Tracking App
**Client:** Silchar Municipal Corporation (SMC)
**Version:** 1.0.0
**Last Updated:** March 2026

---

## 1. Project Overview

A mobile application (Android + iOS) for Safai Karmacharis (sanitation field workers) of Silchar Municipal Corporation to digitally track daily attendance via GPS and submit work progress photos. Supervisors/admins can monitor all worker attendance from the same app.

---

## 2. Stakeholders

| Role | Description |
|------|-------------|
| **Field Worker** | Sanitation worker who marks attendance and uploads work photos |
| **Admin / Supervisor** | Municipal supervisor who monitors worker attendance and activity |
| **Backend Team** | Separate team responsible for REST API development |

---

## 3. Functional Requirements

### 3.1 User Authentication

| ID | Requirement | Status |
|----|-------------|--------|
| FR-1.1 | Worker can login using their registered 10-digit mobile number | ✅ Done |
| FR-1.2 | Unregistered mobile number redirects to signup screen | ✅ Done |
| FR-1.3 | Signup collects: full name, address; mobile is pre-filled from login | ✅ Done |
| FR-1.4 | Session persists via AsyncStorage — survives app restart | ✅ Done |
| FR-1.5 | Worker can logout; session clears and app returns to login | ✅ Done |
| FR-1.6 | New registrations default to `isAdmin: false` | ✅ Done |

### 3.2 Role-Based Access

| ID | Requirement | Status |
|----|-------------|--------|
| FR-2.1 | User has an `isAdmin` boolean flag on their profile | ✅ Done |
| FR-2.2 | Admin tab is visible only to users with `isAdmin: true` | ✅ Done |
| FR-2.3 | Regular workers see only: Home, Upload, History tabs | ✅ Done |
| FR-2.4 | Admin user can also mark their own attendance | ✅ Done |

### 3.3 Geolocation-Based Attendance

| ID | Requirement | Status |
|----|-------------|--------|
| FR-3.1 | Worker marks daily attendance login from Home screen (one tap) | ✅ Done |
| FR-3.2 | GPS coordinates + timestamp captured at login moment | ✅ Done |
| FR-3.3 | Worker marks attendance logout from Home screen | ✅ Done |
| FR-3.4 | GPS coordinates + timestamp captured at logout moment | ✅ Done |
| FR-3.5 | Home screen shows 3-state attendance status card | ✅ Done |
| FR-3.6 | Login and logout are idempotent — duplicate taps are safe | ✅ Done |
| FR-3.7 | Location permission denied → clear message + link to Settings | ✅ Done |
| FR-3.8 | Only one attendance record per worker per calendar day | ✅ Done |

### 3.4 Work Photo Upload

| ID | Requirement | Status |
|----|-------------|--------|
| FR-4.1 | Worker can take a photo with the device camera | ✅ Done |
| FR-4.2 | Worker can select an existing photo from gallery | ✅ Done |
| FR-4.3 | Photo is geo-tagged with current GPS at time of submission | ✅ Done |
| FR-4.4 | Worker can add optional text notes describing work done | ✅ Done |
| FR-4.5 | Submit button disabled until both image and GPS are ready | ✅ Done |
| FR-4.6 | Worker receives confirmation snackbar on successful upload | ✅ Done |
| FR-4.7 | Multiple photos can be uploaded per day | ✅ Done |
| FR-4.8 | Photo stored as local file URI in mock mode (not base64) | ✅ Done |

### 3.5 History & Tracking

| ID | Requirement | Status |
|----|-------------|--------|
| FR-5.1 | Worker views today's uploaded photos (with timestamp, notes, coords) | ✅ Done |
| FR-5.2 | Worker views personal attendance records across all dates | ✅ Done |
| FR-5.3 | History screen has two tabs: Today's Photos / Attendance Records | ✅ Done |
| FR-5.4 | Both tabs support pull-to-refresh | ✅ Done |
| FR-5.5 | Empty states display icon + descriptive message | ✅ Done |

### 3.6 Admin View

| ID | Requirement | Status |
|----|-------------|--------|
| FR-6.1 | Admin views all registered workers (name, mobile, address) | ✅ Done |
| FR-6.2 | Admin sees today's attendance status per worker (Present / Absent) | ✅ Done |
| FR-6.3 | Admin screen shows summary strip: Present count / Absent count / Total | ✅ Done |
| FR-6.4 | Admin screen supports pull-to-refresh | ✅ Done |

---

## 4. Non-Functional Requirements

### 4.1 Platform & Compatibility

| ID | Requirement | Status |
|----|-------------|--------|
| NFR-1.1 | Runs on Android 7.0+ (API level 24+) | ✅ Done |
| NFR-1.2 | Runs on iOS 15.1+ | ✅ Done |
| NFR-1.3 | Portrait orientation only | ✅ Done |
| NFR-1.4 | Phone-only (no tablet layout) | ✅ Done |
| NFR-1.5 | No companion app required | ✅ Done |
| NFR-1.6 | Built with Expo managed workflow (no custom native code) | ✅ Done |

### 4.2 Performance

| ID | Requirement |
|----|-------------|
| NFR-2.1 | Cold start to interactive screen under 3 seconds on mid-range device |
| NFR-2.2 | Attendance marking (including GPS fetch) completes within 10 seconds |
| NFR-2.3 | Photo upload feedback within 2 seconds of submit (mock mode) |

### 4.3 UI/UX — Field Worker Considerations

| ID | Requirement | Status |
|----|-------------|--------|
| NFR-3.1 | Primary action buttons minimum 56dp tall (thumb-friendly) | ✅ Done |
| NFR-3.2 | Minimum body text size: 16sp | ✅ Done |
| NFR-3.3 | High contrast green palette (WCAG AA) — readable in sunlight | ✅ Done |
| NFR-3.4 | Maximum 2–3 actions per screen | ✅ Done |
| NFR-3.5 | All interactive elements have loading/disabled visual states | ✅ Done |
| NFR-3.6 | Forced light mode (dark mode unreadable outdoors) | ✅ Done |
| NFR-3.7 | All strings in `src/constants/strings.ts` (multilingual-ready) | ✅ Done |
| NFR-3.8 | All interactive elements have `accessibilityLabel` | ✅ Done |

### 4.4 API & Backend Integration

| ID | Requirement | Status |
|----|-------------|--------|
| NFR-4.1 | All screens import only from `src/api/index.ts` | ✅ Done |
| NFR-4.2 | Switch mock ↔ real with one flag: `Config.USE_MOCK` | ✅ Done |
| NFR-4.3 | Mock simulates 300–800ms network delay | ✅ Done |
| NFR-4.4 | Mock data persists across restarts via AsyncStorage | ✅ Done |
| NFR-4.5 | Real API uses axios with JWT Bearer token auth | ✅ Done |
| NFR-4.6 | Axios interceptors handle 401 / 403 / 500 with user messages | ✅ Done |

---

## 5. Permissions Required

| Permission | Platform | Purpose |
|------------|----------|---------|
| `ACCESS_FINE_LOCATION` | Android | Exact GPS for attendance and photo geo-tagging |
| `ACCESS_COARSE_LOCATION` | Android | Fallback GPS |
| `CAMERA` | Both | Take work progress photos |
| `READ_MEDIA_IMAGES` | Android 13+ | Gallery photo selection |
| `READ_EXTERNAL_STORAGE` | Android < 13 | Gallery photo selection |
| `NSLocationWhenInUseUsageDescription` | iOS | GPS when app is in foreground |
| `NSCameraUsageDescription` | iOS | Camera for work photos |
| `NSPhotoLibraryUsageDescription` | iOS | Photo library access |

---

## 6. Out of Scope — Release 1

The following features are deferred to future releases:

- Real backend API integration (one-line switch when ready)
- Push notification reminders for attendance
- Offline upload queue (photos taken without internet, synced later)
- Bengali / Assamese language support (strings.ts is structured to support this)
- Role management UI (admin promotion/demotion)
- Photo compression before upload
- Map view of attendance/photo location
- Date range filtering in History
- Supervisor-specific dashboard (separate from worker dashboard)
