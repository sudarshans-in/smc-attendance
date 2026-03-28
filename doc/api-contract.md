# SMC Karmachari — API Contract

**Version:** 1.0.0
**Last Updated:** March 2026
**Base URL:** `https://api.silcharmunicipal.gov.in/safai`

This document defines the REST API contract the mobile app expects.
The frontend mock layer (`src/mock/mockApi.ts`) implements the same behaviour — use this as the reference for backend development.

---

## Authentication

All endpoints except `/auth/login` and `/auth/signup` require:

```
Authorization: Bearer <jwt_token>
```

The token is returned by login/signup and stored on the device. It is attached to every request automatically by the axios client.

---

## Data Models

### User
```json
{
  "id": "string",
  "mobile": "string",
  "name": "string",
  "address": "string",
  "createdAt": "ISO datetime string",
  "isAdmin": "boolean"
}
```

### AttendanceRecord
```json
{
  "id": "string",
  "userId": "string",
  "date": "YYYY-MM-DD",
  "loginTime": "ISO datetime string | null",
  "logoutTime": "ISO datetime string | null",
  "loginLocation": "LocationCoords | null",
  "logoutLocation": "LocationCoords | null"
}
```

### WorkPhoto
```json
{
  "id": "string",
  "userId": "string",
  "imageUri": "string (URL to stored image)",
  "notes": "string",
  "location": "LocationCoords",
  "uploadedAt": "ISO datetime string"
}
```

### LocationCoords
```json
{
  "latitude": "number",
  "longitude": "number",
  "accuracy": "number | null"
}
```

### AdminWorkerSummary
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

**Response 200** — user found
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

> App behaviour on 404: redirects to Signup screen with mobile pre-filled.

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
Mark attendance check-in for today.

**Request**
```json
{
  "userId": "w001",
  "location": {
    "latitude": 24.8333,
    "longitude": 92.7789,
    "accuracy": 12
  }
}
```

**Response 200** — created or already exists (idempotent)
```json
{ ...AttendanceRecord }
```

---

#### POST `/attendance/logout`
Mark attendance check-out for today.

**Request**
```json
{
  "userId": "w001",
  "location": {
    "latitude": 24.8340,
    "longitude": 92.7795,
    "accuracy": 10
  }
}
```

**Response 200** — updated or already logged out (idempotent)
```json
{ ...AttendanceRecord }
```

**Response 400** — no login exists for today
```json
{ "message": "No attendance login found for today. Please mark attendance first." }
```

---

#### GET `/attendance/today/:userId`
Get today's attendance record for a worker.

**Response 200** — record found
```json
{ ...AttendanceRecord }
```

**Response 404** — no record for today
```json
{ "message": "No attendance record for today" }
```

> App behaviour on 404: treats as `null` (worker hasn't checked in yet).

---

#### GET `/attendance/history/:userId`
Get all attendance records for a worker, sorted newest first.

**Response 200**
```json
[ ...AttendanceRecord ]
```

---

### Work Photos

#### POST `/photos/upload`
Upload a work progress photo.

**Request** — `multipart/form-data`

| Field | Type | Required |
|-------|------|----------|
| `userId` | string | ✅ |
| `notes` | string | optional |
| `latitude` | string (number) | ✅ |
| `longitude` | string (number) | ✅ |
| `accuracy` | string (number) | optional |
| `photo` | file (image/jpeg or image/png) | ✅ |

**Response 201**
```json
{ ...WorkPhoto, "imageUri": "https://cdn.../photo.jpg" }
```

---

#### GET `/photos/today/:userId`
Get all work photos uploaded today by a worker, sorted newest first.

**Response 200**
```json
[ ...WorkPhoto ]
```

---

### Admin

> These endpoints require `isAdmin: true` on the authenticated user. Return 403 otherwise.

#### GET `/admin/workers`
Get all registered workers.

**Response 200**
```json
[ ...User ]
```

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

---

## Error Response Format

All errors follow this shape:

```json
{
  "message": "Human-readable error description",
  "detail": "Optional technical detail"
}
```

| HTTP Status | Meaning | App Behaviour |
|-------------|---------|---------------|
| 400 | Bad request / validation error | Show error message to user |
| 401 | Unauthorized / token expired | Clear token, redirect to Login |
| 403 | Forbidden (not admin) | Show "No permission" message |
| 404 | Resource not found | Handle per-endpoint (see above) |
| 409 | Conflict (duplicate) | Show error message to user |
| 500+ | Server error | Show "Server error, try again later" |
| Network | No internet / timeout | Show "Check internet connection" |

---

## Switching from Mock to Real

1. Open `src/constants/config.ts`
2. Set `USE_MOCK: false`
3. Set `API_BASE_URL` to the deployed backend URL

```ts
export const Config = {
  USE_MOCK: false,                                          // ← change this
  API_BASE_URL: 'https://api.silcharmunicipal.gov.in/safai', // ← and this
  ...
};
```

No other code changes required. All screens call `api.*` which automatically routes to `realApi.ts`.
