-- ─────────────────────────────────────────────────────────────
-- Migration: add_assessment_course_module
-- Adds: QuestionType, Difficulty, CourseStatus, AssessmentStatus,
--        StudentEnrollmentStatus, AttemptStatus enums
-- Adds: CourseItem, LevelContent, Question, Assessment,
--        AssessmentQuestion, StudentEnrollment, Attempt,
--        AttemptQuestion, AttemptAnswer tables
-- ─────────────────────────────────────────────────────────────

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "StudentEnrollmentStatus" AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'ASSESSMENT_REQUIRED',
    'ASSESSMENT_COMPLETED',
    'APPROVED',
    'REJECTED',
    'ACTIVE',
    'COMPLETED'
);

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'EXPIRED', 'CANCELLED');

-- CreateTable: CourseItem
CREATE TABLE "CourseItem" (
    "id"          TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "slug"        TEXT NOT NULL,
    "description" TEXT,
    "status"      "CourseStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable: LevelContent
CREATE TABLE "LevelContent" (
    "id"          TEXT NOT NULL,
    "courseId"    TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "sortOrder"   INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LevelContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Question
CREATE TABLE "Question" (
    "id"              TEXT NOT NULL,
    "text"            TEXT NOT NULL,
    "type"            "QuestionType" NOT NULL DEFAULT 'MULTIPLE_CHOICE',
    "difficulty"      "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "course"          "Course" NOT NULL,
    "level"           "Level" NOT NULL,
    "options"         JSONB NOT NULL,
    "correctOptionId" TEXT NOT NULL,
    "points"          INTEGER NOT NULL DEFAULT 1,
    "explanation"     TEXT,
    "createdBy"       TEXT,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Assessment
CREATE TABLE "Assessment" (
    "id"                    TEXT NOT NULL,
    "courseId"              TEXT NOT NULL,
    "levelId"               TEXT,
    "title"                 TEXT NOT NULL,
    "description"           TEXT,
    "durationMinutes"       INTEGER NOT NULL,
    "passPercentage"        INTEGER NOT NULL DEFAULT 60,
    "attemptsAllowed"       INTEGER NOT NULL DEFAULT 1,
    "questionsPerAttempt"   INTEGER NOT NULL DEFAULT 10,
    "questionSelectionMode" TEXT NOT NULL DEFAULT 'manual',
    "shuffleQuestions"      BOOLEAN NOT NULL DEFAULT false,
    "shuffleOptions"        BOOLEAN NOT NULL DEFAULT false,
    "showResultAfterSubmit" BOOLEAN NOT NULL DEFAULT true,
    "status"                "AssessmentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdBy"             TEXT,
    "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"             TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AssessmentQuestion
CREATE TABLE "AssessmentQuestion" (
    "id"             TEXT NOT NULL,
    "assessmentId"   TEXT NOT NULL,
    "questionId"     TEXT NOT NULL,
    "sortOrder"      INTEGER NOT NULL,
    "pointsOverride" INTEGER,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable: StudentEnrollment
CREATE TABLE "StudentEnrollment" (
    "id"                   TEXT NOT NULL,
    "studentId"            TEXT NOT NULL,
    "courseId"             TEXT NOT NULL,
    "selectedLevelId"      TEXT,
    "assignedAssessmentId" TEXT,
    "status"               "StudentEnrollmentStatus" NOT NULL DEFAULT 'PENDING',
    "applicationData"      TEXT,
    "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"            TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Attempt
CREATE TABLE "Attempt" (
    "id"               TEXT NOT NULL,
    "studentId"        TEXT NOT NULL,
    "assessmentId"     TEXT NOT NULL,
    "enrollmentId"     TEXT,
    "status"           "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "score"            INTEGER,
    "percentage"       DOUBLE PRECISION,
    "passed"           BOOLEAN,
    "timeSpentSeconds" INTEGER,
    "startedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt"      TIMESTAMP(3),
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AttemptQuestion
CREATE TABLE "AttemptQuestion" (
    "id"         TEXT NOT NULL,
    "attemptId"  TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "sortOrder"  INTEGER NOT NULL,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttemptQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AttemptAnswer
CREATE TABLE "AttemptAnswer" (
    "id"               TEXT NOT NULL,
    "attemptId"        TEXT NOT NULL,
    "questionId"       TEXT NOT NULL,
    "selectedOptionId" TEXT,
    "isCorrect"        BOOLEAN DEFAULT false,
    "pointsEarned"     INTEGER DEFAULT 0,
    "answeredAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttemptAnswer_pkey" PRIMARY KEY ("id")
);

-- ─── Unique Indexes ───────────────────────────────────────────

CREATE UNIQUE INDEX "CourseItem_slug_key"
    ON "CourseItem"("slug");

CREATE UNIQUE INDEX "LevelContent_courseId_sortOrder_key"
    ON "LevelContent"("courseId", "sortOrder");

CREATE UNIQUE INDEX "AssessmentQuestion_assessmentId_sortOrder_key"
    ON "AssessmentQuestion"("assessmentId", "sortOrder");

CREATE UNIQUE INDEX "AttemptQuestion_attemptId_sortOrder_key"
    ON "AttemptQuestion"("attemptId", "sortOrder");

CREATE UNIQUE INDEX "AttemptAnswer_attemptId_questionId_key"
    ON "AttemptAnswer"("attemptId", "questionId");

-- ─── Non-unique Indexes ────────────────────────────────────────

CREATE INDEX "LevelContent_courseId_idx"           ON "LevelContent"("courseId");
CREATE INDEX "Assessment_courseId_idx"             ON "Assessment"("courseId");
CREATE INDEX "Assessment_levelId_idx"              ON "Assessment"("levelId");
CREATE INDEX "Assessment_status_idx"               ON "Assessment"("status");
CREATE INDEX "AssessmentQuestion_assessmentId_idx" ON "AssessmentQuestion"("assessmentId");
CREATE INDEX "StudentEnrollment_studentId_idx"     ON "StudentEnrollment"("studentId");
CREATE INDEX "StudentEnrollment_courseId_idx"      ON "StudentEnrollment"("courseId");
CREATE INDEX "StudentEnrollment_assignedAssessmentId_idx" ON "StudentEnrollment"("assignedAssessmentId");
CREATE INDEX "StudentEnrollment_status_idx"        ON "StudentEnrollment"("status");
CREATE INDEX "Attempt_studentId_idx"               ON "Attempt"("studentId");
CREATE INDEX "Attempt_assessmentId_idx"            ON "Attempt"("assessmentId");
CREATE INDEX "Attempt_enrollmentId_idx"            ON "Attempt"("enrollmentId");
CREATE INDEX "Attempt_status_idx"                  ON "Attempt"("status");
CREATE INDEX "AttemptQuestion_attemptId_idx"       ON "AttemptQuestion"("attemptId");
CREATE INDEX "AttemptAnswer_attemptId_idx"         ON "AttemptAnswer"("attemptId");

-- ─── Foreign Keys ─────────────────────────────────────────────

ALTER TABLE "LevelContent"
    ADD CONSTRAINT "LevelContent_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "CourseItem"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Assessment"
    ADD CONSTRAINT "Assessment_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "CourseItem"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Assessment"
    ADD CONSTRAINT "Assessment_levelId_fkey"
    FOREIGN KEY ("levelId") REFERENCES "LevelContent"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AssessmentQuestion"
    ADD CONSTRAINT "AssessmentQuestion_assessmentId_fkey"
    FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AssessmentQuestion"
    ADD CONSTRAINT "AssessmentQuestion_questionId_fkey"
    FOREIGN KEY ("questionId") REFERENCES "Question"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StudentEnrollment"
    ADD CONSTRAINT "StudentEnrollment_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StudentEnrollment"
    ADD CONSTRAINT "StudentEnrollment_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "CourseItem"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StudentEnrollment"
    ADD CONSTRAINT "StudentEnrollment_selectedLevelId_fkey"
    FOREIGN KEY ("selectedLevelId") REFERENCES "LevelContent"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StudentEnrollment"
    ADD CONSTRAINT "StudentEnrollment_assignedAssessmentId_fkey"
    FOREIGN KEY ("assignedAssessmentId") REFERENCES "Assessment"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Attempt"
    ADD CONSTRAINT "Attempt_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Attempt"
    ADD CONSTRAINT "Attempt_assessmentId_fkey"
    FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Attempt"
    ADD CONSTRAINT "Attempt_enrollmentId_fkey"
    FOREIGN KEY ("enrollmentId") REFERENCES "StudentEnrollment"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AttemptQuestion"
    ADD CONSTRAINT "AttemptQuestion_attemptId_fkey"
    FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AttemptQuestion"
    ADD CONSTRAINT "AttemptQuestion_questionId_fkey"
    FOREIGN KEY ("questionId") REFERENCES "Question"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AttemptAnswer"
    ADD CONSTRAINT "AttemptAnswer_attemptId_fkey"
    FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AttemptAnswer"
    ADD CONSTRAINT "AttemptAnswer_questionId_fkey"
    FOREIGN KEY ("questionId") REFERENCES "Question"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
