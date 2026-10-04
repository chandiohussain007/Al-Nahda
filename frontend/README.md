# Al Nahda frontend

Bare-bones Next.js client for the Al Nahda API. Its purpose is to validate the
API contracts, the Google sign-in flow end-to-end, and the role-based routing —
not to look finished.

## Setup

```bash
cd frontend
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of the API, e.g. `https://al-nahda-backend.onrender.com` (no trailing slash) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Must be the **same** client as `GOOGLE_CLIENT_ID` on the backend, or token verification 401s |

## Routes

| Path | Access | What it does |
| --- | --- | --- |
| `/login` | public | Role picker + Google button; probes `/api/health` so a bad API URL is visible immediately |
| `/dashboard` | any session | Dispatches to the role's own dashboard |
| `/dashboard/admin` | `ADMIN` | Approve/reject teachers, review enrollments, list students |
| `/dashboard/teacher` | `TEACHER` | Profile, own enrollments, record attendance, send a notification |
| `/dashboard/student` | `STUDENT` | Profile, progress, placement evaluation, request enrollment |
| `/dashboard/notifications` | any session | Polling feed (15s) with mark-as-read |

Guards are enforced twice: the backend rejects the wrong role with `403`, and
`RequireRole` keeps the wrong role out of the screen client-side.

## How auth works here

The backend only exposes `POST /api/auth/google`, which takes a **Google
Identity Services ID token**. There is no OAuth redirect callback, so the login
page loads `accounts.google.com/gsi/client`, renders the official button, and
posts the credential. The internal JWT comes back as `accessToken` and is kept
in `localStorage`, then attached to every request by an axios interceptor.

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build (also type-checks)
- `npm run typecheck` — `tsc --noEmit`
- `npm start` — serve the production build
