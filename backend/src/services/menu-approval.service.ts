import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface MenuApproval {
  id: string;
  menuId: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedBy?: string;
  submittedDate?: Date;
  approvedBy?: string;
  approvalDate?: Date;
  rejectionReason?: string;
  nutritionalSummary?: {
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    perServingCalories: number;
  };
  allergenWarnings: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMenuApprovalDto {
  menuId: string;
  submittedBy?: string;
  nutritionalSummary?: any;
  allergenWarnings?: string[];
  notes?: string;
}

class MenuApprovalService {
  async getAll(filters?: {
    status?: string;
    menuId?: string;
    schoolId?: string;
  }): Promise<{ data: MenuApproval[]; total: number }> {
    const where: Prisma.MenuApprovalWhereInput = {};

    if (filters?.status) where.status = filters.status as any;
    if (filters?.menuId) where.menuId = filters.menuId;

    const [data, total] = await Promise.all([
      prisma.menuApproval.findMany({
        where,
        include: {
          menu: {
            select: {
              id: true,
              date: true,
              mess: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.menuApproval.count({ where }),
    ]);

    return { data: data as any, total };
  }

  async getById(id: string): Promise<MenuApproval | null> {
    const approval = await prisma.menuApproval.findUnique({
      where: { id },
      include: {
        menu: {
          include: {
            meals: {
              include: {
                variants: {
                  include: {
                    recipe: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    return approval as any;
  }

  async getByMenu(menuId: string): Promise<MenuApproval | null> {
    const approval = await prisma.menuApproval.findUnique({
      where: { menuId },
    });
    return approval as any;
  }

  async getPending(schoolId?: string): Promise<MenuApproval[]> {
    const approvals = await prisma.menuApproval.findMany({
      where: {
        status: 'PENDING_APPROVAL',
      },
      include: {
        menu: {
          select: {
            id: true,
            date: true,
            mess: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    return approvals as any;
  }

  /**
   * Submit menu for approval
   */
  async submit(menuId: string, submittedBy: string, schoolId: string): Promise<MenuApproval> {
    const approval = await prisma.menuApproval.create({
      data: {
        menuId,
        schoolId,
        status: 'PENDING_APPROVAL',
        proposedDate: new Date(),
        reviewNotes: submittedBy,
      },
      include: {
        menu: true,
      },
    });

    // Update menu status
    await prisma.menu.update({
      where: { id: menuId },
      data: { status: 'PENDING_APPROVAL' },
    });

    return approval as any;
  }

  /**
   * Approve menu
   */
  async approve(
    approvalId: string,
    approverName: string,
    notes?: string
  ): Promise<MenuApproval> {
    const approval = await prisma.menuApproval.update({
      where: { id: approvalId },
      data: {
        status: 'APPROVED',
        approverName,
        approvalDate: new Date(),
        approvalNotes: notes,
      },
      include: {
        menu: true,
      },
    });

    // Update menu status
    await prisma.menu.update({
      where: { id: approval.menuId },
      data: { status: 'APPROVED' },
    });

    return approval as any;
  }

  /**
   * Reject menu
   */
  async reject(
    approvalId: string,
    rejectionReason: string,
    approverName: string
  ): Promise<MenuApproval> {
    const approval = await prisma.menuApproval.update({
      where: { id: approvalId },
      data: {
        status: 'REJECTED',
        approvalNotes: rejectionReason,
        approverName,
        approvalDate: new Date(),
      },
      include: {
        menu: true,
      },
    });

    // Update menu status
    await prisma.menu.update({
      where: { id: approval.menuId },
      data: { status: 'REJECTED' },
    });

    return approval as any;
  }

  /**
   * Calculate and update nutritional summary for menu
   */
  async calculateNutritionSummary(menuId: string): Promise<any> {
    const menu = await prisma.menu.findUnique({
      where: { id: menuId },
      include: {
        meals: {
          include: {
            variants: {
              include: {
                recipe: {
                  include: {
                    ingredients: {
                      include: {
                        foodItem: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!menu) throw new Error('Menu not found');

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let recipeCount = 0;

    for (const meal of menu.meals) {
      for (const variant of meal.variants) {
        if (variant.recipe) {
          const recipe = variant.recipe;
          const servings = recipe.servings || 1;

          // Aggregate from food items
          for (const ingredient of recipe.ingredients) {
            const cals = typeof ingredient.foodItem.caloriesPer100g === 'number' ? ingredient.foodItem.caloriesPer100g : (ingredient.foodItem.caloriesPer100g?.toNumber() || 0);
            const protein = typeof ingredient.foodItem.proteinPer100g === 'number' ? ingredient.foodItem.proteinPer100g : (ingredient.foodItem.proteinPer100g?.toNumber() || 0);
            const carbs = typeof ingredient.foodItem.carbsPer100g === 'number' ? ingredient.foodItem.carbsPer100g : (ingredient.foodItem.carbsPer100g?.toNumber() || 0);
            const fat = typeof ingredient.foodItem.fatPer100g === 'number' ? ingredient.foodItem.fatPer100g : (ingredient.foodItem.fatPer100g?.toNumber() || 0);
            const qty = typeof ingredient.quantity === 'number' ? ingredient.quantity : (ingredient.quantity?.toNumber() || 0);
            totalCalories += cals * qty / 100;
            totalProtein += protein * qty / 100;
            totalCarbs += carbs * qty / 100;
            totalFat += fat * qty / 100;
          }
          recipeCount++;
        }
      }
    }

    const summary = {
      totalCalories: Math.round(totalCalories),
      totalProtein: Math.round(totalProtein * 10) / 10,
      totalCarbs: Math.round(totalCarbs * 10) / 10,
      totalFat: Math.round(totalFat * 10) / 10,
      perServingCalories: recipeCount > 0 ? Math.round(totalCalories / recipeCount) : 0,
    };

    return summary;
  }

  /**
   * Identify allergen warnings for menu
   */
  async identifyAllergenWarnings(menuId: string): Promise<string[]> {
    const menu = await prisma.menu.findUnique({
      where: { id: menuId },
      include: {
        meals: {
          include: {
            variants: {
              include: {
                recipe: {
                  include: {
                    ingredients: {
                      include: {
                        foodItem: {
                          include: {
                            allergens: {
                              include: {
                                allergen: {
                                  select: { name: true, severity: true },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!menu) throw new Error('Menu not found');

    const warnings = new Set<string>();

    for (const meal of menu.meals) {
      for (const variant of meal.variants) {
        if (variant.recipe) {
          for (const ingredient of variant.recipe.ingredients) {
            if (ingredient.foodItem.allergens && ingredient.foodItem.allergens.length > 0) {
              for (const allergenLink of ingredient.foodItem.allergens) {
                if (allergenLink.allergen.severity === 'SEVERE' || allergenLink.allergen.severity === 'ANAPHYLAXIS') {
                  warnings.add(`WARNING: ${allergenLink.allergen.name} (${allergenLink.allergen.severity}) detected`);
                }
              }
            }
          }
        }
      }
    }

    return Array.from(warnings);
  }

  /**
   * Can this menu be served? Check approval status and hygiene
   */
  async canServe(menuId: string): Promise<{ allowed: boolean; reason: string }> {
    const menu = await prisma.menu.findUnique({
      where: { id: menuId },
    });

    if (!menu) {
      return { allowed: false, reason: 'Menu not found' };
    }

    if (menu.status !== 'APPROVED') {
      return {
        allowed: false,
        reason: `Menu status is ${menu.status}. Only APPROVED menus can be served.`,
      };
    }

    // Check hygiene for this mess
    const { allowed, reason } = await this.checkMessHygiene(menu.messId);
    return { allowed, reason };
  }

  /**
   * Check if mess has passed today's hygiene check
   */
  private async checkMessHygiene(messId: string): Promise<{ allowed: boolean; reason: string }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCheck = await prisma.kitchenHygieneChecklist.findFirst({
      where: {
        messId,
        checkDate: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    if (!todayCheck) {
      return {
        allowed: false,
        reason: 'No hygiene check completed today. Cannot serve food.',
      };
    }

    if (todayCheck.status === 'FAIL') {
      return {
        allowed: false,
        reason: 'Hygiene check failed today. Cannot serve food.',
      };
    }

    return {
      allowed: true,
      reason: 'Hygiene check passed.',
    };
  }

  async delete(id: string): Promise<void> {
    await prisma.menuApproval.delete({
      where: { id },
    });
  }
}

export const menuApprovalService = new MenuApprovalService();
