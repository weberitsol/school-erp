import { Request, Response } from 'express';
import { assessmentReasonService } from '../services/assessment-reason.service';

export const assessmentReasonController = {
  async create(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { name, code, description } = req.body;

      if (!name || !code) {
        return res.status(400).json({ success: false, error: 'Name and code are required' });
      }

      // Check if code already exists
      const existing = await assessmentReasonService.getAssessmentReasonByCode(code, schoolId);
      if (existing) {
        return res.status(400).json({ success: false, error: 'Assessment reason code already exists' });
      }

      const reason = await assessmentReasonService.createAssessmentReason({
        name,
        code,
        description,
        schoolId,
      });

      res.status(201).json({ success: true, data: reason, message: 'Assessment reason created successfully' });
    } catch (error: any) {
      console.error('Error creating assessment reason:', error);
      if (error.code === 'P2002') {
        return res.status(400).json({ success: false, error: 'Assessment reason code already exists' });
      }
      res.status(500).json({ success: false, error: 'Failed to create assessment reason' });
    }
  },

  async getAll(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { search, isActive } = req.query;

      const reasons = await assessmentReasonService.getAssessmentReasons({
        schoolId,
        search: search as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      });

      res.json({ success: true, data: reasons });
    } catch (error) {
      console.error('Error fetching assessment reasons:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch assessment reasons' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id } = req.params;
      const reason = await assessmentReasonService.getAssessmentReasonById(id, schoolId);

      if (!reason) {
        return res.status(404).json({ success: false, error: 'Assessment reason not found' });
      }

      res.json({ success: true, data: reason });
    } catch (error) {
      console.error('Error fetching assessment reason:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch assessment reason' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id } = req.params;
      const { name, code, description, isActive } = req.body;

      // Check if reason exists
      const existing = await assessmentReasonService.getAssessmentReasonById(id, schoolId);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Assessment reason not found' });
      }

      // Check if code is being changed and if new code already exists
      if (code && code.toUpperCase() !== existing.code) {
        const codeExists = await assessmentReasonService.getAssessmentReasonByCode(code, schoolId);
        if (codeExists) {
          return res.status(400).json({ success: false, error: 'Assessment reason code already exists' });
        }
      }

      const reason = await assessmentReasonService.updateAssessmentReason(id, schoolId, {
        name,
        code,
        description,
        isActive,
      });

      res.json({ success: true, data: reason, message: 'Assessment reason updated successfully' });
    } catch (error: any) {
      console.error('Error updating assessment reason:', error);
      if (error.code === 'P2002') {
        return res.status(400).json({ success: false, error: 'Assessment reason code already exists' });
      }
      res.status(500).json({ success: false, error: 'Failed to update assessment reason' });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id } = req.params;

      // Check if reason exists
      const existing = await assessmentReasonService.getAssessmentReasonById(id, schoolId);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Assessment reason not found' });
      }

      await assessmentReasonService.deleteAssessmentReason(id, schoolId);

      res.json({ success: true, message: 'Assessment reason deleted successfully' });
    } catch (error) {
      console.error('Error deleting assessment reason:', error);
      res.status(500).json({ success: false, error: 'Failed to delete assessment reason' });
    }
  },
};
