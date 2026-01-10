import { PrismaClient, Prisma, MessBillStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import {
  calculateProRataBaseCost,
  aggregateVariantCosts,
  aggregateExtraMealCosts,
  calculateTotalBill,
  getDaysInMonth,
  calculateEnrolledDays,
  validateMonthYear,
} from '../utils/billing-calculator';

const prisma = new PrismaClient();

export interface GenerateBillData {
  enrollmentId: string;
  month: number;
  year: number;
}

export interface BillFilters {
  enrollmentId?: string;
  messId?: string;
  schoolId?: string;
  status?: MessBillStatus;
  billingMonth?: number;
  billingYear?: number;
  studentId?: string;
}

export interface PaginationParams {
  skip?: number;
  take?: number;
}

export interface BillStats {
  totalBills: number;
  totalAmount: Decimal;
  paidAmount: Decimal;
  pendingAmount: Decimal;
  overdueAmount: Decimal;
  byStatus: Record<MessBillStatus, { count: number; amount: Decimal }>;
}

class MessBillService {
  /**
   * Generate bill for a single enrollment for a specific month/year
   * CRITICAL: This is the core billing engine - all bills flow through here
   *
   * Process:
   * 1. Validate month/year
   * 2. Check enrollment exists and is active (or was active during month)
   * 3. Check for existing bill (prevent duplicates via unique constraint)
   * 4. Get enrollment with plan and school details
   * 5. Calculate pro-rata enrolled days
   * 6. Calculate base cost (monthly price pro-rated)
   * 7. Query attendance records and aggregate variant costs
   * 8. Query extra meal bookings and aggregate costs
   * 9. Apply discount if any
   * 10. Calculate total bill amount
   * 11. Create bill record with PENDING status
   */
  async generateBill(data: GenerateBillData) {
    validateMonthYear(data.year, data.month);

    // 1. Verify enrollment exists
    const enrollment = await prisma.messEnrollment.findUnique({
      where: { id: data.enrollmentId },
      include: {
        plan: {
          include: {
            mess: true,
          },
        },
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    // 2. Verify enrollment was active during this month
    const monthStart = new Date(data.year, data.month - 1, 1);
    const monthEnd = new Date(data.year, data.month, 0);

    if (enrollment.endDate && enrollment.endDate < monthStart) {
      throw new Error('Enrollment had ended before this billing month');
    }

    if (enrollment.startDate > monthEnd) {
      throw new Error('Enrollment had not started during this billing month');
    }

    // 3. Check for existing bill (unique constraint)
    const existingBill = await prisma.messBill.findUnique({
      where: {
        enrollmentId_billingMonth_billingYear: {
          enrollmentId: data.enrollmentId,
          billingMonth: data.month,
          billingYear: data.year,
        },
      },
    });

    if (existingBill) {
      throw new Error(
        `Bill already exists for this enrollment for ${data.month}/${data.year}`
      );
    }

    // 4. Calculate enrolled days
    const totalDaysInMonth = getDaysInMonth(data.year, data.month);
    const enrolledDays = calculateEnrolledDays(enrollment, data.year, data.month);

    // 5. Calculate pro-rata base cost
    const monthlyPrice = new Decimal(enrollment.plan.monthlyPrice);
    const baseMealPlanCost = calculateProRataBaseCost(
      monthlyPrice,
      totalDaysInMonth,
      enrolledDays
    );

    // 6. Query and aggregate variant costs from attendance
    const attendances = await prisma.mealAttendance.findMany({
      where: {
        enrollmentId: data.enrollmentId,
        attendanceDate: {
          gte: new Date(data.year, data.month - 1, 1),
          lte: new Date(data.year, data.month, 0),
        },
      },
      include: {
        variant: true,
      },
    });

    const variantCosts = aggregateVariantCosts(attendances);

    // 7. Query and aggregate extra meal costs
    const extraMeals = await prisma.extraMealBooking.findMany({
      where: {
        enrollmentId: data.enrollmentId,
        mealDate: {
          gte: new Date(data.year, data.month - 1, 1),
          lte: new Date(data.year, data.month, 0),
        },
      },
    });

    const extraMealCosts = aggregateExtraMealCosts(extraMeals);

    // 8. Apply discount (currently 0, but allows for future discount rules)
    const discount = new Decimal(0);

    // 9. Calculate additional charges (variant + extra meals)
    const additionalCharges = variantCosts.plus(extraMealCosts);

    // 10. Calculate total bill amount
    const totalAmount = calculateTotalBill(
      baseMealPlanCost,
      variantCosts,
      extraMealCosts,
      discount
    );

    // 11. Create bill record
    const bill = await prisma.messBill.create({
      data: {
        enrollmentId: data.enrollmentId,
        schoolId: enrollment.plan.mess.schoolId,
        billingMonth: data.month,
        billingYear: data.year,
        baseMealPlanCost,
        additionalCharges,
        discount,
        totalAmount,
        status: 'PENDING',
      },
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

    return bill;
  }

  /**
   * Generate bills for all active enrollments in a mess for a specific month
   * Used for bulk billing at month-end
   */
  async generateBulkBills(messId: string, month: number, year: number) {
    validateMonthYear(year, month);

    // Get all enrollments for this mess
    const enrollments = await prisma.messEnrollment.findMany({
      where: {
        plan: {
          mess: {
            id: messId,
          },
        },
      },
    });

    const results = [];
    const errors = [];

    for (const enrollment of enrollments) {
      try {
        const bill = await this.generateBill({
          enrollmentId: enrollment.id,
          month,
          year,
        });
        results.push(bill);
      } catch (error: any) {
        errors.push({
          enrollmentId: enrollment.id,
          error: error.message,
        });
      }
    }

    return { successfulBills: results, errors };
  }

  /**
   * Get bills with filtering and pagination
   */
  async getBills(
    filters?: BillFilters,
    pagination?: PaginationParams
  ): Promise<{ data: any[]; total: number }> {
    const where: Prisma.MessBillWhereInput = {};

    if (filters?.enrollmentId) where.enrollmentId = filters.enrollmentId;
    if (filters?.schoolId) where.schoolId = filters.schoolId;
    if (filters?.status) where.status = filters.status;
    if (filters?.billingMonth) where.billingMonth = filters.billingMonth;
    if (filters?.billingYear) where.billingYear = filters.billingYear;

    if (filters?.messId) {
      where.enrollment = {
        plan: {
          mess: {
            id: filters.messId,
          },
        },
      };
    }

    const [data, total] = await Promise.all([
      prisma.messBill.findMany({
        where,
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
        skip: pagination?.skip || 0,
        take: pagination?.take || 50,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.messBill.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Get single bill by ID
   */
  async getBillById(id: string) {
    const bill = await prisma.messBill.findUnique({
      where: { id },
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

    return bill;
  }

  /**
   * Get bills for a specific enrollment
   */
  async getBillsByEnrollment(enrollmentId: string) {
    const bills = await prisma.messBill.findMany({
      where: { enrollmentId },
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
      orderBy: { createdAt: 'desc' },
    });

    return bills;
  }

  /**
   * Get bills by status
   */
  async getBillsByStatus(schoolId: string, status: MessBillStatus) {
    const bills = await prisma.messBill.findMany({
      where: {
        schoolId,
        status,
      },
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
      orderBy: { createdAt: 'desc' },
    });

    return bills;
  }

  /**
   * Get overdue bills (past due date unpaid)
   */
  async getOverdueBills(schoolId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const bills = await prisma.messBill.findMany({
      where: {
        schoolId,
        status: {
          in: ['PENDING', 'PARTIAL'],
        },
        createdAt: {
          lte: thirtyDaysAgo,
        },
      },
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
      orderBy: { createdAt: 'asc' },
    });

    return bills;
  }

  /**
   * Get outstanding amount for an enrollment
   * (Total bill amount - paid amount)
   */
  async getOutstandingBills(enrollmentId: string) {
    const bills = await prisma.messBill.findMany({
      where: {
        enrollmentId,
        status: {
          in: ['PENDING', 'PARTIAL'],
        },
      },
    });

    return bills;
  }

  /**
   * Update bill status
   */
  async updateBillStatus(id: string, status: MessBillStatus) {
    const bill = await prisma.messBill.update({
      where: { id },
      data: { status },
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
   * Mark bill as paid with payment amount and date
   */
  async markBillAsPaid(id: string, paidAmount: Decimal, paidDate?: Date) {
    const bill = await prisma.messBill.findUnique({
      where: { id },
    });

    if (!bill) {
      throw new Error('Bill not found');
    }

    const paidAmountDecimal = new Decimal(paidAmount);
    const billAmount = new Decimal(bill.totalAmount);

    // Determine status based on paid amount
    let newStatus: MessBillStatus;
    if (paidAmountDecimal.greaterThanOrEqualTo(billAmount)) {
      newStatus = 'PAID';
    } else {
      newStatus = 'PARTIAL';
    }

    const updated = await prisma.messBill.update({
      where: { id },
      data: {
        status: newStatus,
        paidAmount: paidAmountDecimal,
        paidDate: paidDate || new Date(),
        updatedAt: new Date(),
      },
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

    return updated;
  }

  /**
   * Mark bill as partial payment
   */
  async markBillAsPartial(id: string, paidAmount: Decimal) {
    const updated = await prisma.messBill.update({
      where: { id },
      data: {
        status: 'PARTIAL',
        paidAmount: new Decimal(paidAmount),
        paidDate: new Date(),
        updatedAt: new Date(),
      },
      include: {
        enrollment: {
          include: {
            student: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Cancel bill (useful for corrections/adjustments)
   */
  async cancelBill(id: string) {
    const updated = await prisma.messBill.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date(),
      },
      include: {
        enrollment: {
          include: {
            student: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Get bill statistics for a school
   */
  async getBillStats(schoolId: string): Promise<BillStats> {
    const bills = await prisma.messBill.findMany({
      where: { schoolId },
    });

    const stats: BillStats = {
      totalBills: bills.length,
      totalAmount: new Decimal(0),
      paidAmount: new Decimal(0),
      pendingAmount: new Decimal(0),
      overdueAmount: new Decimal(0),
      byStatus: {
        PENDING: { count: 0, amount: new Decimal(0) },
        PAID: { count: 0, amount: new Decimal(0) },
        PARTIAL: { count: 0, amount: new Decimal(0) },
        OVERDUE: { count: 0, amount: new Decimal(0) },
        CANCELLED: { count: 0, amount: new Decimal(0) },
      },
    };

    for (const bill of bills) {
      const billAmount = new Decimal(bill.totalAmount);
      const paidAmt = bill.paidAmount ? new Decimal(bill.paidAmount) : new Decimal(0);

      stats.totalAmount = stats.totalAmount.plus(billAmount);
      stats.paidAmount = stats.paidAmount.plus(paidAmt);

      if (bill.status !== 'CANCELLED') {
        if (bill.status === 'PENDING' || bill.status === 'PARTIAL') {
          stats.pendingAmount = stats.pendingAmount.plus(billAmount.minus(paidAmt));
        }
      }

      stats.byStatus[bill.status].count += 1;
      stats.byStatus[bill.status].amount = stats.byStatus[bill.status].amount.plus(
        billAmount
      );
    }

    return stats;
  }
}

export const messBillService = new MessBillService();
