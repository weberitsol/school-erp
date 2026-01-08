import { PrismaClient, PerformanceReview, Decimal } from '@prisma/client';

const prisma = new PrismaClient();

interface PerformanceReviewFilters {
  employeeId?: string;
  reviewCycleId?: string;
  year?: number;
  quarter?: number;
}

interface CreatePerformanceReviewData {
  employeeId: string;
  reviewCycleId: string;
  reviewPeriod: string;
  year: number;
  quarter?: number;
  technicalSkills: number; // 1-5
  communication: number; // 1-5
  teamwork: number; // 1-5
  initiative: number; // 1-5
  reliability: number; // 1-5
  customerService?: number; // 1-5
  strengths?: string;
  weaknesses?: string;
  developmentAreas?: string;
  comments?: string;
  reviewedById: string;
  reviewDate: Date;
  trainingNeeded?: string;
  promotionEligible?: boolean;
  raisesPercentage?: number;
}

interface UpdatePerformanceReviewData {
  technicalSkills?: number;
  communication?: number;
  teamwork?: number;
  initiative?: number;
  reliability?: number;
  customerService?: number;
  strengths?: string;
  weaknesses?: string;
  developmentAreas?: string;
  comments?: string;
  trainingNeeded?: string;
  promotionEligible?: boolean;
  raisesPercentage?: number;
}

interface PaginationParams {
  page?: number;
  limit?: number;
}

class PerformanceReviewService {
  private calculateOverallRating(
    technicalSkills: number,
    communication: number,
    teamwork: number,
    initiative: number,
    reliability: number,
    customerService?: number
  ): Decimal {
    const ratings = [technicalSkills, communication, teamwork, initiative, reliability];

    if (customerService) {
      ratings.push(customerService);
    }

    const sum = ratings.reduce((a, b) => a + b, 0);
    const average = sum / ratings.length;

    return new Decimal(average.toFixed(2));
  }

  async createPerformanceReview(
    data: CreatePerformanceReviewData
  ): Promise<PerformanceReview> {
    // Verify employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: data.employeeId },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Verify review cycle exists
    const reviewCycle = await prisma.reviewCycle.findUnique({
      where: { id: data.reviewCycleId },
    });

    if (!reviewCycle) {
      throw new Error('Review cycle not found');
    }

    // Verify reviewer exists
    const reviewer = await prisma.user.findUnique({
      where: { id: data.reviewedById },
    });

    if (!reviewer) {
      throw new Error('Reviewer not found');
    }

    // Check if review already exists for this cycle
    const existing = await prisma.performanceReview.findUnique({
      where: {
        employeeId_reviewCycleId: {
          employeeId: data.employeeId,
          reviewCycleId: data.reviewCycleId,
        },
      },
    });

    if (existing) {
      throw new Error('Performance review already exists for this cycle');
    }

    // Validate ratings
    const ratings = [
      data.technicalSkills,
      data.communication,
      data.teamwork,
      data.initiative,
      data.reliability,
    ];

    if (data.customerService) {
      ratings.push(data.customerService);
    }

    for (const rating of ratings) {
      if (rating < 1 || rating > 5) {
        throw new Error('Ratings must be between 1 and 5');
      }
    }

    const overallRating = this.calculateOverallRating(
      data.technicalSkills,
      data.communication,
      data.teamwork,
      data.initiative,
      data.reliability,
      data.customerService
    );

    return prisma.performanceReview.create({
      data: {
        employeeId: data.employeeId,
        reviewCycleId: data.reviewCycleId,
        reviewPeriod: data.reviewPeriod,
        year: data.year,
        quarter: data.quarter,
        technicalSkills: data.technicalSkills,
        communication: data.communication,
        teamwork: data.teamwork,
        initiative: data.initiative,
        reliability: data.reliability,
        customerService: data.customerService,
        overallRating,
        strengths: data.strengths,
        weaknesses: data.weaknesses,
        developmentAreas: data.developmentAreas,
        comments: data.comments,
        reviewedById: data.reviewedById,
        reviewDate: data.reviewDate,
        trainingNeeded: data.trainingNeeded,
        promotionEligible: data.promotionEligible || false,
        raisesPercentage: data.raisesPercentage
          ? new Decimal(data.raisesPercentage)
          : null,
      },
      include: {
        employee: true,
        reviewCycle: true,
        reviewedBy: true,
      },
    });
  }

