import { Request, Response } from 'express';
import { parentService } from '../services/parent.service';

class ParentController {
  // GET /parents - List all parents
  async getAllParents(req: Request, res: Response) {
    try {
      const filters = {
        firstName: req.query.firstName,
        lastName: req.query.lastName,
        relation: req.query.relation,
        city: req.query.city,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      };

      const { data, total } = await parentService.getAll(filters);

      res.json({
        success: true,
        data,
        pagination: {
          total,
          page: filters.page,
          limit: filters.limit,
          pages: Math.ceil(total / filters.limit),
        },
        message: 'Parents fetched successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch parents',
      });
    }
  }

  // GET /parents/:id - Get parent by ID
  async getParent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const parent = await parentService.getById(id);

      res.json({
        success: true,
        data: parent,
        message: 'Parent fetched successfully',
      });
    } catch (error: any) {
      res.status(error.message === 'Parent not found' ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to fetch parent',
      });
    }
  }

  // GET /parents/user/:userId - Get parent by user ID
  async getParentByUserId(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const parent = await parentService.getByUserId(userId);

      res.json({
        success: true,
        data: parent,
        message: 'Parent fetched successfully',
      });
    } catch (error: any) {
      res.status(error.message === 'Parent not found' ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to fetch parent',
      });
    }
  }

  // POST /parents - Create new parent
  async createParent(req: Request, res: Response) {
    try {
      const { firstName, lastName, relation, phone, alternatePhone, email, occupation, profileImage, address, city, state, pincode, userId, password } = req.body;

      // Validate required fields
      if (!firstName || !lastName || !phone || !relation) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: firstName, lastName, phone, relation',
        });
      }

      const schoolId = (req as any).user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({
          success: false,
          error: 'School ID not found in request',
        });
      }

      const parent = await parentService.createParent({
        firstName,
        lastName,
        relation,
        phone,
        alternatePhone,
        email,
        occupation,
        profileImage,
        address,
        city,
        state,
        pincode,
        userId,
        password,
        schoolId,
      });

      res.status(201).json({
        success: true,
        data: parent,
        message: 'Parent created successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create parent',
      });
    }
  }

  // PUT /parents/:id - Update parent
  async updateParent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { firstName, lastName, relation, phone, alternatePhone, email, occupation, profileImage, address, city, state, pincode } = req.body;

      const parent = await parentService.updateParent(id, {
        firstName,
        lastName,
        relation,
        phone,
        alternatePhone,
        email,
        occupation,
        profileImage,
        address,
        city,
        state,
        pincode,
      });

      res.json({
        success: true,
        data: parent,
        message: 'Parent updated successfully',
      });
    } catch (error: any) {
      res.status(error.message === 'Parent not found' ? 404 : 400).json({
        success: false,
        error: error.message || 'Failed to update parent',
      });
    }
  }

  // DELETE /parents/:id - Delete parent
  async deleteParent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleteUser = req.query.deleteUser === 'true';

      const result = await parentService.deleteParent(id, deleteUser);

      res.json({
        success: true,
        data: result,
        message: 'Parent deleted successfully',
      });
    } catch (error: any) {
      res.status(error.message === 'Parent not found' ? 404 : 400).json({
        success: false,
        error: error.message || 'Failed to delete parent',
      });
    }
  }

  // POST /parents/:id/children - Link children to parent
  async linkChildren(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { studentIds, primaryStudentId } = req.body;

      if (!Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'studentIds must be a non-empty array',
        });
      }

      const links = await parentService.linkChildren(id, {
        studentIds,
        primaryStudentId,
      });

      res.status(201).json({
        success: true,
        data: links,
        message: `Linked ${links.length} children to parent`,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to link children',
      });
    }
  }

  // DELETE /parents/:id/children/:studentId - Unlink child
  async unlinkChild(req: Request, res: Response) {
    try {
      const { id, studentId } = req.params;

      const result = await parentService.unlinkChild(id, studentId);

      res.json({
        success: true,
        data: result,
        message: 'Child unlinked successfully',
      });
    } catch (error: any) {
      res.status(error.message === 'Parent-student link not found' ? 404 : 400).json({
        success: false,
        error: error.message || 'Failed to unlink child',
      });
    }
  }

  // GET /parents/:id/children - Get parent's children
  async getChildren(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const children = await parentService.getChildren(id);

      res.json({
        success: true,
        data: children,
        message: 'Children fetched successfully',
      });
    } catch (error: any) {
      res.status(error.message === 'Parent not found' ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to fetch children',
      });
    }
  }

  // GET /parents/:id/payments - Get payment history
  async getPaymentHistory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await parentService.getPaymentHistory(id);

      res.json({
        success: true,
        data: result.payments,
        summary: result.summary,
        message: 'Payment history fetched successfully',
      });
    } catch (error: any) {
      res.status(error.message === 'Parent not found' ? 404 : 500).json({
        success: false,
        error: error.message || 'Failed to fetch payment history',
      });
    }
  }

  // GET /parents/stats - Get parent statistics
  async getStats(req: Request, res: Response) {
    try {
      const schoolId = (req as any).user?.schoolId;
      const stats = await parentService.getParentStats(schoolId);

      res.json({
        success: true,
        data: stats,
        message: 'Parent statistics fetched successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch parent statistics',
      });
    }
  }
}

export const parentController = new ParentController();
