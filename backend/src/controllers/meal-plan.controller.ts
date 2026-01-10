import { Request, Response } from 'express';
import { mealPlanService } from '../services/meal-plan.service';

export const mealPlanController = {
  async create(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const {
        name,
        messId,
        monthlyPrice,
        description,
        annualPrice,
        includeBreakfast,
        includeLunch,
        includeDinner,
        includeSnacks,
      } = req.body;

      if (!name || !messId || !monthlyPrice) {
        return res
          .status(400)
          .json({ success: false, error: 'Name, messId, and monthlyPrice are required' });
      }

      const result = await mealPlanService.create({
        name,
        messId,
        monthlyPrice: parseFloat(monthlyPrice),
        schoolId,
        description,
        annualPrice: annualPrice ? parseFloat(annualPrice) : undefined,
        includeBreakfast,
        includeLunch,
        includeDinner,
        includeSnacks,
      });

      res.status(201).json({
        success: true,
        data: result,
        message: 'Meal plan created successfully',
      });
    } catch (error: any) {
      console.error('Error creating meal plan:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getAll(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      const { messId, isActive } = req.query;

      const result = await mealPlanService.getAll({
        schoolId,
        messId: messId as string,
        isActive: isActive === 'true',
      });

      res.json({ success: true, data: result, total: result.length });
    } catch (error: any) {
      console.error('Error fetching meal plans:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await mealPlanService.getById(id);

      if (!result) {
        return res.status(404).json({ success: false, error: 'Meal plan not found' });
      }

      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('Error fetching meal plan:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      if (updateData.monthlyPrice) {
        updateData.monthlyPrice = parseFloat(updateData.monthlyPrice);
      }
      if (updateData.annualPrice) {
        updateData.annualPrice = parseFloat(updateData.annualPrice);
      }

      const result = await mealPlanService.update(id, updateData);

      res.json({ success: true, data: result, message: 'Meal plan updated successfully' });
    } catch (error: any) {
      console.error('Error updating meal plan:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await mealPlanService.delete(id);

      res.json({ success: true, message: 'Meal plan deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting meal plan:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getByMess(req: Request, res: Response) {
    try {
      const { messId } = req.params;
      const result = await mealPlanService.getByMess(messId);

      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('Error fetching mess meal plans:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
