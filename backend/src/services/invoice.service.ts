import { PrismaClient, FeeInvoice, InvoiceLineItem, Prisma, InvoiceStatus } from '@prisma/client';
import { paymentService } from './payment.service';

const prisma = new PrismaClient();

interface InvoiceFilters {
  schoolId: string;
  studentId?: string;
  status?: InvoiceStatus;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

interface InvoiceLineItemData {
  feeStructureId: string;
  description: string;
  quantity?: number;
  unitPrice: Prisma.Decimal | number;
}

interface GenerateInvoiceData {
  studentId: string;
  feeStructureIds: string[];
  discount?: Prisma.Decimal | number;
  tax?: Prisma.Decimal | number;
  dueDate: Date;
  schoolId: string;
}

interface BulkGenerateInvoiceData {
  classId?: string;
  sectionId?: string;
  feeStructureIds: string[];
  discount?: Prisma.Decimal | number;
  tax?: Prisma.Decimal | number;
  dueDate: Date;
  schoolId: string;
}

interface PaginationParams {
  page?: number;
  limit?: number;
}

class InvoiceService {
  async generateInvoiceNo(): Promise<string> {
    const prefix = 'INV';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  }

  async generateInvoice(data: GenerateInvoiceData): Promise<FeeInvoice> {
    const invoiceNo = await this.generateInvoiceNo();

    // Fetch fee structures and calculate totals
    const feeStructures = await prisma.feeStructure.findMany({
      where: {
        id: { in: data.feeStructureIds },
        schoolId: data.schoolId,
      },
    });

    if (feeStructures.length === 0) {
      throw new Error('No valid fee structures found');
    }

    // Calculate subtotal
    const subtotal = feeStructures.reduce(
      (sum, fee) => sum.plus(fee.amount),
      new Prisma.Decimal(0)
    );

    const discount = data.discount ? new Prisma.Decimal(data.discount) : new Prisma.Decimal(0);
    const tax = data.tax ? new Prisma.Decimal(data.tax) : new Prisma.Decimal(0);
    const totalAmount = subtotal.minus(discount).plus(tax);

    // Create invoice with line items
    const invoice = await prisma.feeInvoice.create({
      data: {
        invoiceNo,
        schoolId: data.schoolId,
        studentId: data.studentId,
        subtotal,
        discount,
        tax,
        totalAmount,
        dueDate: data.dueDate,
        status: 'PENDING',
        lineItems: {
          create: feeStructures.map((fee) => ({
            feeStructureId: fee.id,
            description: fee.name,
            quantity: 1,
            unitPrice: fee.amount,
            amount: fee.amount,
          })),
        },
      },
      include: { lineItems: true, student: true },
    });

    return invoice;
  }

