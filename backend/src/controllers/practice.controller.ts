import { Request, Response } from 'express';
import { practiceMCQService } from '../services/practice-mcq.service';
import { PracticeMode } from '@prisma/client';

// ==================== Book Practice Listing ====================

// GET /practice - Get all books with practice available for student
export const getBooksWithPractice = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const schoolId = user.schoolId;

    // Get studentId from user
    const studentId = user.studentId;
    if (!studentId) {
      return res.status(403).json({
        success: false,
        error: 'Only students can access practice mode',
      });
    }

    const books = await practiceMCQService.getBooksWithPractice(studentId, schoolId);

    res.json({
      success: true,
      data: books,
    });
  } catch (error: any) {
    console.error('Error getting books with practice:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get books',
    });
  }
};

// GET /practice/book/:bookId/stats - Get practice stats for a book
export const getBookPracticeStats = async (req: Request, res: Response) => {
  try {
    const { bookId } = req.params;

    const stats = await practiceMCQService.getBookPracticeStats(bookId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Error getting book practice stats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get stats',
    });
  }
};

// ==================== Session Management ====================

// POST /practice/session/start - Start a new practice session
export const startSession = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const studentId = user.studentId;

    if (!studentId) {
      return res.status(403).json({
        success: false,
        error: 'Only students can start practice sessions',
      });
    }

    const { bookId, mode, questionCount } = req.body;

    if (!bookId || !mode || !questionCount) {
      return res.status(400).json({
        success: false,
        error: 'bookId, mode, and questionCount are required',
      });
    }

    // Validate mode
    if (!['READING', 'TEST'].includes(mode)) {
      return res.status(400).json({
        success: false,
        error: 'mode must be READING or TEST',
      });
    }

    // Validate questionCount
    if (![10, 20, 30, 50].includes(questionCount)) {
      return res.status(400).json({
        success: false,
        error: 'questionCount must be 10, 20, 30, or 50',
      });
    }

    const session = await practiceMCQService.startSession(
      bookId,
      studentId,
      mode as PracticeMode,
      questionCount
    );

    res.json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    console.error('Error starting session:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to start session',
    });
  }
};

// GET /practice/session/:sessionId - Get session details with questions
export const getSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = await practiceMCQService.getSession(sessionId);

    res.json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    console.error('Error getting session:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get session',
    });
  }
};

// POST /practice/session/:sessionId/complete - Complete a session (Test Mode)
export const completeSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = await practiceMCQService.completeSession(sessionId);

    res.json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    console.error('Error completing session:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to complete session',
    });
  }
};

// ==================== Question Operations ====================

// GET /practice/book/:bookId/next - Get next unattempted question (Reading Mode)
export const getNextQuestion = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const studentId = user.studentId;

    if (!studentId) {
      return res.status(403).json({
        success: false,
        error: 'Only students can access practice questions',
      });
    }

    const { bookId } = req.params;

    const question = await practiceMCQService.getNextQuestion(bookId, studentId);

    if (!question) {
      return res.json({
        success: true,
        data: null,
        message: 'All questions have been attempted',
      });
    }

    res.json({
      success: true,
      data: question,
    });
  } catch (error: any) {
    console.error('Error getting next question:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get question',
    });
  }
};

// POST /practice/answer - Submit an answer
export const answerQuestion = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const studentId = user.studentId;

    if (!studentId) {
      return res.status(403).json({
        success: false,
        error: 'Only students can answer practice questions',
      });
    }

    const { questionId, selectedAnswer, timeSpentSeconds, sessionId } = req.body;

    if (!questionId || !selectedAnswer) {
      return res.status(400).json({
        success: false,
        error: 'questionId and selectedAnswer are required',
      });
    }

    const result = await practiceMCQService.answerQuestion(
      questionId,
      studentId,
      selectedAnswer,
      timeSpentSeconds || 0,
      sessionId
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error answering question:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit answer',
    });
  }
};

// ==================== Progress ====================

// GET /practice/book/:bookId/progress - Get student's progress on a book
export const getProgress = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const studentId = user.studentId;

    if (!studentId) {
      return res.status(403).json({
        success: false,
        error: 'Only students can view practice progress',
      });
    }

    const { bookId } = req.params;

    const progress = await practiceMCQService.getStudentProgress(bookId, studentId);

    res.json({
      success: true,
      data: progress,
    });
  } catch (error: any) {
    console.error('Error getting progress:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get progress',
    });
  }
};

// GET /practice/history - Get all practice sessions for student
export const getHistory = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const studentId = user.studentId;

    if (!studentId) {
      return res.status(403).json({
        success: false,
        error: 'Only students can view practice history',
      });
    }

    const { bookId } = req.query;

    const history = await practiceMCQService.getStudentHistory(
      studentId,
      bookId as string | undefined
    );

    res.json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    console.error('Error getting history:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get history',
    });
  }
};

// ==================== Admin: Question Generation ====================

// POST /practice/book/:bookId/generate - Generate new questions (Admin/Teacher)
export const generateQuestions = async (req: Request, res: Response) => {
  try {
    const { bookId } = req.params;
    const { count = 10 } = req.body;

    // Validate count
    const questionCount = Math.min(Math.max(parseInt(count) || 10, 5), 50);

    const result = await practiceMCQService.generateQuestionsFromBook(bookId, questionCount);

    res.json({
      success: true,
      data: result,
      message: `Generated ${result.generated} questions`,
    });
  } catch (error: any) {
    console.error('Error generating questions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate questions',
    });
  }
};

// GET /practice/book/:bookId/questions - List all questions for a book (Admin/Teacher)
export const listQuestions = async (req: Request, res: Response) => {
  try {
    const { bookId } = req.params;
    const { page = '1', limit = '20' } = req.query;

    const result = await practiceMCQService.listQuestions(
      bookId,
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: result.questions,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error('Error listing questions:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list questions',
    });
  }
};
