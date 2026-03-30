# Frontend ↔ Backend Integration Diagrams

**App:** SMC Karmachari (React Native 0.81)
**Backend:** Spring Boot 2.7 · MongoDB Atlas
**Base URL:** `https://world-of-dc-election.onrender.com`

---

## 1. System Architecture Overview

```mermaid
graph TB
    subgraph Device["📱 Android Device"]
        subgraph Screens["Screens"]
            LS[LoginScreen]
            SS[SignupScreen]
            HS[HomeScreen]
            US[UploadScreen]
            HIS[HistoryScreen]
            AS[AdminScreen]
        end

        subgraph State["State / Context"]
            AC[AuthContext\nuser · isAuthenticated]
            APC[AppContext\ntodayAttendance · todayPhotos]
            TC[ThemeContext\nisDark · toggle]
        end

        subgraph APILayer["API Layer"]
            IDX[src/api/index.ts\nUSE_MOCK ? mockApi : realApi]
            REAL[src/api/realApi.ts\naxios calls]
            CLIENT[src/api/client.ts\naxios instance\nJWT interceptor]
        end

        subgraph Storage["Secure Storage"]
            KC[react-native-keychain\nJWT token\nAndroid Keystore]
            AS_STORE[AsyncStorage 1.23.1\nMock data only]
        end

        subgraph Hooks["Native Hooks"]
            CAM[useCamera.ts\nlaunchCamera]
            LOC[useLocation.ts\ngetCurrentPosition]
        end
    end

    subgraph Backend["☁️ Spring Boot Backend — Render.com"]
        subgraph Controllers["Controllers"]
            WAC[WorkerAuthController\n/auth]
            WATC[WorkerAttendanceController\n/attendance]
            WPC[WorkerPhotoController\n/photos]
            WADM[WorkerAdminController\n/admin]
        end

        subgraph Security["Spring Security"]
            JWT_F[JwtAuthenticationFilter\nvalidates Bearer token]
            ROLE[Role Check\nROLE_WORKER_ADMIN]
        end

        subgraph DB["MongoDB Atlas"]
            TM[(tracking_members\nworker entities)]
            TA[(tracking_activities\nattendance logs)]
            WP_COL[(work_photos\nphoto metadata)]
        end

        FS[File System\n./uploads/worker-photos/]
    end

    Screens --> State
    Screens --> APILayer
    APILayer --> CLIENT
    CLIENT --> KC
    CLIENT -->|HTTPS + Bearer token| Controllers
    Controllers --> Security
    Security --> DB
    WPC --> FS
    Hooks --> Screens
```

---

## 2. App Navigation Flow

```mermaid
flowchart TD
    START([App Launch]) --> RN[RootNavigator\ncheck Keychain for token]

    RN -->|token found| AUTH_CHECK[AuthContext\nrestore user session]
    RN -->|no token| LOGIN

    AUTH_CHECK -->|valid| APP_NAV
    AUTH_CHECK -->|invalid/expired| LOGIN

    subgraph AuthStack["Auth Stack"]
        LOGIN[LoginScreen]
        SIGNUP[SignupScreen]
        LOGIN -->|mobile not registered| SIGNUP
    end

    subgraph AppTabs["App Bottom Tabs"]
        APP_NAV[AppNavigator]
        HOME[HomeScreen\nAttendance + Photos shortcut]
        UPLOAD[UploadScreen\nCamera + Submit]
        HISTORY[HistoryScreen\nPhotos tab · Attendance tab]
        ADMIN[AdminScreen\nisAdmin only]

        APP_NAV --> HOME
        APP_NAV --> UPLOAD
        APP_NAV --> HISTORY
        APP_NAV -->|user.isAdmin === true| ADMIN
    end

    LOGIN -->|user found| APP_NAV
    SIGNUP -->|registered| APP_NAV
    HOME -->|logout| LOGIN

    style AuthStack fill:#FFF3CD,stroke:#FFC107
    style AppTabs fill:#D1FAE5,stroke:#10B981
```

