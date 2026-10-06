import axios from 'axios';
import { clearSession, readSession } from './session';
import type {
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

