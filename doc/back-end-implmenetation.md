# Backend Implementation Reference

**Project:** World of DC — SMC Karmachari Worker API
**Repository:** https://github.com/Stormtrooper089/world_of_dc
**Live URL:** https://world-of-dc-election.onrender.com
**Last Synced:** March 2026

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Java Spring Boot 2.7.0 |
| Language | Java 17 |
| Database | MongoDB Atlas (Cloud) — cluster0.f0u1sly.mongodb.net |
| DB Name | `cachar_complaints` |
| Auth | JWT (spring-security + HS256) |
| File Storage | Server filesystem — `./uploads/worker-photos/` |
| Server Port | 8080 |
| Context Path | `/` (no prefix) |
| Timezone | Asia/Kolkata |

---

## Server Configuration

```properties
server.port=8080
server.servlet.context-path=/
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=50MB
```

**JWT Config:**
- Secret: `mySecretKey123456789012345678901234567890`
- Expiry: `3600000ms` (1 hour)

---

## Worker API — Full Endpoint Reference

> These are the only endpoints used by the SMC Karmachari mobile app.
> Source controllers: `WorkerAuthController`, `WorkerAttendanceController`,
> `WorkerPhotoController`, `WorkerAdminController`

---

### Authentication (`WorkerAuthController` → `/auth`)

#### POST `/auth/login`

Login with mobile number.

**Request Body** (`WorkerLoginRequest`):
```json
{ "mobile": "9876543210" }
```

