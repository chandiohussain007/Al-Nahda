import { Injectable } from '@nestjs/common';

export interface GradeResult {
  score: number;        // total points earned
  maxScore: number;     // total possible points
  percentage: number;   // 0–100
  passed: boolean;
}

export interface AnswerInput {
  questionId: string;
  selectedOptionId: string | null;
  correctOptionId: string;
  points: number;
}

/**
 * Pure, stateless grading logic.
 *
 * Separated from the Attempts service so it can be unit-tested
 * without touching the database.
 */
@Injectable()
export class GradingService {
  /**
   * Grades a list of answers and returns the result.
   *
   * @param answers       - The student's submitted answers with ground-truth data
   * @param passPercentage - Minimum % to pass (0–100), e.g. 60
   */
  grade(answers: AnswerInput[], passPercentage: number): GradeResult {
    let score = 0;
    let maxScore = 0;

    for (const answer of answers) {
      maxScore += answer.points;
      if (answer.selectedOptionId === answer.correctOptionId) {
        score += answer.points;
      }
    }

    const percentage =
      maxScore === 0 ? 0 : Math.round((score / maxScore) * 10_000) / 100;

    return {
      score,
      maxScore,
      percentage,
      passed: percentage >= passPercentage,
    };
  }

  /**
   * Determines whether a specific answer is correct.
   */
  isCorrect(selectedOptionId: string | null, correctOptionId: string): boolean {
    return selectedOptionId !== null && selectedOptionId === correctOptionId;
  }
}
