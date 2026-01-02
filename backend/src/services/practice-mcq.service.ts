import { PrismaClient, PracticeDifficulty, PracticeMode, PracticeQuestionStatus } from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Time per question based on difficulty (in seconds)
const TIME_BY_DIFFICULTY: Record<PracticeDifficulty, number> = {
  EASY: 60,
  MEDIUM: 90,
  HARD: 120,
};

// Maximum percentage of questions attempted before suggesting to generate more
const GENERATE_MORE_THRESHOLD = 0.8;

// Maximum content length for AI prompt
const MAX_CONTENT_LENGTH = 4000;

export interface PracticeQuestionOption {
  id: string;
  text: string;
}

export interface GeneratedQuestion {
  questionText: string;
  options: PracticeQuestionOption[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

export interface PracticeProgress {
  bookId: string;
  totalQuestions: number;
  attemptedQuestions: number;
  correctAnswers: number;
  accuracyPercentage: number;
  byDifficulty: {
    easy: { total: number; attempted: number; correct: number };
    medium: { total: number; attempted: number; correct: number };
    hard: { total: number; attempted: number; correct: number };
  };
  shouldGenerateMore: boolean;
}

export interface BookPracticeStats {
  totalQuestions: number;
  byDifficulty: { easy: number; medium: number; hard: number };
  isIndexed: boolean;
  canGenerateMore: boolean;
}

export interface AnswerResult {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
}

class PracticeMCQService {
  // Check if AI service is available
  isAvailable(): boolean {
    const key = process.env.ANTHROPIC_API_KEY || '';
    return key.length > 20 && key.startsWith('sk-ant-');
  }

  // ==================== AI Question Generation ====================

  // Generate practice questions from book content
  async generateQuestionsFromBook(
    bookId: string,
    count: number = 10
  ): Promise<{ generated: number; questions: any[] }> {
    // Get book with text content
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: {
        id: true,
        title: true,
        author: true,
        textContent: true,
        isIndexed: true,
        subject: { select: { name: true } },
      },
    });

    if (!book) {
      throw new Error('Book not found');
    }

    if (!book.isIndexed || !book.textContent) {
      throw new Error('Book must be indexed before generating practice questions');
    }

    if (!this.isAvailable()) {
      throw new Error('AI service is not available');
    }

    // Chunk the text content
    const chunks = this.chunkText(book.textContent, MAX_CONTENT_LENGTH);
    const questionsPerChunk = Math.ceil(count / Math.max(chunks.length, 1));

    const allQuestions: any[] = [];
    const batchId = crypto.randomUUID();

    // Generate questions from each chunk until we have enough
    for (let i = 0; i < chunks.length && allQuestions.length < count; i++) {
      const remaining = count - allQuestions.length;
      const toGenerate = Math.min(questionsPerChunk, remaining);

      try {
        const generated = await this.generateQuestionsWithAI(
          book.title,
          book.subject?.name || 'General',
          chunks[i].text,
          toGenerate
        );

        // Store questions in database
        for (const q of generated) {
          const savedQuestion = await prisma.practiceQuestion.create({
            data: {
              bookId: book.id,
              questionText: q.questionText,
              options: q.options as any,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
              difficulty: q.difficulty as PracticeDifficulty,
              timeSeconds: TIME_BY_DIFFICULTY[q.difficulty as PracticeDifficulty],
              sourcePageStart: chunks[i].pageStart,
              sourcePageEnd: chunks[i].pageEnd,
              sourceChunk: chunks[i].text.substring(0, 500),
              batchId,
              confidence: 0.85,
            },
          });
          allQuestions.push(savedQuestion);
        }
      } catch (error) {
        console.error(`Error generating questions from chunk ${i}:`, error);
        // Continue with other chunks
      }
    }

    return {
      generated: allQuestions.length,
      questions: allQuestions,
    };
  }

