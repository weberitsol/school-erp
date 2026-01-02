import { Request, Response } from 'express';
import { branchService } from '../services/branch.service';

export const branchController = {
  async create(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { name, code, address, city, state, pincode, phone, email } = req.body;

      if (!name || !code) {
        return res.status(400).json({ success: false, error: 'Name and code are required' });
      }

      // Check if code already exists
      const existing = await branchService.getBranchByCode(code, schoolId);
      if (existing) {
        return res.status(400).json({ success: false, error: 'Branch code already exists' });
      }

      const branch = await branchService.createBranch({
        name,
        code,
        address,
        city,
        state,
        pincode,
        phone,
        email,
        schoolId,
      });

      res.status(201).json({ success: true, data: branch, message: 'Branch created successfully' });
    } catch (error: any) {
      console.error('Error creating branch:', error);
      if (error.code === 'P2002') {
        return res.status(400).json({ success: false, error: 'Branch code already exists' });
      }
      res.status(500).json({ success: false, error: 'Failed to create branch' });
    }
  },

  async getAll(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { search, isActive } = req.query;

      const branches = await branchService.getBranches({
        schoolId,
        search: search as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      });

      res.json({ success: true, data: branches });
    } catch (error) {
      console.error('Error fetching branches:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch branches' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id } = req.params;
      const branch = await branchService.getBranchById(id, schoolId);

      if (!branch) {
        return res.status(404).json({ success: false, error: 'Branch not found' });
      }

      res.json({ success: true, data: branch });
    } catch (error) {
      console.error('Error fetching branch:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch branch' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id } = req.params;
      const { name, code, address, city, state, pincode, phone, email, isActive } = req.body;

      // Check if branch exists
      const existing = await branchService.getBranchById(id, schoolId);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Branch not found' });
      }

      // Check if code is being changed and if new code already exists
      if (code && code.toUpperCase() !== existing.code) {
        const codeExists = await branchService.getBranchByCode(code, schoolId);
        if (codeExists) {
          return res.status(400).json({ success: false, error: 'Branch code already exists' });
        }
      }

      const branch = await branchService.updateBranch(id, schoolId, {
        name,
        code,
        address,
        city,
        state,
        pincode,
        phone,
        email,
        isActive,
      });

      res.json({ success: true, data: branch, message: 'Branch updated successfully' });
    } catch (error: any) {
      console.error('Error updating branch:', error);
      if (error.code === 'P2002') {
        return res.status(400).json({ success: false, error: 'Branch code already exists' });
      }
      res.status(500).json({ success: false, error: 'Failed to update branch' });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id } = req.params;

      // Check if branch exists
      const existing = await branchService.getBranchById(id, schoolId);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Branch not found' });
      }

      await branchService.deleteBranch(id, schoolId);

      res.json({ success: true, message: 'Branch deleted successfully' });
    } catch (error) {
      console.error('Error deleting branch:', error);
      res.status(500).json({ success: false, error: 'Failed to delete branch' });
    }
  },
};
