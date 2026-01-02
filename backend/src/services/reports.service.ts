import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface ScoreDistribution {
  range: string;
  count: number;
  percentage: number;
}

interface StudentPerformance {
  studentId: string;
  studentName: string;
  rollNo: string | null;
  score: number;
  percentage: number;
  rank: number;
  status: 'PASS' | 'FAIL' | 'NOT_ATTEMPTED';
  submittedAt: Date | null;
}

interface QuestionAnalysis {
  questionId: string;
  questionText: string;
  questionType: string;
  totalAttempts: number;
  correctAttempts: number;
  successRate: number;
  avgTimeSeconds: number;
}

class ReportsService {
  // Get comprehensive test report for teachers
  async getTestReport(testId: string) {
    const test = await prisma.onlineTest.findUnique({
      where: { id: testId },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        createdBy: { select: { id: true, email: true } },
        questions: {
          include: {
            question: {
              select: {
                id: true,
                questionText: true,
                questionType: true,
                difficulty: true,
              },
            },
          },
          orderBy: { sequenceOrder: 'asc' },
        },
        attempts: {
          where: { status: { in: ['SUBMITTED', 'GRADED'] } },
          include: {
            student: {
              select: { id: true, firstName: true, lastName: true, rollNo: true },
            },
            responses: {
              select: {
                testQuestionId: true,
                isCorrect: true,
                timeSpentSeconds: true,
                marksObtained: true,
              },
            },
          },
          orderBy: { totalScore: 'desc' },
        },
        _count: { select: { attempts: true } },
      },
    });

    if (!test) {
      throw new Error('Test not found');
    }

    const totalMarks = Number(test.totalMarks);
    const passingMarks = Number(test.passingMarks) || totalMarks * 0.4;

    // Calculate stats
    const completedAttempts = test.attempts;
    const scores = completedAttempts.map((a) => Number(a.totalScore) || 0);

    const stats = {
      totalAttempts: test._count.attempts,
      completedAttempts: completedAttempts.length,
      averageScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
      highestScore: scores.length > 0 ? Math.max(...scores) : 0,
      lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
      medianScore: this.calculateMedian(scores),
      passCount: completedAttempts.filter((a) => (Number(a.totalScore) || 0) >= passingMarks).length,
      failCount: completedAttempts.filter((a) => (Number(a.totalScore) || 0) < passingMarks).length,
      averagePercentage: scores.length > 0 && totalMarks > 0
        ? (scores.reduce((a, b) => a + b, 0) / scores.length / totalMarks) * 100
        : 0,
    };

    // Score distribution
    const scoreDistribution = this.calculateScoreDistribution(scores, totalMarks);

    // Student performances
    const studentPerformances: StudentPerformance[] = completedAttempts.map((attempt, index) => ({
      studentId: attempt.student.id,
      studentName: `${attempt.student.firstName} ${attempt.student.lastName}`,
      rollNo: attempt.student.rollNo,
      score: Number(attempt.totalScore) || 0,
      percentage: Number(attempt.percentage) || 0,
      rank: index + 1,
      status: (Number(attempt.totalScore) || 0) >= passingMarks ? 'PASS' : 'FAIL',
      submittedAt: attempt.submittedAt,
    }));

    // Question-wise analysis
    const questionAnalysis: QuestionAnalysis[] = test.questions.map((tq) => {
      const responses = completedAttempts.flatMap((a) =>
        a.responses.filter((r) => r.testQuestionId === tq.id)
      );
      const correctResponses = responses.filter((r) => r.isCorrect).length;
      const times = responses
        .filter((r) => r.timeSpentSeconds)
        .map((r) => r.timeSpentSeconds!);

      return {
        questionId: tq.question.id,
        questionText: tq.question.questionText.substring(0, 100) + '...',
        questionType: tq.question.questionType,
        totalAttempts: responses.length,
        correctAttempts: correctResponses,
        successRate: responses.length > 0 ? Math.round((correctResponses / responses.length) * 100) : 0,
        avgTimeSeconds: times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0,
      };
    });

    // Top performers (top 10)
    const topPerformers = studentPerformances.slice(0, 10);