  // Generate questions using Claude AI
  private async generateQuestionsWithAI(
    bookTitle: string,
    subjectName: string,
    content: string,
    count: number
  ): Promise<GeneratedQuestion[]> {
    const prompt = `Generate ${count} multiple choice questions from this educational content.

Book: ${bookTitle}
Subject: ${subjectName}

Content:
${content}

For each question, provide:
1. A clear question text
2. Exactly 4 options labeled a, b, c, d
3. The correct answer (a, b, c, or d)
4. A brief but helpful explanation
5. Difficulty: EASY (basic recall/definitions), MEDIUM (application/understanding), or HARD (analysis/synthesis)

Ensure questions:
- Test understanding, not just memorization
- Have unambiguous correct answers
- Have plausible distractors (wrong options)
- Cover different aspects of the content

Return as valid JSON array (nothing else):
[{
  "questionText": "...",
  "options": [
    {"id": "a", "text": "..."},
    {"id": "b", "text": "..."},
    {"id": "c", "text": "..."},
    {"id": "d", "text": "..."}
  ],
  "correctAnswer": "a",
  "explanation": "...",
  "difficulty": "MEDIUM"
}]`;

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    });

    const contentBlock = response.content[0];
    if (contentBlock.type !== 'text') {
      throw new Error('Unexpected response type from AI');
    }

    // Parse JSON response
    try {
      const jsonMatch = contentBlock.text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse AI response:', contentBlock.text);
    }

    throw new Error('Failed to parse AI-generated questions');
  }

  // Chunk text into smaller segments
  private chunkText(text: string, maxLength: number): { text: string; pageStart?: number; pageEnd?: number }[] {
    const chunks: { text: string; pageStart?: number; pageEnd?: number }[] = [];

    // Split by paragraphs first
    const paragraphs = text.split(/\n\n+/);
    let currentChunk = '';

    for (const para of paragraphs) {
      if ((currentChunk + para).length > maxLength) {
        if (currentChunk.trim()) {
          chunks.push({ text: currentChunk.trim() });
        }
        currentChunk = para;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + para;
      }
    }

    if (currentChunk.trim()) {
      chunks.push({ text: currentChunk.trim() });
    }

    return chunks;
  }

  // Check if more questions should be generated
  async shouldGenerateMore(bookId: string, studentId: string): Promise<boolean> {
    const [totalQuestions, attemptedCount] = await Promise.all([
      prisma.practiceQuestion.count({
        where: { bookId, status: 'ACTIVE' },
      }),
      prisma.practiceAttempt.count({
        where: {
          studentId,
          question: { bookId },
        },
      }),
    ]);

    if (totalQuestions === 0) return true;
    return attemptedCount / totalQuestions >= GENERATE_MORE_THRESHOLD;
  }

  // ==================== Session Management ====================

  // Start a new practice session
  async startSession(
    bookId: string,
    studentId: string,
    mode: PracticeMode,
    questionCount: number
  ): Promise<any> {
    // Get available questions for this book
    // Prioritize unattempted questions, then incorrect ones
    const attemptedQuestionIds = await prisma.practiceAttempt.findMany({
      where: { studentId, question: { bookId } },
      select: { questionId: true },
    }).then(attempts => attempts.map(a => a.questionId));

    // Get unattempted questions first
    const unattempted = await prisma.practiceQuestion.findMany({
      where: {
        bookId,
        status: 'ACTIVE',
        id: { notIn: attemptedQuestionIds },
      },
      orderBy: { createdAt: 'desc' },
    });

    // If not enough, get all questions
    let selectedQuestions = unattempted.slice(0, questionCount);

    if (selectedQuestions.length < questionCount) {
      const remaining = questionCount - selectedQuestions.length;
      const additional = await prisma.practiceQuestion.findMany({
        where: {
          bookId,
          status: 'ACTIVE',
          id: { in: attemptedQuestionIds },
        },
        orderBy: { createdAt: 'desc' },
        take: remaining,
      });
      selectedQuestions = [...selectedQuestions, ...additional];
    }

    // Shuffle questions
    selectedQuestions = this.shuffleArray(selectedQuestions);

    // Calculate total time
    const totalTimeSeconds = selectedQuestions.reduce(
      (sum, q) => sum + q.timeSeconds,
      0
    );

    // Create session
    const session = await prisma.practiceSession.create({
      data: {
        bookId,
        studentId,
        mode,
        questionCount: selectedQuestions.length,
        totalQuestions: selectedQuestions.length,
        totalTimeSeconds: mode === 'TEST' ? totalTimeSeconds : null,
        questionOrder: selectedQuestions.map(q => q.id),
      },
      include: {
        book: {
          select: { id: true, title: true, coverImage: true },
        },
      },
    });

    return {
      ...session,
      questions: selectedQuestions.map(q => ({
        id: q.id,
        questionText: q.questionText,
        questionHtml: q.questionHtml,
        options: q.options,
        difficulty: q.difficulty,
        timeSeconds: q.timeSeconds,
        // Don't include correctAnswer or explanation until answered
      })),
    };
  }

  // Get session details with questions
  async getSession(sessionId: string): Promise<any> {
    const session = await prisma.practiceSession.findUnique({
      where: { id: sessionId },
      include: {
        book: {
          select: { id: true, title: true, coverImage: true },
        },
        attempts: {
          include: {
            question: true,
          },
        },
      },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // Get questions in order
    const questionIds = session.questionOrder as string[];
    const questions = await prisma.practiceQuestion.findMany({
      where: { id: { in: questionIds } },
    });

    // Sort by order
    const sortedQuestions = questionIds.map(id =>
      questions.find(q => q.id === id)
    ).filter(Boolean);

    // Create a map of attempts for quick lookup
    const attemptMap = new Map(
      session.attempts.map(a => [a.questionId, a])
    );

    return {
      ...session,
      questions: sortedQuestions.map(q => {
        const attempt = attemptMap.get(q!.id);
        const base = {
          id: q!.id,
          questionText: q!.questionText,
          questionHtml: q!.questionHtml,
          options: q!.options,
          difficulty: q!.difficulty,
          timeSeconds: q!.timeSeconds,
        };

        // Include answer details if already attempted or session is completed
        if (attempt || session.completedAt) {
          return {
            ...base,
            correctAnswer: q!.correctAnswer,
            explanation: q!.explanation,
            selectedAnswer: attempt?.selectedAnswer,
            isCorrect: attempt?.isCorrect,
          };
        }

        return base;
      }),
    };
  }

  // Complete a session (for Test Mode)
  async completeSession(sessionId: string): Promise<any> {
    const session = await prisma.practiceSession.findUnique({
      where: { id: sessionId },
      include: {
        attempts: true,
      },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.completedAt) {
      throw new Error('Session already completed');
    }

    // Calculate score
    const correctCount = session.attempts.filter(a => a.isCorrect).length;

    // Update session
    const updatedSession = await prisma.practiceSession.update({
      where: { id: sessionId },
      data: {
        completedAt: new Date(),
        score: correctCount,
      },
      include: {
        book: {
          select: { id: true, title: true, coverImage: true },
        },
      },
    });

    return updatedSession;
  }

  // ==================== Question Operations ====================

  // Get next unattempted question for Reading Mode
  async getNextQuestion(bookId: string, studentId: string): Promise<any> {
    // Get IDs of questions already attempted
    const attemptedIds = await prisma.practiceAttempt.findMany({
      where: {
        studentId,
        question: { bookId },
      },
      select: { questionId: true },
    }).then(attempts => attempts.map(a => a.questionId));

    // Find next unattempted question
    const question = await prisma.practiceQuestion.findFirst({
      where: {
        bookId,
        status: 'ACTIVE',
        id: { notIn: attemptedIds },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!question) {
      return null; // All questions attempted
    }

    return {
      id: question.id,
      questionText: question.questionText,
      questionHtml: question.questionHtml,
      options: question.options,
      difficulty: question.difficulty,
      timeSeconds: question.timeSeconds,
    };
  }

  // Answer a question
  async answerQuestion(
    questionId: string,
    studentId: string,
    selectedAnswer: string,
    timeSpentSeconds: number,
    sessionId?: string
  ): Promise<AnswerResult> {
    // Get the question
    const question = await prisma.practiceQuestion.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new Error('Question not found');
    }

    const isCorrect = question.correctAnswer.toLowerCase() === selectedAnswer.toLowerCase();

    // Create or update attempt
    await prisma.practiceAttempt.upsert({
      where: {
        questionId_studentId_sessionId: {
          questionId,
          studentId,
          sessionId: sessionId || '',
        },
      },
      create: {
        questionId,
        studentId,
        selectedAnswer,
        isCorrect,
        timeSpentSeconds,
        sessionId: sessionId || null,
      },
      update: {
        selectedAnswer,
        isCorrect,
        timeSpentSeconds,
        attemptedAt: new Date(),
      },
    });

    return {
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation || 'No explanation available.',
    };
  }

  // ==================== Progress Tracking ====================

  // Get student's progress for a book
  async getStudentProgress(bookId: string, studentId: string): Promise<PracticeProgress> {
    // Get all questions for the book
    const questions = await prisma.practiceQuestion.findMany({
      where: { bookId, status: 'ACTIVE' },
      select: { id: true, difficulty: true },
    });

    // Get student's attempts
    const attempts = await prisma.practiceAttempt.findMany({
      where: {
        studentId,
        question: { bookId },
      },
      include: {
        question: { select: { difficulty: true } },
      },
    });

    // Calculate stats
    const totalQuestions = questions.length;
    const attemptedQuestions = new Set(attempts.map(a => a.questionId)).size;
    const correctAnswers = attempts.filter(a => a.isCorrect).length;
    const accuracyPercentage = attemptedQuestions > 0
      ? (correctAnswers / attemptedQuestions) * 100
      : 0;

    // Stats by difficulty
    const byDifficulty = {
      easy: { total: 0, attempted: 0, correct: 0 },
      medium: { total: 0, attempted: 0, correct: 0 },
      hard: { total: 0, attempted: 0, correct: 0 },
    };

    // Count total by difficulty
    questions.forEach(q => {
      const key = q.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard';
      byDifficulty[key].total++;
    });

    // Count attempted and correct by difficulty
    const attemptedQuestionIds = new Set<string>();
    attempts.forEach(a => {
      if (!attemptedQuestionIds.has(a.questionId)) {
        attemptedQuestionIds.add(a.questionId);
        const key = a.question.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard';
        byDifficulty[key].attempted++;
      }
      if (a.isCorrect) {
        const key = a.question.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard';
        byDifficulty[key].correct++;
      }
    });

    const shouldGenerateMore = totalQuestions === 0 ||
      attemptedQuestions / totalQuestions >= GENERATE_MORE_THRESHOLD;

    return {
      bookId,
      totalQuestions,
      attemptedQuestions,
      correctAnswers,
      accuracyPercentage: Math.round(accuracyPercentage * 100) / 100,
      byDifficulty,
      shouldGenerateMore,
    };
  }

  // Get student's practice history
  async getStudentHistory(studentId: string, bookId?: string): Promise<any[]> {
    const where: any = { studentId };
    if (bookId) {
      where.bookId = bookId;
    }

    return prisma.practiceSession.findMany({
      where,
      include: {
        book: {
          select: { id: true, title: true, coverImage: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ==================== Book Practice Status ====================

  // Get books with practice questions available for student
  async getBooksWithPractice(studentId: string, schoolId: string): Promise<any[]> {
    // Get student's class info for access control
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        currentClassId: true,
        currentSectionId: true,
      },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Get books with practice questions or indexed books
    const books = await prisma.book.findMany({
      where: {
        schoolId,
        isActive: true,
        status: 'PUBLISHED',
        OR: [
          { practiceQuestions: { some: { status: 'ACTIVE' } } },
          { isIndexed: true },
        ],
        // Access control
        ...(student.currentClassId && {
          bookAccess: {
            some: {
              classId: student.currentClassId,
              OR: [
                { sectionId: null },
                { sectionId: student.currentSectionId || undefined },
              ],
            },
          },
        }),
      },
      include: {
        subject: { select: { name: true } },
        _count: {
          select: { practiceQuestions: true },
        },
      },
    });

    // Get student's progress for each book
    const booksWithProgress = await Promise.all(
      books.map(async (book) => {
        const progress = await this.getStudentProgress(book.id, studentId);
        return {
          id: book.id,
          title: book.title,
          coverImage: book.coverImage,
          subject: book.subject?.name,
          isIndexed: book.isIndexed,
          totalQuestions: book._count.practiceQuestions,
          progress,
        };
      })
    );

    return booksWithProgress;
  }

  // Get practice stats for a specific book
  async getBookPracticeStats(bookId: string): Promise<BookPracticeStats> {
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: { isIndexed: true, textContent: true },
    });

    if (!book) {
      throw new Error('Book not found');
    }

    const questions = await prisma.practiceQuestion.findMany({
      where: { bookId, status: 'ACTIVE' },
      select: { difficulty: true },
    });

    const byDifficulty = { easy: 0, medium: 0, hard: 0 };
    questions.forEach(q => {
      const key = q.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard';
      byDifficulty[key]++;
    });

    return {
      totalQuestions: questions.length,
      byDifficulty,
      isIndexed: book.isIndexed,
      canGenerateMore: book.isIndexed && !!book.textContent && this.isAvailable(),
    };
  }

  // List all questions for a book (admin/teacher view)
  async listQuestions(bookId: string, page = 1, limit = 20): Promise<any> {
    const skip = (page - 1) * limit;

    const [questions, total] = await Promise.all([
      prisma.practiceQuestion.findMany({
        where: { bookId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.practiceQuestion.count({ where: { bookId } }),
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

  // Helper: Shuffle array
  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

export const practiceMCQService = new PracticeMCQService();
