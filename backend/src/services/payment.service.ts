import { PrismaClient, FeePayment, Prisma, PaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface PaymentFilters {
  schoolId?: string;
  studentId?: string;
  classId?: string;
  paymentStatus?: PaymentStatus;
  paymentMethod?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

interface CreatePaymentData {
  studentId: string;
  feeStructureId: string;
  invoiceId?: string;
  amount: Prisma.Decimal | number;
  lateFee?: Prisma.Decimal | number;
  discount?: Prisma.Decimal | number;
  paymentMethod?: string;
  paymentDate?: Date;
  transactionId?: string;
  paidById?: string;
  remarks?: string;
}

interface RecordPaymentData extends CreatePaymentData {
  forMonth?: Date;
}

interface PaginationParams {
  page?: number;
  limit?: number;
}

class PaymentService {
  async generateReceiptNo(): Promise<string> {
    const prefix = 'REC';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `${prefix}${timestamp}${random}`;
  }

  async createPayment(data: CreatePaymentData): Promise<FeePayment> {
    const receiptNo = await this.generateReceiptNo();
    const lateFee = data.lateFee ? new Prisma.Decimal(data.lateFee) : new Prisma.Decimal(0);
    const discount = data.discount ? new Prisma.Decimal(data.discount) : new Prisma.Decimal(0);
    const amount = new Prisma.Decimal(data.amount);

    const totalAmount = amount.plus(lateFee).minus(discount);

    return prisma.feePayment.create({
      data: {
        receiptNo,
        studentId: data.studentId,
        feeStructureId: data.feeStructureId,
        invoiceId: data.invoiceId,
        amount,
        lateFee,
        discount,
        totalAmount,
        paymentMethod: data.paymentMethod as any,
        paymentDate: data.paymentDate || new Date(),
        transactionId: data.transactionId,
        paidById: data.paidById,
        remarks: data.remarks,
        paymentStatus: 'PAID',
      },
      include: { student: true, feeStructure: true, paidBy: true },
    });
  }

  async getPayments(
    filters: PaymentFilters,
    pagination?: PaginationParams
  ): Promise<{ data: FeePayment[]; total: number }> {
    const where: Prisma.FeePaymentWhereInput = {
      ...(filters.studentId && { studentId: filters.studentId }),
      ...(filters.paymentStatus && { paymentStatus: filters.paymentStatus }),
      ...(filters.paymentMethod && { paymentMethod: filters.paymentMethod as any }),
      ...(filters.dateFrom && { paymentDate: { gte: filters.dateFrom } }),
      ...(filters.dateTo && { paymentDate: { lte: filters.dateTo } }),
      ...(filters.search && {
        OR: [
          { receiptNo: { contains: filters.search, mode: 'insensitive' } },
          { student: { firstName: { contains: filters.search, mode: 'insensitive' } } },
          { student: { lastName: { contains: filters.search, mode: 'insensitive' } } },
        ],
      }),
    };

    if (filters.classId) {
      where.student = { currentClassId: filters.classId };
    }

    const skip = pagination ? (pagination.page || 0) * (pagination.limit || 10) : undefined;
    const take = pagination?.limit || 10;

    const [data, total] = await Promise.all([
      prisma.feePayment.findMany({
        where,
        include: { student: true, feeStructure: true, paidBy: true },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.feePayment.count({ where }),
    ]);

    return { data, total };
  }

  async getPaymentById(id: string): Promise<FeePayment | null> {
    return prisma.feePayment.findUnique({
      where: { id },
      include: { student: true, feeStructure: true, paidBy: true, invoice: true },
    });
  }

  async getPaymentByReceiptNo(receiptNo: string): Promise<FeePayment | null> {
    return prisma.feePayment.findUnique({
      where: { receiptNo },
      include: { student: true, feeStructure: true, paidBy: true },
    });
  }

  async getPendingDues(studentId: string): Promise<FeePayment[]> {
    return prisma.feePayment.findMany({
      where: {
        studentId,
        paymentStatus: {
          in: ['PENDING', 'PARTIAL', 'OVERDUE'],
        },
      },
      include: { feeStructure: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getPendingDuesByClass(classId: string): Promise<FeePayment[]> {
    return prisma.feePayment.findMany({
      where: {
        paymentStatus: {
          in: ['PENDING', 'PARTIAL', 'OVERDUE'],
        },
        student: {
          currentClassId: classId,
        },
      },
      include: { student: true, feeStructure: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getOverduePayments(schoolId: string): Promise<FeePayment[]> {
    const today = new Date();
    return prisma.feePayment.findMany({
      where: {
        paymentStatus: 'OVERDUE',
        student: {
          user: {
            schoolId,
          },
        },
      },
      include: { student: true, feeStructure: true },
      orderBy: { paymentDate: 'asc' },
    });
  }

  async calculateTotalDues(studentId: string): Promise<Prisma.Decimal> {
    const payments = await this.getPendingDues(studentId);
    return payments.reduce((total, payment) => total.plus(payment.totalAmount), new Prisma.Decimal(0));
  }

  async calculateTotalCollected(schoolId: string, dateFrom?: Date, dateTo?: Date): Promise<Prisma.Decimal> {
    const where: Prisma.FeePaymentWhereInput = {
      paymentStatus: 'PAID',
      student: {
        user: {
          schoolId,
        },
      },
      ...(dateFrom && { paymentDate: { gte: dateFrom } }),
      ...(dateTo && { paymentDate: { lte: dateTo } }),
    };

    const payments = await prisma.feePayment.findMany({
      where,
      select: { totalAmount: true },
    });

    return payments.reduce((total, payment) => total.plus(payment.totalAmount), new Prisma.Decimal(0));
  }

  async updatePaymentStatus(id: string, status: PaymentStatus): Promise<FeePayment> {
    return prisma.feePayment.update({
      where: { id },
      data: { paymentStatus: status },
      include: { student: true, feeStructure: true },
    });
  }

  async recordPayment(data: RecordPaymentData): Promise<FeePayment> {
    return this.createPayment(data);
  }

  async getPaymentReport(schoolId: string, dateFrom: Date, dateTo: Date): Promise<any> {
    const payments = await prisma.feePayment.findMany({
      where: {
        paymentStatus: 'PAID',
        paymentDate: {
          gte: dateFrom,
          lte: dateTo,
        },
        student: {
          user: {
            schoolId,
          },
        },
      },
      include: { student: true, feeStructure: true, paidBy: true },
      orderBy: { paymentDate: 'desc' },
    });

    const totalCollected = payments.reduce(
      (sum, payment) => sum.plus(payment.totalAmount),
      new Prisma.Decimal(0)
    );
    const totalFees = payments.reduce((sum, payment) => sum.plus(payment.amount), new Prisma.Decimal(0));
    const totalDiscounts = payments.reduce((sum, payment) => sum.plus(payment.discount), new Prisma.Decimal(0));
    const totalLateFees = payments.reduce((sum, payment) => sum.plus(payment.lateFee), new Prisma.Decimal(0));

    return {
      payments,
      summary: {
        totalCollected,
        totalFees,
        totalDiscounts,
        totalLateFees,
        paymentCount: payments.length,
      },
    };
  }
}

export const paymentService = new PaymentService();
