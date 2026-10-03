# Al Nahda Backend Services – Product Requirements Document

## 1. Executive Summary

Al Nahda is an Islamic online education platform focused on two core learning tracks:

- Learn Quran
- Learn Arabic

The backend is responsible for:

- Google OAuth 2.0 authentication
- Student and teacher onboarding
- Course registration and placement preferences
- Assessment and level placement testing
- Enrollment and class coordination
- LMS-related attendance, notifications, and progress tracking

The project should be developed as a low-cost, free-tier-friendly platform that can be deployed without paid infrastructure in the MVP stage.

## 2. Product Objectives

### Primary goals

1. Allow users to sign in using Google SSO.
2. Store user identity and role as `STUDENT` or `TEACHER`.
3. Support profile creation for students and teachers.
4. Support an evaluation test to assess baseline English/Arabic/Quran proficiency.
5. Permit enrollment with teacher selection, preferred time slots, and course choice.
6. Provide core LMS operations: attendance, progress, notifications.
7. Maintain a clean and scalable backend architecture suitable for future growth.

### Non-goals for MVP

- Full admin dashboard
- Real-time video learning
- In-app chat
- WhatsApp automation via paid APIs
- Payment or subscription billing

## 3. Target Users

### Student

- Signs in with Google
- Chooses student profile
- Takes evaluation test
- Selects course, time slot, and preferred teacher
- Tracks progress and attendance

### Teacher

- Signs in with Google
- Creates teacher profile
- Lists qualifications and experience
- Receives enrollment requests
- Tracks attendance and sends notices to students

### Admin (future)

- Reviews teacher applications
- Approves or rejects teacher accounts
- Oversees course operations and enrollment management

## 4. Authentication and Authorization

### 4.1 Authentication method

- Provider: Google OAuth 2.0
- Flow: Frontend receives Google identity token
- Backend verifies token using Google Identity Services
- Backend creates or finds the user
- Backend issues its own JWT token for app usage

### 4.2 Roles

- `STUDENT`
- `TEACHER`
- `ADMIN` (future-ready)

### 4.3 Authorization rules

- Student routes require `STUDENT` role
- Teacher routes require `TEACHER` role
- Admin routes require `ADMIN` role
- JWT payload includes at least:
  - `sub` user ID
  - `role`
  - `email`

### 4.4 Onboarding model

For secure operations:

- A user signs in with Google
- If no user exists, a new account is created
- User selects their primary role or is routed to a role-approval flow
- Teacher accounts should ideally go through approval rather than immediate privilege assignment

## 5. Data Model

### 5.1 User

| Field | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | String (UUID) | PK, unique | Internal user ID |
| email | String | unique, required | Google email |
| googleId | String | unique, required | Google user ID |
| role | Enum | required | STUDENT / TEACHER / ADMIN |
| createdAt | DateTime | auto-generated | Account creation time |

### 5.2 StudentProfile

| Field | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | String (UUID) | PK | Student profile ID |
| userId | String | FK, unique | Linked user |
| fullName | String | required | Student name |
| profilePictureUrl | String | optional | Photo URL |
| whatsappNumber | String | optional | Contact number |
| bio | String | optional | Short introduction |

### 5.3 TeacherProfile

| Field | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | String (UUID) | PK | Teacher profile ID |
| userId | String | FK, unique | Linked user |
| fullName | String | required | Teacher display name |
| profilePictureUrl | String | optional | Photo URL |
| bio | String | optional | Teacher intro |
| qualifications | String[] | required | Degrees or certificates |
| experienceYears | Integer | required | Years of teaching experience |
| subjectsTaught | String[] | required | Example: Learn Quran, Learn Arabic |

### 5.4 EvaluationTest

| Field | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | String | PK | Test session ID |
| studentId | String | FK | Student profile |
| claimedLevel | Enum | required | BEGINNER / INTERMEDIATE / ADVANCED |
| assignedLevel | Enum | required | Evaluated level |
| score | Float | 0-100 | Final percentage |
| status | Enum | required | PASSED / DEMOTED_RECOMMENDED |
| startedAt | DateTime | required | When test started |
| completedAt | DateTime | required | When submitted |

### 5.5 EvaluationAnswer

| Field | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | String | PK | Answer record ID |
| testId | String | FK | Related test |
| questionId | String | FK | Question reference |
| answer | String | required | Student answer |
| isCorrect | Boolean | required | Correctness flag |
| points | Int | required | Earned points |

### 5.6 EvaluationQuestion

| Field | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | String | PK | Question ID |
| course | Enum | required | LEARN_QURAN / LEARN_ARABIC |
| level | Enum | required | BEGINNER / INTERMEDIATE / ADVANCED |
| question | String | required | Text of question |
| options | JSON | required | List of answer options |
| correctAnswer | String | required | Correct option |

### 5.7 Enrollment

| Field | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | String | PK | Enrollment ID |
| studentId | String | FK | Student profile |
| teacherId | String | FK | Teacher profile |
| courseName | Enum | required | LEARN_QURAN / LEARN_ARABIC |
| confirmedLevel | Enum | required | Assigned level |
| preferredTimeSlot | String | required | Weekly availability |
| status | Enum | default PENDING | PENDING / ACTIVE / COMPLETED / CANCELLED |
| createdAt | DateTime | auto | Enrollment creation |

### 5.8 Attendance

