import { Request, Response } from 'express';
import { messBillService } from '../services/mess-bill.service';
import { billingIntegrationService } from '../services/billing-integration.service';

/**
 * Mess Bill Controller
 * PHASE 5: Handles HTTP requests for mess billing operations
 */

export const messBillController = {
  /**
   * Generate bill for single enrollment
   * POST /api/v1/mess/bills/generate
   */
  async generateBill(req: Request, res: Response) {
    try {
      const { enrollmentId, month, year } = req.body;

      if (!enrollmentId || !month || !year) {
        return res.status(400).json({
          error: 'enrollmentId, month, and year are required',
        });
      }

      const bill = await messBillService.generateBill({
        enrollmentId,
        month,
        year,
      });

      res.status(201).json({
        message: 'Bill generated successfully',
        data: bill,
      });
    } catch (error: any) {
      res.status(400).json({
        error: error.message,
      });
    }
  },

  /**
   * Generate bills for all enrollments in a mess
   * POST /api/v1/mess/bills/bulk-generate
   */
  async generateBulkBills(req: Request, res: Response) {
    try {
      const { messId, month, year } = req.body;

      if (!messId || !month || !year) {
        return res.status(400).json({
          error: 'messId, month, and year are required',
        });
      }

      const result = await messBillService.generateBulkBills(messId, month, year);

      res.status(201).json({
        message: 'Bulk bills generated',
        data: {
          successful: result.successfulBills.length,
          failed: result.errors.length,
          successfulBills: result.successfulBills,
          errors: result.errors,
        },
      });
    } catch (error: any) {
      res.status(400).json({
        error: error.message,
      });
    }
  },

  /**
   * Get bills with filtering
   * GET /api/v1/mess/bills
   */
  async getBills(req: Request, res: Response) {
    try {
      const { enrollmentId, messId, schoolId, status, month, year, skip, take } =
        req.query;

      const filters = {
        enrollmentId: enrollmentId as string | undefined,
        messId: messId as string | undefined,
        schoolId: schoolId as string | undefined,
        status: status as any | undefined,
        billingMonth: month ? parseInt(month as string) : undefined,
        billingYear: year ? parseInt(year as string) : undefined,
      };

      const pagination = {
        skip: skip ? parseInt(skip as string) : 0,
        take: take ? parseInt(take as string) : 50,
      };

      const result = await messBillService.getBills(filters, pagination);

      res.status(200).json({
        data: result.data,
        total: result.total,
      });
    } catch (error: any) {
      res.status(400).json({
        error: error.message,
      });
    }
  },

  /**
   * Get single bill
   * GET /api/v1/mess/bills/:id
   */
  async getBillById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const bill = await messBillService.getBillById(id);

      if (!bill) {
        return res.status(404).json({
          error: 'Bill not found',
        });
      }

      res.status(200).json({
        data: bill,
      });
    } catch (error: any) {
      res.status(400).json({
        error: error.message,
      });
    }
  },

  /**
   * Update bill status
   * PUT /api/v1/mess/bills/:id/status
   */
  async updateBillStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          error: 'status is required',
        });
      }

      const bill = await messBillService.updateBillStatus(id, status);

      res.status(200).json({
        message: 'Bill status updated',
        data: bill,
      });
    } catch (error: any) {
      res.status(400).json({
        error: error.message,
      });
    }
  },

  /**
   * Record payment
   * POST /api/v1/mess/bills/:id/payment
   */
  async recordPayment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { amount, paymentMethod, transactionId, notes } = req.body;

      if (!amount || !paymentMethod) {
        return res.status(400).json({
          error: 'amount and paymentMethod are required',
        });
      }

      const bill = await messBillService.markBillAsPaid(
        id,
        amount,
        new Date()
      );

      // Sync payment to Finance module
      try {
        await billingIntegrationService.syncPaymentToFinance(id, {
          amount,
          paymentMethod,
          transactionId,
          notes,
        });
      } catch (error: any) {
        console.warn('Finance sync failed:', error.message);
        // Continue anyway, local payment recorded
      }

      res.status(200).json({
        message: 'Payment recorded',
        data: bill,
      });
    } catch (error: any) {
      res.status(400).json({
        error: error.message,
      });
    }
  },

  /**
   * Get bill statistics
   * GET /api/v1/mess/bills/stats
   */
  async getBillStats(req: Request, res: Response) {
    try {
      const { schoolId } = req.query;

      if (!schoolId) {
        return res.status(400).json({
          error: 'schoolId is required',
        });
      }

      const stats = await messBillService.getBillStats(schoolId as string);

      res.status(200).json({
        data: stats,
      });
    } catch (error: any) {
      res.status(400).json({
        error: error.message,
      });
    }
  },

  /**
   * Get overdue bills
   * GET /api/v1/mess/bills/overdue
   */
  async getOverdueBills(req: Request, res: Response) {
    try {
      const { schoolId } = req.query;

      if (!schoolId) {
        return res.status(400).json({
          error: 'schoolId is required',
        });
      }

      const bills = await messBillService.getOverdueBills(schoolId as string);

      res.status(200).json({
        data: bills,
        total: bills.length,
      });
    } catch (error: any) {
      res.status(400).json({
        error: error.message,
      });
    }
  },

  /**
   * Sync bill to Finance invoice
   * POST /api/v1/mess/bills/:id/sync-finance
   */
  async syncToFinance(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const bill = await messBillService.getBillById(id);

      if (!bill) {
        return res.status(404).json({
          error: 'Bill not found',
        });
      }

      let invoiceId = bill.invoiceId;

      if (!invoiceId) {
        // Create new Finance invoice
        invoiceId = await billingIntegrationService.createFinanceInvoice(id);
      } else {
        // Update existing invoice
        await billingIntegrationService.syncBillToInvoice(id);
      }

      res.status(200).json({
        message: 'Bill synced to Finance',
        data: {
          billId: id,
          invoiceId,
        },
      });
    } catch (error: any) {
      res.status(400).json({
        error: error.message,
      });
    }
  },

  /**
   * Cancel bill
   * PUT /api/v1/mess/bills/:id/cancel
   */
  async cancelBill(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const bill = await messBillService.cancelBill(id);

      res.status(200).json({
        message: 'Bill cancelled',
        data: bill,
      });
    } catch (error: any) {
      res.status(400).json({
        error: error.message,
      });
    }
  },
};
