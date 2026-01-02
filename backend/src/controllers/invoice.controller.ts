import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { invoiceService } from '../services/invoice.service';
import { pdfGenerator } from '../utils/pdf-generator';

const prisma = new PrismaClient();

export const invoiceController = {
  async generateInvoice(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { studentId, feeStructureIds, discount, tax, dueDate } = req.body;

      if (!studentId || !feeStructureIds || !Array.isArray(feeStructureIds) || feeStructureIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'StudentId, feeStructureIds (non-empty array), and dueDate are required',
        });
      }

      if (!dueDate) {
        return res.status(400).json({
          success: false,
          error: 'DueDate is required',
        });
      }

      const invoice = await invoiceService.generateInvoice({
        studentId,
        feeStructureIds,
        discount,
        tax,
        dueDate: new Date(dueDate),
        schoolId,
      });

      res.status(201).json({
        success: true,
        data: invoice,
        message: 'Invoice generated successfully',
      });
    } catch (error: any) {
      console.error('Error generating invoice:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to generate invoice' });
    }
  },

  async getInvoices(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { studentId, status, dateFrom, dateTo, search, page, limit } = req.query;

      const { data, total } = await invoiceService.getInvoices(
        {
          schoolId,
          studentId: studentId as string,
          status: status as any,
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
      console.error('Error fetching invoices:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch invoices' });
    }
  },

  async getInvoiceById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const invoice = await invoiceService.getInvoiceById(id);

      if (!invoice) {
        return res.status(404).json({ success: false, error: 'Invoice not found' });
      }

      res.json({ success: true, data: invoice });
    } catch (error) {
      console.error('Error fetching invoice:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch invoice' });
    }
  },

  async bulkGenerateInvoices(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const { classId, sectionId, feeStructureIds, discount, tax, dueDate } = req.body;

      if (!feeStructureIds || !Array.isArray(feeStructureIds) || feeStructureIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'FeeStructureIds (non-empty array) and dueDate are required',
        });
      }

      if (!dueDate) {
        return res.status(400).json({
          success: false,
          error: 'DueDate is required',
        });
      }

      if (!classId && !sectionId) {
        return res.status(400).json({
          success: false,
          error: 'ClassId or sectionId is required',
        });
      }

      const invoices = await invoiceService.bulkGenerateInvoices({
        classId,
        sectionId,
        feeStructureIds,
        discount,
        tax,
        dueDate: new Date(dueDate),
        schoolId,
      });

      res.status(201).json({
        success: true,
        data: invoices,
        message: `${invoices.length} invoices generated successfully`,
      });
    } catch (error: any) {
      console.error('Error generating invoices:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to generate invoices' });
    }
  },

  async updateInvoiceStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          error: 'Status is required',
        });
      }

      const invoice = await invoiceService.updateInvoiceStatus(id, status);

      res.json({
        success: true,
        data: invoice,
        message: 'Invoice status updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating invoice status:', error);
      res.status(500).json({ success: false, error: 'Failed to update invoice status' });
    }
  },

  async getInvoiceStats(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const stats = await invoiceService.getInvoiceStats(schoolId);

      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('Error fetching invoice stats:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch invoice statistics' });
    }
  },

  async getOverdueInvoices(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) {
        return res.status(401).json({ success: false, error: 'School context required' });
      }

      const invoices = await invoiceService.getOverdueInvoices(schoolId);

      res.json({ success: true, data: invoices });
    } catch (error) {
      console.error('Error fetching overdue invoices:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch overdue invoices' });
    }
  },

  async cancelInvoice(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const invoice = await invoiceService.cancelInvoice(id);

      res.json({
        success: true,
        data: invoice,
        message: 'Invoice cancelled successfully',
      });
    } catch (error: any) {
      console.error('Error cancelling invoice:', error);
      res.status(500).json({ success: false, error: 'Failed to cancel invoice' });
    }
  },

  async downloadInvoice(req: Request, res: Response) {
    try {
      const invoiceId = req.params.invoiceId;
      if (!invoiceId) {
        return res.status(400).json({ success: false, error: 'Invoice ID is required' });
      }

      // Get invoice details from database
      const invoice = await prisma.feeInvoice.findUnique({
        where: { id: invoiceId },
        include: {
          lineItems: true,
          student: true,
          school: true,
        },
      });

      if (!invoice) {
        return res.status(404).json({ success: false, error: 'Invoice not found' });
      }

      // Generate PDF
      const pdfBuffer = await pdfGenerator.generateInvoicePDF(invoice);

      // Send as downloadable file
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNo}.pdf"`);
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error('Error downloading invoice:', error);
      res.status(500).json({ success: false, error: 'Failed to generate invoice PDF' });
    }
  },
};
