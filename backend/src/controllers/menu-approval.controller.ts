import { Request, Response } from 'express';
import { menuApprovalService } from '../services/menu-approval.service';

export const menuApprovalController = {
  async getAll(req: Request, res: Response) {
    try {
      const { status, menuId } = req.query;

      const data = await menuApprovalService.getAll({
        status: status as string,
        menuId: menuId as string,
      });

      res.json({ success: true, data: data.data, total: data.total });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const approval = await menuApprovalService.getById(id);

      if (!approval) {
        return res.status(404).json({ success: false, error: 'Menu approval not found' });
      }

      res.json({ success: true, data: approval });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getByMenu(req: Request, res: Response) {
    try {
      const { menuId } = req.params;
      const approval = await menuApprovalService.getByMenu(menuId);

      if (!approval) {
        return res.status(404).json({ success: false, error: 'Menu approval not found' });
      }

      res.json({ success: true, data: approval });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getPending(req: Request, res: Response) {
    try {
      const approvals = await menuApprovalService.getPending();

      res.json({
        success: true,
        data: approvals,
        message: `${approvals.length} menus pending approval`
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async submit(req: Request, res: Response) {
    try {
      const { menuId } = req.body;
      if (!menuId) {
        return res.status(400).json({ success: false, error: 'menuId is required' });
      }

      const submittedBy = req.user?.id;
      if (!submittedBy) {
        return res.status(401).json({ success: false, error: 'User context required' });
      }

      const schoolId = (req as any).schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const approval = await menuApprovalService.submit(menuId, submittedBy, schoolId);

      res.status(201).json({
        success: true,
        data: approval,
        message: 'Menu submitted for approval'
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async approve(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      const approvedBy = req.user?.id;
      if (!approvedBy) {
        return res.status(401).json({ success: false, error: 'User context required' });
      }

      const approval = await menuApprovalService.approve(id, approvedBy, notes);

      res.json({
        success: true,
        data: approval,
        message: '✓ Menu approved and cleared for meal service'
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async reject(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { rejectionReason } = req.body;

      if (!rejectionReason) {
        return res.status(400).json({ success: false, error: 'rejectionReason is required' });
      }

      const approvedBy = req.user?.id;
      if (!approvedBy) {
        return res.status(401).json({ success: false, error: 'User context required' });
      }

      const approval = await menuApprovalService.reject(id, rejectionReason, approvedBy);

      res.json({
        success: true,
        data: approval,
        message: 'Menu rejected and returned for revision'
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async calculateNutrition(req: Request, res: Response) {
    try {
      const { menuId } = req.params;
      const summary = await menuApprovalService.calculateNutritionSummary(menuId);

      res.json({
        success: true,
        data: summary,
        message: 'Nutrition summary calculated'
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async identifyAllergenWarnings(req: Request, res: Response) {
    try {
      const { menuId } = req.params;
      const warnings = await menuApprovalService.identifyAllergenWarnings(menuId);

      res.json({
        success: true,
        data: warnings,
        message: `Found ${warnings.length} allergen warnings`
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * CRITICAL: Check if menu can be served
   * Returns 403 if cannot be served
   */
  async canServe(req: Request, res: Response) {
    try {
      const { menuId } = req.params;
      const result = await menuApprovalService.canServe(menuId);

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
      await menuApprovalService.delete(id);

      res.json({ success: true, message: 'Menu approval deleted' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