---

## 3. Authentication Flow

```mermaid
sequenceDiagram
    actor W as Worker
    participant LS as LoginScreen
    participant API as api/index.ts → realApi
    participant BE as POST /auth/login
    participant DB as MongoDB
    participant KC as Keychain

    W->>LS: enter 10-digit mobile → tap LOGIN
    LS->>LS: sanitizeNumeric() + isValidMobile()
    LS->>API: loginUser(mobile)
    API->>BE: POST /auth/login { mobile }

    alt user found
        BE->>DB: find worker by mobile
        DB-->>BE: WorkerUser entity
        BE-->>API: 200 { user, token }
        API->>KC: saveToken(jwt)
        API-->>LS: User object
        LS->>LS: AuthContext.login(user)
        LS-->>W: navigate → HomeScreen
    else not registered
        BE-->>API: 404 { message: "User not found" }
        API-->>LS: null
        LS-->>W: navigate → SignupScreen (mobile pre-filled)
    end
```

---

## 4. Signup Flow

```mermaid
sequenceDiagram
    actor W as Worker
    participant SS as SignupScreen
    participant API as api/index.ts → realApi
    participant BE as POST /auth/signup
    participant DB as MongoDB
    participant KC as Keychain

    W->>SS: fill name + address → tap REGISTER
    SS->>SS: sanitizeText() validation
    SS->>API: signupUser({ mobile, name, address })
    API->>BE: POST /auth/signup { mobile, name, address }

    alt new mobile
        BE->>DB: create TrackingMember { id: mem-XXXX, isAdmin: false }
        DB-->>BE: saved entity
        BE-->>API: 201 { user, token }
        API->>KC: saveToken(jwt)
        API-->>SS: User object
        SS->>SS: AuthContext.login(user)
        SS-->>W: navigate → HomeScreen
    else already registered
        BE-->>API: 409 Conflict
        API-->>SS: throws Error
        SS-->>W: show error message
    end
```

---

## 5. Attendance Check-In Flow

```mermaid
sequenceDiagram
    actor W as Worker
    participant HS as HomeScreen
    participant CAM as useCamera
    participant LOC as useLocation
    participant API as realApi
    participant BE as POST /attendance/login
    participant DB as MongoDB

    W->>HS: tap MARK ATTENDANCE
    HS->>CAM: takePicture()
    CAM->>CAM: requestCameraPermission()
    CAM-->>HS: imageUri (stored locally, not sent to backend)

    alt photo cancelled
        HS-->>W: snackbar "Photo required"
    end

    HS->>LOC: fetchLocation()
    LOC->>LOC: requestLocationPermission()
    LOC->>LOC: Geolocation.getCurrentPosition()
    LOC-->>HS: { latitude, longitude, accuracy }

    alt location denied / failed
        HS-->>W: snackbar "Location required"
    end

    HS->>API: markAttendanceLogin(userId, coords, _imageUri)
    API->>BE: POST /attendance/login\n{ userId, location: { lat, lng, accuracy } }
    BE->>DB: upsert TrackingActivity { type: LOGIN }
    BE->>DB: update TrackingMember.status = ON_DUTY
    DB-->>BE: AttendanceRecord
    BE-->>API: 200 { id, userId, date, loginTime, loginLocation, ... }
    API-->>HS: AttendanceRecord
    HS->>HS: AppContext.setTodayAttendance(record)
    HS-->>W: card updates to IN PROGRESS\nsnackbar "Check-in recorded"
```

---

## 6. Attendance Check-Out Flow

