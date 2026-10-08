# Al Nahda

Al Nahda is an Islamic online education platform focused on two learning tracks:

- Learn Quran
- Learn Arabic

This repository contains the backend services (NestJS modular monolith) plus the
product and project documentation.

## Repository layout

```
Al Nahda/
├─ backend/                 NestJS API (TypeScript, Prisma, PostgreSQL)
│  ├─ prisma/
│  │  ├─ schema.prisma      Data model (users, profiles, evaluations, enrollment, attendance, notifications)
│  │  ├─ migrations/        Committed SQL migrations (applied with `prisma migrate deploy`)
│  │  └─ seed.mjs           Seeds sample evaluation questions
│  ├─ src/
│  │  ├─ auth/              Google ID token verification, JWT guards, roles, teacher-approval guard
│  │  ├─ users/             User identity persistence (Google upsert, ADMIN_EMAILS bootstrap)
│  │  ├─ admin/             Admin APIs (teacher approval, students, enrollments)
│  │  ├─ students/          Student profile + progress
│  │  ├─ teachers/          Teacher profile + notifications
│  │  ├─ evaluations/       Evaluation engine (scoring + level placement)
│  │  ├─ enrollments/       Enrollment flow (teacher / time slot / course)
│  │  ├─ attendance/        Attendance tracking
│  │  ├─ notifications/     Notification inbox
│  │  ├─ prisma/            PrismaService / PrismaModule
│  │  └─ health/            Health check
│  └─ Dockerfile            Production image for Render / Koyeb
├─ .github/workflows/ci.yml GitHub Actions CI (build, lint, unit + e2e tests)
├─ render.yaml              Render free-tier blueprint
├─ PRD.md                   Product requirements
└─ PROJECT_CONTEXT.md       Project context and implementation guide
```

## Documentation

- [PRD.md](./PRD.md) — product requirements document
- [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) — project context and implementation guide

## Quick start

```bash
cd backend
npm ci
cp .env.example .env          # then fill in DATABASE_URL, JWT_SECRET, GOOGLE_CLIENT_ID
npx prisma generate
npx prisma migrate deploy     # apply committed migrations
npm run prisma:seed           # optional: seed sample evaluation questions
npm run start:dev
```

The API runs on `http://localhost:3000` and Swagger UI is available at
`http://localhost:3000/api/docs`.

## Deployment (free tier)

- **API**: Render (or Koyeb) using the Dockerfile in `backend/`
- **Database**: PostgreSQL on Supabase (set `DATABASE_URL`)
- **CI**: GitHub Actions (`.github/workflows/ci.yml`)

The API is shipped as a Render **blueprint** (`render.yaml`). `autoDeploy: true`
is set, so every push to `main` rebuilds and redeploys the service — no manual
redeploy clicks needed.

### First deploy

1. Create the project in Render (free tier, Docker, Oregon). Render will pick up
   `render.yaml` automatically.
2. Attach the **Supabase PostgreSQL database** to the service. `DATABASE_URL` is
   `sync: true`, so Render fills it in for you.
3. Set `DIRECT_URL` in the Render service environment to the Supabase direct
   (non-pooler) connection string; Prisma uses it for migrations.
4. Go to **Settings → Deploy** and confirm **Auto-Deploy = On** (the service was
   created from a manual form, so the toggle has to be switched on — the
   `render.yaml` above declares it).
5. Optional: add a `SENTRY_DSN` config var to enable error tracking.

To move a manually-created service onto this blueprint, use Render's
**"Convert to Blueprint"** in the service's Deploy settings — it rewrites the
service to match `render.yaml` (service name, env vars, auto-deploy).
