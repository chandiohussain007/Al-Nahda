# Al Nahda API

NestJS + Prisma backend for the Al Nahda Quran & Arabic learning platform.

## Tech stack

- TypeScript (ESM, `nodenext`)
- NestJS 12
- Prisma 5 + PostgreSQL (committed migrations)
- Google Identity Services (ID token verification) + internal JWT
- `class-validator` DTO validation
- Swagger / OpenAPI
- Vitest for unit and e2e tests

## Environment variables

Copy `.env.example` to `.env` and provide:

| Variable | Description |
| --- | --- |
| `NODE_ENV` | `development` / `production` (production enables strict env validation) |
| `PORT` | HTTP port (default `3000`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign internal JWTs (≥ 16 chars in production) |
| `GOOGLE_CLIENT_ID` | Google OAuth client id used to validate token audience |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret (server-side only) |
| `GOOGLE_REDIRECT_URI` | Google OAuth redirect URI |
| `ADMIN_EMAILS` | Comma-separated Google emails automatically granted the `ADMIN` role |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins (empty = reflect request origin) |

In `NODE_ENV=production` the app fails fast at boot if `DATABASE_URL`,
`JWT_SECRET` or `GOOGLE_CLIENT_ID` are missing, if `JWT_SECRET` is weak/default,
or if `PORT` is not numeric (see `src/config/env.validation.ts`).

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run start:dev` | Start in watch mode |
| `npm run build` | Compile to `dist/` |
| `npm run start:prod` | Run the compiled `dist/main.js` |
| `npm test` | Run unit tests (vitest) |
| `npm run test:e2e` | Run e2e tests (requires a database) |
| `npm run lint` | oxlint |
| `npm run prisma:seed` | Seed sample evaluation questions |

## Database migrations

Migrations are committed under `prisma/migrations/`.

```bash
npx prisma migrate dev       # create/apply migrations during development
npx prisma migrate deploy    # apply committed migrations (CI, production)
npx prisma generate          # regenerate the Prisma client
```

## Authentication flow

1. The frontend signs the user in with Google and obtains a Google **ID token**.
2. The frontend calls `POST /api/auth/google` with `{ "idToken": "<google id token>" }`.
3. The backend verifies the token with Google Identity Services, finds or creates
   the user, and returns an internal JWT plus the user profile.
4. The frontend sends `Authorization: Bearer <accessToken>` on protected requests.

JWT payload: `{ sub, email, role }` where `role` is `STUDENT`, `TEACHER` or `ADMIN`.

## Roles, admin access and teacher approval

- `JwtAuthGuard` validates the bearer token and populates `request.user`.
- `RolesGuard` enforces `@Roles(...)` metadata.
- `TeacherApprovalGuard` requires `teacherStatus = APPROVED` for teacher-only
  features (teacher notifications, attendance recording, enrollment access).
- Student routes require `STUDENT`; admin routes require `ADMIN`.

**Privilege-escalation safety**

- A client can only request `STUDENT` or `TEACHER` at login (`ADMIN` is rejected
  by the DTO).
- `ADMIN` is granted **only** when the verified Google email is listed in
  `ADMIN_EMAILS`.
- Existing roles are never auto-upgraded on later logins (except the admin
  bootstrap above).

**Teacher approval workflow**

```
Google login (role: TEACHER)
        ↓
Teacher creates profile → teacherStatus = PENDING
        ↓
Admin approves/rejects (PATCH /api/admin/teachers/:id/approve|reject)
        ↓
teacherStatus = APPROVED → teacher features unlock
```

While `PENDING`, a teacher can still read/update their own profile so they can
submit their application, but cannot use teacher features.

## API routes

### Auth

| Method | Route | Access |
| --- | --- | --- |
| `POST` | `/api/auth/google` | Public |

### Student

| Method | Route | Access |
| --- | --- | --- |
| `GET` | `/api/student/profile` | Student |
| `PUT` | `/api/student/profile` | Student |
| `GET` | `/api/student/progress` | Student |

### Teacher

| Method | Route | Access |
| --- | --- | --- |
| `GET` | `/api/teacher/profile` | Teacher (any status) |
| `PUT` | `/api/teacher/profile` | Teacher (any status) |
| `POST` | `/api/teacher/notifications` | Approved teacher |

### Evaluation

| Method | Route | Access |
| --- | --- | --- |
| `GET` | `/api/test/questions?course=&level=` | Student |
| `POST` | `/api/test/evaluate` | Student |
| `GET` | `/api/test/:id` | Student |

### Enrollment

| Method | Route | Access |
| --- | --- | --- |
| `POST` | `/api/enrollment/create` | Student |
| `GET` | `/api/enrollment` | Student, approved Teacher |
| `GET` | `/api/enrollment/:id` | Student, approved Teacher |

### Attendance

| Method | Route | Access |
| --- | --- | --- |
| `GET` | `/api/attendance/:enrollmentId` | Student, approved Teacher |
| `POST` | `/api/attendance` | Approved teacher |

### Notifications

| Method | Route | Access |
| --- | --- | --- |
| `GET` | `/api/notifications` | Any authenticated user |
| `PATCH` | `/api/notifications/:id/read` | Any authenticated user |

### Admin

| Method | Route | Access |
| --- | --- | --- |
| `GET` | `/api/admin/teachers?status=` | Admin |
| `PATCH` | `/api/admin/teachers/:id/approve` | Admin |
| `PATCH` | `/api/admin/teachers/:id/reject` | Admin |
| `GET` | `/api/admin/students` | Admin |
| `GET` | `/api/admin/students/:id` | Admin |
| `GET` | `/api/admin/enrollments?status=` | Admin |
| `PATCH` | `/api/admin/enrollments/:id/approve` | Admin |
| `PATCH` | `/api/admin/enrollments/:id/reject` | Admin |

### Health & docs

| Method | Route | Access |
| --- | --- | --- |
| `GET` | `/api/health` | Public (liveness) |
| `GET` | `/api/health/ready` | Public (readiness — checks PostgreSQL) |
| `GET` | `/api/docs` | Public (Swagger UI) |

## Evaluation scoring

- A submitted answer is correct when it matches the question's `correctAnswer`
  (case-insensitive, trimmed).
- `score = correct / total * 100`.
- `score >= 80` keeps the claimed level (`PASSED`).
- `50 <= score < 80` recommends demotion by one level.
- `score < 50` recommends demotion by two levels (never below `BEGINNER`).

Run `npm run prisma:seed` to load sample questions for `LEARN_QURAN` and
`LEARN_ARABIC`.

## Docker

```bash
docker build -t al-nahda-backend .
docker run -p 3000:3000 --env-file .env al-nahda-backend
```

The container runs `prisma generate && prisma migrate deploy` before starting
the API, so committed migrations are applied on boot.