```mermaid
sequenceDiagram
    actor W as Worker
    participant HS as HomeScreen
    participant CAM as useCamera
    participant LOC as useLocation
    participant API as realApi
    participant BE as POST /attendance/logout
    participant DB as MongoDB

    W->>HS: tap MARK LOGOUT
    HS->>CAM: takePicture()
    CAM-->>HS: imageUri (UX only, not sent)
    HS->>LOC: fetchLocation()
    LOC-->>HS: coords

    HS->>API: markAttendanceLogout(userId, coords, _imageUri)
    API->>BE: POST /attendance/logout\n{ userId, location: { lat, lng, accuracy } }

    alt login exists for today
        BE->>DB: update logoutTime + logoutLocation
        BE->>DB: update TrackingMember.status = ACTIVE
        DB-->>BE: updated AttendanceRecord
        BE-->>API: 200 AttendanceRecord (logoutTime now set)
        API-->>HS: AttendanceRecord
        HS->>HS: AppContext.setTodayAttendance(record)
        HS-->>W: card updates to COMPLETE
    else no login today
        BE-->>API: 400 "No attendance login found for today"
        API-->>HS: throws Error with message
        HS-->>W: snackbar shows backend error message
    end
```

---

## 7. Work Photo Upload Flow

```mermaid
sequenceDiagram
    actor W as Worker
    participant US as UploadScreen
    participant CAM as useCamera
    participant LOC as useLocation
    participant API as realApi
    participant BE as POST /photos/upload
    participant FS as File System
    participant DB as MongoDB

    W->>US: tap CAMERA
    US->>CAM: takePicture()
    CAM->>CAM: requestCameraPermission()
    CAM-->>US: imageUri (local file path)
    US->>LOC: fetchLocation() [auto after photo]
    LOC-->>US: coords

    US-->>W: shows preview + location ready\nSubmit button enabled

    W->>US: add optional notes → tap SUBMIT PHOTO
    US->>API: uploadWorkPhoto(userId, imageUri, notes, coords)
    API->>BE: POST /photos/upload\nmultipart/form-data\n{ userId, photo file, latitude,\n  longitude, accuracy, notes }
    BE->>FS: save file to ./uploads/worker-photos/
    BE->>DB: insert WorkPhoto { imageUri: full URL, location, notes }
    DB-->>BE: saved WorkPhoto
    BE-->>API: 201 WorkPhoto { imageUri: https://...url, uploadedAt, ... }
    API-->>US: WorkPhoto
    US->>US: AppContext.addPhoto(photo)
    US-->>W: snackbar "Photo uploaded"\nphoto appears in list below
```

---

## 8. History Screen Data Flow

```mermaid
sequenceDiagram
    participant HS as HistoryScreen
    participant APC as AppContext
    participant API as realApi
    participant BE1 as GET /photos/today/:userId
    participant BE2 as GET /attendance/history/:userId

    HS->>HS: onRefresh() / pull-to-refresh
    HS->>API: getTodayPhotos(userId) + getAttendanceHistory(userId)
    note over HS,API: Both called in parallel via Promise.all

    API->>BE1: GET /photos/today/{userId}
    BE1-->>API: [ WorkPhoto[] ] sorted newest first

    API->>BE2: GET /attendance/history/{userId}
    BE2-->>API: [ AttendanceRecord[] ] sorted newest first

    API-->>HS: [photos, history]
    HS->>APC: setTodayPhotos(photos)
    HS->>APC: setAttendanceHistory(history)
    HS-->>HS: re-render with fresh data
```

---

## 9. Admin Screen Data Flow

