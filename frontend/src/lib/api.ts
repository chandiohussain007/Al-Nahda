import axios from 'axios';
import { clearSession, readSession } from './session';
import type {
  AdminStudentDetail,
  AttendanceRecord,
  CreateEnrollment,
  DirectoryTeacher,
  Enrollment,
  EnrollmentStatus,
  EvaluationQuestion,
  EvaluationTest,
  LoginResponse,
  Notification,
  StudentProfile,
  StudentProgress,
  SubmitEvaluation,
  TeacherProfile,
  TeacherStatus,
  UpsertStudentProfile,
  UpsertTeacherProfile,
  UserRole,
} from './types';

/** Base URL of the API, configured via NEXT_PUBLIC_API_URL. */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/+$/, '');

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the internal JWT to every request.
api.interceptors.request.use((config) => {
  const session = readSession();
  if (session) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

// Expired/invalid token: drop the session, and return to the login screen
// unless we are already there (so the form can still show the error).
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      typeof window !== 'undefined'
    ) {
      clearSession();

      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  },
);

/** Flattens Nest's `{ message: string | string[] }` error payloads. */
export function apiErrorMessage(error: unknown, fallback = 'Request failed'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    if (Array.isArray(data?.message)) return data.message.join(', ');
    if (typeof data?.message === 'string') return data.message;
    if (error.message) return error.message;
  }
  return fallback;
}

type AnyRecord = Record<string, unknown>;

// --- auth -------------------------------------------------------------------
export const loginWithGoogle = (idToken: string, role?: UserRole) =>
  api
    .post<LoginResponse>('/api/auth/google', { idToken, ...(role ? { role } : {}) })
    .then((r) => r.data);

// --- health -----------------------------------------------------------------
export const fetchHealth = () => api.get<AnyRecord>('/api/health').then((r) => r.data);
export const fetchReadiness = () => api.get<AnyRecord>('/api/health/ready').then((r) => r.data);

// --- teacher directory (approved only) --------------------------------------
export const fetchTeacherDirectory = () =>
  api.get<DirectoryTeacher[]>('/api/teachers').then((r) => r.data);

// --- admin ------------------------------------------------------------------
export const fetchAdminTeachers = (status?: TeacherStatus) =>
  api
    .get<TeacherProfile[]>('/api/admin/teachers', { params: status ? { status } : {} })
    .then((r) => r.data);

export const approveTeacher = (id: string) =>
  api.patch<TeacherProfile>(`/api/admin/teachers/${id}/approve`).then((r) => r.data);

export const rejectTeacher = (id: string) =>
  api.patch<TeacherProfile>(`/api/admin/teachers/${id}/reject`).then((r) => r.data);

export const fetchAdminStudents = () =>
  api.get<StudentProfile[]>('/api/admin/students').then((r) => r.data);

export const fetchAdminStudent = (id: string) =>
  api.get<AdminStudentDetail>(`/api/admin/students/${id}`).then((r) => r.data);

export const fetchAdminEnrollments = (status?: EnrollmentStatus) =>
  api
    .get<Enrollment[]>('/api/admin/enrollments', { params: status ? { status } : {} })
    .then((r) => r.data);

export const approveEnrollment = (id: string) =>
  api.patch<Enrollment>(`/api/admin/enrollments/${id}/approve`).then((r) => r.data);

export const rejectEnrollment = (id: string) =>
  api.patch<Enrollment>(`/api/admin/enrollments/${id}/reject`).then((r) => r.data);

// --- student ----------------------------------------------------------------
export const fetchStudentProfile = () =>
  api.get<StudentProfile>('/api/student/profile').then((r) => r.data);

export const saveStudentProfile = (dto: UpsertStudentProfile) =>
  api.put<StudentProfile>('/api/student/profile', dto).then((r) => r.data);

export const fetchStudentProgress = () =>
  api.get<StudentProgress>('/api/student/progress').then((r) => r.data);

// --- teacher ----------------------------------------------------------------
export const fetchTeacherProfile = () =>
  api.get<TeacherProfile>('/api/teacher/profile').then((r) => r.data);

export const saveTeacherProfile = (dto: UpsertTeacherProfile) =>
  api.put<TeacherProfile>('/api/teacher/profile', dto).then((r) => r.data);