**Response 200** (`WorkerAuthResponse`):
```json
{
  "user": {
    "id": "mem-A1B2C3D4",
    "mobile": "9876543210",
    "name": "Raju Das",
    "address": "Ward 12, Silchar",
    "createdAt": "2026-03-01T10:00:00.000Z",
    "isAdmin": true
  },
  "token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

**Response 404:**
```json
{ "message": "User not found" }
```

---

#### POST `/auth/signup`

Register a new worker. Always creates with `isAdmin: false`.

**Request Body** (`WorkerSignupRequest`):
```json
{
  "mobile": "9876543210",
  "name": "Raju Das",
  "address": "Ward 12, Silchar"
}
```
> `name` and `address` are optional in the DTO but the app form enforces them.

**Response 201** (`WorkerAuthResponse`):
```json
{
  "user": {
    "id": "mem-A1B2C3D4",
    "mobile": "9876543210",
    "name": "Raju Das",
    "address": "Ward 12, Silchar",
    "createdAt": "2026-03-30T08:30:00.000Z",
    "isAdmin": false
  },
  "token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

**Response 409:**
```json
{ "message": "Mobile number already registered" }
```

---

### Attendance (`WorkerAttendanceController` → `/attendance`)

#### POST `/attendance/login`

Mark attendance check-in. **JSON body only — no file upload.**

**Request Body** (`WorkerAttendanceRequest`):
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

**Response 200** (`AttendanceRecordDto`):
```json
{
  "id": "mem-A1B2C3D4_2026-03-30",
  "userId": "mem-A1B2C3D4",
  "date": "2026-03-30",
  "loginTime": "2026-03-30T08:30:00.000Z",
  "logoutTime": null,
  "loginLocation": {
    "latitude": 24.8333,
    "longitude": 92.7789,
    "accuracy": 12.0
  },
  "logoutLocation": null
}
```

**Response 404:** `{ "message": "User not found" }`

**Side effect:** Worker `status` is updated to `ON_DUTY` in `tracking_members` collection.

---

#### POST `/attendance/logout`

Mark attendance check-out. **JSON body only — no file upload.**

**Request Body** (`WorkerAttendanceRequest`):
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

**Response 200** (`AttendanceRecordDto`):
```json
{
  "id": "mem-A1B2C3D4_2026-03-30",
  "userId": "mem-A1B2C3D4",
  "date": "2026-03-30",
  "loginTime": "2026-03-30T08:30:00.000Z",
  "logoutTime": "2026-03-30T17:00:00.000Z",
  "loginLocation": { "latitude": 24.8333, "longitude": 92.7789, "accuracy": 12.0 },
  "logoutLocation": { "latitude": 24.8340, "longitude": 92.7795, "accuracy": 10.0 }
}
```

**Response 400:** `{ "message": "No attendance login found for today. Please mark attendance first." }`

**Response 404:** `{ "message": "User not found" }`

**Side effect:** Worker `status` is updated back to `ACTIVE` in `tracking_members` collection.

---

#### GET `/attendance/today/{userId}`

Get today's attendance record.

**Response 200:** `AttendanceRecordDto` (see above)

**Response 404:** `{ "message": "No attendance record found for today" }`

> App treats 404 as `null` (worker hasn't checked in yet today).

---

#### GET `/attendance/history/{userId}`

Get all attendance records for a worker, newest first.

**Response 200:** Array of `AttendanceRecordDto`
```json
[
  { ...AttendanceRecordDto },
  { ...AttendanceRecordDto }
]
```
> Returns `[]` (empty array) if no records — never a 404.

---

### Work Photos (`WorkerPhotoController` → `/photos`)

#### POST `/photos/upload`

Upload a work progress photo with geo-tag. **multipart/form-data.**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `userId` | string | ✅ | Worker's `mem-XXXXXXXX` ID |
| `photo` | File | ✅ | image/jpeg or image/png, max 10MB |
| `latitude` | number | ✅ | Sent as form field string |
| `longitude` | number | ✅ | Sent as form field string |
| `accuracy` | number | optional | Sent as form field string |
| `notes` | string | optional | Work description |

**Response 201** (`WorkPhotoDto`):
```json
{
  "id": "64b7f8e9a1c2d3e4f5a6b7c8",
  "userId": "mem-A1B2C3D4",
  "imageUri": "https://world-of-dc-election.onrender.com/api/files/download/worker-photos/1711789200000_photo.jpg",
  "notes": "Cleaned drainage at Ward 12",
  "location": {
    "latitude": 24.8333,
    "longitude": 92.7789,
    "accuracy": 12.0
  },
  "uploadedAt": "2026-03-30T09:00:00.000Z"
}
```

**Response 404:** `{ "message": "User not found" }`
**Response 500:** Server error (file write failure)

> `imageUri` in the response is a fully-qualified URL — use it directly in `<Image source={{ uri: imageUri }} />`.

---

#### GET `/photos/today/{userId}`

Get all photos uploaded by a worker today, newest first.

**Response 200:** Array of `WorkPhotoDto`
> Returns `[]` (empty array) if no photos today — never a 404.

---

### Admin (`WorkerAdminController` → `/admin`)

> Requires `ROLE_WORKER_ADMIN` authority in the JWT.
> Workers with `isAdmin: true` are automatically granted this role by the backend at login.

#### GET `/admin/workers`

Get all registered workers.

**Response 200:** Array of `WorkerUserDto`
```json
[
  {
    "id": "mem-A1B2C3D4",
    "mobile": "9876543210",
    "name": "Raju Das",
    "address": "Ward 12, Silchar",
    "createdAt": "2026-03-01T10:00:00.000Z",
    "isAdmin": true
  }
]
```

**Response 403:** User lacks `ROLE_WORKER_ADMIN`

---

#### GET `/admin/attendance/today`

Get today's attendance summary for every worker.

**Response 200:** Array of `AdminWorkerSummaryDto`
```json
[
  {
    "user": { ...WorkerUserDto },
    "todayAttendance": { ...AttendanceRecordDto } // null if worker hasn't checked in
  }
]
```

**Response 403:** User lacks `ROLE_WORKER_ADMIN`

---

## Error Response Format

All errors return:
```json
{ "message": "Human-readable description" }
```

| Status | Trigger |
|--------|---------|
| 400 | Logout attempted with no prior login today |
| 401 | Missing/expired JWT token |
| 403 | Valid JWT but insufficient role (not ROLE_WORKER_ADMIN) |
| 404 | User not found / no attendance record today |
| 409 | Mobile already registered (signup) |
| 500 | File storage error / unexpected server failure |

---

## Data Models (MongoDB Collections)

### `tracking_members` — Worker entities

| Field | Type | Notes |
|-------|------|-------|
| `id` | String | Primary key, format: `mem-XXXXXXXX` |
| `mobile` | String | Indexed, unique |
| `name` | String | |
| `address` | String | |
| `role` | String | `WORKER` by default |
| `status` | String | `ACTIVE` / `ON_DUTY` — updated on attendance events |
| `isAdmin` | boolean | Grants `ROLE_WORKER_ADMIN` in JWT when `true` |
| `createdAt` | Instant | ISO 8601 |
| `location` | GeoJsonPoint | Geo-spatial indexed |

### `tracking_activities` — Attendance & activity logs

| Field | Type | Notes |
|-------|------|-------|
| `id` | String | MongoDB ObjectId |
| `squadId` | String | Indexed |
| `memberId` | String | Indexed — same as Worker `id` |
| `type` | String | `LOGIN` / `LOGOUT` / `PHOTO` |
| `latitude` | Double | |
| `longitude` | Double | |
| `accuracy` | Double | |
| `notes` | String | |
| `attachments` | List\<String\> | File paths |
| `timestamp` | Instant | Indexed |

### Work Photos — stored in filesystem

- Path: `./uploads/worker-photos/<timestamp>_<originalfilename>`
- URL served via: `GET /api/files/download/worker-photos/<filename>`
- Full URL in response: `https://world-of-dc-election.onrender.com/api/files/download/worker-photos/...`

---

## Full Backend Controller Inventory

The backend serves multiple modules beyond worker attendance. Listed for reference:

| Controller | Base Path | Purpose |
|-----------|-----------|---------|
| `WorkerAuthController` | `/auth` | ✅ Used by app |
| `WorkerAttendanceController` | `/attendance` | ✅ Used by app |
| `WorkerPhotoController` | `/photos` | ✅ Used by app |
| `WorkerAdminController` | `/admin` | ✅ Used by app |
| `CitizenController` | `/api/citizen` | Citizen grievance portal |
| `ComplaintController` | `/api/complaints` | Complaint CRUD + comments + file uploads |
| `ElectionComplaintController` | `/api/election-complaints` | Election-related complaints |
| `OfficerController` | `/api/officer` | Officer login, complaint assignment, approvals |
| `PollingPartyController` | `/api/polling-parties` | Polling party management + Excel upload |
| `PollingStationController` | `/api/polling-stations` | Station data + H3 hex clustering + PDF route plans |
| `TaskController` | `/api/tasks` | Task creation + workflow + comments |
| `TrackingController` | `/api/tracking` | Squad tracking, member location updates |
| `VehicleController` | `/api/vehicles` | Vehicle data + location tracking |
| `FileController` | `/api/files` | Shared file download endpoint |

---

## Key Implementation Notes

| Topic | Detail |
|-------|--------|
| Worker ID | Auto-generated on signup: `mem-XXXXXXXX` (8 random hex chars) |
| Attendance record ID | `{userId}_{YYYY-MM-DD}` — one record per worker per day |
| Date grouping | UTC date — if worker is in IST, midnight UTC = 5:30 AM IST |
| Idempotency | `/attendance/login` is idempotent — safe to call twice, returns existing record |
| Logout guard | Logout returns 400 if no login exists for today |
| Photo URL | `imageUri` in `WorkPhotoDto` is always a fully-qualified URL |
| File size limit | 10MB per file, 50MB per request |
| JWT expiry | 1 hour — app handles 401 by clearing Keychain token and navigating to Login |
| Admin role | `isAdmin: true` on user → `ROLE_WORKER_ADMIN` in JWT claims |
| Attendance photos | Backend does NOT store selfies for check-in/check-out. App captures selfie for UX only — photo is not transmitted to attendance endpoints. |
