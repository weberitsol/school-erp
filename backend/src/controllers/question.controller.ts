import { Request, Response, NextFunction } from 'express';
import { questionService, QuestionFilters, PaginationOptions } from '../services/question.service';
import { QuestionType, DifficultyLevel, QuestionSource } from '@prisma/client';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';
    schoolId: string;
  };
}

export const questionController = {
  // Create question
  async createQuestion(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const questionData = {
        ...req.body,
        createdById: req.user!.id,
      };

      const question = await questionService.createQuestion(questionData);

      res.status(201).json({
        success: true,
        message: 'Question created successfully',
        data: question,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all questions
  async getQuestions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const {
        subjectId,
        classId,
        chapter,
        topic,
        questionType,
        difficulty,
        source,
        isVerified,
        isActive,
        tags,
        search,
        page,
        limit,
        sortBy,
        sortOrder,
      } = req.query;

      const filters: QuestionFilters = {
        subjectId: subjectId as string,
        classId: classId as string,
        chapter: chapter as string,
        topic: topic as string,
        questionType: questionType as QuestionType,
        difficulty: difficulty as DifficultyLevel,
        source: source as QuestionSource,
        isVerified: isVerified === 'true' ? true : isVerified === 'false' ? false : undefined,
        isActive: isActive === 'false' ? false : true,
        tags: tags ? (tags as string).split(',') : undefined,
        search: search as string,
      };

      const pagination: PaginationOptions = {
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
        sortBy: (sortBy as string) || 'createdAt',
        sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
      };

      const result = await questionService.getQuestions(filters, pagination);

      res.json({
        success: true,
        data: result.questions,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get question by ID
  async getQuestionById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const question = await questionService.getQuestionById(id);

      if (!question) {
        return res.status(404).json({
          success: false,
          error: 'Question not found',
        });
      }

      res.json({
        success: true,
        data: question,
      });
    } catch (error) {
      next(error);
    }
  },

  // Update question
  async updateQuestion(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const existing = await questionService.getQuestionById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Question not found',
        });
      }

      const question = await questionService.updateQuestion(id, req.body);

      res.json({
        success: true,
        message: 'Question updated successfully',
        data: question,
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete question
  async deleteQuestion(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const existing = await questionService.getQuestionById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Question not found',
        });
      }

      await questionService.deleteQuestion(id);

      res.json({
        success: true,
        message: 'Question deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Verify question
  async verifyQuestion(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { isVerified } = req.body;

      const question = await questionService.verifyQuestion(
        id,
        req.user!.id,
        isVerified ?? true
      );

      res.json({
        success: true,
        message: isVerified ? 'Question verified' : 'Question unverified',
        data: question,
      });
    } catch (error) {
      next(error);
    }
  },

  // Bulk create questions
  async bulkCreateQuestions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { questions } = req.body;

      if (!questions || !Array.isArray(questions)) {
        return res.status(400).json({
          success: false,
          error: 'Questions array is required',
        });
      }

      const questionsWithCreator = questions.map((q: any) => ({
        ...q,
        createdById: req.user!.id,
      }));

      const result = await questionService.bulkCreateQuestions(questionsWithCreator);

      res.status(201).json({
        success: true,
        message: `${result.success.length} questions created successfully`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get random questions (for test generation)
  async getRandomQuestions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const {
        subjectId,
        classId,
        count,
        questionTypes,
        difficulties,
        chapters,
        excludeIds,
      } = req.body;

      if (!subjectId || !count) {
        return res.status(400).json({
          success: false,
          error: 'subjectId and count are required',
        });
      }

      const questions = await questionService.getRandomQuestions({
        subjectId,
        classId,
        count: parseInt(count, 10),
        questionTypes,
        difficulties,
        chapters,
        excludeIds,
      });

      res.json({
        success: true,
        data: questions,
        count: questions.length,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get question stats
  async getQuestionStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { subjectId } = req.query;
      const stats = await questionService.getQuestionStats(subjectId as string);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get chapters and topics
  async getChaptersAndTopics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { subjectId } = req.params;
      const result = await questionService.getChaptersAndTopics(subjectId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // Patch question (partial update for difficulty, topic, etc.)
  async patchQuestion(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { difficulty, topic, subTopic, chapter, questionType, tags } = req.body;

      const existing = await questionService.getQuestionById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'Question not found',
        });
      }

      // Only update allowed fields
      const updateData: any = {};
      if (difficulty !== undefined) updateData.difficulty = difficulty;
      if (topic !== undefined) updateData.topic = topic;
      if (subTopic !== undefined) updateData.topic = subTopic; // Map subTopic to topic for backward compat
      if (chapter !== undefined) updateData.chapter = chapter;
      if (questionType !== undefined) updateData.questionType = questionType;
      if (tags !== undefined) updateData.tags = tags;

      const question = await questionService.updateQuestion(id, updateData);

      res.json({
        success: true,
        message: 'Question updated successfully',
        data: question,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get alternative questions for replacement
  async getAlternatives(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { questionId, subjectId, classId, questionType, difficulty, excludeIds } = req.body;

      if (!questionId) {
        return res.status(400).json({
          success: false,
          error: 'questionId is required',
        });
      }

      const alternatives = await questionService.getAlternativeQuestions({
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
};
