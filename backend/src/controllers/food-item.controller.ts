import { Request, Response } from 'express';
import { foodItemService } from '../services/food-item.service';

export const foodItemController = {
  async create(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { name, category, costPerUnit, unit, description, allergenIds } = req.body;

      if (!name || !category || !costPerUnit || !unit) {
        return res.status(400).json({
          success: false,
          error: 'Name, category, costPerUnit, and unit are required',
        });
      }

      const result = await foodItemService.create({
        name,
        category,
        costPerUnit: parseFloat(costPerUnit),
        unit,
        schoolId,
        description,
        allergenIds: allergenIds || [],
      });

      res.status(201).json({
        success: true,
        data: result,
        message: 'Food item created successfully',
      });
    } catch (error: any) {
      console.error('Error creating food item:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getAll(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      const { category, search, isActive } = req.query;

      const result = await foodItemService.getAll({
        schoolId: schoolId!,
        category: category as string,
        search: search as string,
        isActive: isActive === 'true',
      });

      res.json({ success: true, data: result, total: result.length });
    } catch (error: any) {
      console.error('Error fetching food items:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await foodItemService.getById(id);

      if (!result) {
        return res.status(404).json({ success: false, error: 'Food item not found' });
      }

      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('Error fetching food item:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      if (updateData.costPerUnit) {
        updateData.costPerUnit = parseFloat(updateData.costPerUnit);
      }

      const result = await foodItemService.update(id, updateData);

      res.json({ success: true, data: result, message: 'Food item updated successfully' });
    } catch (error: any) {
      console.error('Error updating food item:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await foodItemService.delete(id);

      res.json({ success: true, message: 'Food item deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting food item:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getByCategory(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      const { category } = req.params;

      const result = await foodItemService.getByCategory(schoolId!, category);

      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('Error fetching items by category:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
