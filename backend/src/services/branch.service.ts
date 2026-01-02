import { PrismaClient, Branch, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface BranchFilters {
  schoolId: string;
  isActive?: boolean;
  search?: string;
}

interface CreateBranchData {
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  schoolId: string;
}

interface UpdateBranchData {
  name?: string;
  code?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

class BranchService {
  async createBranch(data: CreateBranchData): Promise<Branch> {
    return prisma.branch.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        phone: data.phone,
        email: data.email,
        schoolId: data.schoolId,
      },
    });
  }

  async getBranches(filters: BranchFilters): Promise<Branch[]> {
    const where: Prisma.BranchWhereInput = {
      schoolId: filters.schoolId,
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { code: { contains: filters.search, mode: 'insensitive' } },
          { city: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    };

    return prisma.branch.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            classes: true,
            teachers: true,
            students: true,
          },
        },
      },
    });
  }

  async getBranchById(id: string, schoolId: string): Promise<Branch | null> {
    return prisma.branch.findFirst({
      where: { id, schoolId },
      include: {
        _count: {
          select: {
            classes: true,
            teachers: true,
            students: true,
          },
        },
      },
    });
  }

  async getBranchByCode(code: string, schoolId: string): Promise<Branch | null> {
    return prisma.branch.findFirst({
      where: { code: code.toUpperCase(), schoolId },
    });
  }

  async updateBranch(id: string, schoolId: string, data: UpdateBranchData): Promise<Branch> {
    return prisma.branch.update({
      where: { id },
      data: {
        ...data,
        ...(data.code && { code: data.code.toUpperCase() }),
      },
    });
  }

  async deleteBranch(id: string, schoolId: string): Promise<Branch> {
    // Soft delete
    return prisma.branch.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async hardDeleteBranch(id: string, schoolId: string): Promise<Branch> {
    return prisma.branch.delete({
      where: { id },
    });
  }
}

export const branchService = new BranchService();
