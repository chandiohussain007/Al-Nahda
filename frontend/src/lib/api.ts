import axios from 'axios';
import { clearSession, clearStoredUser, readSession } from './session';
import { getCsrfCookie } from '../context/AuthContext';
import type {
  AdminStudentDetail,
  Assessment,
  Attempt,
  AttemptResult,
  AttendanceRecord,
  CreateEnrollment,
  CourseItem,
  CourseStatus,
  DirectoryTeacher,
  Enrollment,
  EnrollmentStatus,
  EvaluationQuestion,
  EvaluationTest,
  LevelContent,
  LoginResponse,
  Notification,
  Question,
  StartAttemptResponse,
  StudentEnrollmentRecord,
  StudentEnrollmentStatus,
  StudentProfile,
  StudentProgress,
  SubmitEvaluation,
  TeacherProfile,
  TeacherStatus,
  UpsertStudentProfile,
  UpsertTeacherProfile,
  UserSummary,
} from './types';

/** Base URL of the API, configured via NEXT_PUBLIC_API_URL. */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/+$/, '');

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  // Always send cookies (httpOnly refresh token + csrf-token) on every request.
  withCredentials: true,
});

/**
 * The AuthContext registers this callback once it mounts so the Axios
 * interceptors can read the latest in-memory access token without causing a
 * circular import.
 */
let _getAccessToken: (() => string | null) | null = null;
let _refreshSession: (() => Promise<string | null>) | null = null;

export function registerTokenAccessor(
  getter: () => string | null,
  refresher: () => Promise<string | null>,
) {
  _getAccessToken = getter;
  _refreshSession = refresher;
}

// Attach the in-memory access token (or fallback to session) + CSRF header to every outgoing request.
api.interceptors.request.use((config) => {
  const token = _getAccessToken?.() || readSession()?.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Mirror the csrf-token cookie in the X-CSRF-Token header for all
  // state-changing requests (POST/PUT/PATCH/DELETE).
  const csrfToken = getCsrfCookie();
  if (csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

// On 401: try a silent refresh once, then replay the original request.
// If the refresh also fails, redirect to /login.
let isRefreshing = false;
let pendingQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

function processQueue(token: string | null, error: unknown = null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else reject(error);
  });
  pendingQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (
      !axios.isAxiosError(error) ||
      error.response?.status !== 401 ||
      typeof window === 'undefined'
    ) {
      return Promise.reject(error);
    }

    const originalRequest = error.config;

    // Don't retry the refresh endpoint itself to avoid infinite loops.
    if (originalRequest?.url?.includes('/api/auth/refresh')) {
      clearStoredUser();
      window.location.assign('/login');
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue concurrent 401s while a refresh is already in flight.
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            if (originalRequest) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(api(originalRequest!));
          },
          reject,
        });
      });
    }

    isRefreshing = true;
    try {
      if (!_refreshSession) {
        // No refresher registered (e.g. In unit test or before mount): clear session and reject
        clearSession();
        if (!window.location.pathname.startsWith('/login')) {
          window.location.assign('/login');
        }
        return Promise.reject(error);
      }

      const newToken = await _refreshSession();
      if (!newToken) throw new Error('No token after refresh');
      processQueue(newToken);
      if (originalRequest) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        originalRequest.headers['X-CSRF-Token'] = getCsrfCookie();
        return api(originalRequest);
      }
    } catch (refreshError) {
      processQueue(null, refreshError);
      clearSession();
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
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
export const loginWithCredentials = (dto: { email: string; password: string }) =>
  api.post<LoginResponse>('/api/auth/login', dto).then((r) => r.data);

export const registerStudent = (dto: { fullName: string; email: string; password: string }) =>
  api.post<LoginResponse>('/api/auth/register', dto).then((r) => r.data);

export const loginWithGoogle = (idToken: string) =>
  api.post<LoginResponse>('/api/auth/google', { idToken }).then((r) => r.data);

export const logoutApi = () =>
  api.post('/api/auth/logout').then((r) => r.data);

// --- health -----------------------------------------------------------------
export const fetchHealth = () => api.get<AnyRecord>('/api/health').then((r) => r.data);
export const fetchReadiness = () => api.get<AnyRecord>('/api/health/ready').then((r) => r.data);

export const submitStudentRegistration = (dto: {
  fullName: string;
  email: string;
  preferredCourse: string;
}) => api.post('/api/public/student-registration', dto).then((r) => r.data);

export const submitTeacherApplication = (dto: {
  fullName: string;
  email: string;
  phoneNumber: string;
  subject: string;
  experience: string;
}) => api.post('/api/public/teacher-application', dto).then((r) => r.data);

// --- teacher directory (approved only) --------------------------------------
export const fetchTeacherDirectory = (timeSlot?: string) =>
  api
    .get<DirectoryTeacher[]>('/api/teachers', { params: timeSlot ? { timeSlot } : {} })
    .then((r) => r.data);

// --- admin ------------------------------------------------------------------
export const fetchAdminTeachers = (status?: TeacherStatus, pagination?: { skip?: number; take?: number }) =>
  api
    .get<TeacherProfile[]>('/api/admin/teachers', { params: { ...(status ? { status } : {}), ...(pagination ?? {}) } })
    .then((r) => r.data);

export const createAdminTeacher = (dto: {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  subject?: string;
  bio?: string;
}) => api.post<UserSummary>('/api/admin/teachers', dto).then((r) => r.data);

export const fetchAdminCourses = () =>
  api.get<CourseItem[]>('/api/admin/courses').then((r) => r.data);

export const createAdminCourse = (dto: {
  name: string;
  slug: string;
  description: string | null;
  standardFee: number | null;
  status: CourseStatus;
}) => api.post<CourseItem>('/api/admin/courses', dto).then((r) => r.data);

export const updateAdminCourse = (
  id: string,
  dto: {
    name: string;
    slug: string;
    description: string | null;
    standardFee: number | null;
    status: CourseStatus;
  },
) => api.patch<CourseItem>(`/api/admin/courses/${id}`, dto).then((r) => r.data);

export const archiveAdminCourse = (id: string) =>
  api.delete<CourseItem>(`/api/admin/courses/${id}`).then((r) => r.data);

export const approveTeacher = (id: string) =>
  api.patch<TeacherProfile>(`/api/admin/teachers/${id}/approve`).then((r) => r.data);

export const rejectTeacher = (id: string) =>
  api.patch<TeacherProfile>(`/api/admin/teachers/${id}/reject`).then((r) => r.data);

export const fetchAdminStudents = (pagination?: { skip?: number; take?: number }) =>
  api.get<StudentProfile[]>('/api/admin/students', { params: pagination ?? {} }).then((r) => r.data);

export const setAdminUserActive = (userId: string, isActive: boolean) =>
  api
    .patch<UserSummary>(`/api/admin/users/${userId}/active`, { isActive })
    .then((r) => r.data);

export const fetchAdminStudent = (id: string) =>
  api.get<AdminStudentDetail>(`/api/admin/students/${id}`).then((r) => r.data);

export const fetchAdminEnrollments = (status?: EnrollmentStatus, pagination?: { skip?: number; take?: number }) =>
  api
    .get<Enrollment[]>('/api/admin/enrollments', { params: { ...(status ? { status } : {}), ...(pagination ?? {}) } })
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