export const sendTeacherNotification = (recipientId: string, message: string) =>
  api.post('/api/teacher/notifications', { recipientId, message }).then((r) => r.data);

// --- enrollments ------------------------------------------------------------
export const fetchMyEnrollments = () =>
  api.get<Enrollment[]>('/api/enrollment').then((r) => r.data);

export const createEnrollment = (dto: CreateEnrollment) =>
  api.post<Enrollment>('/api/enrollment/create', dto).then((r) => r.data);

// Teacher-side resolution of their own pending enrollment.
export const teacherAcceptEnrollment = (id: string) =>
  api.patch<Enrollment>(`/api/enrollment/${id}/accept`).then((r) => r.data);

export const teacherRejectEnrollment = (id: string) =>
  api.patch<Enrollment>(`/api/enrollment/${id}/reject`).then((r) => r.data);

/** Single enrollment with its attendance history (ownership enforced server-side). */
export const fetchEnrollment = (id: string) =>
  api.get<Enrollment>(`/api/enrollment/${id}`).then((r) => r.data);

// --- attendance -------------------------------------------------------------
export const fetchAttendance = (enrollmentId: string) =>
  api.get<AttendanceRecord[]>(`/api/attendance/${enrollmentId}`).then((r) => r.data);

export const recordAttendance = (payload: {
  enrollmentId: string;
  date: string;
  status: AttendanceRecord['status'];
}) => api.post<AttendanceRecord>('/api/attendance', payload).then((r) => r.data);

// --- evaluations ------------------------------------------------------------
export const fetchEvaluationQuestions = (course: string, level: string) =>
  api
    .get<EvaluationQuestion[]>('/api/test/questions', { params: { course, level } })
    .then((r) => r.data);

export const submitEvaluation = (dto: SubmitEvaluation) =>
  api.post<EvaluationTest>('/api/test/evaluate', dto).then((r) => r.data);

export const fetchEvaluationTest = (id: string) =>
  api.get<EvaluationTest>(`/api/test/${id}`).then((r) => r.data);

// --- notifications ----------------------------------------------------------
export const fetchNotifications = () =>
  api.get<Notification[]>('/api/notifications').then((r) => r.data);

export const markNotificationRead = (id: string) =>
  api.patch<Notification>(`/api/notifications/${id}/read`).then((r) => r.data);

// --- helpers ----------------------------------------------------------------
/** HTTP status of a failed request, e.g. to tell "not created yet" from "broken". */
export function apiStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}

// ─── Assessment Module APIs ─────────────────────────────────────────────────
import type {
  Assessment,
  Attempt,
  AttemptResult,
  CourseItem,
  LevelContent,
  Question,
  StartAttemptResponse,
  StudentEnrollmentRecord,
  StudentEnrollmentStatus,
} from './types';

// --- questions ---------------------------------------------------------------
export const fetchQuestions = (params?: { course?: string; level?: string; difficulty?: string }) =>
  api.get<Question[]>('/api/questions', { params }).then((r) => r.data);

export const fetchQuestion = (id: string) =>
  api.get<Question>(`/api/questions/${id}`).then((r) => r.data);

export const createQuestion = (dto: {
  text: string;
  course: string;
  level: string;
  options: string; // JSON string
  correctOptionId: string;
  difficulty?: string;
  points?: number;
  explanation?: string;
}) => api.post<Question>('/api/questions', dto).then((r) => r.data);

export const deleteQuestion = (id: string) =>
  api.delete(`/api/questions/${id}`).then((r) => r.data);

// --- course items ------------------------------------------------------------
export const fetchCourses = () =>
  api.get<CourseItem[]>('/api/courses').then((r) => r.data);

export const fetchCourseLevels = (courseId: string) =>
  api.get<LevelContent[]>(`/api/courses/${courseId}/levels`).then((r) => r.data);

// --- assessments ------------------------------------------------------------
export const fetchAssessments = () =>
  api.get<Assessment[]>('/api/assessments').then((r) => r.data);

export const fetchAssessment = (id: string) =>
  api.get<Assessment>(`/api/assessments/${id}`).then((r) => r.data);