| Field | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | String | PK | Attendance record |
| enrollmentId | String | FK | Related enrollment |
| date | DateTime | required | Class date |
| status | Enum | required | PRESENT / ABSENT / EXCUSED |

### 5.9 Notification

| Field | Type | Constraints | Description |
| --- | --- | --- | --- |
| id | String | PK | Notification ID |
| recipientId | String | FK | Target user |
| senderId | String | FK | Sender user |
| message | String | required | Notification body |
| isRead | Boolean | default false | Read state |
| createdAt | DateTime | auto | Creation timestamp |

## 6. Business Logic and Core Flows

### 6.1 Google Sign-In

1. User clicks Google login.
2. Frontend gets Google ID token.
3. Backend verifies token against Google.
4. Backend finds or creates user.
5. Backend creates JWT.
6. Frontend stores token and uses it for subsequent requests.

### 6.2 Student onboarding

- Student creates profile with name and optionally WhatsApp number.
- Student can take evaluation test.
- Student chooses preferred teacher and time slot.
- Student creates enrollment request.

### 6.3 Teacher onboarding

- Teacher creates profile and qualification list.
- Teacher receives enrollment-related notifications.
- Teacher may review attendance and progress.

### 6.4 Evaluation test logic

- Student selects a claimed level before taking the test.
- Test engine asks questions based on course and difficulty.
- Each question has a correct answer and points.
- Backend calculates score and determines assigned level.
- If the score is below expected threshold, recommended level is lower.
- Result stored securely for auditing and future recommendations.

### 6.5 Enrollment creation

- Student submits:
  - selected course
  - preferred teacher
  - time slot
  - WhatsApp number
  - evaluation result
- System creates a pending enrollment.
- Teacher can accept or review it later.

### 6.6 Attendance and progress

- Attendance is recorded per attendance date for each enrollment.
- Student progress is derived from attendance and evaluation history.
- Backend can compute completion and retention trends.

### 6.7 Notifications

- Teacher or admin sends notification message to a student or teacher group.
- Notification is saved as a record.
- Recipient can mark it as read.

## 7. API Routes

### Auth

- `POST /api/auth/google`
- `POST /api/auth/refresh` (optional later)

### Student

- `GET /api/student/profile`
- `PUT /api/student/profile`
- `GET /api/student/progress`

### Teacher

- `GET /api/teacher/profile`
- `PUT /api/teacher/profile`
- `POST /api/teacher/notifications`

### Evaluation

- `POST /api/test/evaluate`
- `GET /api/test/:id`

### Enrollment

- `POST /api/enrollment/create`
- `GET /api/enrollment`
- `GET /api/enrollment/:id`

### LMS

- `GET /api/attendance/:enrollmentId`
- `POST /api/attendance`
- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`

## 8. Security Requirements

- Use HTTPS only
- Validate all incoming DTOs
- Use JWT verification middleware
- Enforce role-based access control
- Protect against SQL injection using Prisma or another ORM
- Use rate limiting and CORS
- Store secrets in environment configuration
- Never expose Google client secrets in the frontend

## 9. Deployment Strategy

### MVP free deployment stack

- Frontend: Next.js on Vercel
- Backend: NestJS on Render or Koyeb
- Database: PostgreSQL on Supabase
- Storage: Supabase Storage or Cloudinary
- Auth: Google OAuth 2.0
- Docs: Swagger for OpenAPI
- CI/CD: GitHub Actions

### Key deployment principle

Use free-tier services that support real PostgreSQL and simple hosting without forcing expensive infrastructure.

## 10. Recommended Tech Stack

- Language: TypeScript
- Backend: NestJS
- DB: PostgreSQL
- ORM: Prisma
- Frontend: Next.js
- Auth: Google OAuth 2.0
- Validation: class-validator
- API docs: Swagger/OpenAPI
- Testing: Jest + Supertest
- Version control: GitHub

## 11. Suggested Project Architecture

- `auth/`
- `users/`
- `students/`
- `teachers/`
- `evaluations/`
- `enrollments/`
- `attendance/`
- `notifications/`
- `common/`
- `prisma/`

The application should start as a modular monolith instead of a microservice system.

## 12. Initial Development Order

1. Project scaffolding
2. Database and Prisma schema
3. Google authentication
4. User and role setup
5. Student and teacher profiles
6. Assessment engine
7. Enrollment flow
8. Attendance and progress
9. Notification APIs
10. Swagger docs and deployment

## 13. Risks and Constraints

- Free-tier hosting may sleep after inactivity
- Some providers may impose limits on DB size or request frequency
- Google OAuth requires valid redirect URIs and environment configuration
- WhatsApp automation requires business API setup and can drive costs
- Production-grade security requires careful role and DTO validation

## 14. Success Criteria

The MVP is successful when:

- user can log in with Google
- role is stored and enforced
- student/teacher profile creation works
- evaluation test can be submitted and scored
- enrollment can be created with teacher/time preference
- attendance and notifications can be tracked
- the application is deployable on free-tier infrastructure

## 15. Final Recommendation

The best path for Al Nahda is:

- NestJS monolith
- PostgreSQL + Prisma
- Google OAuth 2.0
- Next.js frontend
- Vercel + Render/Koyeb + Supabase deployment stack

This keeps the project practical, low cost, and scalable enough for future feature expansion without overengineering the MVP.
