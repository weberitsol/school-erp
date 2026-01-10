import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { invoiceService } from './invoice.service';
import { paymentService } from './payment.service';

const prisma = new PrismaClient();

export interface PaymentData {
  amount: Decimal | number;
  paymentMethod: string;
  transactionId?: string;
  notes?: string;
}

/**
 * Billing Integration Service
 * PHASE 5: Bridge between Mess Billing and Finance Module
 *
 * Handles:
 * - Creating Finance invoices from Mess bills
 * - Syncing payment status between systems
 * - Maintaining bidirectional consistency
 */
class BillingIntegrationService {
  /**
   * Create a Finance invoice from a Mess bill
   * Called when mess bill is generated to record in Finance system
   *
   * @param billId - Mess bill ID
   * @returns Finance invoice ID
   */
  async createFinanceInvoice(billId: string): Promise<string> {
    const bill = await prisma.messBill.findUnique({
      where: { id: billId },
      include: {
        enrollment: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
            plan: {
              include: {
                mess: true,
              },
            },
          },
        },
      },
    });

    if (!bill) {
      throw new Error('Mess bill not found');
    }

    // Determine due date (typically 10th of next month for monthly bills)
    const dueDate = new Date(bill.billingYear, bill.billingMonth, 10);

    // Create Finance invoice with line items
    const invoice = await invoiceService.generateInvoice({
      studentId: bill.enrollment.student.id,
      schoolId: bill.schoolId,
      invoiceType: 'MESS_BILL',
      lineItems: [
        {
          description: `Mess Bill - ${this.getMonthName(bill.billingMonth)} ${bill.billingYear}`,
          description_detail: `Base Plan Cost: ₹${bill.baseMealPlanCost}, Additional Charges: ₹${bill.additionalCharges}`,
          unitPrice: bill.totalAmount,
          quantity: 1,
          amount: bill.totalAmount,
        },
      ],
      dueDate,
      notes: `Enrollment: ${bill.enrollment.id}`,
    });

    // Link invoice back to bill
    await prisma.messBill.update({
      where: { id: billId },
      data: {
        invoiceId: invoice.id,
        updatedAt: new Date(),
      },
    });

    return invoice.id;
  }

  /**
   * Sync bill to Finance invoice (update existing invoice)
   */
  async syncBillToInvoice(billId: string): Promise<void> {
    const bill = await prisma.messBill.findUnique({
      where: { id: billId },
      include: {
        enrollment: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!bill) {
      throw new Error('Mess bill not found');
    }

    if (!bill.invoiceId) {
      throw new Error('Bill not linked to Finance invoice');
    }

    // Update invoice status based on bill status
    let invoiceStatus = 'PENDING';
    if (bill.status === 'PAID') {
      invoiceStatus = 'PAID';
    } else if (bill.status === 'PARTIAL') {
      invoiceStatus = 'PARTIAL';
    } else if (bill.status === 'OVERDUE') {
      invoiceStatus = 'OVERDUE';
    } else if (bill.status === 'CANCELLED') {
      invoiceStatus = 'CANCELLED';
    }

    await invoiceService.updateInvoiceStatus(bill.invoiceId, invoiceStatus);
  }

  /**
   * Record payment in Finance module and sync to Mess bill
   */
  async syncPaymentToFinance(
    billId: string,
    paymentData: PaymentData
  ): Promise<void> {
    const bill = await prisma.messBill.findUnique({
      where: { id: billId },
    });

    if (!bill) {
      throw new Error('Mess bill not found');
    }

    if (!bill.invoiceId) {
      throw new Error('Bill not linked to Finance invoice');
    }

    const amount = new Decimal(paymentData.amount);

    // Record payment in Finance module
    const payment = await paymentService.recordPayment({
      invoiceId: bill.invoiceId,
      amount,
      paymentMethod: paymentData.paymentMethod,
      transactionId: paymentData.transactionId,
      notes: paymentData.notes,
    });

    // Update mess bill with payment information
    await prisma.messBill.update({
      where: { id: billId },
      data: {
        paidAmount: amount,
        paidDate: new Date(),
        updatedAt: new Date(),
      },
    });

    return;
  }

  /**
   * Handle payment callback from Finance module
   * Called when Finance module processes a payment
   */
  async handlePaymentCallback(
    invoiceId: string,
    paymentStatus: string,
    paidAmount?: number
  ): Promise<void> {
    // Find bill linked to this invoice
    const bill = await prisma.messBill.findFirst({
      where: { invoiceId },
    });

    if (!bill) {
      // Bill doesn't exist yet, ignore callback
      return;
    }

    // Update bill status based on payment status
    let newBillStatus = bill.status;
    if (paymentStatus === 'PAID') {
      newBillStatus = 'PAID';
    } else if (paymentStatus === 'PARTIAL') {
      newBillStatus = 'PARTIAL';
    }

    await prisma.messBill.update({
      where: { id: bill.id },
      data: {
        status: newBillStatus,
        paidAmount: paidAmount ? new Decimal(paidAmount) : bill.paidAmount,
        paidDate: paidAmount ? new Date() : bill.paidDate,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Update bill status based on linked Finance invoice
   */
  async updateBillFromInvoiceStatus(invoiceId: string): Promise<void> {
    const bill = await prisma.messBill.findFirst({
      where: { invoiceId },
    });

    if (!bill) {
      return;
    }

    // Get invoice from Finance module
    const invoice = await invoiceService.getInvoiceById(invoiceId);

    if (!invoice) {
      return;
    }

    // Map Finance invoice status to Mess bill status
    let billStatus = 'PENDING';
    if (invoice.status === 'PAID') {
      billStatus = 'PAID';
    } else if (invoice.status === 'PARTIAL') {
      billStatus = 'PARTIAL';
    } else if (invoice.status === 'OVERDUE') {
      billStatus = 'OVERDUE';
    } else if (invoice.status === 'CANCELLED') {
      billStatus = 'CANCELLED';
    }

    await prisma.messBill.update({
      where: { id: bill.id },
      data: {
        status: billStatus as any,
        paidAmount: invoice.paidAmount,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get bill from Finance invoice ID
   */
  async getBillFromInvoiceId(invoiceId: string) {
    const bill = await prisma.messBill.findFirst({
      where: { invoiceId },
      include: {
        enrollment: {
          include: {
            student: true,
            plan: {
              include: {
                mess: true,
              },
            },
          },
        },
      },
    });

    return bill;
  }

  /**
   * Sync all pending bills to Finance invoices
   * Useful for batch operations
   */
  async syncAllPendingBills(schoolId: string): Promise<{
    successful: string[];
    failed: Array<{ billId: string; error: string }>;
  }> {
    const bills = await prisma.messBill.findMany({
      where: {
        schoolId,
        invoiceId: null,
      },
    });

    const results = {
      successful: [] as string[],
      failed: [] as Array<{ billId: string; error: string }>,
    };

    for (const bill of bills) {
      try {
        await this.createFinanceInvoice(bill.id);
        results.successful.push(bill.id);
      } catch (error: any) {
        results.failed.push({
          billId: bill.id,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Helper: Get month name from month number
   */
  private getMonthName(month: number): string {
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return monthNames[month - 1] || 'Unknown';
  }

  /**
   * Verify integration health (check linked bills)
   */
  async verifyIntegrationHealth(schoolId: string): Promise<{
    totalBills: number;
    linkedToInvoices: number;
    orphanedBills: number;
    syncErrors: number;
  }> {
    const bills = await prisma.messBill.findMany({
      where: { schoolId },
    });

    const linkedCount = bills.filter((b) => b.invoiceId).length;
    const orphanedCount = bills.filter((b) => !b.invoiceId).length;

    // Count sync errors by checking mismatched statuses
    let syncErrors = 0;
    for (const bill of bills) {
      if (bill.invoiceId) {
        const invoice = await invoiceService.getInvoiceById(bill.invoiceId);
        if (
          invoice &&
          bill.status !== 'PAID' &&
          invoice.status === 'PAID'
        ) {
          syncErrors += 1;
        }
      }
    }

    return {
      totalBills: bills.length,
      linkedToInvoices: linkedCount,
      orphanedBills: orphanedCount,
      syncErrors,
    };
  }
}

export const billingIntegrationService = new BillingIntegrationService();
