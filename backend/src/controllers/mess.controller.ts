import { Request, Response } from 'express';
import { messService } from '../services/mess.service';

export const messController = {
  async create(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { name, code, capacity, description, location, manager, contactPhone, contactEmail } =
        req.body;

      if (!name || !code || !capacity) {
        return res
          .status(400)
          .json({ success: false, error: 'Name, code, and capacity are required' });
      }

      const result = await messService.create({
        name,
        code,
        capacity,
        schoolId,
        description,
        location,
        manager,
        contactPhone,
        contactEmail,
      });

      res.status(201).json({
        success: true,
        data: result,
        message: 'Mess created successfully',
      });
    } catch (error: any) {
      console.error('Error creating mess:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getAll(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      const { search, page = 0, limit = 10 } = req.query;

      const result = await messService.getAll(
        { schoolId, search: search as string },
        { page: parseInt(page as string), limit: parseInt(limit as string) }
      );

      res.json({ success: true, data: result.data, total: result.total });
    } catch (error: any) {
      console.error('Error fetching messes:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await messService.getById(id);

      if (!result) {
        return res.status(404).json({ success: false, error: 'Mess not found' });
      }

      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('Error fetching mess:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getStatistics(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const stats = await messService.getStatistics(id);

      res.json({ success: true, data: stats });
    } catch (error: any) {
      console.error('Error fetching statistics:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, capacity, description, location, manager, contactPhone, contactEmail, isActive } =
        req.body;

      const result = await messService.update(id, {
        name,
        capacity,
        description,
        location,
        manager,
        contactPhone,
        contactEmail,
        isActive,
      });

      res.json({ success: true, data: result, message: 'Mess updated successfully' });
    } catch (error: any) {
      console.error('Error updating mess:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await messService.delete(id);

      res.json({ success: true, message: 'Mess deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting mess:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
