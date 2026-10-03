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

Deploy by pointing Render at this repository — `render.yaml` defines the
`al-nahda-backend` web service with the required environment variables.