    // Students needing attention (bottom 10 or failed)
    const studentsNeedingAttention = studentPerformances
      .filter((s) => s.status === 'FAIL')
      .slice(-10);

    return {
      test: {
        id: test.id,
        title: test.title,
        subject: test.subject,
        class: test.class,
        section: test.section,
        totalMarks,
        passingMarks,
        durationMinutes: test.durationMinutes,
        totalQuestions: test.totalQuestions,
        status: test.status,
        startDateTime: test.startDateTime,
        endDateTime: test.endDateTime,
        createdBy: test.createdBy,
      },
      stats: {
        ...stats,
        averageScore: Math.round(stats.averageScore * 100) / 100,
        averagePercentage: Math.round(stats.averagePercentage * 100) / 100,
        passRate: completedAttempts.length > 0
          ? Math.round((stats.passCount / completedAttempts.length) * 100)
          : 0,
      },
      scoreDistribution,
      studentPerformances,
      topPerformers,
      studentsNeedingAttention,
      questionAnalysis,
    };
  }

  // Get class-wise report
  async getClassReport(classId: string, filters: { subjectId?: string; dateFrom?: Date; dateTo?: Date } = {}) {
    const { subjectId, dateFrom, dateTo } = filters;

    // Get all tests for this class
    const tests = await prisma.onlineTest.findMany({
      where: {
        classId,
        status: { in: ['PUBLISHED', 'CLOSED'] },
        ...(subjectId && { subjectId }),
        ...(dateFrom && { createdAt: { gte: dateFrom } }),
        ...(dateTo && { createdAt: { lte: dateTo } }),
      },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        attempts: {
          where: { status: { in: ['SUBMITTED', 'GRADED'] } },
          include: {
            student: {
              select: { id: true, firstName: true, lastName: true, rollNo: true },
            },
          },
        },
      },
    });

    // Get class info
    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        sections: { select: { id: true, name: true } },
      },
    });

    if (!classInfo) {
      throw new Error('Class not found');
    }

    // Subject-wise performance
    const subjectPerformance = new Map<string, {
      subjectId: string;
      subjectName: string;
      testCount: number;
      avgScore: number;
      totalAttempts: number;
    }>();

    for (const test of tests) {
      const existing = subjectPerformance.get(test.subjectId) || {
        subjectId: test.subjectId,
        subjectName: test.subject.name,
        testCount: 0,
        avgScore: 0,
        totalAttempts: 0,
      };

      const scores = test.attempts.map((a) => Number(a.percentage) || 0);
      const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

      existing.testCount++;
      existing.totalAttempts += test.attempts.length;
      existing.avgScore = (existing.avgScore * (existing.testCount - 1) + avgScore) / existing.testCount;

      subjectPerformance.set(test.subjectId, existing);
    }

    // Student rankings
    const studentScores = new Map<string, {
      studentId: string;
      studentName: string;
      rollNo: string | null;
      totalScore: number;
      testsTaken: number;
      avgPercentage: number;
    }>();

    for (const test of tests) {
      for (const attempt of test.attempts) {
        const existing = studentScores.get(attempt.studentId) || {
          studentId: attempt.studentId,
          studentName: `${attempt.student.firstName} ${attempt.student.lastName}`,
          rollNo: attempt.student.rollNo,
          totalScore: 0,
          testsTaken: 0,
          avgPercentage: 0,
        };

        existing.totalScore += Number(attempt.percentage) || 0;
        existing.testsTaken++;
        existing.avgPercentage = existing.totalScore / existing.testsTaken;

        studentScores.set(attempt.studentId, existing);
      }
    }

    // Sort students by average percentage
    const studentRankings = Array.from(studentScores.values())
      .sort((a, b) => b.avgPercentage - a.avgPercentage)
      .map((s, index) => ({ ...s, rank: index + 1, avgPercentage: Math.round(s.avgPercentage * 100) / 100 }));

    return {
      class: {
        id: classInfo.id,
        name: classInfo.name,
        sections: classInfo.sections,
      },
      summary: {
        totalTests: tests.length,
        totalAttempts: tests.reduce((sum, t) => sum + t.attempts.length, 0),
        subjectsCount: subjectPerformance.size,
        studentsCount: studentScores.size,
      },
      subjectPerformance: Array.from(subjectPerformance.values()).map((s) => ({
        ...s,
        avgScore: Math.round(s.avgScore * 100) / 100,
      })),
      topPerformers: studentRankings.slice(0, 10),
      studentsNeedingSupport: studentRankings.filter((s) => s.avgPercentage < 50),
      allStudents: studentRankings,
    };
  }

  // Get individual student report
  async getStudentReport(studentId: string, filters: { subjectId?: string; dateFrom?: Date; dateTo?: Date } = {}) {
    const { subjectId, dateFrom, dateTo } = filters;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        currentClass: { select: { id: true, name: true } },
        currentSection: { select: { id: true, name: true } },
      },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Get all attempts by this student
    const attempts = await prisma.testAttempt.findMany({
      where: {
        studentId,
        status: { in: ['SUBMITTED', 'GRADED'] },
        ...(dateFrom && { submittedAt: { gte: dateFrom } }),
        ...(dateTo && { submittedAt: { lte: dateTo } }),
        test: {
          ...(subjectId && { subjectId }),
        },
      },
      include: {
        test: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
          },
        },
        responses: {
          include: {
            testQuestion: {
              include: {
                question: {
                  include: {
                    chapterRef: { select: { id: true, name: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    // Test history
    const testHistory = attempts.map((attempt) => ({
      testId: attempt.testId,
      testTitle: attempt.test.title,
      subject: attempt.test.subject,
      score: Number(attempt.totalScore) || 0,
      totalMarks: Number(attempt.test.totalMarks),
      percentage: Number(attempt.percentage) || 0,
      submittedAt: attempt.submittedAt,
      questionsAnswered: attempt.questionsAnswered,
      correctAnswers: attempt.correctAnswers,
    }));

    // Subject-wise performance
    const subjectWise = new Map<string, {
      subjectId: string;
      subjectName: string;
      testCount: number;
      avgPercentage: number;
      totalPercentage: number;
    }>();

    for (const attempt of attempts) {
      const existing = subjectWise.get(attempt.test.subjectId) || {
        subjectId: attempt.test.subjectId,
        subjectName: attempt.test.subject.name,
        testCount: 0,
        avgPercentage: 0,
        totalPercentage: 0,
      };

      existing.testCount++;
      existing.totalPercentage += Number(attempt.percentage) || 0;
      existing.avgPercentage = existing.totalPercentage / existing.testCount;

      subjectWise.set(attempt.test.subjectId, existing);
    }

    // Chapter-wise performance
    const chapterWise = new Map<string, {
      chapterId: string;
      chapterName: string;
      correct: number;
      total: number;
    }>();

    for (const attempt of attempts) {
      for (const response of attempt.responses) {
        const chapter = response.testQuestion.question.chapterRef;
        if (chapter) {
          const existing = chapterWise.get(chapter.id) || {
            chapterId: chapter.id,
            chapterName: chapter.name,
            correct: 0,
            total: 0,
          };

          existing.total++;
          if (response.isCorrect) existing.correct++;

          chapterWise.set(chapter.id, existing);
        }
      }
    }

    // Progress trend (last 10 tests)
    const progressTrend = testHistory.slice(0, 10).reverse().map((t, index) => ({
      index: index + 1,
      testTitle: t.testTitle,
      percentage: t.percentage,
      date: t.submittedAt,
    }));

    // Calculate overall stats
    const percentages = attempts.map((a) => Number(a.percentage) || 0);
    const overallStats = {
      totalTests: attempts.length,
      averagePercentage: percentages.length > 0
        ? Math.round((percentages.reduce((a, b) => a + b, 0) / percentages.length) * 100) / 100
        : 0,
      bestPercentage: percentages.length > 0 ? Math.max(...percentages) : 0,
      worstPercentage: percentages.length > 0 ? Math.min(...percentages) : 0,
      testsAbove80: percentages.filter((p) => p >= 80).length,
      testsBelow50: percentages.filter((p) => p < 50).length,
    };

    // Identify weak chapters
    const chapterPerformance = Array.from(chapterWise.values()).map((c) => ({
      ...c,
      percentage: c.total > 0 ? Math.round((c.correct / c.total) * 100) : 0,
    }));

    const weakChapters = chapterPerformance
      .filter((c) => c.percentage < 60 && c.total >= 3)
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, 5);

    return {
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        rollNo: student.rollNo,
        class: student.currentClass,
        section: student.currentSection,
      },
      overallStats,
      subjectWise: Array.from(subjectWise.values()).map((s) => ({
        ...s,
        avgPercentage: Math.round(s.avgPercentage * 100) / 100,
      })),
      chapterPerformance,
      weakChapters,
      progressTrend,
      testHistory,
      recommendations: this.generateStudentRecommendations(overallStats, weakChapters),
    };
  }

  // Get test attempts for export
  async getTestAttemptsForExport(testId: string) {
    const test = await prisma.onlineTest.findUnique({
      where: { id: testId },
      include: {
        subject: { select: { name: true } },
        class: { select: { name: true } },
        attempts: {
          where: { status: { in: ['SUBMITTED', 'GRADED'] } },
          include: {
            student: {
              select: { firstName: true, lastName: true, rollNo: true, admissionNo: true },
            },
          },
          orderBy: { totalScore: 'desc' },
        },
      },
    });

    if (!test) {
      throw new Error('Test not found');
    }

    return {
      testTitle: test.title,
      subject: test.subject.name,
      class: test.class.name,
      totalMarks: Number(test.totalMarks),
      data: test.attempts.map((attempt, index) => ({
        rank: index + 1,
        rollNo: attempt.student.rollNo || '',
        admissionNo: attempt.student.admissionNo,
        studentName: `${attempt.student.firstName} ${attempt.student.lastName}`,
        score: Number(attempt.totalScore) || 0,
        percentage: Math.round((Number(attempt.percentage) || 0) * 100) / 100,
        questionsAnswered: attempt.questionsAnswered,
        correctAnswers: attempt.correctAnswers,
        submittedAt: attempt.submittedAt,
      })),
    };
  }

  // Private helper methods
  private calculateMedian(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  private calculateScoreDistribution(scores: number[], totalMarks: number): ScoreDistribution[] {
    const ranges = [
      { min: 90, max: 100, label: '90-100%' },
      { min: 80, max: 89, label: '80-89%' },
      { min: 70, max: 79, label: '70-79%' },
      { min: 60, max: 69, label: '60-69%' },
      { min: 50, max: 59, label: '50-59%' },
      { min: 40, max: 49, label: '40-49%' },
      { min: 0, max: 39, label: '0-39%' },
    ];

    const percentages = scores.map((s) => totalMarks > 0 ? (s / totalMarks) * 100 : 0);

    return ranges.map((range) => {
      const count = percentages.filter(
        (p) => p >= range.min && (range.max === 100 ? p <= 100 : p < range.max + 1)
      ).length;
      return {
        range: range.label,
        count,
        percentage: scores.length > 0 ? Math.round((count / scores.length) * 100) : 0,
      };
    });
  }

  private generateStudentRecommendations(
    stats: { averagePercentage: number; testsBelow50: number },
    weakChapters: { chapterName: string; percentage: number }[]
  ): string[] {
    const recommendations: string[] = [];

    if (stats.averagePercentage >= 80) {
      recommendations.push('Excellent performance! Keep up the good work and aim for consistency.');
    } else if (stats.averagePercentage >= 60) {
      recommendations.push('Good progress. Focus on improving accuracy to reach the top tier.');
    } else if (stats.averagePercentage >= 40) {
      recommendations.push('There is room for improvement. Regular practice is recommended.');
    } else {
      recommendations.push('Intensive revision and practice is needed. Consider additional support.');
    }

    if (stats.testsBelow50 > 3) {
      recommendations.push('Multiple tests with low scores detected. Review fundamentals thoroughly.');
    }

    for (const chapter of weakChapters.slice(0, 3)) {
      recommendations.push(
        `Focus on "${chapter.chapterName}" (current accuracy: ${chapter.percentage}%). Practice more questions from this topic.`
      );
    }

    return recommendations;
  }
}

export const reportsService = new ReportsService();
