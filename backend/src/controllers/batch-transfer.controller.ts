import { Request, Response } from 'express';
import { batchTransferService } from '../services/batch-transfer.service';

export const batchTransferController = {
  async transferStudent(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const { studentId, toClassId, toSectionId, reason } = req.body;

      if (!studentId || !toClassId || !toSectionId) {
        return res.status(400).json({
          success: false,
          error: 'Student ID, target class ID, and target section ID are required',
        });
      }

      const transfer = await batchTransferService.transferStudent({
        studentId,
        toClassId,
        toSectionId,
        reason,
        transferredById: userId,
      });

      res.status(201).json({
        success: true,
        data: transfer,
        message: 'Student transferred successfully',
      });
    } catch (error: any) {
      console.error('Error transferring student:', error);
      res.status(400).json({ success: false, error: error.message || 'Failed to transfer student' });
    }
  },

  async bulkTransferStudents(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const { studentIds, toClassId, toSectionId, reason } = req.body;

      if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ success: false, error: 'Student IDs array is required' });
      }

      if (!toClassId || !toSectionId) {
        return res.status(400).json({
          success: false,
          error: 'Target class ID and target section ID are required',
        });
      }

      const result = await batchTransferService.bulkTransferStudents(
        studentIds,
        toClassId,
        toSectionId,
        reason,
        userId
      );

      const success = result.success.length > 0;
      const message =
        result.failed.length === 0
          ? `Successfully transferred ${result.success.length} students`
          : `Transferred ${result.success.length} students, ${result.failed.length} failed`;

      res.status(success ? 200 : 400).json({
        success,
        data: result,
        message,
      });
    } catch (error: any) {
      console.error('Error bulk transferring students:', error);
      res.status(500).json({ success: false, error: 'Failed to transfer students' });
    }
  },

  async getTransferHistory(req: Request, res: Response) {
    try {
      const {
        studentId,
        fromClassId,
        toClassId,
        transferredById,
        fromDate,
        toDate,
        page,
        limit,
        sortBy,
        sortOrder,
      } = req.query;

      const result = await batchTransferService.getTransferHistory(
        {
          studentId: studentId as string,
          fromClassId: fromClassId as string,
          toClassId: toClassId as string,
          transferredById: transferredById as string,
          fromDate: fromDate ? new Date(fromDate as string) : undefined,
          toDate: toDate ? new Date(toDate as string) : undefined,
        },
        {
          page: page ? parseInt(page as string) : 1,
          limit: limit ? parseInt(limit as string) : 20,
          sortBy: sortBy as string,
          sortOrder: sortOrder as 'asc' | 'desc',
        }
      );

      res.json({
        success: true,
        data: result.transfers,
        total: result.total,
      });
    } catch (error) {
      console.error('Error fetching transfer history:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch transfer history' });
    }
  },

  async getStudentTransferHistory(req: Request, res: Response) {
    try {
      const { studentId } = req.params;

      const transfers = await batchTransferService.getStudentTransferHistory(studentId);

      res.json({ success: true, data: transfers });
    } catch (error) {
      console.error('Error fetching student transfer history:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch transfer history' });
    }
  },

  async getTransferById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const transfer = await batchTransferService.getTransferById(id);

      if (!transfer) {
        return res.status(404).json({ success: false, error: 'Transfer record not found' });
      }

      res.json({ success: true, data: transfer });
    } catch (error) {
      console.error('Error fetching transfer:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch transfer' });
    }
  },
};
