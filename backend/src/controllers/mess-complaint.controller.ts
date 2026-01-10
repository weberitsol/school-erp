import { Request, Response } from 'express';
import { messComplaintService, CreateComplaintData } from '@/services/mess-complaint.service';

export const messComplaintController = {
  /**
   * Create new complaint
   */
  async createComplaint(req: Request, res: Response) {
    try {
      const { title, description, category } = req.body;
      const schoolId = req.user?.schoolId;
      const studentId = req.user?.id;

      if (!title || !description) {
        return res.status(400).json({
          message: 'Title and description are required',
        });
      }

      if (!schoolId || !studentId) {
        return res.status(401).json({
          message: 'Authentication required',
        });
      }

      const data: CreateComplaintData = {
        studentId,
        schoolId,
        title,
        description,
        category,
      };

      const complaint = await messComplaintService.createComplaint(data);

      res.status(201).json({
        message: 'Complaint created successfully',
        data: complaint,
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || 'Failed to create complaint',
      });
    }
  },

  /**
   * Get all complaints
   */
  async getComplaints(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      const { status, category, studentId, skip, take } = req.query;

      if (!schoolId) {
        return res.status(401).json({
          message: 'Authentication required',
        });
      }

      const complaints = await messComplaintService.getComplaints({
        schoolId,
        status: status as any,
        category: category as string,
        studentId: studentId as string,
        skip: skip ? parseInt(skip as string) : undefined,
        take: take ? parseInt(take as string) : undefined,
      });

      res.status(200).json({
        message: 'Complaints retrieved successfully',
        data: complaints.data,
        total: complaints.total,
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || 'Failed to fetch complaints',
      });
    }
  },

  /**
   * Get complaint by ID
   */
  async getComplaintById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const complaint = await messComplaintService.getComplaintById(id);

      res.status(200).json({
        message: 'Complaint retrieved successfully',
        data: complaint,
      });
    } catch (error: any) {
      res.status(404).json({
        message: error.message || 'Complaint not found',
      });
    }
  },

  /**
   * Update complaint
   */
  async updateComplaint(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { title, description, category, status, resolutionNotes, resolutionDate } = req.body;

      const complaint = await messComplaintService.updateComplaint(id, {
        title,
        description,
        category,
        status,
        resolutionNotes,
        resolutionDate: resolutionDate ? new Date(resolutionDate) : undefined,
      });

      res.status(200).json({
        message: 'Complaint updated successfully',
        data: complaint,
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || 'Failed to update complaint',
      });
    }
  },

  /**
   * Update complaint status
   */
  async updateComplaintStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, resolutionNotes } = req.body;

      if (!status) {
        return res.status(400).json({
          message: 'Status is required',
        });
      }

      const complaint = await messComplaintService.updateComplaintStatus(
        id,
        status,
        resolutionNotes
      );

      res.status(200).json({
        message: 'Complaint status updated successfully',
        data: complaint,
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || 'Failed to update complaint status',
      });
    }
  },

  /**
   * Delete complaint
   */
  async deleteComplaint(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await messComplaintService.deleteComplaint(id);

      res.status(200).json({
        message: 'Complaint deleted successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || 'Failed to delete complaint',
      });
    }
  },

  /**
   * Get open complaints
   */
  async getOpenComplaints(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      const { category, skip, take } = req.query;

      if (!schoolId) {
        return res.status(401).json({
          message: 'Authentication required',
        });
      }

      const complaints = await messComplaintService.getOpenComplaints(schoolId, {
        category: category as string,
        skip: skip ? parseInt(skip as string) : undefined,
        take: take ? parseInt(take as string) : undefined,
      });

      res.status(200).json({
        message: 'Open complaints retrieved successfully',
        data: complaints.data,
        total: complaints.total,
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || 'Failed to fetch open complaints',
      });
    }
  },

  /**
   * Get complaints by category
   */
  async getComplaintsByCategory(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      const { category } = req.params;

      if (!schoolId) {
        return res.status(401).json({
          message: 'Authentication required',
        });
      }

      const complaints = await messComplaintService.getComplaintsByCategory(
        schoolId,
        category
      );

      res.status(200).json({
        message: 'Complaints retrieved successfully',
        data: complaints,
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || 'Failed to fetch complaints',
      });
    }
  },

  /**
   * Get student complaints
   */
  async getStudentComplaints(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      const studentId = req.user?.id;

      if (!schoolId || !studentId) {
        return res.status(401).json({
          message: 'Authentication required',
        });
      }

      const complaints = await messComplaintService.getStudentComplaints(
        studentId,
        schoolId
      );

      res.status(200).json({
        message: 'Student complaints retrieved successfully',
        data: complaints,
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || 'Failed to fetch student complaints',
      });
    }
  },

  /**
   * Get complaint categories
   */
  async getCategories(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;

      if (!schoolId) {
        return res.status(401).json({
          message: 'Authentication required',
        });
      }

      const categories = await messComplaintService.getCategories(schoolId);

      res.status(200).json({
        message: 'Categories retrieved successfully',
        data: categories,
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || 'Failed to fetch categories',
      });
    }
  },

  /**
   * Get complaint stats
   */
  async getComplaintStats(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;

      if (!schoolId) {
        return res.status(401).json({
          message: 'Authentication required',
        });
      }

      const stats = await messComplaintService.getComplaintStats(schoolId);

      res.status(200).json({
        message: 'Complaint stats retrieved successfully',
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || 'Failed to fetch complaint stats',
      });
    }
  },

  /**
   * Get complaint summary
   */
  async getComplaintSummary(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;

      if (!schoolId) {
        return res.status(401).json({
          message: 'Authentication required',
        });
      }

      const summary = await messComplaintService.getComplaintSummary(schoolId);

      res.status(200).json({
        message: 'Complaint summary retrieved successfully',
        data: summary,
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || 'Failed to fetch complaint summary',
      });
    }
  },
};