  async getPerformanceReviews(
    filters: PerformanceReviewFilters,
    pagination?: PaginationParams
  ): Promise<{ data: PerformanceReview[]; total: number }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.reviewCycleId) where.reviewCycleId = filters.reviewCycleId;
    if (filters.year) where.year = filters.year;
    if (filters.quarter) where.quarter = filters.quarter;

    const [data, total] = await Promise.all([
      prisma.performanceReview.findMany({
        where,
        skip,
        take: limit,
        include: {
          employee: true,
          reviewCycle: true,
          reviewedBy: true,
        },
        orderBy: { reviewDate: 'desc' },
      }),
      prisma.performanceReview.count({ where }),
    ]);

    return { data, total };
  }

  async getPerformanceReviewById(id: string): Promise<PerformanceReview | null> {
    return prisma.performanceReview.findUnique({
      where: { id },
      include: {
        employee: true,
        reviewCycle: true,
        reviewedBy: true,
      },
    });
  }

  async updatePerformanceReview(
    id: string,
    data: UpdatePerformanceReviewData
  ): Promise<PerformanceReview> {
    const review = await prisma.performanceReview.findUnique({
      where: { id },
    });

    if (!review) {
      throw new Error('Performance review not found');
    }

    const updateData: any = { ...data };

    // Recalculate overall rating if any rating is updated
    if (
      data.technicalSkills ||
      data.communication ||
      data.teamwork ||
      data.initiative ||
      data.reliability ||
      data.customerService
    ) {
      const overallRating = this.calculateOverallRating(
        data.technicalSkills || review.technicalSkills,
        data.communication || review.communication,
        data.teamwork || review.teamwork,
        data.initiative || review.initiative,
        data.reliability || review.reliability,
        data.customerService || review.customerService || undefined
      );

      updateData.overallRating = overallRating;
    }

    return prisma.performanceReview.update({
      where: { id },
      data: updateData,
      include: {
        employee: true,
        reviewCycle: true,
        reviewedBy: true,
      },
    });
  }

  async getEmployeePerformanceReviews(employeeId: string): Promise<PerformanceReview[]> {
    return prisma.performanceReview.findMany({
      where: { employeeId },
      include: {
        reviewCycle: true,
        reviewedBy: true,
      },
      orderBy: { reviewDate: 'desc' },
    });
  }

  async getPromotionEligibleEmployees(): Promise<PerformanceReview[]> {
    return prisma.performanceReview.findMany({
      where: { promotionEligible: true },
      include: {
        employee: true,
        reviewCycle: true,
        reviewedBy: true,
      },
      orderBy: { overallRating: 'desc' },
    });
  }

  async getEmployeePerformanceTrend(
    employeeId: string
  ): Promise<Array<{ reviewPeriod: string; overallRating: Decimal }>> {
    const reviews = await this.getEmployeePerformanceReviews(employeeId);

    return reviews.map(review => ({
      reviewPeriod: review.reviewPeriod,
      overallRating: review.overallRating,
    }));
  }

  async getCyclePerformanceStats(
    reviewCycleId: string
  ): Promise<{
    totalReviews: number;
    averageRating: Decimal;
    highestRating: Decimal;
    lowestRating: Decimal;
    promotionEligibleCount: number;
  }> {
    const reviews = await prisma.performanceReview.findMany({
      where: { reviewCycleId },
    });

    if (reviews.length === 0) {
      return {
        totalReviews: 0,
        averageRating: new Decimal(0),
        highestRating: new Decimal(0),
        lowestRating: new Decimal(0),
        promotionEligibleCount: 0,
      };
    }

    const ratings = reviews.map(r => r.overallRating.toNumber());
    const sum = ratings.reduce((a, b) => a + b, 0);
    const averageRating = new Decimal((sum / ratings.length).toFixed(2));

    const highestRating = new Decimal(Math.max(...ratings));
    const lowestRating = new Decimal(Math.min(...ratings));
    const promotionEligibleCount = reviews.filter(r => r.promotionEligible).length;

    return {
      totalReviews: reviews.length,
      averageRating,
      highestRating,
      lowestRating,
      promotionEligibleCount,
    };
  }

  async getDepartmentPerformanceStats(
    departmentId: string
  ): Promise<{
    departmentId: string;
    averageRating: Decimal;
    employeeCount: number;
  }> {
    const reviews = await prisma.performanceReview.findMany({
      where: {
        employee: {
          departmentId,
        },
      },
    });

    if (reviews.length === 0) {
      return {
        departmentId,
        averageRating: new Decimal(0),
        employeeCount: 0,
      };
    }

    const ratings = reviews.map(r => r.overallRating.toNumber());
    const sum = ratings.reduce((a, b) => a + b, 0);
    const averageRating = new Decimal((sum / ratings.length).toFixed(2));

    const employeeCount = new Set(reviews.map(r => r.employeeId)).size;

    return {
      departmentId,
      averageRating,
      employeeCount,
    };
  }
}

export const performanceReviewService = new PerformanceReviewService();
