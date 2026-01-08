import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateAnnouncementData {
  title: string;
  content: string;
  schoolId: string;
  targetAudience: string[];
  targetClasses?: string[];
  attachments?: string[];
  publishedAt?: Date;
  expiresAt?: Date;
}

interface UpdateAnnouncementData {
  title?: string;
  content?: string;
  targetAudience?: string[];
  targetClasses?: string[];
  attachments?: string[];
  expiresAt?: Date;
}

interface PublishAnnouncementData {
  publishedAt?: Date;
}

export class AnnouncementService {
  // Create new announcement
  async createAnnouncement(data: CreateAnnouncementData, createdById: string) {
    try {
      // Validate required fields
      if (!data.title || !data.content) {
        throw new Error('Missing required fields: title, content');
      }

      // Validate target audience
      const validAudience = ['ALL', 'TEACHERS', 'STUDENTS', 'PARENTS'];
      const invalidAudience = data.targetAudience.filter(a => !validAudience.includes(a));
      if (invalidAudience.length > 0) {
        throw new Error(`Invalid target audience: ${invalidAudience.join(', ')}`);
      }

      // Verify all target classes exist if provided
      if (data.targetClasses && data.targetClasses.length > 0) {
        const classes = await prisma.class.findMany({
          where: { id: { in: data.targetClasses } },
        });
        if (classes.length !== data.targetClasses.length) {
          throw new Error('One or more target classes not found');
        }
      }

      const announcement = await prisma.announcement.create({
        data: {
          title: data.title,
          content: data.content,
          schoolId: data.schoolId,
          targetAudience: data.targetAudience,
          targetClasses: data.targetClasses || [],
          attachments: data.attachments || [],
          publishedAt: data.publishedAt,
          expiresAt: data.expiresAt,
          createdById,
        },
      });

      return announcement;
    } catch (error: any) {
      throw new Error(`Failed to create announcement: ${error.message}`);
    }
  }

  // Get all announcements with filters
  async getAll(filters?: any) {
    try {
      const where: any = {};

      if (filters?.schoolId) {
        where.schoolId = filters.schoolId;
      }

      if (filters?.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { content: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      if (filters?.isPublished !== undefined) {
        where.isPublished = filters.isPublished;
      }

      if (filters?.targetAudience) {
        where.targetAudience = {
          has: filters.targetAudience,
        };
      }

      const announcements = await prisma.announcement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: filters?.page ? (filters.page - 1) * (filters.limit || 20) : 0,
        take: filters?.limit || 20,
      });

      const total = await prisma.announcement.count({ where });

      return { data: announcements, total };
    } catch (error: any) {
      throw new Error(`Failed to fetch announcements: ${error.message}`);
    }
  }

  // Get single announcement by ID
  async getById(id: string) {
    try {
      const announcement = await prisma.announcement.findUnique({
        where: { id },
      });

      if (!announcement) throw new Error('Announcement not found');
      return announcement;
    } catch (error: any) {
      throw new Error(`Failed to fetch announcement: ${error.message}`);
    }
  }

  // Update announcement
  async updateAnnouncement(id: string, data: UpdateAnnouncementData) {
    try {
      const announcement = await prisma.announcement.findUnique({ where: { id } });
      if (!announcement) throw new Error('Announcement not found');

      // Cannot update published announcements
      if (announcement.isPublished) {
        throw new Error('Cannot update published announcements');
      }

      // Validate target audience if provided
      if (data.targetAudience) {
        const validAudience = ['ALL', 'TEACHERS', 'STUDENTS', 'PARENTS'];
        const invalidAudience = data.targetAudience.filter(a => !validAudience.includes(a));
        if (invalidAudience.length > 0) {
          throw new Error(`Invalid target audience: ${invalidAudience.join(', ')}`);
        }
      }

      // Verify target classes if provided
      if (data.targetClasses && data.targetClasses.length > 0) {
        const classes = await prisma.class.findMany({
          where: { id: { in: data.targetClasses } },
        });
        if (classes.length !== data.targetClasses.length) {
          throw new Error('One or more target classes not found');
        }
      }

      const updated = await prisma.announcement.update({
        where: { id },
        data: {
          title: data.title,
          content: data.content,
          targetAudience: data.targetAudience,
          targetClasses: data.targetClasses,
          attachments: data.attachments,
          expiresAt: data.expiresAt,
        },
      });

      return updated;
    } catch (error: any) {
      throw new Error(`Failed to update announcement: ${error.message}`);
    }
  }

