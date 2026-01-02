import { PrismaClient, QuestionType, QuestionSource, TestStatus } from '@prisma/client';
import { wordParserService, ParseResult, ParsedQuestion } from './word-parser.service';
import { patternService, PatternSection } from './pattern.service';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// ==================== TYPES ====================

// Extended ParsedQuestion with section assignment info
export interface ParsedQuestionWithSection extends ParsedQuestion {
  section?: string;
  subjectName?: string;
  marks?: number;
  negativeMarks?: number;
}

export interface UploadTestDto {
  patternId?: string;
  subjectId: string; // Primary subject for the test
  subjectIds?: string[]; // All subjects (for multi-subject tests like JEE/NEET)
  classId: string;
  sectionId?: string;
  testName: string;
  description?: string;
  instructions?: string;
  durationMinutes: number;
  startDateTime?: Date;
  endDateTime?: Date;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  showResultsImmediately?: boolean;
  maxAttempts?: number;
  createdById: string;
  schoolId: string;
}

export interface ParsedTestPreview {
  parseResult: ParseResult;
  patternValidation?: {
    valid: boolean;
    errors: string[];
  };
  estimatedTotalMarks: number;
  totalQuestions: number;
  sectionBreakdown: {
    section: string;
    subject: string;
    startQ: number;
    endQ: number;
    count: number;
    marksPerQuestion: number;
    negativeMarks: number;
    totalMarks: number;
    questionTypes: string[];
  }[];
  questions: ParsedQuestionWithSection[];
  errors?: string[];
}

export interface CreateTestFromParsedDto extends UploadTestDto {
  questions: ParsedQuestion[];
  passages?: {
    id: string;
    title: string;
    passageText: string;
  }[];
  // Marks configuration per section/question type
  marksConfig?: {
    [questionType: string]: {
      marks: number;
      negativeMarks: number;
    };
  };
  // Optional: Save to school question bank
  saveToQuestionBank?: boolean;
  questionBankChapterId?: string;
}

export interface SchoolQuestionBankEntry {
  questionId: string;
  originalParsedQuestion: ParsedQuestion;
}

// ==================== SERVICE ====================

class TestUploadService {
  private uploadsDir: string;