  async getInvoices(
    filters: InvoiceFilters,
    pagination?: PaginationParams
  ): Promise<{ data: FeeInvoice[]; total: number }> {
    const where: Prisma.FeeInvoiceWhereInput = {
      schoolId: filters.schoolId,
      ...(filters.studentId && { studentId: filters.studentId }),
      ...(filters.status && { status: filters.status }),
      ...(filters.dateFrom && { createdAt: { gte: filters.dateFrom } }),
      ...(filters.dateTo && { createdAt: { lte: filters.dateTo } }),
      ...(filters.search && {
        OR: [
          { invoiceNo: { contains: filters.search, mode: 'insensitive' } },
          { student: { firstName: { contains: filters.search, mode: 'insensitive' } } },
          { student: { lastName: { contains: filters.search, mode: 'insensitive' } } },
        ],
      }),
    };

    const skip = pagination ? (pagination.page || 0) * (pagination.limit || 10) : undefined;
    const take = pagination?.limit || 10;

    const [data, total] = await Promise.all([
      prisma.feeInvoice.findMany({
        where,
        include: {
          lineItems: { include: { feeStructure: true } },
          student: true,
          payments: true,
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.feeInvoice.count({ where }),
    ]);

    return { data, total };
  }

  async getInvoiceById(id: string): Promise<FeeInvoice | null> {
    return prisma.feeInvoice.findUnique({
      where: { id },
      include: {
        lineItems: { include: { feeStructure: true } },
        student: true,
        payments: true,
        school: true,
      },
    });
  }

  async getInvoiceByInvoiceNo(invoiceNo: string, schoolId: string): Promise<FeeInvoice | null> {
    return prisma.feeInvoice.findFirst({
      where: { invoiceNo, schoolId },
      include: {
        lineItems: { include: { feeStructure: true } },
        student: true,
        payments: true,
      },
    });
  }

  async updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<FeeInvoice> {
    return prisma.feeInvoice.update({
      where: { id },
      data: { status },
      include: { lineItems: true, student: true, payments: true },
    });
  }

  async bulkGenerateInvoices(data: BulkGenerateInvoiceData): Promise<FeeInvoice[]> {
    // Get students in the class/section
    const whereStudent: Prisma.StudentWhereInput = {
      ...(data.classId && { currentClassId: data.classId }),
      ...(data.sectionId && { currentSectionId: data.sectionId }),
    };

    const students = await prisma.student.findMany({
      where: whereStudent,
      select: { id: true },
    });

    if (students.length === 0) {
      return [];
    }

    // Generate invoices for each student
    const invoices = await Promise.all(
      students.map((student) =>
        this.generateInvoice({
          studentId: student.id,
          feeStructureIds: data.feeStructureIds,
          discount: data.discount,
          tax: data.tax,
          dueDate: data.dueDate,
          schoolId: data.schoolId,
        })
      )
    );

    return invoices;
  }

  async getInvoicesByStudent(studentId: string): Promise<FeeInvoice[]> {
    return prisma.feeInvoice.findMany({
      where: { studentId },
      include: {
        lineItems: { include: { feeStructure: true } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getInvoicesByStatus(schoolId: string, status: InvoiceStatus): Promise<FeeInvoice[]> {
    return prisma.feeInvoice.findMany({
      where: { schoolId, status },
      include: {
        lineItems: { include: { feeStructure: true } },
        student: true,
        payments: true,
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async calculateInvoiceBalance(id: string): Promise<Prisma.Decimal> {
    const invoice = await this.getInvoiceById(id);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Query payments for this invoice
    const payments = await prisma.feePayment.findMany({
      where: { invoiceId: id },
      select: { totalAmount: true },
    });

    const paidAmount = payments.reduce(
      (sum: Prisma.Decimal, payment) => sum.plus(payment.totalAmount),
      new Prisma.Decimal(0)
    );

    return invoice.totalAmount.minus(paidAmount);
  }

  async markInvoiceAsPaid(id: string): Promise<FeeInvoice> {
    return this.updateInvoiceStatus(id, 'PAID');
  }

  async markInvoiceAsPartial(id: string): Promise<FeeInvoice> {
    return this.updateInvoiceStatus(id, 'PARTIAL');
  }

  async markInvoiceAsOverdue(id: string): Promise<FeeInvoice> {
    return this.updateInvoiceStatus(id, 'OVERDUE');
  }

  async cancelInvoice(id: string): Promise<FeeInvoice> {
    return this.updateInvoiceStatus(id, 'CANCELLED');
  }

  async getOverdueInvoices(schoolId: string): Promise<FeeInvoice[]> {
    const today = new Date();
    return prisma.feeInvoice.findMany({
      where: {
        schoolId,
        dueDate: {
          lt: today,
        },
        status: {
          in: ['PENDING', 'PARTIAL'],
        },
      },
      include: {
        lineItems: { include: { feeStructure: true } },
        student: true,
        payments: true,
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async getInvoiceStats(schoolId: string): Promise<any> {
    const invoices = await prisma.feeInvoice.findMany({
      where: { schoolId },
      include: { payments: true },
    });

    const totalInvoiced = invoices.reduce((sum, inv) => sum.plus(inv.totalAmount), new Prisma.Decimal(0));
    const totalPaid = invoices
      .filter((inv) => inv.status === 'PAID')
      .reduce((sum, inv) => sum.plus(inv.totalAmount), new Prisma.Decimal(0));
    const totalPartial = invoices
      .filter((inv) => inv.status === 'PARTIAL')
      .reduce((sum, inv) => sum.plus(inv.totalAmount), new Prisma.Decimal(0));
    const outstanding = invoices
      .filter((inv) => ['PENDING', 'PARTIAL', 'OVERDUE'].includes(inv.status))
      .reduce((sum, inv) => sum.plus(inv.totalAmount), new Prisma.Decimal(0));

    return {
      totalInvoices: invoices.length,
      totalInvoiced,
      totalPaid,
      totalPartial,
      outstanding,
      byStatus: {
        pending: invoices.filter((inv) => inv.status === 'PENDING').length,
        paid: invoices.filter((inv) => inv.status === 'PAID').length,
        partial: invoices.filter((inv) => inv.status === 'PARTIAL').length,
        overdue: invoices.filter((inv) => inv.status === 'OVERDUE').length,
        cancelled: invoices.filter((inv) => inv.status === 'CANCELLED').length,
      },
    };
  }
}

export const invoiceService = new InvoiceService();
