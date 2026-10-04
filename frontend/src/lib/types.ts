/** Mirrors the enums in backend/prisma/schema.prisma. */

export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN';
export type Course = 'LEARN_QURAN' | 'LEARN_ARABIC';
export type Level = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type EnrollmentStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'EXCUSED';
export type TeacherStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type TestStatus = 'PASSED' | 'DEMOTED_RECOMMENDED';

export const COURSES: Course[] = ['LEARN_QURAN', 'LEARN_ARABIC'];
export const LEVELS: Level[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
export const ATTENDANCE_STATUSES: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'EXCUSED'];
export const TEACHER_STATUSES: TeacherStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];
export const ENROLLMENT_STATUSES: EnrollmentStatus[] = [
  'PENDING',
  'ACTIVE',
  'COMPLETED',
  'CANCELLED',
];

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface Session {
  accessToken: string;
  user: SessionUser;
}

export interface LoginResponse {
  accessToken: string;
  user: SessionUser;
}

export interface UserSummary {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

/** Row returned by GET /api/teachers — deliberately has no user/email. */
export interface DirectoryTeacher {
  id: string;
  fullName: string;
  profilePictureUrl: string | null;
  bio: string | null;
  qualifications: string[];
  experienceYears: number;
  subjectsTaught: string[];
}

export interface TeacherProfile extends DirectoryTeacher {
  id: string;
  userId?: string;
  teacherStatus?: TeacherStatus;
  user?: UserSummary;
}

export interface StudentProfile {
  id: string;
  userId?: string;
  fullName: string;
  profilePictureUrl: string | null;
  whatsappNumber: string | null;
  bio: string | null;
  user?: UserSummary;
}

export interface EnrollmentStudent {
  id: string;
  fullName: string;
  userId?: string;
  whatsappNumber?: string | null;
}

export interface EnrollmentTeacher {
  id: string;
  fullName: string;
  userId?: string;
}

export interface AttendanceRecord {
  id: string;
  enrollmentId: string;
  date: string;
  status: AttendanceStatus;
}

export interface Enrollment {
  id: string;
  studentId: string;
  teacherId: string;
  courseName: Course;
  confirmedLevel: Level;
  preferredTimeSlot: string;
  status: EnrollmentStatus;
  createdAt: string;
  student?: EnrollmentStudent;
  teacher?: EnrollmentTeacher;
  attendance?: AttendanceRecord[];
}

export interface Notification {
  id: string;
  recipientId: string;
  senderId: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface EvaluationQuestion {
  id: string;
  course: Course;
  level: Level;
  question: string;
  options: unknown;
}

export interface EvaluationAnswer {
  questionId: string;
  answer: string;
  isCorrect?: boolean;
  points?: number;
}

export interface EvaluationTest {
  id: string;
  studentId: string;
  claimedLevel: Level;
  assignedLevel: Level;
  score: number;
  status: TestStatus;
  startedAt: string;
  completedAt: string | null;
  answers?: EvaluationAnswer[];
}

export interface AttendanceSummary {
  PRESENT: number;
  ABSENT: number;
  EXCUSED: number;
  totalSessions: number;
  attendanceRate: number;
}

export interface StudentProgress {
  studentId: string;
  fullName: string;
  totalEnrollments: number;
  activeEnrollments: number;
  attendance: AttendanceSummary;
  latestEvaluations: EvaluationTest[];
  enrollments: Array<{
    id: string;
    courseName: Course;
    confirmedLevel: Level;
    status: EnrollmentStatus;
    teacher: EnrollmentTeacher;
    createdAt: string;
  }>;
}

export interface UpsertStudentProfile {
  fullName: string;
  profilePictureUrl?: string;
  whatsappNumber?: string;
  bio?: string;
}

export interface UpsertTeacherProfile {
  fullName: string;
  profilePictureUrl?: string;
  bio?: string;
  qualifications: string[];
  experienceYears: number;
  subjectsTaught: string[];
}

export interface CreateEnrollment {
  teacherId: string;
  courseName: Course;
  preferredTimeSlot: string;
  evaluationTestId?: string;
  confirmedLevel?: Level;
}

export interface SubmitEvaluation {
  course: Course;
  claimedLevel: Level;
  answers: Array<{ questionId: string; answer: string }>;
}
