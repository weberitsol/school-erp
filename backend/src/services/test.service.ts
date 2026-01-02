import { PrismaClient, TestStatus, AttemptStatus, QuestionType, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateTestDto {
  title: string;
  description?: string;
  instructions?: string;
  subjectId: string;
  classId: string;
  sectionId?: string;
  totalMarks: number;
  passingMarks?: number;
  durationMinutes: number;
  totalQuestions: number;
  startDateTime?: Date;
  endDateTime?: Date;
  maxAttempts?: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  showResultsImmediately?: boolean;
  showCorrectAnswers?: boolean;
  allowReview?: boolean;
  questionIds: string[];
  createdById: string;
}

export interface SubmitTestDto {
  attemptId: string;
  responses: {
    testQuestionId: string;
    selectedOptions?: string[];
    responseText?: string;
    timeSpentSeconds?: number;
  }[];
}

export interface TestFilters {
  subjectId?: string;
  classId?: string;
  status?: TestStatus;
  createdById?: string;
  search?: string;
}

class TestService {
  // Create online test
  async createTest(data: CreateTestDto) {
    // First, fetch the actual marks for each question
    const questions = await prisma.question.findMany({
      where: { id: { in: data.questionIds } },
      select: { id: true, marks: true },
    });

    const questionMarksMap = new Map(questions.map(q => [q.id, q.marks]));

    // Calculate total marks from actual questions
    const calculatedTotalMarks = data.questionIds.reduce((sum, qId) => {
      const marks = questionMarksMap.get(qId);
      return sum + (marks ? Number(marks) : 4);
    }, 0);

    const test = await prisma.onlineTest.create({
      data: {
        title: data.title,
        description: data.description,
        instructions: data.instructions,
        subjectId: data.subjectId,
        classId: data.classId,
        sectionId: data.sectionId,
        totalMarks: calculatedTotalMarks || data.totalMarks,
        passingMarks: data.passingMarks,
        durationMinutes: data.durationMinutes,
        totalQuestions: data.totalQuestions,
        startDateTime: data.startDateTime,
        endDateTime: data.endDateTime,
        maxAttempts: data.maxAttempts || 1,
        shuffleQuestions: data.shuffleQuestions ?? true,
        shuffleOptions: data.shuffleOptions ?? true,
        showResultsImmediately: data.showResultsImmediately ?? true,
        showCorrectAnswers: data.showCorrectAnswers ?? false,
        allowReview: data.allowReview ?? true,
        status: 'DRAFT',
        createdById: data.createdById,
        questions: {
          create: data.questionIds.map((questionId, index) => ({
            questionId,
            sequenceOrder: index + 1,
            marks: Number(questionMarksMap.get(questionId)) || 4,
          })),
        },
      },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true, code: true } },
        questions: {
          include: {
            question: {
              select: {
                id: true,
                questionText: true,
                questionType: true,
                marks: true,
              },
            },
          },
          orderBy: { sequenceOrder: 'asc' },
        },
        _count: { select: { attempts: true } },
      },
    });

    return test;
  }

  // Get all tests
  async getTests(filters: TestFilters = {}, pagination: { page?: number; limit?: number } = {}) {
    const { subjectId, classId, status, createdById, search } = filters;
    const { page = 1, limit = 10 } = pagination;

    const skip = (page - 1) * limit;

    const where: Prisma.OnlineTestWhereInput = {
      ...(subjectId && { subjectId }),
      ...(classId && { classId }),
      ...(status && { status }),
      ...(createdById && { createdById }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [tests, total] = await Promise.all([
      prisma.onlineTest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          subject: { select: { id: true, name: true, code: true } },
          class: { select: { id: true, name: true, code: true } },
          _count: { select: { questions: true, attempts: true } },
        },
      }),
      prisma.onlineTest.count({ where }),
    ]);

    return {
      tests,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // Get test by ID
  async getTestById(id: string, includeAnswers = false) {
    const test = await prisma.onlineTest.findUnique({
      where: { id },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true, code: true } },
        section: { select: { id: true, name: true } },
        createdBy: { select: { id: true, email: true } },
        questions: {
          include: {
            question: {
              select: {
                id: true,
                questionText: true,
                questionHtml: true,
                questionImage: true,
                questionType: true,
                options: true,
                marks: true,
                negativeMarks: true,
                ...(includeAnswers && {
                  correctAnswer: true,
                  answerExplanation: true,
                }),
              },
            },
          },
          orderBy: { sequenceOrder: 'asc' },
        },
        _count: { select: { attempts: true } },
      },
    });

    return test;
  }

  // Get available tests for a student (accepts either studentId or userId)
  async getAvailableTestsForStudent(studentIdOrUserId: string) {
    // Try to find student by ID first, then by userId
    let student = await prisma.student.findUnique({
      where: { id: studentIdOrUserId },
      select: { id: true, currentSectionId: true, currentClassId: true },
    });

    // If not found, try by userId
    if (!student) {
      student = await prisma.student.findUnique({
        where: { userId: studentIdOrUserId },
        select: { id: true, currentSectionId: true, currentClassId: true },
      });
    }

    if (!student) {
      throw new Error('Student not found');
    }

    const now = new Date();

    const tests = await prisma.onlineTest.findMany({
      where: {
        status: 'PUBLISHED',
        classId: student.currentClassId || undefined,
        OR: [
          { sectionId: student.currentSectionId },
          { sectionId: null }, // Tests without section restriction
        ],
        AND: [
          { OR: [{ startDateTime: null }, { startDateTime: { lte: now } }] },
          { OR: [{ endDateTime: null }, { endDateTime: { gte: now } }] },
        ],
      },
      include: {
        subject: { select: { id: true, name: true } },
        _count: { select: { questions: true } },
        attempts: {
          where: { studentId: student.id },
          select: { id: true, status: true, totalScore: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter out tests where student has reached max attempts
    return tests.filter((test) => {
      const completedAttempts = test.attempts.filter(
        (a: { status: AttemptStatus }) => a.status === 'SUBMITTED' || a.status === 'GRADED'
      ).length;
      return completedAttempts < test.maxAttempts;
    });
  }

  // Start test attempt (accepts either studentId or userId)
  async startTestAttempt(testId: string, studentIdOrUserId: string) {
    // First, resolve the actual studentId
    let student = await prisma.student.findUnique({
      where: { id: studentIdOrUserId },
      select: { id: true },
    });

    // If not found by ID, try by userId
    if (!student) {
      student = await prisma.student.findUnique({
        where: { userId: studentIdOrUserId },
        select: { id: true },
      });
    }

    if (!student) {
      throw new Error('Student not found');
    }

    const studentId = student.id;

    const test = await prisma.onlineTest.findUnique({
      where: { id: testId },
      include: {
        questions: {
          include: { question: true },
          orderBy: { sequenceOrder: 'asc' },
        },
        attempts: {
          where: { studentId, status: { in: ['IN_PROGRESS', 'SUBMITTED', 'GRADED'] } },
        },
      },
    });

    if (!test) {
      throw new Error('Test not found');
    }

    if (test.status !== 'PUBLISHED') {
      throw new Error('Test is not available');
    }

    // Check if already has in-progress attempt
    const inProgressAttempt = test.attempts.find((a) => a.status === 'IN_PROGRESS');
    if (inProgressAttempt) {
      return this.getAttemptById(inProgressAttempt.id);
    }

    // Check max attempts
    const completedAttempts = test.attempts.filter((a: { status: AttemptStatus }) => a.status === 'SUBMITTED' || a.status === 'GRADED').length;
    if (completedAttempts >= test.maxAttempts) {
      throw new Error('Maximum attempts reached');
    }

    // Check time window
    const now = new Date();
    if (test.startDateTime && test.startDateTime > now) {
      throw new Error('Test has not started yet');
    }
    if (test.endDateTime && test.endDateTime < now) {
      throw new Error('Test has ended');
    }

    // Create attempt with responses for each question
    const attempt = await prisma.testAttempt.create({
      data: {
        testId,
        studentId,
        startedAt: now,
        status: 'IN_PROGRESS',
        attemptNumber: completedAttempts + 1,
        responses: {
          create: test.questions.map((q: { id: string }) => ({
            testQuestionId: q.id,
          })),
        },
      },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            durationMinutes: true,
            shuffleOptions: true,
            instructions: true,
          },
        },
        responses: {
          include: {
            testQuestion: {
              include: {
                question: {
                  select: {
                    id: true,
                    questionText: true,
                    questionHtml: true,
                    questionImage: true,
                    questionType: true,
                    options: true,
                    marks: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return attempt;
  }

  // Get attempt by ID
  async getAttemptById(attemptId: string) {
    return prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            durationMinutes: true,
            shuffleOptions: true,
            showResultsImmediately: true,
            showCorrectAnswers: true,
            allowReview: true,
          },
        },
        responses: {
          include: {
            testQuestion: {
              include: {
                question: {
                  select: {
                    id: true,
                    questionText: true,
                    questionHtml: true,
                    questionImage: true,
                    questionType: true,
                    options: true,
                    marks: true,
                    negativeMarks: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  // Save response (auto-save during test)
  async saveResponse(
    attemptId: string,
    testQuestionId: string,
    selectedOptions?: string[],
    responseText?: string
  ) {
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      select: { status: true },
    });

    if (!attempt || attempt.status !== 'IN_PROGRESS') {
      throw new Error('Attempt is not in progress');
    }

    return prisma.testResponse.updateMany({
      where: { attemptId, testQuestionId },
      data: {
        selectedOptions,
        responseText,
        answeredAt: new Date(),
      },
    });
  }

  // Submit test
  async submitTest(data: SubmitTestDto) {
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: data.attemptId },
      include: {
        test: true,
        responses: {
          include: {
            testQuestion: {
              include: {
                question: {
                  select: {
                    id: true,
                    questionType: true,
                    correctAnswer: true,
                    marks: true,
                    negativeMarks: true,
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

    if (attempt.status !== 'IN_PROGRESS') {
      throw new Error('Test already submitted');
    }

    // Update responses and calculate score
    let totalScore = 0;
    let correctCount = 0;
    let questionsAnswered = 0;

    for (const response of data.responses) {
      const existingResponse = attempt.responses.find(
        (r) => r.testQuestionId === response.testQuestionId
      );

      if (!existingResponse) continue;

      const question = existingResponse.testQuestion.question;
      let isCorrect = false;

      // Auto-grade MCQ and True/False
      if (
        question.questionType === 'MCQ' ||
        question.questionType === 'TRUE_FALSE'
      ) {
        const selectedAnswer = response.selectedOptions?.[0];
        isCorrect = selectedAnswer === question.correctAnswer;

        if (selectedAnswer) {
          questionsAnswered++;
          if (isCorrect) {
            totalScore += existingResponse.testQuestion.marks.toNumber();
            correctCount++;
          } else {
            totalScore -= existingResponse.testQuestion.negativeMarks.toNumber();
          }
        }
      } else {
        // Other types need manual grading
        if (response.responseText) {
          questionsAnswered++;
        }
      }

      await prisma.testResponse.update({
        where: { id: existingResponse.id },
        data: {
          selectedOptions: response.selectedOptions,
          responseText: response.responseText,
          isCorrect:
            question.questionType === 'MCQ' ||
            question.questionType === 'TRUE_FALSE'
              ? isCorrect
              : null,
          marksObtained: isCorrect ? existingResponse.testQuestion.marks : 0,
          timeSpentSeconds: response.timeSpentSeconds,
          answeredAt: new Date(),
          autoGraded: question.questionType === 'MCQ' || question.questionType === 'TRUE_FALSE',
        },
      });
    }

    // Update attempt
    const updatedAttempt = await prisma.testAttempt.update({
      where: { id: data.attemptId },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        totalScore,
        percentage: (totalScore / attempt.test.totalMarks.toNumber()) * 100,
        questionsAnswered,
        correctAnswers: correctCount,
      },
      include: {
        test: {
          select: {
            title: true,
            totalMarks: true,
            passingMarks: true,
            showResultsImmediately: true,
            showCorrectAnswers: true,
          },
        },
      },
    });

    return updatedAttempt;
  }

  // Get student's test attempts (accepts either studentId or userId)
  async getStudentAttempts(studentIdOrUserId: string, testId?: string) {
    // First, resolve the actual studentId
    let student = await prisma.student.findUnique({
      where: { id: studentIdOrUserId },
      select: { id: true },
    });

    // If not found by ID, try by userId
    if (!student) {
      student = await prisma.student.findUnique({
        where: { userId: studentIdOrUserId },
        select: { id: true },
      });
    }

    if (!student) {
      return [];
    }

    const studentId = student.id;

    return prisma.testAttempt.findMany({
      where: {
        studentId,
        ...(testId && { testId }),
      },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            subject: { select: { id: true, name: true } },
            totalMarks: true,
            passingMarks: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  // Get test results/analytics
  async getTestAnalytics(testId: string) {
    const test = await prisma.onlineTest.findUnique({
      where: { id: testId },
      include: {
        attempts: {
          where: { status: { in: ['SUBMITTED', 'GRADED'] } },
          include: {
            student: {
              select: { id: true, firstName: true, lastName: true, rollNo: true },
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

    type AttemptWithStudent = {
      totalScore: { toNumber: () => number } | null;
      percentage: { toNumber: () => number } | null;
      submittedAt: Date | null;
      student: { id: string; firstName: string; lastName: string; rollNo: string | null };
    };

    const completedAttempts = test.attempts as unknown as AttemptWithStudent[];
    const scores = completedAttempts.map((a: AttemptWithStudent) => a.totalScore?.toNumber() || 0);

    const passingMarks = test.passingMarks?.toNumber() || 0;

    const stats = {
      totalAttempts: (test as any)._count?.attempts || 0,
      completedAttempts: completedAttempts.length,
      averageScore: scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0,
      highestScore: scores.length > 0 ? Math.max(...scores) : 0,
      lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
      passCount: completedAttempts.filter(
        (a: AttemptWithStudent) => (a.totalScore?.toNumber() || 0) >= passingMarks
      ).length,
      failCount: completedAttempts.filter(
        (a: AttemptWithStudent) => (a.totalScore?.toNumber() || 0) < passingMarks
      ).length,
    };

    return {
      test: {
        id: test.id,
        title: test.title,
        totalMarks: test.totalMarks,
        passingMarks: test.passingMarks,
      },
      stats,
      leaderboard: completedAttempts.slice(0, 10).map((a: AttemptWithStudent, index: number) => ({
        rank: index + 1,
        student: a.student,
        score: a.totalScore,
        percentage: a.percentage,
        submittedAt: a.submittedAt,
      })),
    };
  }

  // Publish test
  async publishTest(testId: string) {
    return prisma.onlineTest.update({
      where: { id: testId },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });
  }

  // Close test
  async closeTest(testId: string) {
    return prisma.onlineTest.update({
      where: { id: testId },
      data: { status: 'CLOSED' },
    });
  }

  // Delete test
  async deleteTest(testId: string) {
    // Check if test has attempts
    const attemptCount = await prisma.testAttempt.count({
      where: { testId },
    });

    if (attemptCount > 0) {
      throw new Error('Cannot delete test with existing attempts');
    }

    await prisma.onlineTest.delete({ where: { id: testId } });
    return { success: true };
  }

  // Duplicate test with new name
  async duplicateTest(testId: string, newTitle: string, createdById: string) {
    // Get the original test with questions
    const originalTest = await prisma.onlineTest.findUnique({
      where: { id: testId },
      include: {
        questions: {
          include: {
            question: true,
          },
        },
      },
    });

    if (!originalTest) {
      throw new Error('Test not found');
    }

    // Create a copy of the test
    const newTest = await prisma.onlineTest.create({
      data: {
        title: newTitle,
        description: originalTest.description,
        instructions: originalTest.instructions,
        testType: originalTest.testType,
        subjectId: originalTest.subjectId,
        classId: originalTest.classId,
        sectionId: originalTest.sectionId,
        patternId: originalTest.patternId,
        totalMarks: originalTest.totalMarks,
        passingMarks: originalTest.passingMarks,
        durationMinutes: originalTest.durationMinutes,
        totalQuestions: originalTest.totalQuestions,
        maxAttempts: originalTest.maxAttempts,
        shuffleQuestions: originalTest.shuffleQuestions,
        shuffleOptions: originalTest.shuffleOptions,
        showResultsImmediately: originalTest.showResultsImmediately,
        showCorrectAnswers: originalTest.showCorrectAnswers,
        allowReview: originalTest.allowReview,
        status: 'DRAFT', // New copy starts as draft
        createdById,
        questions: {
          create: originalTest.questions.map((tq) => ({
            questionId: tq.questionId,
            sequenceOrder: tq.sequenceOrder,
            marks: tq.marks,
            negativeMarks: tq.negativeMarks,
          })),
        },
      },
      include: {
        subject: true,
        class: true,
        questions: true,
      },
    });

    return newTest;
  }

  // Assign test to class/section
  async assignTest(testId: string, classId?: string, sectionId?: string) {
    const updateData: any = {};

    if (classId !== undefined) {
      updateData.classId = classId || null;
    }
    if (sectionId !== undefined) {
      updateData.sectionId = sectionId || null;
    }

    return prisma.onlineTest.update({
      where: { id: testId },
      data: updateData,
      include: {
        subject: true,
        class: true,
        section: true,
      },
    });
  }

  // Remove question from test
  async removeQuestionFromTest(testId: string, testQuestionId: string) {
    // Verify the test question belongs to this test
    const testQuestion = await prisma.testQuestion.findFirst({
      where: {
        id: testQuestionId,
        testId: testId,
      },
    });

    if (!testQuestion) {
      throw new Error('Question not found in this test');
    }

    // Delete the test question
    await prisma.testQuestion.delete({
      where: { id: testQuestionId },
    });

    // Update total questions count
    const questionCount = await prisma.testQuestion.count({
      where: { testId },
    });

    // Recalculate total marks
    const questions = await prisma.testQuestion.findMany({
      where: { testId },
      select: { marks: true },
    });

    const totalMarks = questions.reduce((sum, q) => sum + Number(q.marks), 0);

    await prisma.onlineTest.update({
      where: { id: testId },
      data: {
        totalQuestions: questionCount,
        totalMarks: totalMarks,
      },
    });

    // Reorder remaining questions
    const remainingQuestions = await prisma.testQuestion.findMany({
      where: { testId },
      orderBy: { sequenceOrder: 'asc' },
    });

    for (let i = 0; i < remainingQuestions.length; i++) {
      await prisma.testQuestion.update({
        where: { id: remainingQuestions[i].id },
        data: { sequenceOrder: i + 1 },
      });
    }

    return { success: true, questionsRemaining: questionCount };
  }

  // Replace question in test
  async replaceQuestionInTest(testId: string, testQuestionId: string, newQuestionId: string) {
    // Verify the test question belongs to this test
    const testQuestion = await prisma.testQuestion.findFirst({
      where: {
        id: testQuestionId,
        testId: testId,
      },
    });

    if (!testQuestion) {
      throw new Error('Question not found in this test');
    }

    // Get the new question details
    const newQuestion = await prisma.question.findUnique({
      where: { id: newQuestionId },
      select: { id: true, marks: true },
    });

    if (!newQuestion) {
      throw new Error('New question not found');
    }

    // Update the test question
    const updatedTestQuestion = await prisma.testQuestion.update({
      where: { id: testQuestionId },
      data: {
        questionId: newQuestionId,
        marks: newQuestion.marks,
      },
      include: {
        question: true,
      },
    });

    // Recalculate total marks
    const questions = await prisma.testQuestion.findMany({
      where: { testId },
      select: { marks: true },
    });

    const totalMarks = questions.reduce((sum, q) => sum + Number(q.marks), 0);

    await prisma.onlineTest.update({
      where: { id: testId },
      data: { totalMarks: totalMarks },
    });

    return updatedTestQuestion;
  }

  // Get alternative questions for replacement
  async getAlternativeQuestions(options: {
    questionId: string;
    subjectId?: string;
    classId?: string;
    questionType?: QuestionType;
    difficulty?: string;
    excludeIds?: string[];
    limit?: number;
  }) {
    const where: any = {
      id: { notIn: [options.questionId, ...(options.excludeIds || [])] },
    };

    if (options.subjectId) {
      where.subjectId = options.subjectId;
    }

    if (options.classId) {
      where.classId = options.classId;
    }

    if (options.questionType) {
      where.questionType = options.questionType;
    }

    if (options.difficulty) {
      where.difficulty = options.difficulty;
    }

    const questions = await prisma.question.findMany({
      where,
      take: options.limit || 10,
      select: {
        id: true,
        questionText: true,
        questionType: true,
        difficulty: true,
        marks: true,
        options: true,
        subject: { select: { id: true, name: true } },
        chapter: true,
        topic: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return questions;
  }

  // Export test questions template for Excel
  async exportTestTemplate(testId: string) {
    const test = await prisma.onlineTest.findUnique({
      where: { id: testId },
      include: {
        questions: {
          include: {
            question: {
              select: {
                id: true,
                questionText: true,
                questionType: true,
                difficulty: true,
                marks: true,
                options: true,
                correctAnswer: true,
                answerExplanation: true,
                topic: true,
                chapter: true,
              },
            },
          },
          orderBy: { sequenceOrder: 'asc' },
        },
      },
    });

    if (!test) {
      throw new Error('Test not found');
    }

    // Return data in a format suitable for Excel export
    return test.questions.map((tq: any, index: number) => ({
      sequenceNumber: index + 1,
      questionId: tq.question.id,
      questionText: tq.question.questionText,
      questionType: tq.question.questionType,
      difficulty: tq.question.difficulty,
      marks: Number(tq.marks),
      options: JSON.stringify(tq.question.options),
      correctAnswer: tq.question.correctAnswer,
      explanation: tq.question.answerExplanation,
      topic: tq.question.topic,
      chapter: tq.question.chapter,
    }));
  }
}

export const testService = new TestService();
