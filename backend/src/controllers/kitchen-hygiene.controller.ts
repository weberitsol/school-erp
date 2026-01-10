import { Request, Response } from 'express';
import { kitchenHygieneService } from '../services/kitchen-hygiene.service';

/**
 * ⚠️ CRITICAL CONTROLLER
 * Kitchen hygiene checks must be passed before meal service.
 * Minimum score: 50/100
 */

export const kitchenHygieneController = {
  async getAll(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) return res.status(401).json({ success: false, error: 'School context required' });

      const { messId, status, startDate, endDate } = req.query;

      const data = await kitchenHygieneService.getAll({
        messId: messId as string,
        status: status as string,
        schoolId,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      res.json({ success: true, data: data.data, total: data.total });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const checklist = await kitchenHygieneService.getById(id);

      if (!checklist) {
        return res.status(404).json({ success: false, error: 'Hygiene checklist not found' });
      }

      res.json({ success: true, data: checklist });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getTodayCheck(req: Request, res: Response) {
    try {
      const { messId } = req.params;
      const checklist = await kitchenHygieneService.getTodayCheck(messId);

      if (!checklist) {
        return res.status(404).json({
          success: false,
          error: 'No hygiene check completed today for this mess'
        });
      }

      res.json({ success: true, data: checklist });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) return res.status(401).json({ success: false, error: 'School context required' });

      const {
        messId,
        checkDate,
        inspectorName,
        inspectorSignature,
        cleanlinessScore,
        temperatureControlScore,
        equipmentMaintenanceScore,
        storageConditionsScore,
        waterQualityScore,
        wasteManagementScore,
        staffHygieneScore,
        staffLunchAssistantScore,
      } = req.body;

      if (!messId || !checkDate || !inspectorName) {
        return res.status(400).json({
          success: false,
          error: 'messId, checkDate, and inspectorName are required'
        });
      }

      const checklist = await kitchenHygieneService.create({
        messId,
        checkDate: new Date(checkDate),
        inspectorName,
        inspectorSignature,
        cleanlinessScore,
        temperatureControlScore,
        equipmentMaintenanceScore,
        storageConditionsScore,
        waterQualityScore,
        wasteManagementScore,
        staffHygieneScore,
        staffLunchAssistantScore,
        schoolId,
        issuesIdentified: req.body.issuesIdentified,
        correctionDeadline: req.body.correctionDeadline,
        correctionStatus: req.body.correctionStatus,
        photosUrl: req.body.photosUrl,
      });

      const statusMessage = checklist.status === 'PASS'
        ? '✓ Check passed - Meal service APPROVED'
        : '⚠️ Check FAILED - Score below 25/50 - Meal service BLOCKED';

      res.status(201).json({
        success: true,
        data: checklist,
        message: statusMessage,
        score: checklist.overallScore,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const checklist = await kitchenHygieneService.update(id, req.body);

      res.json({
        success: true,
        data: checklist,
        message: `Checklist updated - Status: ${checklist.status}`
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async recordCorrection(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { correction } = req.body;

      if (!correction) {
        return res.status(400).json({ success: false, error: 'correction is required' });
      }

      const checklist = await kitchenHygieneService.recordCorrection(id, correction);

      res.json({
        success: true,
        data: checklist,
        message: 'Correction recorded'
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getComplianceReport(req: Request, res: Response) {
    try {
      const { messId } = req.params;
      const months = parseInt(req.query.months as string) || 3;

      const report = await kitchenHygieneService.getComplianceReport(messId, months);

      res.json({
        success: true,
        data: report,
        message: `Compliance Report (${months} months) - Trend: ${report.trend}`
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * CRITICAL: Check if meal service can proceed
   * Returns 403 if meals cannot be served
   */
  async canServeMeals(req: Request, res: Response) {
    try {
      const { messId } = req.params;
      const result = await kitchenHygieneService.canServeMeals(messId);

      if (!result.allowed) {
        return res.status(403).json({
          success: false,
          error: result.reason,
          allowed: false
        });
      }

      res.json({
        success: true,
        data: { allowed: true },
        message: result.reason
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await kitchenHygieneService.delete(id);

      res.json({ success: true, message: 'Hygiene checklist deleted' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