export const createAssessment = (dto: {
  courseId: string;
  levelId?: string;
  title: string;
  description?: string;
  durationMinutes: number;
  passPercentage?: number;
  attemptsAllowed?: number;
  questionsPerAttempt?: number;
}) => api.post<Assessment>('/api/assessments', dto).then((r) => r.data);

export const publishAssessment = (id: string) =>
  api.post<Assessment>(`/api/assessments/${id}/publish`).then((r) => r.data);

export const setAssessmentQuestions = (id: string, questionIds: string[]) =>
  api.post<Assessment>(`/api/assessments/${id}/questions`, { questionIds }).then((r) => r.data);

// --- student enrollments (new module) ----------------------------------------
export const applyForEnrollment = (dto: {
  courseId: string;
  selectedLevelId?: string;
  applicationData?: string;
  proposedFee?: number;
}) => api.post<StudentEnrollmentRecord>('/api/student-enrollments', dto).then((r) => r.data);

export const fetchMyStudentEnrollments = () =>
  api.get<StudentEnrollmentRecord[]>('/api/student-enrollments/mine').then((r) => r.data);

export const fetchAllStudentEnrollments = (status?: StudentEnrollmentStatus) =>
  api
    .get<StudentEnrollmentRecord[]>('/api/student-enrollments', { params: status ? { status } : {} })
    .then((r) => r.data);

export const updateEnrollmentStatus = (
  id: string,
  dto: { status: StudentEnrollmentStatus; assignedAssessmentId?: string },
) =>
  api
    .patch<StudentEnrollmentRecord>(`/api/student-enrollments/${id}/status`, dto)
    .then((r) => r.data);

// --- fee bidding (admin) -----------------------------------------------------
export const approveStudentEnrollmentFee = (id: string, agreedFee?: number) =>
  api
    .patch<StudentEnrollmentRecord>(`/api/student-enrollments/${id}/fee/approve`, {
      ...(agreedFee === undefined ? {} : { agreedFee }),
    })
    .then((r) => r.data);

export const rejectStudentEnrollmentFee = (id: string) =>
  api
    .patch<StudentEnrollmentRecord>(`/api/student-enrollments/${id}/fee/reject`)
    .then((r) => r.data);

export const approveEnrollmentFee = (id: string, agreedFee?: number) =>
  api
    .patch<Enrollment>(`/api/admin/enrollments/${id}/fee/approve`, {
      ...(agreedFee === undefined ? {} : { agreedFee }),
    })
    .then((r) => r.data);

export const rejectEnrollmentFee = (id: string) =>
  api.patch<Enrollment>(`/api/admin/enrollments/${id}/fee/reject`).then((r) => r.data);

// --- admin media moderation (URL-based) --------------------------------------
export const setProfilePicture = (userId: string, profilePictureUrl: string) =>
  api
    .patch<StudentProfile | TeacherProfile>(
      `/api/admin/users/${userId}/profile-picture`,
      { profilePictureUrl },
    )
    .then((r) => r.data);

export const clearProfilePicture = (userId: string) =>
  api
    .delete<StudentProfile | TeacherProfile>(`/api/admin/users/${userId}/profile-picture`)
    .then((r) => r.data);

export const setTeacherCv = (userId: string, cvUrl: string) =>
  api.patch<TeacherProfile>(`/api/admin/users/${userId}/cv`, { cvUrl }).then((r) => r.data);

export const clearTeacherCv = (userId: string) =>
  api.delete<TeacherProfile>(`/api/admin/users/${userId}/cv`).then((r) => r.data);

// --- attempts ----------------------------------------------------------------
export const startAttempt = (dto: { assessmentId: string; enrollmentId?: string }) =>
  api.post<StartAttemptResponse>('/api/attempts/start', dto).then((r) => r.data);

export const saveAnswer = (
  attemptId: string,
  dto: { questionId: string; selectedOptionId: string | null },
) => api.post(`/api/attempts/${attemptId}/answer`, dto).then((r) => r.data);

export const submitAttempt = (attemptId: string) =>
  api.post<AttemptResult>(`/api/attempts/${attemptId}/submit`).then((r) => r.data);

export const fetchMyAttempts = () =>
  api.get<Attempt[]>('/api/attempts').then((r) => r.data);

export const fetchAttempt = (id: string) =>
  api.get<Attempt>(`/api/attempts/${id}`).then((r) => r.data);
