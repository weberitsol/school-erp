import { Request, Response } from 'express';
import { resultAnalysisService } from '../services/result-analysis.service';
import { aiDoubtService } from '../services/ai-doubt.service';
import { youtubeService } from '../services/youtube.service';

class ResultController {
  // GET /results/:attemptId/analysis - Get detailed analysis
  async getDetailedAnalysis(req: Request, res: Response) {
    try {
      const { attemptId } = req.params;
      const analysis = await resultAnalysisService.getDetailedAnalysis(attemptId);

      res.json({
        success: true,
        data: analysis,
      });
    } catch (error: any) {
      res.status(error.message === 'Attempt not found' ? 404 : 500).json({
        success: false,
        message: error.message || 'Failed to fetch analysis',
      });
    }
  }

  // GET /results/:attemptId/comparison - Get comparison stats
  async getComparisonStats(req: Request, res: Response) {
    try {
      const { attemptId } = req.params;
      const comparison = await resultAnalysisService.getComparisonStats(attemptId);

      res.json({
        success: true,
        data: comparison,
      });
    } catch (error: any) {
      res.status(error.message === 'Attempt not found' ? 404 : 500).json({
        success: false,
        message: error.message || 'Failed to fetch comparison stats',
      });
    }
  }

  // GET /results/:attemptId/insights - Get performance insights
  async getPerformanceInsights(req: Request, res: Response) {
    try {
      const { attemptId } = req.params;
      const insights = await resultAnalysisService.getPerformanceInsights(attemptId);

      res.json({
        success: true,
        data: insights,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch insights',
      });
    }
  }

  // GET /results/question/:questionId/insights - Get question insights
  async getQuestionInsights(req: Request, res: Response) {
    try {
      const { questionId } = req.params;
      const insights = await resultAnalysisService.getQuestionInsights(questionId);

      res.json({
        success: true,
        data: insights,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch question insights',
      });
    }
  }

  // GET /results/student/:studentId/weak-areas - Get weak areas for a student in a subject
  async getSubjectWeakAreas(req: Request, res: Response) {
    try {
      const { studentId } = req.params;
      const { subjectId } = req.query;

      if (!subjectId) {
        return res.status(400).json({
          success: false,
          message: 'subjectId query parameter is required',
        });
      }

      const weakAreas = await resultAnalysisService.getSubjectWeakAreas(
        studentId,
        subjectId as string
      );

      res.json({
        success: true,
        data: weakAreas,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch weak areas',
      });
    }
  }

  // POST /results/question/:questionId/explain - AI explanation for a question
  async explainQuestion(req: Request, res: Response) {
    try {
      const { questionId } = req.params;
      const { query } = req.body;

      const explanation = await aiDoubtService.explainQuestion(questionId, query);

      res.json({
        success: true,
        data: explanation,
        aiAvailable: aiDoubtService.isAvailable(),
      });
    } catch (error: any) {
      res.status(error.message === 'Question not found' ? 404 : 500).json({
        success: false,
        message: error.message || 'Failed to generate explanation',
      });
    }
  }

  // GET /results/question/:questionId/shortcuts - Get shortcuts/tricks
  async getShortcutsTricks(req: Request, res: Response) {
    try {
      const { questionId } = req.params;
      const shortcuts = await aiDoubtService.getShortcutsTricks(questionId);

      res.json({
        success: true,
        data: shortcuts,
        aiAvailable: aiDoubtService.isAvailable(),
      });
    } catch (error: any) {
      res.status(error.message === 'Question not found' ? 404 : 500).json({
        success: false,
        message: error.message || 'Failed to generate shortcuts',
      });
    }
  }

  // GET /results/question/:questionId/similar - Get similar questions
  async getSimilarQuestions(req: Request, res: Response) {
    try {
      const { questionId } = req.params;
      const { limit } = req.query;

      const similarQuestions = await aiDoubtService.getSimilarQuestions(
        questionId,
        limit ? parseInt(limit as string) : 5
      );

      res.json({
        success: true,
        data: similarQuestions,
      });
    } catch (error: any) {
      res.status(error.message === 'Question not found' ? 404 : 500).json({
        success: false,
        message: error.message || 'Failed to fetch similar questions',
      });
    }
  }

  // POST /results/question/:questionId/analyze-wrong - Analyze wrong answer
  async analyzeWrongAnswer(req: Request, res: Response) {
    try {
      const { questionId } = req.params;
      const { selectedAnswer, correctAnswer } = req.body;

      if (!selectedAnswer || !correctAnswer) {
        return res.status(400).json({
          success: false,
          message: 'selectedAnswer and correctAnswer are required',
        });
      }

      const analysis = await aiDoubtService.analyzeWrongAnswer(
        questionId,
        selectedAnswer,
        correctAnswer
      );

      res.json({
        success: true,
        data: analysis,
        aiAvailable: aiDoubtService.isAvailable(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to analyze answer',
      });
    }
  }

  // GET /results/question/:questionId/videos - Get YouTube videos
  async getQuestionVideos(req: Request, res: Response) {
    try {
      const { questionId } = req.params;
      const videos = await youtubeService.getRecommendedVideos(questionId);

      res.json({
        success: true,
        data: {
          videos,
          channels: youtubeService.getCuratedChannels(),
        },
        apiAvailable: youtubeService.isAvailable(),
      });
    } catch (error: any) {
      res.status(error.message === 'Question not found' ? 404 : 500).json({
        success: false,
        message: error.message || 'Failed to fetch videos',
      });
    }
  }

  // GET /results/videos/search - Search YouTube videos
  async searchVideos(req: Request, res: Response) {
    try {
      const { query, maxResults, language } = req.query;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'query parameter is required',
        });
      }

      const videos = await youtubeService.searchVideos({
        query: query as string,
        maxResults: maxResults ? parseInt(maxResults as string) : 5,
        language: language as string,
      });

      res.json({
        success: true,
        data: videos,
        apiAvailable: youtubeService.isAvailable(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to search videos',
      });
    }
  }

  // GET /results/videos/topics - Get videos by topic
  async getVideosByTopic(req: Request, res: Response) {
    try {
      const { subject, chapter, topic } = req.query;

      if (!subject) {
        return res.status(400).json({
          success: false,
          message: 'subject parameter is required',
        });
      }

      const videos = await youtubeService.getVideosByTopic(
        subject as string,
        chapter as string,
        topic as string
      );

      res.json({
        success: true,
        data: videos,
        apiAvailable: youtubeService.isAvailable(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch topic videos',
      });
    }
  }

  // GET /results/channels - Get curated channels
  getCuratedChannels(req: Request, res: Response) {
    res.json({
      success: true,
      data: youtubeService.getCuratedChannels(),
    });
  }
}

export const resultController = new ResultController();
