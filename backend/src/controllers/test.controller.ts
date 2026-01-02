import { Request, Response, NextFunction } from 'express';
import { testService, TestFilters } from '../services/test.service';
import { TestStatus } from '@prisma/client';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';
    schoolId: string;
  };
}

export const testController = {
  // Create test
  async createTest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const testData = {
        ...req.body,
        createdById: req.user!.id,
        // Map frontend field names to backend expected names
        durationMinutes: Number(req.body.duration) || Number(req.body.durationMinutes) || 60,
        totalQuestions: req.body.questionIds?.length || 0,
        startDateTime: req.body.startTime ? new Date(req.body.startTime) : undefined,
        endDateTime: req.body.endTime ? new Date(req.body.endTime) : undefined,
      };

      const test = await testService.createTest(testData);

      res.status(201).json({
        success: true,
        message: 'Test created successfully',
        data: test,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all tests
  async getTests(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { subjectId, classId, status, search, page, limit } = req.query;

      const filters: TestFilters = {
        subjectId: subjectId as string,
        classId: classId as string,
        status: status as TestStatus,
        search: search as string,
        // Teachers see only their own tests
        ...(req.user?.role === 'TEACHER' && { createdById: req.user.id }),
      };

      const pagination = {
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10,
      };

      const result = await testService.getTests(filters, pagination);

      res.json({
        success: true,
        data: result.tests,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get test by ID
  async getTestById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const includeAnswers =
        req.user?.role === 'ADMIN' ||
        req.user?.role === 'SUPER_ADMIN' ||
        req.user?.role === 'TEACHER';

      const test = await testService.getTestById(id, includeAnswers);

      if (!test) {
        return res.status(404).json({
          success: false,
          error: 'Test not found',
        });
      }

      res.json({
        success: true,
        data: test,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get available tests for student
  async getAvailableTests(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Get student ID from user or param
      const { studentId } = req.params;

      const tests = await testService.getAvailableTestsForStudent(studentId);

      res.json({
        success: true,
        data: tests,
      });
    } catch (error) {
      next(error);
    }
  },

  // Start test attempt
  async startTest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { testId, studentId } = req.body;

      if (!testId || !studentId) {
        return res.status(400).json({
          success: false,
          error: 'testId and studentId are required',
        });
      }

      const attempt = await testService.startTestAttempt(testId, studentId);

      res.json({
        success: true,
        message: 'Test started',
        data: attempt,
      });
    } catch (error: any) {
      if (error.message.includes('Maximum attempts')) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }
      next(error);
    }
  },

  // Save response (auto-save)
  async saveResponse(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { attemptId, questionId, selectedAnswer, textAnswer } = req.body;

      await testService.saveResponse(
        attemptId,
        questionId,
        selectedAnswer,
        textAnswer
      );

      res.json({
        success: true,
        message: 'Response saved',
      });
    } catch (error) {
      next(error);
    }
  },

  // Submit test
  async submitTest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { attemptId, responses } = req.body;

      if (!attemptId || !responses) {
        return res.status(400).json({
          success: false,
          error: 'attemptId and responses are required',
        });
      }

      const result = await testService.submitTest({ attemptId, responses });

      res.json({
        success: true,
        message: 'Test submitted successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get attempt by ID
  async getAttempt(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const attempt = await testService.getAttemptById(id);

      if (!attempt) {
        return res.status(404).json({
          success: false,
          error: 'Attempt not found',
        });
      }

      res.json({
        success: true,
        data: attempt,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get student attempts
  async getStudentAttempts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { studentId } = req.params;
      const { testId } = req.query;

      const attempts = await testService.getStudentAttempts(
        studentId,
        testId as string
      );

      res.json({
        success: true,
        data: attempts,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get test analytics
  async getTestAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const analytics = await testService.getTestAnalytics(id);

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  },

  // Publish test
  async publishTest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const test = await testService.publishTest(id);

      res.json({
        success: true,
        message: 'Test published successfully',
        data: test,
      });
    } catch (error) {
      next(error);
    }
  },

  // Close test
  async closeTest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const test = await testService.closeTest(id);

      res.json({
        success: true,
        message: 'Test closed successfully',
        data: test,
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete test
  async deleteTest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await testService.deleteTest(id);

      res.json({
        success: true,
        message: 'Test deleted successfully',
      });
    } catch (error: any) {
      if (error.message.includes('Cannot delete')) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }
      next(error);
    }
  },

  // Duplicate test
  async duplicateTest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { title } = req.body;

      if (!title) {
        return res.status(400).json({
          success: false,
          error: 'New test title is required',
        });
      }

      const test = await testService.duplicateTest(id, title, req.user!.id);

      res.status(201).json({
        success: true,
        message: 'Test duplicated successfully',
        data: test,
      });
    } catch (error) {
      next(error);
    }
  },

  // Assign test to class/section
  async assignTest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { classId, sectionId } = req.body;

      const test = await testService.assignTest(id, classId, sectionId);

      res.json({
        success: true,
        message: 'Test assigned successfully',
        data: test,
      });
    } catch (error) {
      next(error);
    }
  },

  // Remove question from test
  async removeQuestion(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id, questionId } = req.params;
      const result = await testService.removeQuestionFromTest(id, questionId);

      res.json({
        success: true,
        message: 'Question removed from test',
        data: result,
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }
      next(error);
    }
  },

  // Replace question in test
  async replaceQuestion(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id, questionId } = req.params;
      const { newQuestionId } = req.body;

      if (!newQuestionId) {
        return res.status(400).json({
          success: false,
          error: 'New question ID is required',
        });
      }

      const result = await testService.replaceQuestionInTest(id, questionId, newQuestionId);

      res.json({
        success: true,
        message: 'Question replaced successfully',
        data: result,
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }
      next(error);
    }
  },

  // Get alternative questions
  async getAlternatives(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { questionId, subjectId, classId, questionType, difficulty, excludeIds } = req.body;

      const alternatives = await testService.getAlternativeQuestions({
        questionId,
        subjectId,
        classId,
        questionType,
        difficulty,
        excludeIds: excludeIds || [],
        limit: 10,
      });

      res.json({
        success: true,
        data: alternatives,
      });
    } catch (error) {
      next(error);
    }
  },

  // Export test template for Excel
  async exportTemplate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await testService.exportTestTemplate(id);

      // Set headers for JSON download (frontend will convert to Excel)
      res.json({
        success: true,
        data: data,
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }
      next(error);
    }
  },

  // Verify answers with AI (placeholder - needs AI integration)
  async verifyAnswers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // TODO: Integrate with AI service (e.g., Anthropic) to verify answers
      // For now, return a placeholder response
      res.json({
        success: true,
        message: 'AI verification feature - requires AI service integration',
        data: {},
      });
    } catch (error) {
      next(error);
    }
  },

  // Generate AI explanations (placeholder - needs AI integration)
  async generateExplanations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // TODO: Integrate with AI service to generate explanations
      // For now, return a placeholder response
      res.json({
        success: true,
        message: 'AI explanation generation - requires AI service integration',
      });
    } catch (error) {
      next(error);
    }
  },
};
