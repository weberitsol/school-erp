import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { feeService } from '../services/fee.service';
import { paymentService } from '../services/payment.service';
import { pdfGenerator } from '../utils/pdf-generator';

const prisma = new PrismaClient();

export const feeController = {
  // Fee Structure endpoints
  async createFeeStructure(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const {
        name,
        description,
        academicYearId,
        classId,
        amount,
        frequency,
        dueDay,
        lateFee,
        lateFeeAfterDays,
      } = req.body;

      if (!name || !academicYearId || !amount || !frequency) {
        return res.status(400).json({
          success: false,
          error: 'Name, academicYearId, amount, and frequency are required',
        });
      }

      const feeStructure = await feeService.createFeeStructure({
        name,
        description,
        schoolId,
        academicYearId,
        classId,
        amount,
        frequency,
        dueDay,
        lateFee,
        lateFeeAfterDays,
      });

      res.status(201).json({
        success: true,
        data: feeStructure,
        message: 'Fee structure created successfully',
      });
    } catch (error: any) {
      console.error('Error creating fee structure:', error);
      res.status(500).json({ success: false, error: 'Failed to create fee structure' });
    }
  },

  async getFeeStructures(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { search, classId, academicYearId, isActive, page, limit } = req.query;

      const { data, total } = await feeService.getFeeStructures(
        {
          schoolId,
          search: search as string,
          classId: classId as string,
          academicYearId: academicYearId as string,
          isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        },
        {
          page: page ? parseInt(page as string) : 0,
          limit: limit ? parseInt(limit as string) : 10,
        }
      );

      res.json({ success: true, data, total });
    } catch (error) {
      console.error('Error fetching fee structures:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch fee structures' });
    }
  },

  async getFeeStructureById(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id } = req.params;
      const feeStructure = await feeService.getFeeStructureById(id, schoolId);

      if (!feeStructure) {
        return res.status(404).json({ success: false, error: 'Fee structure not found' });
      }

      res.json({ success: true, data: feeStructure });
    } catch (error) {
      console.error('Error fetching fee structure:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch fee structure' });
    }
  },

  async updateFeeStructure(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id } = req.params;
      const { name, description, amount, frequency, dueDay, lateFee, lateFeeAfterDays, isActive } = req.body;

      const feeStructure = await feeService.updateFeeStructure(id, schoolId, {
        name,
        description,
        amount,
        frequency,
        dueDay,
        lateFee,
        lateFeeAfterDays,
        isActive,
      });

      res.json({
        success: true,
        data: feeStructure,
        message: 'Fee structure updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating fee structure:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ success: false, error: 'Fee structure not found' });
      }
      res.status(500).json({ success: false, error: 'Failed to update fee structure' });
    }
  },

  async deleteFeeStructure(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { id } = req.params;
      await feeService.deleteFeeStructure(id, schoolId);

      res.json({ success: true, message: 'Fee structure deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting fee structure:', error);
      res.status(500).json({ success: false, error: 'Failed to delete fee structure' });
    }
  },

  // Payment endpoints
  async recordPayment(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const {
        studentId,
        feeStructureId,
        invoiceId,
        amount,
        lateFee,
        discount,
        paymentMethod,
        paymentDate,
        transactionId,
        remarks,
      } = req.body;

      if (!studentId || !feeStructureId || !amount) {
        return res.status(400).json({
          success: false,
          error: 'StudentId, feeStructureId, and amount are required',
        });
      }

      const payment = await paymentService.createPayment({
        studentId,
        feeStructureId,
        invoiceId,
        amount,
        lateFee,
        discount,
        paymentMethod,
        paymentDate,
        transactionId,
        // paidById is only set when parent makes direct payment
        // For admin recording payments, leave it undefined
        remarks,
      });

      res.status(201).json({
        success: true,
        data: payment,
        message: 'Payment recorded successfully',
      });
    } catch (error: any) {
      console.error('Error recording payment:', error);
      res.status(500).json({ success: false, error: 'Failed to record payment' });
    }
  },

  async getPayments(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const {
        studentId,
        classId,
        paymentStatus,
        paymentMethod,
        dateFrom,
        dateTo,
        search,
        page,
        limit,
      } = req.query;

      const { data, total } = await paymentService.getPayments(
        {
          schoolId,
          studentId: studentId as string,
          classId: classId as string,
          paymentStatus: paymentStatus as any,
          paymentMethod: paymentMethod as string,
          dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
          dateTo: dateTo ? new Date(dateTo as string) : undefined,
          search: search as string,
        },
        {
          page: page ? parseInt(page as string) : 0,
          limit: limit ? parseInt(limit as string) : 10,
        }
      );

      res.json({ success: true, data, total });
    } catch (error) {
      console.error('Error fetching payments:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch payments' });
    }
  },

  async getPendingDues(req: Request, res: Response) {
    try {
      const { studentId, classId } = req.query;

      let dues: any[] = [];

      if (studentId) {
        dues = await paymentService.getPendingDues(studentId as string);
      } else if (classId) {
        dues = await paymentService.getPendingDuesByClass(classId as string);
      }

      res.json({ success: true, data: dues });
    } catch (error) {
      console.error('Error fetching pending dues:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch pending dues' });
    }
  },

  async getPaymentReport(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { dateFrom, dateTo } = req.query;

      if (!dateFrom || !dateTo) {
        return res.status(400).json({
          success: false,
          error: 'dateFrom and dateTo are required',
        });
      }

      const report = await paymentService.getPaymentReport(
        schoolId,
        new Date(dateFrom as string),
        new Date(dateTo as string)
      );

      res.json({ success: true, data: report });
    } catch (error) {
      console.error('Error generating payment report:', error);
      res.status(500).json({ success: false, error: 'Failed to generate payment report' });
    }
  },

  async downloadReceipt(req: Request, res: Response) {
    try {
      const paymentId = req.params.paymentId;
      if (!paymentId) {
        return res.status(400).json({ success: false, error: 'Payment ID is required' });
      }

      // Get payment details from database
      const payment = await prisma.feePayment.findUnique({
        where: { id: paymentId },
        include: {
          student: true,
          feeStructure: true,
        },
      });

      if (!payment) {
        return res.status(404).json({ success: false, error: 'Payment not found' });
      }

      // Generate PDF
      const pdfBuffer = await pdfGenerator.generatePaymentReceiptPDF(payment);

      // Send as downloadable file
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="receipt-${payment.receiptNo}.pdf"`);
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error('Error downloading receipt:', error);
      res.status(500).json({ success: false, error: 'Failed to generate receipt PDF' });
    }
  },
};
