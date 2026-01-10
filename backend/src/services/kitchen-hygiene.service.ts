import { PrismaClient, Prisma, HygieneCheckStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface KitchenHygieneChecklist {
  id: string;
  messId: string;
  checkDate: Date;
  inspectorName: string | null;
  inspectorSignature: string | null;
  status: HygieneCheckStatus;
  // Checklist Items (scored 0-50 each)
  cleanlinessScore: number;
  temperatureControlScore: number;
  equipmentMaintenanceScore: number;
  storageConditionsScore: number;
  waterQualityScore: number;
  wasteManagementScore: number;
  staffHygieneScore: number;
  staffLunchAssistantScore: number;
  // Overall
  overallScore: number; // 0-50, calculated from average of above
  issuesIdentified: string[];
  correctionDeadline: Date | null;
  correctionStatus: string | null;
  photosUrl: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateKitchenHygieneDto {
  messId: string;
  checkDate: Date;
  inspectorName?: string;
  inspectorSignature?: string;
  cleanlinessScore: number;
  temperatureControlScore: number;
  equipmentMaintenanceScore: number;
  storageConditionsScore: number;
  waterQualityScore: number;
  wasteManagementScore: number;
  staffHygieneScore: number;
  staffLunchAssistantScore: number;
  issuesIdentified?: string[];
  correctionDeadline?: Date;
  correctionStatus?: string;
  photosUrl?: string[];
}

class KitchenHygieneService {
  /**
   * Calculate total score from individual item scores (each 0-50)
   * Formula: average of all 8 scores
   * Minimum passing score: 25/50 (prevents meal service if below)
   */
  private calculateScore(scores: {
    cleanlinessScore: number;
    temperatureControlScore: number;
    equipmentMaintenanceScore: number;
    storageConditionsScore: number;
    waterQualityScore: number;
    wasteManagementScore: number;
    staffHygieneScore: number;
    staffLunchAssistantScore: number;
  }): number {
    const items = [
      scores.cleanlinessScore,
      scores.temperatureControlScore,
      scores.equipmentMaintenanceScore,
      scores.storageConditionsScore,
      scores.waterQualityScore,
      scores.wasteManagementScore,
      scores.staffHygieneScore,
      scores.staffLunchAssistantScore,
    ];
    const sum = items.reduce((a, b) => a + b, 0);
    return Math.round(sum / items.length);
  }

  private determineStatus(score: number): HygieneCheckStatus {
    return score >= 25 ? 'PASS' : 'FAIL';
  }

  async getAll(filters?: {
    messId?: string;
    status?: string;
    schoolId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{ data: KitchenHygieneChecklist[]; total: number }> {
    const where: Prisma.KitchenHygieneChecklistWhereInput = {};

    if (filters?.messId) where.messId = filters.messId;
    if (filters?.status) where.status = filters.status as any;
    if (filters?.schoolId) where.schoolId = filters.schoolId;
    if (filters?.startDate || filters?.endDate) {
      where.checkDate = {};
      if (filters?.startDate) where.checkDate!.gte = filters.startDate;
      if (filters?.endDate) where.checkDate!.lte = filters.endDate;
    }

    const [data, total] = await Promise.all([
      prisma.kitchenHygieneChecklist.findMany({
        where,
        orderBy: { checkDate: 'desc' },
      }),
      prisma.kitchenHygieneChecklist.count({ where }),
    ]);

    return { data: data as any, total };
  }

  async getById(id: string): Promise<KitchenHygieneChecklist | null> {
    const checklist = await prisma.kitchenHygieneChecklist.findUnique({
      where: { id },
    });
    return checklist as any;
  }

  async getLatestByMess(messId: string): Promise<KitchenHygieneChecklist | null> {
    const checklist = await prisma.kitchenHygieneChecklist.findFirst({
      where: { messId },
      orderBy: { checkDate: 'desc' },
    });
    return checklist as any;
  }

  /**
   * Get today's check if it exists
   * CRITICAL: Blocks meal service if today's check not passed
   */
  async getTodayCheck(messId: string): Promise<KitchenHygieneChecklist | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checklist = await prisma.kitchenHygieneChecklist.findFirst({
      where: {
        messId,
        checkDate: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });
    return checklist as any;
  }

  /**
   * Create a new hygiene check
   */
  async create(data: CreateKitchenHygieneDto & { schoolId: string }): Promise<KitchenHygieneChecklist> {
    const overallScore = this.calculateScore({
      cleanlinessScore: data.cleanlinessScore,
      temperatureControlScore: data.temperatureControlScore,
      equipmentMaintenanceScore: data.equipmentMaintenanceScore,
      storageConditionsScore: data.storageConditionsScore,
      waterQualityScore: data.waterQualityScore,
      wasteManagementScore: data.wasteManagementScore,
      staffHygieneScore: data.staffHygieneScore,
      staffLunchAssistantScore: data.staffLunchAssistantScore,
    });
    const status = this.determineStatus(overallScore);

    const checklist = await prisma.kitchenHygieneChecklist.create({
      data: {
        messId: data.messId,
        schoolId: data.schoolId,
        checkDate: data.checkDate,
        inspectorName: data.inspectorName,
        inspectorSignature: data.inspectorSignature,
        cleanlinessScore: data.cleanlinessScore,
        temperatureControlScore: data.temperatureControlScore,
        equipmentMaintenanceScore: data.equipmentMaintenanceScore,
        storageConditionsScore: data.storageConditionsScore,
        waterQualityScore: data.waterQualityScore,
        wasteManagementScore: data.wasteManagementScore,
        staffHygieneScore: data.staffHygieneScore,
        staffLunchAssistantScore: data.staffLunchAssistantScore,
        overallScore,
        status,
        issuesIdentified: data.issuesIdentified || [],
        correctionDeadline: data.correctionDeadline,
        correctionStatus: data.correctionStatus,
        photosUrl: data.photosUrl || [],
      },
    });

    return checklist as any;
  }

  /**
   * Update a hygiene check
   */
  async update(id: string, data: Partial<CreateKitchenHygieneDto>): Promise<KitchenHygieneChecklist> {
    const current = await prisma.kitchenHygieneChecklist.findUnique({ where: { id } });
    if (!current) throw new Error('Checklist not found');

    const overallScore = this.calculateScore({
      cleanlinessScore: data.cleanlinessScore ?? current.cleanlinessScore,
      temperatureControlScore: data.temperatureControlScore ?? current.temperatureControlScore,
      equipmentMaintenanceScore: data.equipmentMaintenanceScore ?? current.equipmentMaintenanceScore,
      storageConditionsScore: data.storageConditionsScore ?? current.storageConditionsScore,
      waterQualityScore: data.waterQualityScore ?? current.waterQualityScore,
      wasteManagementScore: data.wasteManagementScore ?? current.wasteManagementScore,
      staffHygieneScore: data.staffHygieneScore ?? current.staffHygieneScore,
      staffLunchAssistantScore: data.staffLunchAssistantScore ?? current.staffLunchAssistantScore,
    });
    const status = this.determineStatus(overallScore);

    const checklist = await prisma.kitchenHygieneChecklist.update({
      where: { id },
      data: {
        checkDate: data.checkDate,
        inspectorName: data.inspectorName,
        inspectorSignature: data.inspectorSignature,
        cleanlinessScore: data.cleanlinessScore,
        temperatureControlScore: data.temperatureControlScore,
        equipmentMaintenanceScore: data.equipmentMaintenanceScore,
        storageConditionsScore: data.storageConditionsScore,
        waterQualityScore: data.waterQualityScore,
        wasteManagementScore: data.wasteManagementScore,
        staffHygieneScore: data.staffHygieneScore,
        staffLunchAssistantScore: data.staffLunchAssistantScore,
        overallScore,
        status,
        issuesIdentified: data.issuesIdentified,
        correctionDeadline: data.correctionDeadline,
        correctionStatus: data.correctionStatus,
        photosUrl: data.photosUrl,
      },
    });

    return checklist as any;
  }

  /**
   * Record correction for a failing item
   */
  async recordCorrection(id: string, correctionStatus: string): Promise<KitchenHygieneChecklist> {
    const checklist = await prisma.kitchenHygieneChecklist.findUnique({ where: { id } });
    if (!checklist) throw new Error('Checklist not found');

    return await prisma.kitchenHygieneChecklist.update({
      where: { id },
      data: {
        correctionStatus,
        correctionDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
    }) as any;
  }

  /**
   * Get compliance report for a mess
   */
  async getComplianceReport(messId: string, months: number = 3): Promise<{
    messId: string;
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    compliancePercentage: number;
    averageScore: number;
    trend: string; // IMPROVING, DECLINING, STABLE
    latestCheck: any;
  }> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const checklists = await prisma.kitchenHygieneChecklist.findMany({
      where: {
        messId,
        checkDate: { gte: startDate },
      },
      orderBy: { checkDate: 'desc' },
    });

    const passedCount = checklists.filter(c => c.status === 'PASS').length;
    const totalCount = checklists.length;
    const compliancePercentage = totalCount > 0 ? (passedCount / totalCount) * 100 : 0;
    const averageScore = totalCount > 0 ? Math.round(checklists.reduce((sum, c) => sum + c.overallScore, 0) / totalCount) : 0;

    // Simple trend: compare first half with second half
    let trend = 'STABLE';
    if (checklists.length > 2) {
      const mid = Math.floor(checklists.length / 2);
      const firstHalf = checklists.slice(mid).reduce((sum, c) => sum + c.overallScore, 0) / (checklists.length - mid);
      const secondHalf = checklists.slice(0, mid).reduce((sum, c) => sum + c.overallScore, 0) / mid;
      if (secondHalf > firstHalf + 5) trend = 'IMPROVING';
      else if (secondHalf < firstHalf - 5) trend = 'DECLINING';
    }

    return {
      messId,
      totalChecks: totalCount,
      passedChecks: passedCount,
      failedChecks: totalCount - passedCount,
      compliancePercentage: Math.round(compliancePercentage),
      averageScore,
      trend,
      latestCheck: checklists[0] || null,
    };
  }

  /**
   * Check if meal service can proceed
   * CRITICAL: Returns false if today's check failed or missing
   */
  async canServeMeals(messId: string): Promise<{ allowed: boolean; reason: string }> {
    const todayCheck = await this.getTodayCheck(messId);

    if (!todayCheck) {
      return {
        allowed: false,
        reason: 'No hygiene check completed today. Check must be done before meal service.',
      };
    }

    if (todayCheck.status === 'FAIL') {
      return {
        allowed: false,
        reason: `Hygiene check failed with score ${todayCheck.overallScore}/50. Minimum required: 25/50`,
      };
    }

    return {
      allowed: true,
      reason: 'Hygiene check passed. Meal service approved.',
    };
  }

  async delete(id: string): Promise<void> {
    await prisma.kitchenHygieneChecklist.delete({
      where: { id },
    });
  }
}

export const kitchenHygieneService = new KitchenHygieneService();