```mermaid
sequenceDiagram
    participant AS as AdminScreen
    participant API as realApi
    participant BE1 as GET /admin/workers
    participant BE2 as GET /admin/attendance/today
    participant SEC as Spring Security

    AS->>AS: useEffect on mount
    AS->>API: getAllWorkers() + getTodayAllAttendance()

    API->>BE1: GET /admin/workers\nAuthorization: Bearer <token>
    BE1->>SEC: validate JWT + check ROLE_WORKER_ADMIN

    alt has ROLE_WORKER_ADMIN
        SEC-->>BE1: allowed
        BE1-->>API: [ User[] ]
    else missing role
        SEC-->>BE1: 403 Forbidden
        BE1-->>API: throws Error "No permission"
    end

    API->>BE2: GET /admin/attendance/today\nAuthorization: Bearer <token>
    BE2->>SEC: validate JWT + check ROLE_WORKER_ADMIN
    SEC-->>BE2: allowed
    BE2-->>API: [ AdminWorkerSummary[] ]

    API-->>AS: [workers, summaries]
    AS-->>AS: render stats strip\n(Present / Absent / Total)\nrender worker rows
```

---

## 10. JWT Token Lifecycle

```mermaid
flowchart LR
    SIGNUP[signup / login] -->|server issues token\n1 hour expiry| SAVE
    SAVE[Keychain.setGenericPassword\nAndroid Keystore] --> ATTACH

    ATTACH[axios request interceptor\nclient.ts line 38\nattaches Bearer token\nto every request] --> REQ[API Request]

    REQ --> VALID{Token valid?}
    VALID -->|yes| SUCCESS[200 Response]
    VALID -->|expired / invalid| RESP_401[401 Unauthorized]

    RESP_401 --> CLEAR[clearToken\nKeychain.resetGenericPassword]
    CLEAR --> REDIRECT[navigate → LoginScreen]
    REDIRECT --> SIGNUP

    style SAVE fill:#D1FAE5,stroke:#10B981
    style RESP_401 fill:#FEE2E2,stroke:#EF4444
    style CLEAR fill:#FEE2E2,stroke:#EF4444
```

---

## 11. Mock ↔ Real API Switch

```mermaid
flowchart LR
    CFG[src/constants/config.ts\nUSE_MOCK: true / false\nAPI_BASE_URL: https://...]

    CFG -->|USE_MOCK = true| MOCK[src/mock/mockApi.ts\nAsyncStorage-backed\n300-800ms simulated delay]
    CFG -->|USE_MOCK = false| REAL[src/api/realApi.ts\naxios → Spring Boot\nhttps://world-of-dc-election.onrender.com]

    IDX[src/api/index.ts\nexport const api = Config.USE_MOCK ? mockApi : realApi]

    CFG --> IDX
    IDX --> MOCK
    IDX --> REAL

    SCREENS[All Screens\nimport api from src/api/index.ts] --> IDX

    style MOCK fill:#FFF3CD,stroke:#FFC107
    style REAL fill:#D1FAE5,stroke:#10B981
    style IDX fill:#DBEAFE,stroke:#3B82F6
```

---

## 12. Screen → API Mapping Reference

| Screen | API Call | Backend Endpoint |
|--------|----------|-----------------|
| LoginScreen | `api.loginUser(mobile)` | `POST /auth/login` |
| SignupScreen | `api.signupUser({mobile, name, address})` | `POST /auth/signup` |
| HomeScreen | `api.getTodayAttendance(userId)` | `GET /attendance/today/:userId` |
| HomeScreen | `api.getTodayPhotos(userId)` | `GET /photos/today/:userId` |
| HomeScreen | `api.markAttendanceLogin(userId, coords, _)` | `POST /attendance/login` |
| HomeScreen | `api.markAttendanceLogout(userId, coords, _)` | `POST /attendance/logout` |
| UploadScreen | `api.getTodayPhotos(userId)` | `GET /photos/today/:userId` |
| UploadScreen | `api.uploadWorkPhoto(userId, uri, notes, coords)` | `POST /photos/upload` |
| HistoryScreen | `api.getTodayPhotos(userId)` | `GET /photos/today/:userId` |
| HistoryScreen | `api.getAttendanceHistory(userId)` | `GET /attendance/history/:userId` |
| AdminScreen | `api.getAllWorkers()` | `GET /admin/workers` |
| AdminScreen | `api.getTodayAllAttendance()` | `GET /admin/attendance/today` |
