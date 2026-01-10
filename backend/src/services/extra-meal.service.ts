import { PrismaClient, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

export interface BookExtraMealData {
  enrollmentId: string;
  mealDate: Date;
  quantity: number;
  unitCost: Decimal | number;
  schoolId: string;
}

export interface UpdateExtraMealData {
  quantity?: number;
  unitCost?: Decimal | number;
  status?: string;
}

export interface ExtraMealFilters {
  enrollmentId?: string;
  schoolId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
}

export interface PaginationParams {
  skip?: number;
  take?: number;
}

class ExtraMealService {
  /**
   * Book extra meal(s) for a student
   * Extra meals are meals booked outside the regular enrollment
   */
  async bookExtraMeal(data: BookExtraMealData) {
    // Verify enrollment exists
    const enrollment = await prisma.messEnrollment.findUnique({
      where: { id: data.enrollmentId },
      include: {
        plan: {
          include: {
            mess: true,
          },
        },
      },
    });

    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    // Calculate total cost
    const unitCost = new Decimal(data.unitCost);
    const totalCost = unitCost.times(new Decimal(data.quantity));

    const extraMeal = await prisma.extraMealBooking.create({
      data: {
        enrollmentId: data.enrollmentId,
        bookingDate: new Date(),
        mealDate: data.mealDate,
        quantity: data.quantity,
        unitCost,
        totalCost,
        status: 'PENDING',
        schoolId: data.schoolId,
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

    return extraMeal;
  }

  /**
   * Book multiple extra meals in bulk
   */
  async bulkBookExtraMeals(bookings: BookExtraMealData[]) {
    const results = [];
    const errors = [];

    for (const booking of bookings) {
      try {
        const result = await this.bookExtraMeal(booking);
        results.push(result);
      } catch (error: any) {
        errors.push({
          booking,
          error: error.message,
        });
      }
    }

    return { successful: results, failed: errors };
  }

  /**
   * Get extra meal bookings with filters and pagination
   */
  async getExtraMeals(
    filters?: ExtraMealFilters,
    pagination?: PaginationParams
  ): Promise<{ data: any[]; total: number }> {
    const where: Prisma.ExtraMealBookingWhereInput = {};

    if (filters?.enrollmentId) where.enrollmentId = filters.enrollmentId;
    if (filters?.schoolId) where.schoolId = filters.schoolId;
    if (filters?.status) where.status = filters.status;

    if (filters?.startDate || filters?.endDate) {
      where.mealDate = {};
      if (filters?.startDate) where.mealDate.gte = filters.startDate;
      if (filters?.endDate) where.mealDate.lte = filters.endDate;
    }

    const [data, total] = await Promise.all([
      prisma.extraMealBooking.findMany({
        where,
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
        skip: pagination?.skip || 0,
        take: pagination?.take || 50,
        orderBy: { mealDate: 'desc' },
      }),
      prisma.extraMealBooking.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Get single extra meal booking
   */
  async getExtraMealById(id: string) {
    const booking = await prisma.extraMealBooking.findUnique({
      where: { id },
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

    return booking;
  }

  /**
   * Get extra meals for an enrollment
   */
  async getExtraMealsByEnrollment(enrollmentId: string) {
    const bookings = await prisma.extraMealBooking.findMany({
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
      orderBy: { mealDate: 'desc' },
    });

    return bookings;
  }

  /**
   * Get extra meals for an enrollment in a specific month
   */
  async getExtraMealsByMonth(enrollmentId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const bookings = await prisma.extraMealBooking.findMany({
      where: {
        enrollmentId,
        mealDate: {
          gte: startDate,
          lte: endDate,
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
      orderBy: { mealDate: 'asc' },
    });

    return bookings;
  }

  /**
   * Update extra meal booking
   */
  async updateExtraMeal(id: string, data: UpdateExtraMealData) {
    const booking = await prisma.extraMealBooking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Recalculate total cost if quantity or unit cost changed
    let totalCost = booking.totalCost;
    if (data.quantity !== undefined || data.unitCost !== undefined) {
      const quantity = new Decimal(data.quantity ?? booking.quantity);
      const unitCost = new Decimal(data.unitCost ?? booking.unitCost);
      totalCost = quantity.times(unitCost);
    }

    const updated = await prisma.extraMealBooking.update({
      where: { id },
      data: {
        quantity: data.quantity,
        unitCost: data.unitCost ? new Decimal(data.unitCost) : undefined,
        totalCost,
        status: data.status,
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
   * Cancel extra meal booking
   */
  async cancelExtraMeal(id: string) {
    const updated = await prisma.extraMealBooking.update({
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
   * Get monthly cost summary for extra meals
   */
  async getMonthlyExtraMealCost(
    enrollmentId: string,
    month: number,
    year: number
  ) {
    const bookings = await this.getExtraMealsByMonth(enrollmentId, month, year);

    const totalCost = bookings.reduce((sum, booking) => {
      return sum.plus(new Decimal(booking.totalCost));
    }, new Decimal(0));

    const totalQuantity = bookings.reduce((sum, booking) => {
      return sum + booking.quantity;
    }, 0);

    return {
      enrollmentId,
      month,
      year,
      totalQuantity,
      totalCost,
      bookings,
    };
  }

  /**
   * Confirm/approve extra meal booking (status PENDING -> APPROVED)
   */
  async approveExtraMeal(id: string) {
    const updated = await prisma.extraMealBooking.update({
      where: { id },
      data: {
        status: 'APPROVED',
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
   * Mark extra meal as served
   */
  async markAsServed(id: string) {
    const updated = await prisma.extraMealBooking.update({
      where: { id },
      data: {
        status: 'SERVED',
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
}

export const extraMealService = new ExtraMealService();
