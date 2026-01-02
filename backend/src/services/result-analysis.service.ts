import { PrismaClient, QuestionType } from '@prisma/client';

const prisma = new PrismaClient();

interface TopicPerformance {
  topic: string;
  chapterId?: string;
  chapterName?: string;
  correct: number;
  total: number;
  score: number;
  maxScore: number;
  percentage: number;
}

interface QuestionTypePerformance {
  type: QuestionType;
  correct: number;
  total: number;
  score: number;
  maxScore: number;
  percentage: number;
}

interface TimeAnalysis {
  totalTimeSeconds: number;
  avgTimePerQuestion: number;
  fastestQuestionTime: number;
  slowestQuestionTime: number;
  questionsUnderAvgTime: number;
  questionsOverAvgTime: number;
}

interface ComparisonStats {
  yourScore: number;
  topperScore: number;
  classAverage: number;
  lowestScore: number;
  yourRank: number;
  totalStudents: number;
  percentile: number;
  scoreDifference: {
    fromTopper: number;
    fromAverage: number;
  };
}

class ResultAnalysisService {
  // Get detailed student analysis for an attempt
  async getDetailedAnalysis(attemptId: string) {
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        test: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
            class: { select: { id: true, name: true } },
          },
        },
        student: {
          select: { id: true, firstName: true, lastName: true, rollNo: true },
        },
        responses: {
          include: {
            testQuestion: {
              include: {
                question: {
                  include: {
                    chapterRef: { select: { id: true, name: true, chapterNumber: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new Error('Attempt not found');
    }

    // Calculate overview stats
    const totalMarks = Number(attempt.test.totalMarks);
    const score = Number(attempt.totalScore) || 0;
    const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
    const passingMarks = Number(attempt.test.passingMarks) || 0;
    const isPassed = score >= passingMarks;

    // Get rank and percentile
    const comparisonStats = await this.getComparisonStats(attemptId);

    // Topic-wise performance
    const topicWise = this.calculateTopicWisePerformance(attempt.responses);

    // Question type performance
    const questionTypeWise = this.calculateQuestionTypePerformance(attempt.responses);

    // Time analysis
    const timeAnalysis = this.calculateTimeAnalysis(attempt.responses);

    // Identify weak areas and strengths
    const { weakAreas, strengths } = this.identifyWeakAreasAndStrengths(topicWise);

    // Question-by-question breakdown
    const questionBreakdown = attempt.responses.map((response) => {
      const question = response.testQuestion.question;
      return {
        questionId: question.id,
        questionText: question.questionText.substring(0, 100) + '...',
        questionType: question.questionType,
        chapter: question.chapterRef?.name || question.chapter || 'Unknown',
        topic: question.topic || 'General',
        marks: Number(response.testQuestion.marks),
        marksObtained: Number(response.marksObtained) || 0,
        isCorrect: response.isCorrect,
        timeSpent: response.timeSpentSeconds || 0,
        selectedOptions: response.selectedOptions,
        correctAnswer: question.correctAnswer,
      };
    });

    return {
      attemptId: attempt.id,
      test: {
        id: attempt.test.id,
        title: attempt.test.title,
        subject: attempt.test.subject,
        class: attempt.test.class,
        totalMarks,
        passingMarks,
        durationMinutes: attempt.test.durationMinutes,
      },
      student: attempt.student,
      overview: {
        score,
        totalMarks,
        percentage: Math.round(percentage * 100) / 100,
        isPassed,
        rank: comparisonStats.yourRank,
        totalStudents: comparisonStats.totalStudents,
        percentile: comparisonStats.percentile,
        questionsAnswered: attempt.questionsAnswered,
        correctAnswers: attempt.correctAnswers,
        totalQuestions: attempt.test.totalQuestions,
        timeTaken: attempt.timeTakenSeconds || 0,
        submittedAt: attempt.submittedAt,
      },
      comparison: comparisonStats,
      topicWise,
      questionTypeWise,
      timeAnalysis,
      weakAreas,
      strengths,
      questionBreakdown,
    };
  }

  // Get comparison stats with topper and class average
  async getComparisonStats(attemptId: string): Promise<ComparisonStats> {
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      select: {
        testId: true,
        totalScore: true,
        studentId: true,
      },
    });

    if (!attempt) {
      throw new Error('Attempt not found');
    }

    // Get all completed attempts for this test
    const allAttempts = await prisma.testAttempt.findMany({
      where: {
        testId: attempt.testId,
        status: { in: ['SUBMITTED', 'GRADED'] },
      },
      select: {
        studentId: true,
        totalScore: true,
      },
      orderBy: { totalScore: 'desc' },
    });

    // Get unique student scores (best attempt per student)
    const studentBestScores = new Map<string, number>();
    for (const a of allAttempts) {
      const score = Number(a.totalScore) || 0;
      const existing = studentBestScores.get(a.studentId);
      if (!existing || score > existing) {
        studentBestScores.set(a.studentId, score);
      }
    }

    const scores = Array.from(studentBestScores.values()).sort((a, b) => b - a);
    const yourScore = Number(attempt.totalScore) || 0;
    const topperScore = scores[0] || 0;
    const lowestScore = scores[scores.length - 1] || 0;
    const classAverage = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    // Calculate rank
    const yourRank = scores.filter((s) => s > yourScore).length + 1;
    const totalStudents = scores.length;

    // Calculate percentile
    const studentsBelow = scores.filter((s) => s < yourScore).length;
    const percentile = totalStudents > 0 ? Math.round((studentsBelow / totalStudents) * 100) : 0;

    return {
      yourScore,
      topperScore,
      classAverage: Math.round(classAverage * 100) / 100,
      lowestScore,
      yourRank,
      totalStudents,
      percentile,
      scoreDifference: {
        fromTopper: Math.round((topperScore - yourScore) * 100) / 100,
        fromAverage: Math.round((yourScore - classAverage) * 100) / 100,
      },
    };
  }

  // Get performance insights
  async getPerformanceInsights(attemptId: string) {
    const analysis = await this.getDetailedAnalysis(attemptId);
    const insights: string[] = [];
    const recommendations: string[] = [];

    // Score-based insights
    if (analysis.overview.percentage >= 90) {
      insights.push('Excellent performance! You are among the top performers.');
    } else if (analysis.overview.percentage >= 75) {
      insights.push('Good performance. With a little more practice, you can reach the top.');
    } else if (analysis.overview.percentage >= 60) {
      insights.push('Average performance. Focus on your weak areas to improve.');
    } else {
      insights.push('You need to work harder. Consider revisiting the fundamentals.');
    }

    // Rank-based insights
    if (analysis.comparison.yourRank <= 3) {
      insights.push(`You ranked ${analysis.comparison.yourRank} out of ${analysis.comparison.totalStudents} students.`);
    }

    // Time-based insights
    const optimalTime = analysis.test.durationMinutes * 60;
    const timeTaken = analysis.overview.timeTaken;
    if (timeTaken < optimalTime * 0.5) {
      insights.push('You finished very quickly. Take more time to review your answers.');
    } else if (timeTaken > optimalTime * 0.95) {
      insights.push('You used almost all the time. Practice time management.');
    }

    // Weak area recommendations
    for (const weak of analysis.weakAreas) {
      recommendations.push(`Focus on "${weak}" - your performance was below average in this topic.`);
    }

    // Question type recommendations
    for (const qt of analysis.questionTypeWise) {
      if (qt.percentage < 50) {
        recommendations.push(`Practice more ${qt.type.replace(/_/g, ' ').toLowerCase()} questions.`);
      }
    }

    return {
      attemptId,
      insights,
      recommendations,
      summary: {
        overallGrade: this.calculateGrade(analysis.overview.percentage),
        performanceLevel: this.getPerformanceLevel(analysis.overview.percentage),
        improvement: analysis.comparison.scoreDifference.fromTopper,
        strongestTopic: analysis.strengths[0] || null,
        weakestTopic: analysis.weakAreas[0] || null,
      },
    };
  }

  // Get question-level insights
  async getQuestionInsights(questionId: string) {
    // Get all responses for this question
    const responses = await prisma.testResponse.findMany({
      where: {
        testQuestion: { questionId },
        attempt: { status: { in: ['SUBMITTED', 'GRADED'] } },
      },
      include: {
        testQuestion: {
          include: {
            question: {
              select: {
                questionText: true,
                questionType: true,
                correctAnswer: true,
                options: true,
                answerExplanation: true,
                difficulty: true,
              },
            },
          },
        },
      },
    });

    const totalAttempts = responses.length;
    const correctAttempts = responses.filter((r) => r.isCorrect).length;
    const successRate = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;

    // Analyze common wrong answers
    const wrongAnswerCounts = new Map<string, number>();
    for (const response of responses) {
      if (!response.isCorrect && response.selectedOptions) {
        const selected = Array.isArray(response.selectedOptions)
          ? response.selectedOptions.join(',')
          : String(response.selectedOptions);
        wrongAnswerCounts.set(selected, (wrongAnswerCounts.get(selected) || 0) + 1);
      }
    }

    const commonMistakes = Array.from(wrongAnswerCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([answer, count]) => ({
        answer,
        count,
        percentage: Math.round((count / totalAttempts) * 100),
      }));

    // Average time spent
    const times = responses.filter((r) => r.timeSpentSeconds).map((r) => r.timeSpentSeconds!);
    const avgTimeSeconds = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;

    const question = responses[0]?.testQuestion?.question;

    return {
      questionId,
      question: question ? {
        text: question.questionText,
        type: question.questionType,
        difficulty: question.difficulty,
        correctAnswer: question.correctAnswer,
        explanation: question.answerExplanation,
      } : null,
      stats: {
        totalAttempts,
        correctAttempts,
        successRate: Math.round(successRate * 100) / 100,
        avgTimeSeconds: Math.round(avgTimeSeconds),
        difficultyRating: this.calculateDifficultyRating(successRate),
      },
      commonMistakes,
    };
  }

  // Get student's weak areas in a subject
  async getSubjectWeakAreas(studentId: string, subjectId: string) {
    // Get all attempts by this student for tests in this subject
    const attempts = await prisma.testAttempt.findMany({
      where: {
        studentId,
        test: { subjectId },
        status: { in: ['SUBMITTED', 'GRADED'] },
      },
      include: {
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
    });

    // Aggregate performance by chapter
    const chapterPerformance = new Map<string, { correct: number; total: number; name: string }>();

    for (const attempt of attempts) {
      for (const response of attempt.responses) {
        const chapter = response.testQuestion.question.chapterRef;
        if (chapter) {
          const existing = chapterPerformance.get(chapter.id) || {
            correct: 0,
            total: 0,
            name: chapter.name,
          };
          existing.total++;
          if (response.isCorrect) existing.correct++;
          chapterPerformance.set(chapter.id, existing);
        }
      }
    }

    // Calculate percentages and identify weak areas
    const chapterStats = Array.from(chapterPerformance.entries()).map(([id, data]) => ({
      chapterId: id,
      chapterName: data.name,
      correct: data.correct,
      total: data.total,
      percentage: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
    }));

    // Sort by percentage (ascending) to get weakest first
    chapterStats.sort((a, b) => a.percentage - b.percentage);

    const weakChapters = chapterStats.filter((c) => c.percentage < 60);
    const strongChapters = chapterStats.filter((c) => c.percentage >= 80);

    return {
      studentId,
      subjectId,
      totalAttempts: attempts.length,
      chapterStats,
      weakChapters,
      strongChapters,
      recommendations: weakChapters.map((c) => ({
        chapter: c.chapterName,
        message: `Your accuracy in ${c.chapterName} is ${c.percentage}%. Focus on practicing more questions from this chapter.`,
      })),
    };
  }

  // Private helper methods
  private calculateTopicWisePerformance(responses: any[]): TopicPerformance[] {
    const topicMap = new Map<string, {
      correct: number;
      total: number;
      score: number;
      maxScore: number;
      chapterId?: string;
      chapterName?: string;
    }>();

    for (const response of responses) {
      const question = response.testQuestion.question;
      const topic = question.topic || question.chapterRef?.name || question.chapter || 'General';

      const existing = topicMap.get(topic) || {
        correct: 0,
        total: 0,
        score: 0,
        maxScore: 0,
        chapterId: question.chapterRef?.id,
        chapterName: question.chapterRef?.name,
      };

      existing.total++;
      existing.maxScore += Number(response.testQuestion.marks);
      if (response.isCorrect) {
        existing.correct++;
        existing.score += Number(response.marksObtained) || Number(response.testQuestion.marks);
      }

      topicMap.set(topic, existing);
    }

    return Array.from(topicMap.entries()).map(([topic, data]) => ({
      topic,
      chapterId: data.chapterId,
      chapterName: data.chapterName,
      correct: data.correct,
      total: data.total,
      score: data.score,
      maxScore: data.maxScore,
      percentage: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
    }));
  }

  private calculateQuestionTypePerformance(responses: any[]): QuestionTypePerformance[] {
    const typeMap = new Map<QuestionType, {
      correct: number;
      total: number;
      score: number;
      maxScore: number;
    }>();

    for (const response of responses) {
      const type = response.testQuestion.question.questionType;

      const existing = typeMap.get(type) || {
        correct: 0,
        total: 0,
        score: 0,
        maxScore: 0,
      };

      existing.total++;
      existing.maxScore += Number(response.testQuestion.marks);
      if (response.isCorrect) {
        existing.correct++;
        existing.score += Number(response.marksObtained) || Number(response.testQuestion.marks);
      }

      typeMap.set(type, existing);
    }

    return Array.from(typeMap.entries()).map(([type, data]) => ({
      type,
      correct: data.correct,
      total: data.total,
      score: data.score,
      maxScore: data.maxScore,
      percentage: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
    }));
  }

  private calculateTimeAnalysis(responses: any[]): TimeAnalysis {
    const times = responses
      .filter((r) => r.timeSpentSeconds && r.timeSpentSeconds > 0)
      .map((r) => r.timeSpentSeconds);

    if (times.length === 0) {
      return {
        totalTimeSeconds: 0,
        avgTimePerQuestion: 0,
        fastestQuestionTime: 0,
        slowestQuestionTime: 0,
        questionsUnderAvgTime: 0,
        questionsOverAvgTime: 0,
      };
    }

    const totalTime = times.reduce((a, b) => a + b, 0);
    const avgTime = totalTime / times.length;

    return {
      totalTimeSeconds: totalTime,
      avgTimePerQuestion: Math.round(avgTime),
      fastestQuestionTime: Math.min(...times),
      slowestQuestionTime: Math.max(...times),
      questionsUnderAvgTime: times.filter((t) => t < avgTime).length,
      questionsOverAvgTime: times.filter((t) => t > avgTime).length,
    };
  }

  private identifyWeakAreasAndStrengths(topicWise: TopicPerformance[]): {
    weakAreas: string[];
    strengths: string[];
  } {
    const sorted = [...topicWise].sort((a, b) => a.percentage - b.percentage);

    const weakAreas = sorted
      .filter((t) => t.percentage < 60 && t.total >= 2)
      .slice(0, 3)
      .map((t) => t.topic);

    const strengths = sorted
      .filter((t) => t.percentage >= 80 && t.total >= 2)
      .slice(-3)
      .reverse()
      .map((t) => t.topic);

    return { weakAreas, strengths };
  }

  private calculateGrade(percentage: number): string {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  }

  private getPerformanceLevel(percentage: number): string {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 75) return 'Good';
    if (percentage >= 60) return 'Average';
    if (percentage >= 40) return 'Below Average';
    return 'Needs Improvement';
  }

  private calculateDifficultyRating(successRate: number): string {
    if (successRate >= 80) return 'Easy';
    if (successRate >= 50) return 'Medium';
    return 'Hard';
  }
}

export const resultAnalysisService = new ResultAnalysisService();
