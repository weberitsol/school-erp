import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

interface CreateParentData {
  userId?: string;
  firstName: string;
  lastName: string;
  relation: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  occupation?: string;
  profileImage?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  schoolId: string;
  // If creating without existing user, need password
  password?: string;
}

interface UpdateParentData {
  firstName?: string;
  lastName?: string;
  relation?: string;
  phone?: string;
  alternatePhone?: string;
  email?: string;
  occupation?: string;
  profileImage?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

interface LinkChildrenData {
  studentIds: string[];
  primaryStudentId?: string;
}

export class ParentService {
  // Create new parent
  async createParent(data: CreateParentData) {
    try {
      // Validate required fields
      if (!data.firstName || !data.lastName || !data.phone || !data.relation) {
        throw new Error('Missing required fields: firstName, lastName, phone, relation');
      }

      // Validate relation
      const validRelations = ['Father', 'Mother', 'Guardian', 'Uncle', 'Aunt', 'Grandfather', 'Grandmother'];
      if (!validRelations.includes(data.relation)) {
        throw new Error(`Invalid relation. Allowed values: ${validRelations.join(', ')}`);
      }

      let userId = data.userId;

      // If no userId provided, create a user
      if (!userId) {
        if (!data.email || !data.password) {
          throw new Error('Email and password required to create new user account');
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: data.email },
        });
        if (existingUser) {
          throw new Error('Email already registered');
        }

        // Hash password
        const hashedPassword = await bcryptjs.hash(data.password, 10);

        // Create user
        const user = await prisma.user.create({
          data: {
            email: data.email,
            password: hashedPassword,
            role: 'PARENT',
            schoolId: data.schoolId,
            isActive: true,
          },
        });

        userId = user.id;
      } else {
        // Verify user exists
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });
        if (!user) throw new Error('User not found');
      }

      // Create parent
      const parent = await prisma.parent.create({
        data: {
          userId,
          firstName: data.firstName,
          lastName: data.lastName,
          relation: data.relation,
          phone: data.phone,
          alternatePhone: data.alternatePhone,
          email: data.email,
          occupation: data.occupation,
          profileImage: data.profileImage,
          address: data.address,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
        },
        include: {
          user: true,
          children: {
            include: {
              student: true,
            },
          },
        },
      });

      return parent;
    } catch (error: any) {
      throw new Error(`Failed to create parent: ${error.message}`);
    }
  }

  // Get all parents with filters
  async getAll(filters?: any) {
    try {
      const where: any = {};

      if (filters?.firstName) {
        where.firstName = { contains: filters.firstName, mode: 'insensitive' };
      }
      if (filters?.lastName) {
        where.lastName = { contains: filters.lastName, mode: 'insensitive' };
      }
      if (filters?.relation) {
        where.relation = filters.relation;
      }
      if (filters?.city) {
        where.city = { contains: filters.city, mode: 'insensitive' };
      }

      const parents = await prisma.parent.findMany({
        where,
        include: {
          user: true,
          children: {
            include: {
              student: true,
            },
          },
          feePayments: true,
        },
        orderBy: { firstName: 'asc' },
        skip: filters?.page ? (filters.page - 1) * (filters.limit || 20) : 0,
        take: filters?.limit || 20,
      });

      const total = await prisma.parent.count({ where });

      return { data: parents, total };
    } catch (error: any) {
      throw new Error(`Failed to fetch parents: ${error.message}`);
    }
  }

  // Get single parent by ID
  async getById(id: string) {
    try {
      const parent = await prisma.parent.findUnique({
        where: { id },
        include: {
          user: true,
          children: {
            include: {
              student: {
                include: {
                  currentClass: true,
                },
              },
            },
          },
          feePayments: true,
        },
      });

      if (!parent) throw new Error('Parent not found');
      return parent;
    } catch (error: any) {
      throw new Error(`Failed to fetch parent: ${error.message}`);
    }
  }

  // Get parent by user ID
  async getByUserId(userId: string) {
    try {
      const parent = await prisma.parent.findUnique({
        where: { userId },
        include: {
          user: true,
          children: {
            include: {
              student: {
                include: {
                  currentClass: true,
                },
              },
            },
          },
          feePayments: true,
        },
      });

      if (!parent) throw new Error('Parent not found');
      return parent;
    } catch (error: any) {
      throw new Error(`Failed to fetch parent: ${error.message}`);
    }
  }

  // Update parent
  async updateParent(id: string, data: UpdateParentData) {
    try {
      const parent = await prisma.parent.findUnique({ where: { id } });
      if (!parent) throw new Error('Parent not found');

      // Validate relation if provided
      if (data.relation) {
        const validRelations = ['Father', 'Mother', 'Guardian', 'Uncle', 'Aunt', 'Grandfather', 'Grandmother'];
        if (!validRelations.includes(data.relation)) {
          throw new Error(`Invalid relation. Allowed values: ${validRelations.join(', ')}`);
        }
      }

      const updated = await prisma.parent.update({
        where: { id },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          relation: data.relation,
          phone: data.phone,
          alternatePhone: data.alternatePhone,
          email: data.email,
          occupation: data.occupation,
          profileImage: data.profileImage,
          address: data.address,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
        },
        include: {
          user: true,
          children: {
            include: {
              student: true,
            },
          },
        },
      });

      return updated;
    } catch (error: any) {
      throw new Error(`Failed to update parent: ${error.message}`);
    }
  }

  // Delete parent
  async deleteParent(id: string, deleteUser: boolean = false) {
    try {
      const parent = await prisma.parent.findUnique({ where: { id } });
      if (!parent) throw new Error('Parent not found');

      // Delete parent (will cascade delete StudentParent records)
      await prisma.parent.delete({ where: { id } });

      // Optionally delete associated user
      if (deleteUser) {
        await prisma.user.delete({ where: { id: parent.userId } });
      }

      return { success: true, message: 'Parent deleted successfully' };
    } catch (error: any) {
      throw new Error(`Failed to delete parent: ${error.message}`);
    }
  }

  // Link parent to students
  async linkChildren(parentId: string, data: LinkChildrenData) {
    try {
      const parent = await prisma.parent.findUnique({ where: { id: parentId } });
      if (!parent) throw new Error('Parent not found');

      if (!data.studentIds || data.studentIds.length === 0) {
        throw new Error('At least one student ID is required');
      }

      // Verify all students exist
      const students = await prisma.student.findMany({
        where: { id: { in: data.studentIds } },
      });

      if (students.length !== data.studentIds.length) {
        throw new Error('One or more students not found');
      }

      // Create StudentParent links
      const links = [];

      for (const studentId of data.studentIds) {
        // Check if link already exists
        const existing = await prisma.studentParent.findUnique({
          where: {
            studentId_parentId: {
              studentId,
              parentId,
            },
          },
        });

        if (!existing) {
          const isPrimary = data.primaryStudentId === studentId;

          const link = await prisma.studentParent.create({
            data: {
              studentId,
              parentId,
              isPrimary,
            },
            include: {
              student: true,
              parent: true,
            },
          });

          links.push(link);
        }
      }

      return links;
    } catch (error: any) {
      throw new Error(`Failed to link children: ${error.message}`);
    }
  }

  // Unlink student from parent
  async unlinkChild(parentId: string, studentId: string) {
    try {
      const link = await prisma.studentParent.findUnique({
        where: {
          studentId_parentId: {
            studentId,
            parentId,
          },
        },
      });

      if (!link) throw new Error('Parent-student link not found');

      await prisma.studentParent.delete({
        where: {
          id: link.id,
        },
      });

      return { success: true, message: 'Child unlinked successfully' };
    } catch (error: any) {
      throw new Error(`Failed to unlink child: ${error.message}`);
    }
  }

  // Get parent's children
  async getChildren(parentId: string) {
    try {
      const parent = await prisma.parent.findUnique({
        where: { id: parentId },
        include: {
          children: {
            include: {
              student: {
                include: {
                  currentClass: true,
                  parents: {
                    include: {
                      parent: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!parent) throw new Error('Parent not found');

      return parent.children;
    } catch (error: any) {
      throw new Error(`Failed to fetch children: ${error.message}`);
    }
  }

  // Get parent's payment history
  async getPaymentHistory(parentId: string) {
    try {
      const parent = await prisma.parent.findUnique({
        where: { id: parentId },
        include: {
          feePayments: {
            include: {
              student: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!parent) throw new Error('Parent not found');

      // Calculate summary
      const totalPayments = parent.feePayments.length;
      const totalAmount = parent.feePayments.reduce((sum, p) => sum + Number(p.amount), 0);

      return {
        payments: parent.feePayments,
        summary: {
          totalPayments,
          totalAmount,
          recentPayment: parent.feePayments[0] || null,
        },
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch payment history: ${error.message}`);
    }
  }

  // Get parent statistics
  async getParentStats(schoolId?: string) {
    try {
      const where = schoolId ? { user: { schoolId } } : {};

      const totalParents = await prisma.parent.count({ where });
      const fathersCount = await prisma.parent.count({
        where: {
          ...where,
          relation: 'Father',
        },
      });
      const mothersCount = await prisma.parent.count({
        where: {
          ...where,
          relation: 'Mother',
        },
      });
      const guardiansCount = await prisma.parent.count({
        where: {
          ...where,
          relation: 'Guardian',
        },
      });

      const parentsWithEmail = await prisma.parent.count({
        where: {
          ...where,
          email: { not: null },
        },
      });

      return {
        totalParents,
        fathersCount,
        mothersCount,
        guardiansCount,
        othersCount: totalParents - fathersCount - mothersCount - guardiansCount,
        parentsWithEmail,
        emailCoverage: totalParents > 0 ? Math.round((parentsWithEmail / totalParents) * 100) : 0,
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch parent statistics: ${error.message}`);
    }
  }
}

export const parentService = new ParentService();
