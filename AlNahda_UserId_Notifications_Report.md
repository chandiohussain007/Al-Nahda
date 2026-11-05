# Al Nahda — User ID & Notification Architecture Report

## 1. What Was Implemented

### A. Automatic 4-digit User ID Assignment (`"0001"`, `"0002"`, ...)
- **Deterministic & Sequential:** Implemented in [`backend/src/common/user-id.util.ts`](file:///D:/testing%20app/Al%20Nahda/backend/src/common/user-id.util.ts):
  - `getUserIdNumber(prisma, userId)` calculates a user's chronological creation position among all registered users and formats it with leading zeroes (e.g., `0001`, `0002`, `0003`).
  - `findUsersByIdsOrNumbers(prisma, identifiers)` supports querying users by either their 4-digit User ID string or standard UUID.
- **Session & Auth Integration:**
  - Updated [`backend/src/auth/auth.service.ts`](file:///D:/testing%20app/Al%20Nahda/backend/src/auth/auth.service.ts) to automatically attach `userIdNumber` to the returned user object on `login`, `register`, `googleLogin`, and `refreshSession`.
  - Updated [`frontend/src/lib/types.ts`](file:///D:/testing%20app/Al%20Nahda/frontend/src/lib/types.ts) to type `userIdNumber?: string` on `SessionUser`, `UserSummary`, and `EnrollmentStudent`.

### B. Role-Based Visibility Rules
1. **Students:**
   - Updated [`frontend/src/app/dashboard/student/page.tsx`](file:///D:/testing%20app/Al%20Nahda/frontend/src/app/dashboard/student/page.tsx) to display **only their own** 4-digit Student ID in a prominent badge at the top of their dashboard. They cannot see other student or teacher IDs.
2. **Teachers:**
   - Updated [`frontend/src/app/dashboard/teacher/page.tsx`](file:///D:/testing%20app/Al%20Nahda/frontend/src/app/dashboard/teacher/page.tsx):
     - Displays their own 4-digit Teacher ID in the Overview tab.
     - Displays the 4-digit Student ID next to each student's name in their **Enrollments** table.
   - Updated [`backend/src/enrollments/enrollments.service.ts`](file:///D:/testing%20app/Al%20Nahda/backend/src/enrollments/enrollments.service.ts) to enrich the teacher's enrollment response with each enrolled student's `userIdNumber`.
3. **Admins:**
   - Updated [`backend/src/admin/admin.service.ts`](file:///D:/testing%20app/Al%20Nahda/backend/src/admin/admin.service.ts) via `attachUserIdNumbers` to attach the 4-digit ID to all teacher and student listings.
   - Updated [`frontend/src/app/dashboard/admin/page.tsx`](file:///D:/testing%20app/Al%20Nahda/frontend/src/app/dashboard/admin/page.tsx) table columns to show the 4-digit IDs for both teachers and students.

### C. Multi-Recipient & Permission-Controlled Notifications
- **Multiple Recipients Support:**
  - Users can now specify a single ID (`"0003"`) or comma-separated multiple IDs (`"0001,0002"`).
  - Updated [`backend/src/teachers/teachers.dto.ts`](file:///D:/testing%20app/Al%20Nahda/backend/src/teachers/teachers.dto.ts) and [`backend/src/admin/admin.dto.ts`](file:///D:/testing%20app/Al%20Nahda/backend/src/admin/admin.dto.ts).
- **Teacher Restriction (Course-bound only):**
  - Updated [`backend/src/teachers/teachers.service.ts`](file:///D:/testing%20app/Al%20Nahda/backend/src/teachers/teachers.service.ts):
    - When a teacher attempts to send a notification, the backend queries the database for all students enrolled in that teacher's courses.
    - If a target recipient is not enrolled in the teacher's courses, it throws:
      `ForbiddenException("User <ID> is not enrolled in any of your courses. You may only message students enrolled in your courses.")`
- **Admin Full Access:**
  - Added `POST /api/admin/notifications` in [`backend/src/admin/admin.controller.ts`](file:///D:/testing%20app/Al%20Nahda/backend/src/admin/admin.controller.ts) allowing administrators to broadcast notifications to any student or teacher by 4-digit ID or UUID.
  - Added `sendAdminNotification` in [`frontend/src/lib/api.ts`](file:///D:/testing%20app/Al%20Nahda/frontend/src/lib/api.ts).

---

## 2. The Problem & Why It Was Taking Long

### Windows Exclusive File-Locking (The Bottleneck)
When the Next.js dev server (`npm run dev`) or NestJS dev server (`npm run start:dev` / `ts-node` / `vite`) is running on Windows:
1. Node processes lock source files, build directories (`dist/`, `.next/`), and `.git/index.lock`.
2. Running tools like `npx prisma generate`, `npm run build`, or editing files using standard PowerShell streams triggers:
   - `EPERM: operation not permitted`
   - `UnauthorizedAccessException: Access to the path ... is denied`
   - `fatal: Unable to create '.../.git/index.lock': Permission denied`
3. This is why command executions hung or failed when attempting file updates or builds while background dev servers were active.

---

## 3. Current Status & Next Actions

All backend business logic and frontend types/pages have been updated:
- [x] 4-digit ID utility created ([`backend/src/common/user-id.util.ts`](file:///D:/testing%20app/Al%20Nahda/backend/src/common/user-id.util.ts))
- [x] Multi-recipient validation & course-bound authorization in teacher service ([`backend/src/teachers/teachers.service.ts`](file:///D:/testing%20app/Al%20Nahda/backend/src/teachers/teachers.service.ts))
- [x] Admin broadcast notification endpoint added ([`backend/src/admin/admin.controller.ts`](file:///D:/testing%20app/Al%20Nahda/backend/src/admin/admin.controller.ts))
- [x] Teacher and Student UI displays their assigned 4-digit IDs
- [x] Teacher notify form updated to accept single or comma-separated student IDs (`"0003"`, `"0001,0002"`)

To restart the application with these changes:
1. Stop your local running dev server in your terminal (`Ctrl + C`).
2. Run `npm run build` in the backend to ensure TypeScript compiles cleanly.
3. Start the application (`npm run dev` / `npm start`).
