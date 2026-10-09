import { expect, test } from '@playwright/test';

test('student login, profile, course enrollment, and placement exam smoke flow', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'al-nahda.session',
      JSON.stringify({
        accessToken: 'jwt-token-123',
        user: { id: 'student-1', email: 'aisha@example.com', role: 'STUDENT' },
      }),
    );
  });

  const course = {
    id: 'course-1',
    slug: 'learn-quran',
    name: 'Learn Quran',
    description: 'Master Quran recitation from basic letters to fluent reading.',
  };

  const studentEnrollments: Array<{
    id: string;
    status: string;
    createdAt: string;
    course: { slug: string; name: string };
    selectedLevel: { name: string };
    assignedAssessment: { id: string; title: string };
  }> = [];

  const enrollment = {
    id: 'enrollment-1',
    status: 'ASSESSMENT_REQUIRED',
    createdAt: new Date().toISOString(),
    course: { slug: 'learn-quran', name: 'Learn Quran' },
    selectedLevel: { name: 'Beginner' },
    assignedAssessment: { id: 'assessment-1', title: 'Placement Test' },
  };

  await page.route('**/api/health', async (route) => {
    await route.fulfill({ status: 200, json: { ok: true } });
  });

  await page.route('**/api/auth/google', async (route) => {
    await route.fulfill({
      status: 200,
      json: {
        accessToken: 'jwt-token-123',
        user: { id: 'student-1', email: 'aisha@example.com', role: 'STUDENT' },
      },
    });
  });

  await page.route('**/api/student/profile', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        json: {
          id: 'student-1',
          fullName: 'Aisha Rahman',
          whatsappNumber: '+971500000000',
          bio: 'Loves Quran and Arabic',
        },
      });
      return;
    }

    const payload = await route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      json: {
        id: 'student-1',
        fullName: payload.fullName,
        whatsappNumber: payload.whatsappNumber ?? null,
        bio: payload.bio ?? null,
      },
    });
  });

  await page.route('**/api/student/progress', async (route) => {
    await route.fulfill({
      status: 200,
      json: {
        studentId: 'student-1',
        fullName: 'Aisha Rahman',
        totalEnrollments: 0,
        activeEnrollments: 0,
        attendance: { PRESENT: 4, ABSENT: 1, EXCUSED: 1, totalSessions: 6, attendanceRate: 80 },
        latestEvaluations: [],
        enrollments: [],
      },
    });
  });

  await page.route('**/api/courses', async (route) => {
    await route.fulfill({ status: 200, json: [course] });
  });

  await page.route('**/api/student-enrollments', async (route) => {
    studentEnrollments.push({ ...enrollment });
    await route.fulfill({ status: 200, json: { ...enrollment } });
  });

  await page.route('**/api/student-enrollments/mine', async (route) => {
    await route.fulfill({ status: 200, json: studentEnrollments });
  });

  await page.route('**/api/attempts/**', async (route) => {
    const url = route.request().url();

    if (url.includes('/start')) {
      await route.fulfill({
        status: 200,
        json: {
          attemptId: 'attempt-1',
          durationMinutes: 1,
          questions: [
            {
              id: 'q1',
              text: 'Which letter is the first letter of the Arabic alphabet?',
              points: 1,
              difficulty: 'BEGINNER',
              options: [
                { id: 'alif', text: 'Alif' },
                { id: 'baa', text: 'Baa' },
                { id: 'jeem', text: 'Jeem' },
              ],
            },
          ],
        },
      });
      return;
    }

    if (url.includes('/answer')) {
      await route.fulfill({ status: 200, json: { ok: true } });
      return;
    }

    if (url.includes('/submit')) {
      await route.fulfill({
        status: 200,
        json: {
          passed: true,
          score: 1,
          maxScore: 1,
          percentage: 100,
          passPercentage: 50,
        },
      });
      return;
    }

    await route.continue();
  });

  await page.goto('/login');

  await expect(page).toHaveURL(/\/dashboard\/student$/);

  await page.getByLabel('Full name').fill('Aisha Rahman');
  await page.getByLabel('WhatsApp number').fill('+971500000000');
  await page.getByLabel('Bio').fill('Loves Quran and Arabic');
  await page.getByRole('button', { name: /save profile|create profile/i }).click();

  await expect(page.getByText(/Profile saved\./i)).toBeVisible();

  await page.goto('/dashboard/student/courses');
  await page.getByRole('button', { name: /apply now/i }).click();
  await expect(page.getByRole('button', { name: /take placement exam/i })).toBeVisible();

  await page.goto('/dashboard/student/exam?assessmentId=assessment-1&enrollmentId=enrollment-1');
  await expect(page.getByText(/Placement Exam/i)).toBeVisible();

  await page.getByRole('radio', { name: /Alif/i }).click();
  await page.getByRole('button', { name: 'Submit Exam' }).click();

  await expect(page.getByText(/Congratulations!/i)).toBeVisible();
  await expect(page.getByText(/You passed the placement exam/i)).toBeVisible();
});
