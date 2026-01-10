import { PrismaClient, FoodItem, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

class FoodItemService {
  async create(data: {
    name: string;
    category: string;
    costPerUnit: number;
    unit: string;
    schoolId: string;
    description?: string;
    caloriesPer100g?: number;
    proteinPer100g?: number;
    carbsPer100g?: number;
    fatPer100g?: number;
    storageInstructions?: string;
    shelfLifeDays?: number;
    allergenIds?: string[];
  }): Promise<FoodItem> {
    const { allergenIds, ...createData } = data;

    const foodItem = await prisma.foodItem.create({
      data: {
        ...createData,
        costPerUnit: new Prisma.Decimal(data.costPerUnit.toString()),
        caloriesPer100g: data.caloriesPer100g
          ? new Prisma.Decimal(data.caloriesPer100g.toString())
          : undefined,
        proteinPer100g: data.proteinPer100g
          ? new Prisma.Decimal(data.proteinPer100g.toString())
          : undefined,
        carbsPer100g: data.carbsPer100g
          ? new Prisma.Decimal(data.carbsPer100g.toString())
          : undefined,
        fatPer100g: data.fatPer100g ? new Prisma.Decimal(data.fatPer100g.toString()) : undefined,
      },
    });

    // Link allergens if provided
    if (allergenIds && allergenIds.length > 0) {
      for (const allergenId of allergenIds) {
        await prisma.foodItemAllergen.create({
          data: {
            foodItemId: foodItem.id,
            allergenId,
          },
        });
      }
    }

    return foodItem;
  }

  async getAll(filters: {
    schoolId: string;
    category?: string;
    search?: string;
    isActive?: boolean;
  }): Promise<FoodItem[]> {
    const where: any = { schoolId: filters.schoolId };

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return prisma.foodItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string): Promise<FoodItem | null> {
    return prisma.foodItem.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: Partial<FoodItem>): Promise<FoodItem> {
    return prisma.foodItem.update({
      where: { id },
      data: {
        ...data,
        costPerUnit: data.costPerUnit
          ? new Prisma.Decimal(data.costPerUnit.toString())
          : undefined,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.foodItem.delete({ where: { id } });
  }

  async getByCategory(schoolId: string, category: string): Promise<FoodItem[]> {
    return prisma.foodItem.findMany({
      where: { schoolId, category, isActive: true },
    });
  }

  async getWithAllergens(schoolId: string): Promise<
    (FoodItem & { allergens: Array<{ name: string; severity: string }> })[]
  > {
    const items = await prisma.foodItem.findMany({
      where: { schoolId, isActive: true },
      include: {
        allergens: {
          include: {
            allergen: {
              select: {
                name: true,
                severity: true,
              },
            },
          },
        },
      },
    });

    // Map allergen relationships to names
    return items.map(item => ({
      ...item,
      allergens: item.allergens.map(link => ({
        name: link.allergen.name,
        severity: link.allergen.severity,
      })),
    }));
  }
}

export const foodItemService = new FoodItemService();
