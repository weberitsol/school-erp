import { Request, Response } from 'express';
import { advancedFeaturesService } from '../services/advanced-features.service';

class AdvancedFeaturesController {
  // Get student analytics
  async getStudentAnalytics(req: Request, res: Response) {
    try {
      const { studentId } = req.params;

      const analytics = await advancedFeaturesService.getStudentAnalytics(studentId);

      res.json({
        success: true,
        data: analytics,
        message: 'Student analytics fetched successfully',
      });
    } catch (error: any) {
      res.status(error.message === 'Student not found' ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to fetch analytics',
      });
    }
  }

  // Get learning insights
  async getLearningInsights(req: Request, res: Response) {
    try {
      const { studentId } = req.params;

      const insights = await advancedFeaturesService.generateLearningInsights(studentId);

      res.json({
        success: true,
        data: insights,
        message: 'Learning insights generated successfully',
      });
    } catch (error: any) {
      res.status(error.message === 'Student not found' ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to generate insights',
      });
    }
  }

  // Get engagement metrics
  async getEngagementMetrics(req: Request, res: Response) {
    try {
      const { studentId } = req.params;

      const metrics = await advancedFeaturesService.getEngagementMetrics(studentId);

      res.json({
        success: true,
        data: metrics,
        message: 'Engagement metrics fetched successfully',
      });
    } catch (error: any) {
      res.status(error.message === 'Student not found' ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to fetch metrics',
      });
    }
  }

  // Get personalized recommendations
  async getRecommendations(req: Request, res: Response) {
    try {
      const { studentId } = req.params;

      const recommendations = await advancedFeaturesService.getPersonalizedRecommendations(
        studentId
      );

      res.json({
        success: true,
        data: recommendations,
        message: 'Personalized recommendations generated successfully',
      });
    } catch (error: any) {
      res.status(error.message === 'Student not found' ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to generate recommendations',
      });
    }
  }

  // Get learning dashboard
  async getLearningDashboard(req: Request, res: Response) {
    try {
      const { studentId } = req.params;

      const dashboard = await advancedFeaturesService.getLearningDashboard(studentId);

      res.json({
        success: true,
        data: dashboard,
        message: 'Learning dashboard fetched successfully',
      });
    } catch (error: any) {
      res.status(error.message === 'Student not found' ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to fetch dashboard',
      });
    }
  }

  // Get class analytics
  async getClassAnalytics(req: Request, res: Response) {
    try {
      const { classId } = req.params;

      const classAnalytics = await advancedFeaturesService.getClassAnalytics(classId);

      res.json({
        success: true,
        data: classAnalytics,
        message: 'Class analytics fetched successfully',
      });
    } catch (error: any) {
      res.status(error.message === 'Class not found' ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to fetch class analytics',
      });
    }
  }
}

export const advancedFeaturesController = new AdvancedFeaturesController();
