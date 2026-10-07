/** Mirrors the enums in backend/prisma/schema.prisma. */

export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN';
export type Course = 'LEARN_QURAN' | 'LEARN_ARABIC';
export type Level = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type EnrollmentStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'EXCUSED';
export type TeacherStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type TestStatus = 'PASSED' | 'DEMOTED_RECOMMENDED';
export type FeeStatus = 'NONE' | 'PROPOSED' | 'AGREED' | 'REJECTED';

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
  availableTimeSlots?: string[];
}

export interface TeacherProfile extends DirectoryTeacher {
  id: string;
  userId?: string;
  teacherStatus?: TeacherStatus;
  user?: UserSummary;
  /** Contact phone - only returned to ADMIN and to the owning teacher. */
  phoneNumber?: string | null;
  cvUrl?: string | null;
  availableTimeSlots?: string[];
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
  proposedFee: number | null;
  agreedFee: number | null;
  feeStatus: FeeStatus;
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
  phoneNumber?: string | null;
  cvUrl?: string | null;
  availableTimeSlots?: string[];
}

export interface CreateEnrollment {
  teacherId: string;
  courseName: Course;
  preferredTimeSlot: string;
  evaluationTestId?: string;
  confirmedLevel?: Level;
  proposedFee?: number;
}

export interface SubmitEvaluation {
  course: Course;
  claimedLevel: Level;
  answers: Array<{ questionId: string; answer: string }>;
}

/** Richer payload from GET /api/admin/students/:id. */
export interface AdminStudentDetail extends StudentProfile {
  enrollments: Enrollment[];
  evaluationTests: EvaluationTest[];
}

// ─── Assessment Module Types ───────────────────────────────────────────────

export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type AssessmentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type StudentEnrollmentStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'ASSESSMENT_REQUIRED'
  | 'ASSESSMENT_COMPLETED'
  | 'APPROVED'
  | 'REJECTED'
  | 'ACTIVE'
  | 'COMPLETED';
export type AttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED' | 'CANCELLED';
export type QuestionType = 'MULTIPLE_CHOICE';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface CourseItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: CourseStatus;
  standardFee: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface LevelContent {
  id: string;
  courseId: string;
  name: string;
  sortOrder: number;
  description: string | null;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  difficulty: Difficulty;
  course: Course;
  level: Level;
  options: QuestionOption[];
  correctOptionId: string;
  points: number;
  explanation: string | null;
  createdBy: string | null;
  createdAt: string;
}

/** Question as served to a student during an attempt — no correct answer. */
export interface ExamQuestion {
  id: string;
  text: string;
  type: QuestionType;
  options: QuestionOption[];
  points: number;
  difficulty: Difficulty;
}

export interface Assessment {
  id: string;
  courseId: string;
  levelId: string | null;
  title: string;
  description: string | null;
  durationMinutes: number;
  passPercentage: number;
  attemptsAllowed: number;
  questionsPerAttempt: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResultAfterSubmit: boolean;
  status: AssessmentStatus;
  createdAt: string;
  course?: Pick<CourseItem, 'id' | 'name' | 'slug'>;
  level?: Pick<LevelContent, 'id' | 'name'> | null;
  _count?: { questions: number; attempts: number };
}

export interface StudentEnrollmentRecord {
  id: string;
  studentId: string;
  courseId: string;
  selectedLevelId: string | null;
  assignedAssessmentId: string | null;
  status: StudentEnrollmentStatus;
  applicationData: string | null;
  proposedFee: number | null;
  agreedFee: number | null;
  feeStatus: FeeStatus;
  createdAt: string;
  updatedAt: string;
  course?: Pick<CourseItem, 'id' | 'name' | 'slug'>;
  selectedLevel?: Pick<LevelContent, 'id' | 'name'> | null;
  assignedAssessment?: Pick<Assessment, 'id' | 'title' | 'durationMinutes'> | null;
  student?: { id: string; email: string };
}

export interface AttemptResult {
  attemptId: string;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  passPercentage: number;
}

export interface StartAttemptResponse {
  attemptId: string;
  durationMinutes: number;
  questions: ExamQuestion[];
}

export interface Attempt {
  id: string;
  studentId: string;
  assessmentId: string;
  enrollmentId: string | null;
  status: AttemptStatus;
  score: number | null;
  percentage: number | null;
  passed: boolean | null;
  timeSpentSeconds: number | null;
  startedAt: string;
  submittedAt: string | null;
  assessment?: Pick<Assessment, 'id' | 'title' | 'passPercentage'>;
}

