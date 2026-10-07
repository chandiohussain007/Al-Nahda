-- CreateEnum
CREATE TYPE "FeeStatus" AS ENUM ('NONE', 'PROPOSED', 'AGREED', 'REJECTED');

-- AlterTable
ALTER TABLE "CourseItem" ADD COLUMN     "standardFee" INTEGER;

-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN     "agreedFee" INTEGER,
ADD COLUMN     "feeStatus" "FeeStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "proposedFee" INTEGER;

-- AlterTable
ALTER TABLE "StudentEnrollment" ADD COLUMN     "agreedFee" INTEGER,
ADD COLUMN     "feeStatus" "FeeStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "proposedFee" INTEGER;

-- AlterTable
ALTER TABLE "TeacherProfile" ADD COLUMN     "cvUrl" TEXT,
ADD COLUMN     "phoneNumber" TEXT;
