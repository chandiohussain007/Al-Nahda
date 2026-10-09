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
| `PORT` | HTTP port (default `3001` locally; Render sets `3000`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `DIRECT_URL` | Direct PostgreSQL connection string used by Prisma migrations (bypasses poolers) |
| `JWT_SECRET` | Secret used to sign internal JWTs (≥ 16 chars in production) |
| `GOOGLE_CLIENT_ID` | Google OAuth client id used to validate token audience |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret (server-side only) |
| `GOOGLE_REDIRECT_URI` | Google OAuth redirect URI |
| `ADMIN_EMAILS` | Comma-separated Google emails automatically granted the `ADMIN` role |
| `TEACHER_EMAILS` | Comma-separated Google emails automatically granted the `TEACHER` role |
| `ADMIN_EMAIL` | Recipient for public student registrations and teacher applications |
| `RESEND_API_KEY` | Resend API key used to deliver public applications |
| `RESEND_FROM_EMAIL` | Verified sender identity configured in Resend |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins (empty = reflect request origin) |

In `NODE_ENV=production` the app fails fast at boot if `DATABASE_URL`,
`JWT_SECRET` or `GOOGLE_CLIENT_ID` are missing, if `JWT_SECRET` is weak/default,
or if `PORT` is not numeric (see `src/config/env.validation.ts`).
Configure `TEACHER_EMAILS` and `ADMIN_EMAILS` in the backend deployment to
assign portal roles automatically. Student registration and teacher application
emails require a Resend API key, a verified sender, and an `ADMIN_EMAIL`.
Prisma also requires `DIRECT_URL` for schema validation and migrations. When
using a pooled database URL, configure this as the database provider's direct,
non-pooler connection string.

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

Production deployments must provide both `DATABASE_URL` and `DIRECT_URL`.
GitHub Actions points both to its local PostgreSQL service. On Render, add
`DIRECT_URL` in the backend service's environment settings, using the direct
connection string from the database provider (for Supabase, use its direct
connection URI rather than a pooler URI).

## Authentication flow

1. The frontend signs the user in with Google and obtains a Google **ID token**.
2. The frontend calls `POST /api/auth/google` with `{ "idToken": "<google id token>" }`.
3. The backend verifies the token with Google Identity Services, finds or creates
   the user, and returns an internal JWT plus the user profile.
4. The frontend sends `Authorization: Bearer <accessToken>` on protected requests.

JWT payload: `{ sub, email, role }` where `role` is `STUDENT`, `TEACHER` or `ADMIN`.

The role is assigned from the verified email on the backend. Addresses in
`ADMIN_EMAILS` receive `ADMIN` (taking precedence); addresses in
`TEACHER_EMAILS` receive `TEACHER`; all other new accounts receive `STUDENT`.
There is no role selector in the public login flow. Set the allow-lists in the
backend deployment environment before those users sign in.

## Roles, admin access and teacher approval

- `JwtAuthGuard` validates the bearer token and populates `request.user`.
- `RolesGuard` enforces `@Roles(...)` metadata.
- `TeacherApprovalGuard` requires `teacherStatus = APPROVED` for teacher-only
  features (teacher notifications, attendance recording, enrollment access).
- Student routes require `STUDENT`; admin routes require `ADMIN`.

**Privilege-escalation safety**

- `ADMIN` is granted **only** when the verified Google email is listed in
  `ADMIN_EMAILS`.
- `TEACHER` is granted only when the verified email is listed in `TEACHER_EMAILS`.
- Every login recalculates the role from the server-side allow-lists, so a
  removed address cannot keep an old privileged role; role selection is never
  accepted from the client.

**Teacher approval workflow**

```
Google login (email listed in `TEACHER_EMAILS`)
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

### Public applications

`POST /api/public/student-registration` emails a course-interest registration
request to `ADMIN_EMAIL`. `POST /api/public/teacher-application` emails a
teacher's name, email, contact number, teaching subjects, and experience.
Both routes use Resend and require `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and
`ADMIN_EMAIL`; requests are rate-limited.

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
