import { PrismaClient, FeedbackRating } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateFeedbackData {
  mealId: string;
  studentId: string;
  schoolId: string;
  rating: FeedbackRating;
  comments?: string;
}

export interface UpdateFeedbackData {
  rating?: FeedbackRating;
  comments?: string;
}

export interface FeedbackFilters {
  mealId?: string;
  studentId?: string;
  schoolId?: string;
  rating?: FeedbackRating;
  skip?: number;
  take?: number;
}

export interface FeedbackStats {
  totalFeedbacks: number;
  excellentCount: number;
  goodCount: number;
  averageCount: number;
  poorCount: number;
  averageRating: number;
}

class FeedbackService {
  /**
   * Create new meal feedback
   */
  async createFeedback(data: CreateFeedbackData) {
    try {
      const feedback = await prisma.mealFeedback.create({
        data: {
          mealId: data.mealId,
          studentId: data.studentId,
          schoolId: data.schoolId,
          rating: data.rating,
          comments: data.comments,
        },
        include: {
          meal: true,
          student: true,
          actions: true,
        },
      });

      return feedback;
    } catch (error: any) {
      throw new Error(`Failed to create feedback: ${error.message}`);
    }
  }

  /**
   * Get all feedback with filters
   */
  async getFeedback(filters?: FeedbackFilters) {
    try {
      const where: any = {};

      if (filters?.schoolId) {
        where.schoolId = filters.schoolId;
      }
      if (filters?.mealId) {
        where.mealId = filters.mealId;
      }
      if (filters?.studentId) {
        where.studentId = filters.studentId;
      }
      if (filters?.rating) {
        where.rating = filters.rating;
      }

      const [data, total] = await Promise.all([
        prisma.mealFeedback.findMany({
          where,
          include: {
            meal: true,
            student: true,
            actions: true,
          },
          skip: filters?.skip,
          take: filters?.take,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.mealFeedback.count({ where }),
      ]);

      return { data, total };
    } catch (error: any) {
      throw new Error(`Failed to fetch feedback: ${error.message}`);
    }
  }

  /**
   * Get feedback by ID
   */
  async getFeedbackById(id: string) {
    try {
      const feedback = await prisma.mealFeedback.findUnique({
        where: { id },
        include: {
          meal: true,
          student: true,
          actions: true,
        },
      });

      if (!feedback) {
        throw new Error('Feedback not found');
      }

      return feedback;
    } catch (error: any) {
      throw new Error(`Failed to fetch feedback: ${error.message}`);
    }
  }

  /**
   * Update feedback
   */
  async updateFeedback(id: string, data: UpdateFeedbackData) {
    try {
      const feedback = await prisma.mealFeedback.update({
        where: { id },
        data: {
          rating: data.rating,
          comments: data.comments,
        },
        include: {
          meal: true,
          student: true,
          actions: true,
        },
      });

      return feedback;
    } catch (error: any) {
      throw new Error(`Failed to update feedback: ${error.message}`);
    }
  }

  /**
   * Delete feedback
   */
  async deleteFeedback(id: string) {
    try {
      const feedback = await prisma.mealFeedback.delete({
        where: { id },
        include: {
          meal: true,
          student: true,
        },
      });

      return feedback;
    } catch (error: any) {
      throw new Error(`Failed to delete feedback: ${error.message}`);
    }
  }

  /**
   * Get feedback stats for a meal
   */
  async getMealFeedbackStats(mealId: string) {
    try {
      const feedbacks = await prisma.mealFeedback.findMany({
        where: { mealId },
      });

      const stats = {
        totalFeedbacks: feedbacks.length,
        excellentCount: feedbacks.filter((f) => f.rating === 'EXCELLENT').length,
        goodCount: feedbacks.filter((f) => f.rating === 'GOOD').length,
        averageCount: feedbacks.filter((f) => f.rating === 'AVERAGE').length,
        poorCount: feedbacks.filter((f) => f.rating === 'POOR').length,
        averageRating: this.calculateAverageRating(feedbacks),
      };

      return stats;
    } catch (error: any) {
      throw new Error(`Failed to fetch feedback stats: ${error.message}`);
    }
  }

  /**
   * Get feedback stats for school
   */
  async getSchoolFeedbackStats(schoolId: string): Promise<FeedbackStats> {
    try {
      const feedbacks = await prisma.mealFeedback.findMany({
        where: { schoolId },
      });

      const stats = {
        totalFeedbacks: feedbacks.length,
        excellentCount: feedbacks.filter((f) => f.rating === 'EXCELLENT').length,
        goodCount: feedbacks.filter((f) => f.rating === 'GOOD').length,
        averageCount: feedbacks.filter((f) => f.rating === 'AVERAGE').length,
        poorCount: feedbacks.filter((f) => f.rating === 'POOR').length,
        averageRating: this.calculateAverageRating(feedbacks),
      };

      return stats;
    } catch (error: any) {
      throw new Error(`Failed to fetch school feedback stats: ${error.message}`);
    }
  }

  /**
   * Get feedback by meal variant (for quality tracking)
   */
  async getFeedbackByMealVariant(mealVariantId: string, filters?: FeedbackFilters) {
    try {
      const where: any = {
        meal: {
          mealVariants: {
            some: {
              id: mealVariantId,
            },
          },
        },
      };

      if (filters?.schoolId) {
        where.schoolId = filters.schoolId;
      }

      const [data, total] = await Promise.all([
        prisma.mealFeedback.findMany({
          where,
          include: {
            meal: true,
            student: true,
            actions: true,
          },
          skip: filters?.skip,
          take: filters?.take,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        prisma.mealFeedback.count({ where }),
      ]);

      return { data, total };
    } catch (error: any) {
      throw new Error(`Failed to fetch variant feedback: ${error.message}`);
    }
  }

  /**
   * Calculate average rating from feedbacks
   */
  private calculateAverageRating(feedbacks: any[]): number {
    if (feedbacks.length === 0) return 0;

    const ratingValues: Record<string, number> = {
      POOR: 1,
      AVERAGE: 2,
      GOOD: 3,
      EXCELLENT: 4,
    };

    const sum = feedbacks.reduce((acc: number, feedback: any) => {
      return acc + ratingValues[feedback.rating];
    }, 0);

    return Math.round((sum / feedbacks.length) * 100) / 100;
  }

  /**
   * Get recent feedback
   */
  async getRecentFeedback(schoolId: string, limit: number = 10) {
    try {
      const feedback = await prisma.mealFeedback.findMany({
        where: { schoolId },
        include: {
          meal: true,
          student: true,
          actions: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });

      return feedback;
    } catch (error: any) {
      throw new Error(`Failed to fetch recent feedback: ${error.message}`);
    }
  }

  /**
   * Get feedback for student
   */
  async getStudentFeedback(studentId: string, schoolId: string) {
    try {
      const feedback = await prisma.mealFeedback.findMany({
        where: {
          studentId,
          schoolId,
        },
        include: {
          meal: true,
          actions: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return feedback;
    } catch (error: any) {
      throw new Error(`Failed to fetch student feedback: ${error.message}`);
    }
  }
}

export const feedbackService = new FeedbackService();
