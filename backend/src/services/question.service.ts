import { PrismaClient, QuestionType, DifficultyLevel, QuestionSource, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// ==================== QUESTION TYPE INTERFACES ====================

export interface MCQOption {
  id: string;      // "a", "b", "c", "d"
  text: string;
  isCorrect?: boolean;
  image?: string;
}

export interface MatrixMatchData {
  leftColumn: { id: string; text: string }[];   // P, Q, R, S
  rightColumn: { id: string; text: string }[];  // 1, 2, 3, 4
  correctMatches: Record<string, string[]>;      // {"P": ["1", "2"], "Q": ["3"]}
}

export interface AssertionReasoningData {
  assertion: string;
  reason: string;
  correctOption: string; // "a", "b", "c", "d"
  // Standard options:
  // a) Both Assertion and Reason are correct, and Reason is the correct explanation
  // b) Both Assertion and Reason are correct, but Reason is NOT the correct explanation
  // c) Assertion is correct, but Reason is incorrect
  // d) Assertion is incorrect, but Reason is correct
}

export interface CreateQuestionDto {
  questionText: string;
  questionHtml?: string;
  questionImage?: string;
  questionType: QuestionType;
  difficulty?: DifficultyLevel;
  marks?: number;
  negativeMarks?: number;
  partialMarking?: boolean;
  estimatedTime?: number;
  subjectId: string;
  classId: string;
  chapterId?: string;
  chapter?: string;
  topic?: string;
  tags?: string[];
  // Generic answer
  correctAnswer?: string;
  options?: MCQOption[];
  answerExplanation?: string;
  // Multiple correct
  correctOptions?: string[];
  // Integer type
  integerAnswer?: number;
  integerRangeMin?: number;
  integerRangeMax?: number;
  // Matrix match
  matrixData?: MatrixMatchData;
  // Assertion reasoning
  assertionData?: AssertionReasoningData;
  // Comprehension
  comprehensionPassageId?: string;
  passageQuestionNumber?: number;
  // Source metadata
  source?: QuestionSource;
  sourceYear?: number;
  sourceExam?: string;
  createdById: string;
}

export interface UpdateQuestionDto {
  questionText?: string;
  questionHtml?: string;
  questionImage?: string;
  questionType?: QuestionType;
  difficulty?: DifficultyLevel;
  marks?: number;
  negativeMarks?: number;
  partialMarking?: boolean;
  estimatedTime?: number;
  chapterId?: string;
  chapter?: string;
  topic?: string;
  tags?: string[];
  correctAnswer?: string;
  options?: MCQOption[];
  answerExplanation?: string;
  correctOptions?: string[];
  integerAnswer?: number;
  integerRangeMin?: number;
  integerRangeMax?: number;
  matrixData?: MatrixMatchData;
  assertionData?: AssertionReasoningData;
  comprehensionPassageId?: string;
  passageQuestionNumber?: number;
  sourceYear?: number;
  sourceExam?: string;
  isVerified?: boolean;
  verifiedById?: string;
  isActive?: boolean;
}

// ==================== SCORING UTILITIES ====================

export interface ScoringResult {
  isCorrect: boolean;
  marksObtained: number;
  partialCredit?: boolean;
}

export function scoreQuestion(
  questionType: QuestionType,
  question: {
    correctAnswer?: string | null;
    correctOptions?: string[];
    integerAnswer?: number | null;
    integerRangeMin?: number | null;
    integerRangeMax?: number | null;
    matrixData?: any;
    assertionData?: any;
    marks: number;
    negativeMarks: number;
    partialMarking?: boolean;
  },
  response: {
    selectedOptions?: string[];
    responseText?: string;
    integerResponse?: number;
    matrixResponse?: Record<string, string[]>;
  }
): ScoringResult {
  const { marks, negativeMarks, partialMarking } = question;

  switch (questionType) {
    case 'SINGLE_CORRECT':
    case 'MCQ': {
      const selected = response.selectedOptions?.[0];
      const correct = question.correctAnswer;
      if (!selected) return { isCorrect: false, marksObtained: 0 };
      const isCorrect = selected === correct;
      return {
        isCorrect,
        marksObtained: isCorrect ? marks : -negativeMarks,
      };
    }

    case 'MULTIPLE_CORRECT': {
      const selected = response.selectedOptions || [];
      const correct = question.correctOptions || [];
      if (selected.length === 0) return { isCorrect: false, marksObtained: 0 };

      const correctSet = new Set(correct);
      const selectedSet = new Set(selected);

      // Check for any wrong answers
      const hasWrong = selected.some((s) => !correctSet.has(s));
      if (hasWrong) {
        return { isCorrect: false, marksObtained: -negativeMarks };
      }

      // All selected are correct - check if all correct are selected
      const allCorrect = correct.every((c) => selectedSet.has(c));
      if (allCorrect) {
        return { isCorrect: true, marksObtained: marks };
      }

      // Partial credit (if enabled)
      if (partialMarking) {
        const correctCount = selected.filter((s) => correctSet.has(s)).length;
        const partialMarks = (marks * correctCount) / correct.length;
        return { isCorrect: false, marksObtained: partialMarks, partialCredit: true };
      }

      return { isCorrect: false, marksObtained: 0 };
    }

    case 'INTEGER_TYPE': {
      const studentAnswer = response.integerResponse ?? parseInt(response.responseText || '', 10);
      if (isNaN(studentAnswer)) return { isCorrect: false, marksObtained: 0 };

      const correctAnswer = question.integerAnswer;
      const rangeMin = question.integerRangeMin;
      const rangeMax = question.integerRangeMax;

      let isCorrect = false;
      if (correctAnswer !== null && correctAnswer !== undefined) {
        isCorrect = studentAnswer === correctAnswer;
      } else if (rangeMin != null && rangeMax != null) {
        isCorrect = studentAnswer >= rangeMin && studentAnswer <= rangeMax;
      }

      // Integer type typically has no negative marking
      return { isCorrect, marksObtained: isCorrect ? marks : 0 };
    }

    case 'MATRIX_MATCH': {
      const studentMatches = response.matrixResponse || {};
      const correctMatches = question.matrixData?.correctMatches || {};

      if (Object.keys(studentMatches).length === 0) {
        return { isCorrect: false, marksObtained: 0 };
      }

      let correctPairs = 0;
      let totalPairs = 0;
      let hasWrong = false;

      for (const [left, correctRights] of Object.entries(correctMatches)) {
        const studentRights = studentMatches[left] || [];
        totalPairs += (correctRights as string[]).length;

        for (const right of studentRights) {
          if ((correctRights as string[]).includes(right)) {
            correctPairs++;
          } else {
            hasWrong = true;
          }
        }
      }

      if (hasWrong) {
        return { isCorrect: false, marksObtained: -negativeMarks };
      }

      const allCorrect = correctPairs === totalPairs;
      if (allCorrect) {
        return { isCorrect: true, marksObtained: marks };
      }

      if (partialMarking && totalPairs > 0) {
        return {
          isCorrect: false,
          marksObtained: (marks * correctPairs) / totalPairs,
          partialCredit: true,
        };
      }

      return { isCorrect: false, marksObtained: 0 };
    }

    case 'ASSERTION_REASONING': {
      const selected = response.selectedOptions?.[0];
      const correct = question.assertionData?.correctOption || question.correctAnswer;
      if (!selected) return { isCorrect: false, marksObtained: 0 };
      const isCorrect = selected === correct;
      return {
        isCorrect,
        marksObtained: isCorrect ? marks : -negativeMarks,
      };
    }

    case 'TRUE_FALSE': {
      const selected = response.selectedOptions?.[0] || response.responseText;
      const correct = question.correctAnswer;
      if (!selected) return { isCorrect: false, marksObtained: 0 };
      const isCorrect = selected.toLowerCase() === correct?.toLowerCase();
      return {
        isCorrect,
        marksObtained: isCorrect ? marks : -negativeMarks,
      };
    }

    case 'COMPREHENSION': {
      // Comprehension questions are scored like their underlying type
      // Usually SINGLE_CORRECT within a passage
      const selected = response.selectedOptions?.[0];
      const correct = question.correctAnswer;
      if (!selected) return { isCorrect: false, marksObtained: 0 };
      const isCorrect = selected === correct;
      return {
        isCorrect,
        marksObtained: isCorrect ? marks : -negativeMarks,
      };
    }

    default:
      // For SHORT_ANSWER, LONG_ANSWER, FILL_BLANK - needs manual grading
      return { isCorrect: false, marksObtained: 0 };
  }
}

export interface QuestionFilters {
  subjectId?: string;
  classId?: string;
  chapter?: string;
  topic?: string;
  questionType?: QuestionType;
  difficulty?: DifficultyLevel;
  source?: QuestionSource;
  isVerified?: boolean;
  isActive?: boolean;
  tags?: string[];
  search?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class QuestionService {
  // Validate question data based on type
  private validateQuestionData(data: CreateQuestionDto): void {
    const { questionType } = data;

    switch (questionType) {
      case 'SINGLE_CORRECT':
      case 'MCQ':
        if (!data.options || data.options.length < 2) {
          throw new Error('Single correct questions require at least 2 options');
        }
        if (!data.correctAnswer) {
          throw new Error('Single correct questions require a correct answer');
        }
        break;

      case 'MULTIPLE_CORRECT':
        if (!data.options || data.options.length < 2) {
          throw new Error('Multiple correct questions require at least 2 options');
        }
        if (!data.correctOptions || data.correctOptions.length < 1) {
          throw new Error('Multiple correct questions require at least 1 correct option');
        }
        break;

      case 'INTEGER_TYPE':
        if (data.integerAnswer === undefined &&
            (data.integerRangeMin === undefined || data.integerRangeMax === undefined)) {
          throw new Error('Integer type questions require either exact answer or range');
        }
        break;

      case 'MATRIX_MATCH':
        if (!data.matrixData?.leftColumn || !data.matrixData?.rightColumn ||
            !data.matrixData?.correctMatches) {
          throw new Error('Matrix match questions require left column, right column, and correct matches');
        }
        break;

      case 'ASSERTION_REASONING':
        if (!data.assertionData?.assertion || !data.assertionData?.reason ||
            !data.assertionData?.correctOption) {
          throw new Error('Assertion reasoning questions require assertion, reason, and correct option');
        }
        break;

      case 'COMPREHENSION':
        if (!data.comprehensionPassageId) {
          throw new Error('Comprehension questions require a passage reference');
        }
        break;

      case 'TRUE_FALSE':
        if (!data.correctAnswer || !['true', 'false'].includes(data.correctAnswer.toLowerCase())) {
          throw new Error('True/False questions require correct answer as "true" or "false"');
        }
        break;
    }
  }

  // Create question
  async createQuestion(data: CreateQuestionDto) {
    // Validate based on question type
    this.validateQuestionData(data);

    const question = await prisma.question.create({
      data: {
        questionText: data.questionText,
        questionHtml: data.questionHtml,
        questionImage: data.questionImage,
        questionType: data.questionType,
        difficulty: data.difficulty || 'MEDIUM',
        marks: data.marks || 4, // Default to 4 marks (JEE/NEET standard)
        negativeMarks: data.negativeMarks || 1,
        partialMarking: data.partialMarking || false,
        estimatedTime: data.estimatedTime || 120, // 2 minutes default
        subjectId: data.subjectId,
        classId: data.classId,
        chapterId: data.chapterId,
        chapter: data.chapter,
        topic: data.topic,
        tags: data.tags || [],
        // Generic answer
        correctAnswer: data.correctAnswer,
        options: data.options as Prisma.InputJsonValue | undefined,
        answerExplanation: data.answerExplanation,
        // Multiple correct
        correctOptions: data.correctOptions || [],
        // Integer type
        integerAnswer: data.integerAnswer,
        integerRangeMin: data.integerRangeMin,
        integerRangeMax: data.integerRangeMax,
        // Matrix match
        matrixData: data.matrixData as Prisma.InputJsonValue | undefined,
        // Assertion reasoning
        assertionData: data.assertionData as Prisma.InputJsonValue | undefined,
        // Comprehension
        comprehensionPassageId: data.comprehensionPassageId,
        passageQuestionNumber: data.passageQuestionNumber,
        // Source
        source: data.source || 'MANUAL',
        sourceYear: data.sourceYear,
        sourceExam: data.sourceExam,
        createdById: data.createdById,
      },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true, code: true } },
        chapterRef: { select: { id: true, name: true, chapterNumber: true } },
        comprehensionPassage: { select: { id: true, title: true } },
      },
    });

    return question;
  }

  // Get all questions with filters
  async getQuestions(filters: QuestionFilters = {}, pagination: PaginationOptions = {}) {
    const {
      subjectId,
      classId,
      chapter,
      topic,
      questionType,
      difficulty,
      source,
      isVerified,
      isActive = true,
      tags,
      search,
    } = filters;

    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;

    const skip = (page - 1) * limit;

    const where: Prisma.QuestionWhereInput = {
      isActive,
      ...(subjectId && { subjectId }),
      ...(classId && { classId }),
      ...(chapter && { chapter }),
      ...(topic && { topic }),
      ...(questionType && { questionType }),
      ...(difficulty && { difficulty }),
      ...(source && { source }),
      ...(isVerified !== undefined && { isVerified }),
      ...(tags && tags.length > 0 && { tags: { hasEvery: tags } }),
      ...(search && {
        OR: [
          { questionText: { contains: search, mode: 'insensitive' } },
          { chapter: { contains: search, mode: 'insensitive' } },
          { topic: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          subject: { select: { id: true, name: true, code: true } },
          class: { select: { id: true, name: true, code: true } },
          createdBy: { select: { id: true, email: true } },
        },
      }),
      prisma.question.count({ where }),
    ]);

    return {
      questions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get question by ID
  async getQuestionById(id: string) {
    return prisma.question.findUnique({
      where: { id },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, email: true } },
        sourceDocument: {
          select: { id: true, originalName: true, chapter: true },
        },
      },
    });
  }

  // Update question
  async updateQuestion(id: string, data: UpdateQuestionDto) {
    const updateData: any = { ...data };

    if (data.isVerified && data.verifiedById) {
      updateData.verifiedAt = new Date();
    }

    return prisma.question.update({
      where: { id },
      data: updateData,
      include: {
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true, code: true } },
      },
    });
  }

  // Delete question (soft)
  async deleteQuestion(id: string) {
    return prisma.question.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // Verify question
  async verifyQuestion(id: string, verifiedById: string, isVerified: boolean) {
    return prisma.question.update({
      where: { id },
      data: {
        isVerified,
        verifiedById: isVerified ? verifiedById : null,
        verifiedAt: isVerified ? new Date() : null,
      },
    });
  }

  // Bulk create questions
  async bulkCreateQuestions(questions: CreateQuestionDto[]) {
    const results = {
      success: [] as string[],
      failed: [] as { index: number; error: string }[],
    };

    for (let i = 0; i < questions.length; i++) {
      try {
        const question = await this.createQuestion(questions[i]);
        results.success.push(question.id);
      } catch (error: any) {
        results.failed.push({ index: i, error: error.message });
      }
    }

    return results;
  }

  // Get random questions for test generation
  async getRandomQuestions(params: {
    subjectId: string;
    classId?: string;
    count: number;
    questionTypes?: QuestionType[];
    difficulties?: DifficultyLevel[];
    chapters?: string[];
    excludeIds?: string[];
  }) {
    const { subjectId, classId, count, questionTypes, difficulties, chapters, excludeIds } = params;

    const where: Prisma.QuestionWhereInput = {
      subjectId,
      isActive: true,
      isVerified: true,
      ...(classId && { classId }),
      ...(questionTypes && questionTypes.length > 0 && { questionType: { in: questionTypes } }),
      ...(difficulties && difficulties.length > 0 && { difficulty: { in: difficulties } }),
      ...(chapters && chapters.length > 0 && { chapter: { in: chapters } }),
      ...(excludeIds && excludeIds.length > 0 && { id: { notIn: excludeIds } }),
    };

    // Get total available
    const totalAvailable = await prisma.question.count({ where });

    if (totalAvailable === 0) {
      return [];
    }

    // Random selection using skip
    const questions = await prisma.question.findMany({
      where,
      take: Math.min(count, totalAvailable),
      orderBy: { createdAt: 'asc' }, // We'll shuffle in application
      include: {
        subject: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } },
      },
    });

    // Shuffle the results
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }

    return questions.slice(0, count);
  }

  // Get question stats
  async getQuestionStats(subjectId?: string) {
    const where = subjectId ? { subjectId, isActive: true } : { isActive: true };

    const [total, verified, byType, byDifficulty] = await Promise.all([
      prisma.question.count({ where }),
      prisma.question.count({ where: { ...where, isVerified: true } }),
      prisma.question.groupBy({
        by: ['questionType'],
        where,
        _count: true,
      }),
      prisma.question.groupBy({
        by: ['difficulty'],
        where,
        _count: true,
      }),
    ]);

    return {
      total,
      verified,
      unverified: total - verified,
      byType: byType.reduce((acc, item) => {
        acc[item.questionType] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byDifficulty: byDifficulty.reduce((acc, item) => {
        acc[item.difficulty] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  // Get chapters and topics for a subject
  async getChaptersAndTopics(subjectId: string) {
    const questions = await prisma.question.findMany({
      where: { subjectId, isActive: true },
      select: { chapter: true, topic: true },
      distinct: ['chapter', 'topic'],
    });

    const chapters = [...new Set(questions.map((q) => q.chapter).filter(Boolean))];
    const topics = [...new Set(questions.map((q) => q.topic).filter(Boolean))];

    return { chapters, topics };
  }

  // Get alternative questions for replacement
  async getAlternativeQuestions(options: {
    questionId: string;
    subjectId?: string;
    classId?: string;
    questionType?: QuestionType;
    difficulty?: DifficultyLevel;
    excludeIds?: string[];
    limit?: number;
  }) {
    const where: Prisma.QuestionWhereInput = {
      id: { notIn: [options.questionId, ...(options.excludeIds || [])] },
      isActive: true,
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
}

export const questionService = new QuestionService();
