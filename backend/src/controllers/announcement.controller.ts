import { Request, Response } from 'express';
import { announcementService } from '../services/announcement.service';

class AnnouncementController {
  // GET /announcements - List all announcements
  async getAll(req: Request, res: Response) {
    try {
      const filters = {
        schoolId: (req as any).user?.schoolId,
        search: req.query.search,
        isPublished: req.query.isPublished === 'true',
        targetAudience: req.query.targetAudience,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      };

      const { data, total } = await announcementService.getAll(filters);

      res.json({
        success: true,
        data,
        pagination: {
          total,
          page: filters.page,
          limit: filters.limit,
          pages: Math.ceil(total / filters.limit),
        },
        message: 'Announcements fetched successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch announcements',
      });
    }
  }

  // GET /announcements/active - Get active announcements
  async getActive(req: Request, res: Response) {
    try {
      const filters = {
        schoolId: (req as any).user?.schoolId,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      };

      const { data, total } = await announcementService.getActiveAnnouncements(filters);

      res.json({
        success: true,
        data,
        pagination: {
          total,
          page: filters.page,
          limit: filters.limit,
          pages: Math.ceil(total / filters.limit),
        },
        message: 'Active announcements fetched successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch active announcements',
      });
    }
  }

  // GET /announcements/audience/:audience - Get announcements for specific audience
  async getByAudience(req: Request, res: Response) {
    try {
      const { audience } = req.params;
      const schoolId = (req as any).user?.schoolId;

      if (!schoolId) {
        return res.status(401).json({
          success: false,
          error: 'School ID not found in request',
        });
      }

      const filters = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      };

      const { data, total } = await announcementService.getAnnouncementsByAudience(
        schoolId,
        audience,
        filters
      );

      res.json({
        success: true,
        data,
        pagination: {
          total,
          page: filters.page,
          limit: filters.limit,
          pages: Math.ceil(total / filters.limit),
        },
        message: `Announcements fetched for audience: ${audience}`,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to fetch announcements',
      });
    }
  }

  // GET /announcements/:id - Get announcement by ID
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const announcement = await announcementService.getById(id);

      res.json({
        success: true,
        data: announcement,
        message: 'Announcement fetched successfully',
      });
    } catch (error: any) {
      res.status(error.message === 'Announcement not found' ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to fetch announcement',
      });
    }
  }

  // POST /announcements - Create new announcement
  async create(req: Request, res: Response) {
    try {
      const { title, content, targetAudience, targetClasses, attachments, expiresAt } = req.body;

      // Validate required fields
      if (!title || !content || !targetAudience || !Array.isArray(targetAudience)) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: title, content, targetAudience (array)',
        });
      }

      const schoolId = (req as any).user?.schoolId;
      const userId = (req as any).user?.id;

      if (!schoolId || !userId) {
        return res.status(401).json({
          success: false,
          error: 'School ID or User ID not found in request',
        });
      }

      const announcement = await announcementService.createAnnouncement(
        {
          title,
          content,
          schoolId,
          targetAudience,
          targetClasses,
          attachments,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        },
        userId
      );

      res.status(201).json({
        success: true,
        data: announcement,
        message: 'Announcement created successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create announcement',
      });
    }
  }

  // PUT /announcements/:id - Update announcement
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { title, content, targetAudience, targetClasses, attachments, expiresAt } = req.body;

      const announcement = await announcementService.updateAnnouncement(id, {
        title,
        content,
        targetAudience,
        targetClasses,
        attachments,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      });

      res.json({
        success: true,
        data: announcement,
        message: 'Announcement updated successfully',
      });
    } catch (error: any) {
      res.status(error.message === 'Announcement not found' ? 404 : 400).json({
        success: false,
        error: error.message || 'Failed to update announcement',
      });
    }
  }

  // POST /announcements/:id/publish - Publish announcement
  async publish(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const announcement = await announcementService.publishAnnouncement(id);

      res.json({
        success: true,
        data: announcement,
        message: 'Announcement published successfully',
      });
    } catch (error: any) {
      res.status(error.message === 'Announcement not found' ? 404 : 400).json({
        success: false,
        error: error.message || 'Failed to publish announcement',
      });
    }
  }

  // DELETE /announcements/:id - Delete announcement
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await announcementService.deleteAnnouncement(id);

      res.json({
        success: true,
        data: result,
        message: 'Announcement deleted successfully',
      });
    } catch (error: any) {
      res.status(error.message === 'Announcement not found' ? 404 : 400).json({
        success: false,
        error: error.message || 'Failed to delete announcement',
      });
    }
  }

  // GET /announcements/stats - Get announcement statistics
  async getStats(req: Request, res: Response) {
    try {
      const schoolId = (req as any).user?.schoolId;
      const stats = await announcementService.getAnnouncementStats(schoolId);

      res.json({
        success: true,
        data: stats,
        message: 'Announcement statistics fetched successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch statistics',
      });
    }
  }
}

export const announcementController = new AnnouncementController();
