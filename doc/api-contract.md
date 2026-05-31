# SMC Karmachari — API Contract

**Version:** 2.0.0
**Last Updated:** March 2026
**Base URL:** `https://world-of-dc-election.onrender.com`
**Backend:** Java Spring Boot 2.7 · MongoDB Atlas · JWT Auth
**Source:** https://github.com/Stormtrooper089/world_of_dc

> This document is derived from the actual backend source code.
> All field names, types, and status codes match the Java DTOs and controllers exactly.

---

## Authentication

All endpoints except `/auth/login` and `/auth/signup` require:

```
Authorization: Bearer <jwt_token>
```

The token is returned by login/signup, stored in Android Keystore via `react-native-keychain`,
and attached automatically by the axios request interceptor in `src/api/client.ts`.

**Token expiry:** 1 hour (3600000 ms)

---

## Data Models

### User (`WorkerUserDto`)
```json
{
  "id": "string (format: mem-XXXXXXXX)",
  "mobile": "string",
  "name": "string",
  "address": "string",
  "createdAt": "ISO 8601 datetime",
  "isAdmin": "boolean"
}
```

### AttendanceRecord (`AttendanceRecordDto`)
```json
{
  "id": "string (format: userId_YYYY-MM-DD)",
  "userId": "string",
  "date": "YYYY-MM-DD",
  "loginTime": "ISO 8601 datetime | null",
  "logoutTime": "ISO 8601 datetime | null",
  "loginLocation": "LocationCoords | null",
  "logoutLocation": "LocationCoords | null"
}
```

> Note: No photo URI fields — attendance records store location + time only.

### WorkPhoto (`WorkPhotoDto`)
```json
{
  "id": "string (MongoDB ObjectId)",
  "userId": "string",
  "imageUri": "string (full URL: baseUrl + /api/files/download/...)",
  "notes": "string | null",
  "location": "LocationCoords",
  "uploadedAt": "ISO 8601 datetime"
}
```

### LocationCoords (`LocationCoordsDto`)
```json
{
  "latitude": "number (double, required)",
  "longitude": "number (double, required)",
  "accuracy": "number (double, optional)"
}
```

### AdminWorkerSummary (`AdminWorkerSummaryDto`)
```json
{
  "user": "User",
  "todayAttendance": "AttendanceRecord | null"
}
```

---

## Endpoints

---

### Auth

#### POST `/auth/login`
Login with mobile number.

**Request**
```json
{ "mobile": "9876543210" }
```

**Response 200**
```json
{
  "user": { ...User },
  "token": "jwt_token_string"
}
```

**Response 404** — mobile not registered
```json
{ "message": "User not found" }
```

> App behaviour on 404: navigates to Signup screen with mobile pre-filled.

---

#### POST `/auth/signup`
Register a new worker.

**Request**
```json
{
  "mobile": "9876543210",
  "name": "Raju Das",
  "address": "Ward 12, Silchar"
}
```
> `name` and `address` are optional in the backend DTO but required by the app's signup form validation.

**Response 201**
```json
{
  "user": { ...User, "isAdmin": false },
  "token": "jwt_token_string"
}
```

**Response 409** — mobile already registered
```json
{ "message": "Mobile number already registered" }
```

---

### Attendance

#### POST `/attendance/login`
Mark attendance check-in. **JSON body — no file upload.**

**Request**
```json
{
  "userId": "mem-A1B2C3D4",
  "location": {
    "latitude": 24.8333,
    "longitude": 92.7789,
    "accuracy": 12.0
  }
}
```

**Response 200** — created or already exists (idempotent)
```json
{ ...AttendanceRecord }
```

**Response 404** — user not found
```json
{ "message": "User not found" }
```

> Note: Worker status is updated to `ON_DUTY` on successful login.

---

#### POST `/attendance/logout`
Mark attendance check-out. **JSON body — no file upload.**

**Request**
```json
{
  "userId": "mem-A1B2C3D4",
  "location": {
    "latitude": 24.8340,
    "longitude": 92.7795,
    "accuracy": 10.0
  }
}
```

