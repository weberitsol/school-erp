import { Request, Response } from 'express';
import { chapterService, passageService } from '../services/chapter.service';

class ChapterController {
  // Get all chapters
  async getAllChapters(req: Request, res: Response) {
    try {
      const { subjectId } = req.query;

      let chapters;
      if (subjectId) {
        chapters = await chapterService.getChaptersBySubject(subjectId as string);
      } else {
        chapters = await chapterService.getAllChapters();
      }

      res.json({
        success: true,
        data: chapters,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch chapters',
      });
    }
  }

  // Create chapter
  async createChapter(req: Request, res: Response) {
    try {
      const chapter = await chapterService.createChapter(req.body);
      res.status(201).json({
        success: true,
        message: 'Chapter created successfully',
        data: chapter,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create chapter',
      });
    }
  }

  // Bulk create chapters
  async bulkCreateChapters(req: Request, res: Response) {
    try {
      const { chapters } = req.body;

      if (!Array.isArray(chapters) || chapters.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Chapters array is required',
        });
      }

      const result = await chapterService.bulkCreateChapters(chapters);
      res.status(201).json({
        success: true,
        message: `Created ${result.success.length} chapters, ${result.failed.length} failed`,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create chapters',
      });
    }
  }

  // Get chapters by subject
  async getChaptersBySubject(req: Request, res: Response) {
    try {
      const { subjectId } = req.params;
      const { classLevel } = req.query;

      const chapters = await chapterService.getChaptersBySubject(
        subjectId,
        classLevel as string
      );

      res.json({
        success: true,
        data: chapters,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch chapters',
      });
    }
  }

  // Get chapter by ID
  async getChapterById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const chapter = await chapterService.getChapterById(id);

      if (!chapter) {
        return res.status(404).json({
          success: false,
          message: 'Chapter not found',
        });
      }

      res.json({
        success: true,
        data: chapter,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch chapter',
      });
    }
  }

  // Update chapter
  async updateChapter(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const chapter = await chapterService.updateChapter(id, req.body);

      res.json({
        success: true,
        message: 'Chapter updated successfully',
        data: chapter,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update chapter',
      });
    }
  }

  // Delete chapter
  async deleteChapter(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await chapterService.deleteChapter(id);

      res.json({
        success: true,
        message: 'Chapter deleted successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to delete chapter',
      });
    }
  }

  // Get chapter stats
  async getChapterStats(req: Request, res: Response) {
    try {
      const { subjectId } = req.params;
      const stats = await chapterService.getChapterStats(subjectId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch chapter stats',
      });
    }
  }
}

class PassageController {
  // Create passage
  async createPassage(req: Request, res: Response) {
    try {
      const data = {
        ...req.body,
        createdById: req.user?.id || '',
      };

      const passage = await passageService.createPassage(data);
      res.status(201).json({
        success: true,
        message: 'Passage created successfully',
        data: passage,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create passage',
      });
    }
  }

  // Get passages
  async getPassages(req: Request, res: Response) {
    try {
      const { subjectId, chapterId } = req.query;

      const passages = await passageService.getPassages({
        subjectId: subjectId as string,
        chapterId: chapterId as string,
      });

      res.json({
        success: true,
        data: passages,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch passages',
      });
    }
  }

  // Get passage by ID
  async getPassageById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const passage = await passageService.getPassageById(id);

      if (!passage) {
        return res.status(404).json({
          success: false,
          message: 'Passage not found',
        });
      }

      res.json({
        success: true,
        data: passage,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch passage',
      });
    }
  }

  // Update passage
  async updatePassage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const passage = await passageService.updatePassage(id, req.body);

      res.json({
        success: true,
        message: 'Passage updated successfully',
        data: passage,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update passage',
      });
    }
  }

  // Delete passage
  async deletePassage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await passageService.deletePassage(id);

      res.json({
        success: true,
        message: 'Passage deleted successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to delete passage',
      });
    }
  }
}

export const chapterController = new ChapterController();
export const passageController = new PassageController();