  // Delete announcement
  async deleteAnnouncement(id: string) {
    try {
      const announcement = await prisma.announcement.findUnique({ where: { id } });
      if (!announcement) throw new Error('Announcement not found');

      // Cannot delete published announcements
      if (announcement.isPublished) {
        throw new Error('Cannot delete published announcements');
      }

      await prisma.announcement.delete({ where: { id } });

      return { success: true, message: 'Announcement deleted successfully' };
    } catch (error: any) {
      throw new Error(`Failed to delete announcement: ${error.message}`);
    }
  }

  // Publish announcement
  async publishAnnouncement(id: string, data?: PublishAnnouncementData) {
    try {
      const announcement = await prisma.announcement.findUnique({ where: { id } });
      if (!announcement) throw new Error('Announcement not found');

      if (announcement.isPublished) {
        throw new Error('Announcement is already published');
      }

      const published = await prisma.announcement.update({
        where: { id },
        data: {
          isPublished: true,
          publishedAt: data?.publishedAt || new Date(),
        },
      });

      return published;
    } catch (error: any) {
      throw new Error(`Failed to publish announcement: ${error.message}`);
    }
  }

  // Get active announcements (published and not expired)
  async getActiveAnnouncements(filters?: any) {
    try {
      const now = new Date();

      const where: any = {
        isPublished: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      };

      if (filters?.schoolId) {
        where.schoolId = filters.schoolId;
      }

      const announcements = await prisma.announcement.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip: filters?.page ? (filters.page - 1) * (filters.limit || 10) : 0,
        take: filters?.limit || 10,
      });

      const total = await prisma.announcement.count({ where });

      return { data: announcements, total };
    } catch (error: any) {
      throw new Error(`Failed to fetch active announcements: ${error.message}`);
    }
  }

  // Get announcements for specific audience
  async getAnnouncementsByAudience(schoolId: string, audience: string, filters?: any) {
    try {
      const validAudience = ['TEACHERS', 'STUDENTS', 'PARENTS'];
      if (!validAudience.includes(audience)) {
        throw new Error(`Invalid audience: ${audience}`);
      }

      const now = new Date();

      const where: any = {
        schoolId,
        isPublished: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        targetAudience: {
          hasSome: ['ALL', audience],
        },
      };

      const announcements = await prisma.announcement.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip: filters?.page ? (filters.page - 1) * (filters.limit || 10) : 0,
        take: filters?.limit || 10,
      });

      const total = await prisma.announcement.count({ where });

      return { data: announcements, total };
    } catch (error: any) {
      throw new Error(`Failed to fetch announcements: ${error.message}`);
    }
  }

  // Get announcement statistics
  async getAnnouncementStats(schoolId?: string) {
    try {
      const where = schoolId ? { schoolId } : {};

      const totalAnnouncements = await prisma.announcement.count({ where });
      const publishedCount = await prisma.announcement.count({
        where: {
          ...where,
          isPublished: true,
        },
      });

      const draftCount = await prisma.announcement.count({
        where: {
          ...where,
          isPublished: false,
        },
      });

      const now = new Date();
      const activeCount = await prisma.announcement.count({
        where: {
          ...where,
          isPublished: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      });

      const expiredCount = await prisma.announcement.count({
        where: {
          ...where,
          isPublished: true,
          expiresAt: { lte: now },
        },
      });

      return {
        totalAnnouncements,
        publishedCount,
        draftCount,
        activeCount,
        expiredCount,
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch announcement statistics: ${error.message}`);
    }
  }
}

export const announcementService = new AnnouncementService();
