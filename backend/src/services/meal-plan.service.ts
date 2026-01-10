import { PrismaClient, MealPlan, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

class MealPlanService {
  async create(data: {
    name: string;
    monthlyPrice: number;
    messId: string;
    schoolId: string;
    description?: string;
    annualPrice?: number;
    includeBreakfast?: boolean;
    includeLunch?: boolean;
    includeDinner?: boolean;
    includeSnacks?: boolean;
  }): Promise<MealPlan> {
    return prisma.mealPlan.create({
      data: {
        ...data,
        monthlyPrice: new Prisma.Decimal(data.monthlyPrice.toString()),
        annualPrice: data.annualPrice
          ? new Prisma.Decimal(data.annualPrice.toString())
          : undefined,
      },
      include: { mess: true },
    });
  }

  async getAll(filters: {
    messId?: string;
    schoolId?: string;
    isActive?: boolean;
  }): Promise<MealPlan[]> {
    return prisma.mealPlan.findMany({
      where: filters,
      include: { mess: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string): Promise<MealPlan | null> {
    return prisma.mealPlan.findUnique({
      where: { id },
      include: { mess: true, enrollments: true },
    });
  }

  async update(id: string, data: Partial<MealPlan>): Promise<MealPlan> {
    return prisma.mealPlan.update({
      where: { id },
      data: {
        ...data,
        monthlyPrice: data.monthlyPrice
          ? new Prisma.Decimal(data.monthlyPrice.toString())
          : undefined,
        annualPrice: data.annualPrice
          ? new Prisma.Decimal(data.annualPrice.toString())
          : undefined,
      },
      include: { mess: true },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.mealPlan.delete({ where: { id } });
  }

  async getByMess(messId: string): Promise<MealPlan[]> {
    return prisma.mealPlan.findMany({
      where: { messId, isActive: true },
    });
  }
}

export const mealPlanService = new MealPlanService();
