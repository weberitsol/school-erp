import { Request, Response } from 'express';
import { feedbackService, CreateFeedbackData } from '@/services/feedback.service';
import { feedbackActionService, CreateFeedbackActionData } from '@/services/feedback-action.service';

export const feedbackController = {
  /**
   * Create new feedback
   */
  async createFeedback(req: Request, res: Response) {
    try {
      const { mealId, rating, comments } = req.body;
      const schoolId = req.user?.schoolId;
      const studentId = req.user?.id;

      if (!mealId || !rating) {
        return res.status(400).json({
          message: 'Meal ID and rating are required',
        });
      }

      if (!schoolId || !studentId) {
        return res.status(401).json({
          message: 'Authentication required',
        });
      }

      const data: CreateFeedbackData = {
        mealId,
        studentId,
        schoolId,
        rating,
        comments,
      };

      const feedback = await feedbackService.createFeedback(data);

      res.status(201).json({
        message: 'Feedback created successfully',
        data: feedback,
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || 'Failed to create feedback',
      });
    }
  },

  /**
   * Get all feedback
   */
  async getFeedback(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      const { mealId, studentId, rating, skip, take } = req.query;

      if (!schoolId) {
        return res.status(401).json({
          message: 'Authentication required',
        });
      }

      const feedback = await feedbackService.getFeedback({
        schoolId,
        mealId: mealId as string,
        studentId: studentId as string,
        rating: rating as any,
        skip: skip ? parseInt(skip as string) : undefined,
        take: take ? parseInt(take as string) : undefined,
      });

      res.status(200).json({
        message: 'Feedback retrieved successfully',
        data: feedback.data,
        total: feedback.total,
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || 'Failed to fetch feedback',
      });
    }
  },

  /**
   * Get feedback by ID
   */
  async getFeedbackById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const feedback = await feedbackService.getFeedbackById(id);

      res.status(200).json({
        message: 'Feedback retrieved successfully',
        data: feedback,
      });
    } catch (error: any) {
      res.status(404).json({
        message: error.message || 'Feedback not found',
      });
    }
  },

  /**
   * Update feedback
   */
  async updateFeedback(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { rating, comments } = req.body;

      const feedback = await feedbackService.updateFeedback(id, {
        rating,
        comments,
      });

      res.status(200).json({
        message: 'Feedback updated successfully',
        data: feedback,
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || 'Failed to update feedback',
      });
    }
  },

  /**
   * Delete feedback
   */
  async deleteFeedback(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await feedbackService.deleteFeedback(id);

      res.status(200).json({
        message: 'Feedback deleted successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || 'Failed to delete feedback',
      });
    }
  },

  /**
   * Get meal feedback stats
   */
  async getMealFeedbackStats(req: Request, res: Response) {
    try {
      const { mealId } = req.params;

      const stats = await feedbackService.getMealFeedbackStats(mealId);

      res.status(200).json({
        message: 'Feedback stats retrieved successfully',
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || 'Failed to fetch feedback stats',
      });
    }
  },

  /**
   * Get school feedback stats
   */
  async getSchoolFeedbackStats(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;

      if (!schoolId) {
        return res.status(401).json({
          message: 'Authentication required',
        });
      }

      const stats = await feedbackService.getSchoolFeedbackStats(schoolId);

      res.status(200).json({
        message: 'School feedback stats retrieved successfully',
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || 'Failed to fetch school feedback stats',
      });
    }
  },

  /**
   * Get recent feedback
   */
  async getRecentFeedback(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      const { limit } = req.query;

      if (!schoolId) {
        return res.status(401).json({
          message: 'Authentication required',
        });
      }

      const feedback = await feedbackService.getRecentFeedback(
        schoolId,
        limit ? parseInt(limit as string) : 10
      );

      res.status(200).json({
        message: 'Recent feedback retrieved successfully',
        data: feedback,
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || 'Failed to fetch recent feedback',
      });
    }
  },

  /**
   * Get student feedback
   */
  async getStudentFeedback(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      const studentId = req.user?.id;

      if (!schoolId || !studentId) {
        return res.status(401).json({
          message: 'Authentication required',
        });
      }

      const feedback = await feedbackService.getStudentFeedback(studentId, schoolId);

      res.status(200).json({
        message: 'Student feedback retrieved successfully',
        data: feedback,
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || 'Failed to fetch student feedback',
      });
    }
  },

  /**
   * Create feedback action
   */
  async createFeedbackAction(req: Request, res: Response) {
    try {
      const { feedbackId, actionDescription, actionDate } = req.body;
      const schoolId = req.user?.schoolId;

      if (!feedbackId || !actionDescription || !actionDate) {
        return res.status(400).json({
          message: 'Feedback ID, action description, and action date are required',
        });
      }

      if (!schoolId) {
        return res.status(401).json({
          message: 'Authentication required',
        });
      }

      const data: CreateFeedbackActionData = {
        feedbackId,
        schoolId,
        actionDescription,
        actionDate: new Date(actionDate),
      };

      const action = await feedbackActionService.createAction(data);

      res.status(201).json({
        message: 'Feedback action created successfully',
        data: action,
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || 'Failed to create feedback action',
      });
    }
  },

  /**
   * Get feedback actions
   */
  async getFeedbackActions(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      const { feedbackId, status, skip, take } = req.query;

      if (!schoolId) {
        return res.status(401).json({
          message: 'Authentication required',
        });
      }

      const actions = await feedbackActionService.getActions({
        schoolId,
        feedbackId: feedbackId as string,
        status: status as string,
        skip: skip ? parseInt(skip as string) : undefined,
        take: take ? parseInt(take as string) : undefined,
      });

      res.status(200).json({
        message: 'Feedback actions retrieved successfully',
        data: actions.data,
        total: actions.total,
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || 'Failed to fetch feedback actions',
      });
    }
  },

  /**
   * Update feedback action
   */
  async updateFeedbackAction(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { actionDescription, actionDate, status, completionDate } = req.body;

      const action = await feedbackActionService.updateAction(id, {
        actionDescription,
        actionDate: actionDate ? new Date(actionDate) : undefined,
        status,
        completionDate: completionDate ? new Date(completionDate) : undefined,
      });

      res.status(200).json({
        message: 'Feedback action updated successfully',
        data: action,
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || 'Failed to update feedback action',
      });
    }
  },

  /**
   * Complete feedback action
   */
  async completeFeedbackAction(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const action = await feedbackActionService.completeAction(id);

      res.status(200).json({
        message: 'Feedback action completed successfully',
        data: action,
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || 'Failed to complete feedback action',
      });
    }
  },

  /**
   * Get open actions
   */
  async getOpenActions(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;

      if (!schoolId) {
        return res.status(401).json({
          message: 'Authentication required',
        });
      }

      const actions = await feedbackActionService.getOpenActions(schoolId);

      res.status(200).json({
        message: 'Open actions retrieved successfully',
        data: actions,
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || 'Failed to fetch open actions',
      });
    }
  },

  /**
   * Get action stats
   */
  async getActionStats(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;

      if (!schoolId) {
        return res.status(401).json({
          message: 'Authentication required',
        });
      }

      const stats = await feedbackActionService.getActionStats(schoolId);

      res.status(200).json({
        message: 'Action stats retrieved successfully',
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || 'Failed to fetch action stats',
      });
    }
  },
};