  constructor() {
    this.uploadsDir = path.join(process.cwd(), 'uploads', 'test-papers');
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Step 1: Upload and parse Word file
   */
  async uploadAndParse(
    file: { path: string; originalname: string },
    patternId?: string
  ): Promise<ParsedTestPreview> {
    // Parse the Word document
    let parseResult: ParseResult;
    let patternValidation: { valid: boolean; errors: string[] } | undefined;
    let sectionBreakdown: ParsedTestPreview['sectionBreakdown'] = [];
    let questionsWithSection: ParsedQuestionWithSection[] = [];
    const errors: string[] = [];

    // First, parse the Word document
    parseResult = await wordParserService.parseWordDocument(file.path);

    if (patternId) {
      // Get pattern and apply section assignments
      const pattern = await patternService.getPatternById(patternId);
      if (!pattern) {
        throw new Error('Pattern not found');
      }

      const sections = pattern.sections as unknown as any[];

      // Build section breakdown from pattern
      sectionBreakdown = sections.map(s => {
        // Use explicit questionRange if available, otherwise calculate from questionCount
        const start = s.questionRange?.start || 1;
        const end = s.questionRange?.end || (start + (s.questionCount || 25) - 1);

        return {
          section: s.name,
          subject: s.subjectName || s.subjectCode || 'Unknown',
          startQ: start,
          endQ: end,
          count: end - start + 1,
          marksPerQuestion: s.marksPerQuestion || 4,
          negativeMarks: s.negativeMarks || 0,
          totalMarks: (end - start + 1) * (s.marksPerQuestion || 4),
          questionTypes: s.questionTypes || ['SINGLE_CORRECT'],
        };
      });

      // Assign questions to sections based on question number
      questionsWithSection = parseResult.questions.map(q => {
        const qNum = q.questionNumber;
        const matchingSection = sectionBreakdown.find(
          s => qNum >= s.startQ && qNum <= s.endQ
        );

        if (matchingSection) {
          return {
            ...q,
            section: matchingSection.section,
            subjectName: matchingSection.subject,
            marks: matchingSection.marksPerQuestion,
            negativeMarks: matchingSection.negativeMarks,
          };
        } else {
          errors.push(`Question ${qNum} not in any section range`);
          return { ...q };
        }
      });

      // Validate question counts per section
      for (const section of sectionBreakdown) {
        const sectionQuestions = questionsWithSection.filter(
          q => q.section === section.section
        );
        if (sectionQuestions.length !== section.count) {
          errors.push(
            `${section.section}: Expected ${section.count} questions (Q${section.startQ}-Q${section.endQ}), found ${sectionQuestions.length}`
          );
        }
      }

      patternValidation = {
        valid: errors.length === 0,
        errors,
      };
    } else {
      // No pattern - create simple breakdown by question type
      sectionBreakdown = this.calculateSimpleBreakdown(parseResult.questions);
      // Without pattern, questions don't have section info
      questionsWithSection = parseResult.questions.map(q => ({ ...q }));
    }

    // Calculate estimated total marks
    const estimatedTotalMarks = sectionBreakdown.reduce(
      (sum, section) => sum + section.totalMarks,
      0
    );

    return {
      parseResult,
      patternValidation,
      estimatedTotalMarks,
      totalQuestions: parseResult.questions.length,
      sectionBreakdown,
      questions: questionsWithSection,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Calculate simple breakdown without pattern (by question type)
   */
  private calculateSimpleBreakdown(questions: ParsedQuestion[]): ParsedTestPreview['sectionBreakdown'] {
    const typeMap = new Map<string, ParsedQuestion[]>();

    for (const q of questions) {
      const key = q.questionType || 'SINGLE_CORRECT';
      if (!typeMap.has(key)) {
        typeMap.set(key, []);
      }
      typeMap.get(key)!.push(q);
    }

    return Array.from(typeMap.entries()).map(([type, qs]) => {
      const qNums = qs.map(q => q.questionNumber).sort((a, b) => a - b);
      return {
        section: this.getQuestionTypeName(type),
        subject: 'General',
        startQ: qNums[0] || 1,
        endQ: qNums[qNums.length - 1] || qs.length,
        count: qs.length,
        marksPerQuestion: 4,
        negativeMarks: 1,
        totalMarks: qs.length * 4,
        questionTypes: [type],
      };
    });
  }

  private getDefaultMarks(questionType: string): number {
    const defaults: Record<string, number> = {
      SINGLE_CORRECT: 4,
      MULTIPLE_CORRECT: 4,
      INTEGER_TYPE: 4,
      COMPREHENSION: 4,
      MATRIX_MATCH: 4,
      ASSERTION_REASONING: 4,
    };
    return defaults[questionType] || 4;
  }

  private getQuestionTypeName(type: string): string {
    const names: Record<string, string> = {
      SINGLE_CORRECT: 'Single Correct Answer',
      MULTIPLE_CORRECT: 'Multiple Correct Answers',
      INTEGER_TYPE: 'Integer Type',
      COMPREHENSION: 'Comprehension/Passage Based',
      MATRIX_MATCH: 'Matrix Match',
      ASSERTION_REASONING: 'Assertion & Reasoning',
    };
    return names[type] || type;
  }

  /**
   * Step 2: Create test from parsed questions
   */
  async createTestFromParsed(data: CreateTestFromParsedDto) {
    const {
      questions,
      passages,
      marksConfig,
      saveToQuestionBank,
      questionBankChapterId,
      ...testData
    } = data;

    // Create comprehension passages if any
    const passageIdMap = new Map<string, string>();

    if (passages && passages.length > 0) {
      for (const passage of passages) {
        const dbPassage = await prisma.comprehensionPassage.create({
          data: {
            title: passage.title,
            passageText: passage.passageText,
            subjectId: testData.subjectId,
            chapterId: questionBankChapterId,
            source: 'IMPORTED',
            createdById: testData.createdById,
          },
        });
        passageIdMap.set(passage.id, dbPassage.id);
      }
    }

    // Create questions in database
    const createdQuestions: { id: string; marks: number }[] = [];

    for (const q of questions) {
      const marks = marksConfig?.[q.questionType]?.marks || this.getDefaultMarks(q.questionType);
      const negativeMarks = marksConfig?.[q.questionType]?.negativeMarks || 1;

      // Map passage ID if this is a comprehension question
      const comprehensionPassageId = q.passageId ? passageIdMap.get(q.passageId) : undefined;

      const dbQuestion = await prisma.question.create({
        data: {
          questionText: q.questionText,
          questionHtml: q.questionHtml,
          questionImage: q.questionImage,
          questionType: q.questionType as QuestionType,
          difficulty: 'MEDIUM',
          marks,
          negativeMarks,
          subjectId: testData.subjectId,
          classId: testData.classId,
          chapterId: questionBankChapterId,
          options: q.options.map(opt => ({
            id: opt.id,
            text: opt.text,
            isCorrect: q.correctAnswer === opt.id || q.correctAnswers?.includes(opt.id) || false,
          })),
          correctAnswer: q.correctAnswer,
          correctOptions: q.correctAnswers || [],
          answerExplanation: q.solution,
          comprehensionPassageId,
          matrixData: q.matrixData,
          source: 'IMPORTED' as QuestionSource,
          createdById: testData.createdById,
          isActive: true,
        },
      });

      createdQuestions.push({ id: dbQuestion.id, marks });
    }

    // Calculate total marks
    const totalMarks = createdQuestions.reduce((sum, q) => sum + q.marks, 0);

    // Create the online test
    const test = await prisma.onlineTest.create({
      data: {
        title: testData.testName,
        description: testData.description,
        instructions: testData.instructions,
        testType: 'GRADED',
        subjectId: testData.subjectId,
        classId: testData.classId,
        sectionId: testData.sectionId,
        patternId: testData.patternId,
        totalMarks,
        passingMarks: Math.round(totalMarks * 0.33), // 33% passing
        durationMinutes: testData.durationMinutes,
        totalQuestions: createdQuestions.length,
        startDateTime: testData.startDateTime,
        endDateTime: testData.endDateTime,
        shuffleQuestions: testData.shuffleQuestions ?? true,
        shuffleOptions: testData.shuffleOptions ?? true,
        showResultsImmediately: testData.showResultsImmediately ?? true,
        showCorrectAnswers: false,
        allowReview: true,
        maxAttempts: testData.maxAttempts || 1,
        status: 'DRAFT' as TestStatus,
        createdById: testData.createdById,
        questions: {
          create: createdQuestions.map((q, index) => ({
            questionId: q.id,
            sequenceOrder: index + 1,
            marks: q.marks,
            negativeMarks: marksConfig?.['default']?.negativeMarks || 1,
          })),
        },
      },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        class: { select: { id: true, name: true, code: true } },
        section: { select: { id: true, name: true } },
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
        _count: { select: { questions: true } },
      },
    });

    // Optionally save to school question bank
    let questionBankEntries: SchoolQuestionBankEntry[] = [];
    if (saveToQuestionBank) {
      questionBankEntries = await this.saveToSchoolQuestionBank(
        createdQuestions.map((q, idx) => ({
          questionId: q.id,
          originalParsedQuestion: questions[idx],
        })),
        testData.schoolId,
        testData.subjectId,
        questionBankChapterId
      );
    }

    return {
      test,
      questionsCreated: createdQuestions.length,
      passagesCreated: passageIdMap.size,
      savedToQuestionBank: saveToQuestionBank ? questionBankEntries.length : 0,
    };
  }

  /**
   * Save questions to school's private question bank
   */
  private async saveToSchoolQuestionBank(
    entries: SchoolQuestionBankEntry[],
    schoolId: string,
    subjectId: string,
    chapterId?: string
  ): Promise<SchoolQuestionBankEntry[]> {
    // For now, questions are already in the main Question table
    // This could be extended to create a separate SchoolQuestionBank table
    // or tag questions as belonging to a school's bank

    // We can add a tag or metadata to mark these questions as part of the school's bank
    for (const entry of entries) {
      await prisma.question.update({
        where: { id: entry.questionId },
        data: {
          // Add a tag to identify school's question bank entries
          tags: { push: `school_bank:${schoolId}` },
        },
      });
    }

    return entries;
  }

  /**
   * Get school's question bank
   */
  async getSchoolQuestionBank(
    schoolId: string,
    filters: {
      subjectId?: string;
      chapterId?: string;
      questionType?: string;
      search?: string;
    } = {},
    pagination: { page?: number; limit?: number } = {}
  ) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const where: any = {
      tags: { has: `school_bank:${schoolId}` },
      isActive: true,
    };

    if (filters.subjectId) where.subjectId = filters.subjectId;
    if (filters.chapterId) where.chapterId = filters.chapterId;
    if (filters.questionType) where.questionType = filters.questionType;
    if (filters.search) {
      where.OR = [
        { questionText: { contains: filters.search, mode: 'insensitive' } },
        { chapter: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          subject: { select: { id: true, name: true, code: true } },
          class: { select: { id: true, name: true, code: true } },
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

  /**
   * Edit parsed question before creating test
   */
  async updateParsedQuestion(
    questions: ParsedQuestion[],
    questionId: string,
    updates: Partial<ParsedQuestion>
  ): Promise<ParsedQuestion[]> {
    return questions.map(q => {
      if (q.id === questionId) {
        return { ...q, ...updates };
      }
      return q;
    });
  }

  /**
   * Delete a parsed question from preview
   */
  async deleteParsedQuestion(
    questions: ParsedQuestion[],
    questionId: string
  ): Promise<ParsedQuestion[]> {
    return questions.filter(q => q.id !== questionId);
  }

  /**
   * Get available patterns for test creation
   */
  async getAvailablePatterns(subjectId?: string) {
    return patternService.getPatterns({
      subjectId,
      isActive: true,
    });
  }
}

export const testUploadService = new TestUploadService();