**Response 200**
```json
{ ...AttendanceRecord }
```

**Response 400** — no login found for today
```json
{ "message": "No attendance login found for today. Please mark attendance first." }
```

**Response 404** — user not found
```json
{ "message": "User not found" }
```

> Note: Worker status is updated to `ACTIVE` on successful logout.

---

#### GET `/attendance/today/:userId`
Get today's attendance record for a worker.

**Response 200**
```json
{ ...AttendanceRecord }
```

**Response 404** — no record today or user not found
```json
{ "message": "No attendance record found for today" }
```

> App behaviour on 404: treats as `null` (worker hasn't checked in yet).

---

#### GET `/attendance/history/:userId`
Get all attendance records for a worker, newest first.

**Response 200**
```json
[ ...AttendanceRecord ]
```

> Returns empty array `[]` if no records exist. Never 404.

---

### Work Photos

#### POST `/photos/upload`
Upload a work progress photo. **multipart/form-data.**

| Field | Type | Required |
|-------|------|----------|
| `userId` | string | ✅ |
| `photo` | file (image/jpeg or image/png, max 10MB) | ✅ |
| `latitude` | number (as form field) | ✅ |
| `longitude` | number (as form field) | ✅ |
| `accuracy` | number (as form field) | optional |
| `notes` | string | optional |

**Response 201**
```json
{
  ...WorkPhoto,
  "imageUri": "https://world-of-dc-election.onrender.com/api/files/download/worker-photos/filename.jpg"
}
```

**Response 404** — user not found

---

#### GET `/photos/today/:userId`
Get all work photos uploaded today by a worker, newest first.

**Response 200**
```json
[ ...WorkPhoto ]
```

> Returns empty array `[]` if no photos today.

---

### Admin

> Requires `ROLE_WORKER_ADMIN` authority in JWT. Workers with `isAdmin: true` are assigned this role.

#### GET `/admin/workers`
Get all registered workers.

**Response 200**
```json
[ ...User ]
```

**Response 403** — not authenticated or missing ROLE_WORKER_ADMIN

---

#### GET `/admin/attendance/today`
Get today's attendance summary for all workers.

**Response 200**
```json
[
  {
    "user": { ...User },
    "todayAttendance": { ...AttendanceRecord } | null
  }
]
```

**Response 403** — not authenticated or missing ROLE_WORKER_ADMIN

---

## Error Response Format

All errors follow this shape:

```json
{ "message": "Human-readable error description" }
```

| HTTP Status | Meaning | App Behaviour |
|-------------|---------|---------------|
| 400 | Bad request / no login before logout | Show error message to user |
| 401 | Unauthorized / token expired | Clear token, redirect to Login |
| 403 | Forbidden (not admin) | Show "No permission" message |
| 404 | Resource not found | Handle per-endpoint (see above) |
| 409 | Conflict (mobile already registered) | Show error message to user |
| 500 | Server error | Show "Server error, try again later" |
| Network | No internet / timeout | Show "Check internet connection" |

---

## Implementation Notes

| Topic | Detail |
|-------|--------|
| Worker ID format | `mem-XXXXXXXX` (auto-generated by backend on signup) |
| Attendance record ID | `{userId}_{YYYY-MM-DD}` e.g. `mem-A1B2C3D4_2026-03-30` |
| Date grouping | UTC date — attendance is per calendar day |
| Photo storage | Server filesystem at `./uploads/worker-photos/` |
| Photo URL | Full URL embedded in `WorkPhoto.imageUri` response — use directly in `<Image>` |
| Attendance photos | NOT stored in attendance endpoints. The app captures a selfie for UX verification only; it is not transmitted to the backend. |
| Admin role | Controlled by `isAdmin` flag on `WorkerUser` entity; granted `ROLE_WORKER_ADMIN` in JWT |
| JWT expiry | 1 hour — app handles 401 by clearing token and redirecting to Login |

---

## Switching Back to Mock

1. Open `src/constants/config.ts`
2. Set `USE_MOCK: true`

No other changes needed. All screens call `api.*` which routes automatically via `src/api/index.ts`.
