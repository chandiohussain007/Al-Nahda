# Al Nahda – Project Context and Implementation Guide

## 1. Project intent

Al Nahda is a free-tier-friendly online education platform that supports:

- Quran learning
- Arabic learning
- student onboarding
- teacher onboarding
- placement evaluation
- enrollment management
- attendance tracking
- progress monitoring
- notifications

The backend must remain simple, maintainable, and deployable without paid infrastructure in MVP phase.

## 2. Business context

The platform is designed for Islamic education access in a digital format. It should support a simple and structured learning journey:

1. Google sign-in
2. profile setup
3. level assessment
4. teacher selection and course enrollment
5. attendance and progress tracking
6. ongoing communication through notifications

This is not a large SaaS system yet; it is a focused learning platform with a clear educational flow.

## 3. Core technical direction

### Recommended stack

- TypeScript
- NestJS
- PostgreSQL
- Prisma
- Next.js
- Google OAuth 2.0
- Swagger
- Jest

### Why this stack

- TypeScript gives consistency across frontend and backend.
- NestJS is structured and suited for modular APIs.
- PostgreSQL is a better fit than MongoDB because the data model is relational.
- Prisma simplifies schema management, migrations, and validation.
- Next.js is fast to build and deploy on Vercel.
- Google OAuth is the required authentication provider.

## 4. Architecture assumptions

### Modular monolith

Start with a modular monolith instead of a distributed service architecture.

This keeps early development easy while still providing separation between concerns:

- auth
- users
- students
- teachers
- evaluations
- enrollments
- attendance
- notifications

### Future extensibility

The backend is designed so the system can evolve into separate services later if needed, but there is no value in doing that at the beginning.

## 5. Data modeling principles

The platform should use relational tables with strong constraints.

Use database relationships for:

- user to profile mappings
- enrollment to student and teacher
- attendance to enrollment
- notifications to users

Do not try to force this into document-style data storage.

## 6. Security and role model

The default secure model should be:

- user signs in with Google
- backend verifies token
- app generates internal JWT
- backend checks the role in JWT
- all protected routes use role guards

This is safer than allowing any user to self-assign teacher status without validation.

## 7. Teacher approval model

Although the initial PRD may allow role selection at first login, the system should be designed for a more disciplined approval workflow:

- `STUDENT` account can be immediately activated
- `TEACHER` account may require application and review
- `ADMIN` can approve or reject

This reduces abuse risk and makes long-term platform integrity stronger.

## 8. Evaluation design

The evaluation engine should not be a simple score-only endpoint. It should support:

- claimed level
- assigned level
- score
- answer records
- question data
- scoring logic

This makes the system auditable and adaptable.

## 9. Free deployment constraints

The project should be built with free-tier-first deployment in mind:

- Vercel for frontend
- Render or Koyeb for API
- Supabase for Postgres
- Supabase Storage or Cloudinary for uploaded images
- GitHub Actions for CI/CD

Do not assume the service will always remain free. Free plans and limits change often.

## 10. MVP scope

The MVP should include:

- Google auth
- user and role persistence
- student profile
- teacher profile
- evaluation flow
- enrollment creation
- attendance tracking
- notifications
- API docs

The following are intentionally deferred:

- video conferencing
- direct WhatsApp automation
- complex admin tooling
- marketplace features
- payments

## 11. Implementation priorities

### Phase 1

- project scaffolding
- Prisma schema
- env configuration
- database connection
- auth module

### Phase 2

- student profile API
- teacher profile API
- evaluation module

### Phase 3

- enrollment module
- attendance module
- notification module

### Phase 4

- deployment setup
- Swagger docs
- environment verification

## 12. Code quality guidelines

- Keep modules separated by feature
- Use DTOs for request validation
- Use service-layer logic for business rules
- Keep controllers thin
- Use Prisma for all database access
- Do not store raw secrets in source control
- Prefer environment variables for config

## 13. API conventions

- use RESTful endpoints
- use consistent naming: `create`, `update`, `get`, `list`
- use HTTP status codes correctly
- return structured error responses
- keep route permissions explicit

## 14. Expected milestone outcome

The initial implementation should reach a state where a user can:

- sign in with Google
- create a profile
- complete a test
- create an enrollment request
- view progress and notifications

That milestone is the true minimum viable product for Al Nahda.

## 15. Final project direction

The implementation should be pragmatic, low-cost, and educationally focused. The team should avoid unnecessary complexity while still designing for future capability.

The project should begin as a modular monolith using NestJS and PostgreSQL and only expand later if the product demonstrates real demand.
