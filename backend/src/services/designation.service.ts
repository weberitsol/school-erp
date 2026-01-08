import { PrismaClient, Designation } from '@prisma/client';

const prisma = new PrismaClient();

interface DesignationFilters {
  level?: number;
  search?: string;
}

interface CreateDesignationData {
  name: string;
  code: string;
  description?: string;
  level?: number;
  parentDesignationId?: string;
  minSalary?: number;
  maxSalary?: number;
  standardSalary?: number;
}

interface UpdateDesignationData {
  name?: string;
  code?: string;
  description?: string;
  level?: number;
  parentDesignationId?: string;
  minSalary?: number;
  maxSalary?: number;
  standardSalary?: number;
}

interface PaginationParams {
  page?: number;
  limit?: number;
}

class DesignationService {
  async createDesignation(data: CreateDesignationData): Promise<Designation> {
    // Check uniqueness
    const existing = await prisma.designation.findFirst({
      where: {
        OR: [{ name: data.name }, { code: data.code }],
      },
    });

    if (existing) {
      throw new Error(
        `Designation with name or code already exists`
      );
    }

    // Verify parent designation exists if provided
    if (data.parentDesignationId) {
      const parent = await prisma.designation.findUnique({
        where: { id: data.parentDesignationId },
      });

      if (!parent) {
        throw new Error('Parent designation not found');
      }
    }

    return prisma.designation.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        level: data.level,
        parentDesignationId: data.parentDesignationId,
        minSalary: data.minSalary,
        maxSalary: data.maxSalary,
        standardSalary: data.standardSalary,
      },
      include: {
        parentDesignation: true,
        subordinateDesignations: true,
      },
    });
  }

  async getDesignations(
    filters?: DesignationFilters,
    pagination?: PaginationParams
  ): Promise<{ data: Designation[]; total: number }> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.level !== undefined) where.level = filters.level;

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.designation.findMany({
        where,
        skip,
        take: limit,
        include: {
          parentDesignation: true,
          subordinateDesignations: true,
          employees: true,
        },
        orderBy: [{ level: 'asc' }, { name: 'asc' }],
      }),
      prisma.designation.count({ where }),
    ]);

    return { data, total };
  }

  async getDesignationById(id: string): Promise<Designation | null> {
    return prisma.designation.findUnique({
      where: { id },
      include: {
        parentDesignation: true,
        subordinateDesignations: true,
        employees: true,
      },
    });
  }

  async updateDesignation(
    id: string,
    data: UpdateDesignationData
  ): Promise<Designation> {
    const designation = await prisma.designation.findUnique({
      where: { id },
    });

    if (!designation) {
      throw new Error('Designation not found');
    }

    // Check uniqueness for name and code if being updated
    if (data.name || data.code) {
      const existing = await prisma.designation.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                data.name ? { name: data.name } : {},
                data.code ? { code: data.code } : {},
              ].filter(obj => Object.keys(obj).length > 0),
            },
          ],
        },
      });

      if (existing) {
        throw new Error('Name or code already in use');
      }
    }

    // Verify parent designation if being updated
    if (data.parentDesignationId) {
      const parent = await prisma.designation.findUnique({
        where: { id: data.parentDesignationId },
      });

      if (!parent) {
        throw new Error('Parent designation not found');
      }

      // Prevent circular reference
      if (data.parentDesignationId === id) {
        throw new Error('Designation cannot be its own parent');
      }
    }

    return prisma.designation.update({
      where: { id },
      data,
      include: {
        parentDesignation: true,
        subordinateDesignations: true,
        employees: true,
      },
    });
  }

  async deleteDesignation(id: string): Promise<void> {
    const designation = await prisma.designation.findUnique({
      where: { id },
      include: { employees: true, subordinateDesignations: true },
    });

    if (!designation) {
      throw new Error('Designation not found');
    }

    if (designation.employees.length > 0) {
      throw new Error(
        'Cannot delete designation with assigned employees'
      );
    }

    if (designation.subordinateDesignations.length > 0) {
      throw new Error(
        'Cannot delete designation with subordinate designations'
      );
    }

    await prisma.designation.delete({
      where: { id },
    });
  }

  async getDesignationByCode(code: string): Promise<Designation | null> {
    return prisma.designation.findUnique({
      where: { code },
      include: {
        parentDesignation: true,
        subordinateDesignations: true,
        employees: true,
      },
    });
  }

  async getDesignationHierarchy(): Promise<Designation[]> {
    return prisma.designation.findMany({
      where: { parentDesignationId: null },
      include: {
        subordinateDesignations: {
          include: {
            subordinateDesignations: true,
          },
        },
      },
      orderBy: { level: 'asc' },
    });
  }

  async getDesignationsByLevel(level: number): Promise<Designation[]> {
    return prisma.designation.findMany({
      where: { level },
      include: { employees: true },
      orderBy: { name: 'asc' },
    });
  }

  async getEmployeeCountByDesignation(designationId: string): Promise<number> {
    return prisma.employee.count({
      where: { designationId },
    });
  }

  async validateSalaryRange(
    designationId: string,
    salary: number
  ): Promise<boolean> {
    const designation = await prisma.designation.findUnique({
      where: { id: designationId },
    });

    if (!designation) {
      throw new Error('Designation not found');
    }

    if (!designation.minSalary || !designation.maxSalary) {
      return true; // No range defined, allow any salary
    }

    return salary >= designation.minSalary && salary <= designation.maxSalary;
  }
}

export const designationService = new DesignationService();
