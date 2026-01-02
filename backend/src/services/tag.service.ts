import { PrismaClient, Tag, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface TagFilters {
  schoolId: string;
  isActive?: boolean;
  search?: string;
  category?: string;
}

interface CreateTagData {
  name: string;
  category?: string;
  color?: string;
  schoolId: string;
}

interface UpdateTagData {
  name?: string;
  category?: string;
  color?: string;
  isActive?: boolean;
}

class TagService {
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async createTag(data: CreateTagData): Promise<Tag> {
    const slug = this.generateSlug(data.name);
    return prisma.tag.create({
      data: {
        name: data.name,
        slug,
        category: data.category,
        color: data.color,
        schoolId: data.schoolId,
      },
    });
  }

  async getTags(filters: TagFilters): Promise<Tag[]> {
    const where: Prisma.TagWhereInput = {
      schoolId: filters.schoolId,
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters.category && { category: filters.category }),
      ...(filters.search && {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { slug: { contains: filters.search, mode: 'insensitive' } },
        ],
      }),
    };

    return prisma.tag.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async getTagById(id: string, schoolId: string): Promise<Tag | null> {
    return prisma.tag.findFirst({
      where: { id, schoolId },
    });
  }

  async getTagBySlug(slug: string, schoolId: string): Promise<Tag | null> {
    return prisma.tag.findFirst({
      where: { slug, schoolId },
    });
  }

  async searchTags(query: string, schoolId: string, limit: number = 20): Promise<Tag[]> {
    return prisma.tag.findMany({
      where: {
        schoolId,
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { slug: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { name: 'asc' },
    });
  }

  async updateTag(id: string, schoolId: string, data: UpdateTagData): Promise<Tag> {
    const updateData: any = { ...data };
    if (data.name) {
      updateData.slug = this.generateSlug(data.name);
    }

    return prisma.tag.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteTag(id: string, schoolId: string): Promise<Tag> {
    // Soft delete
    return prisma.tag.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async hardDeleteTag(id: string, schoolId: string): Promise<Tag> {
    return prisma.tag.delete({
      where: { id },
    });
  }

  async getCategories(schoolId: string): Promise<string[]> {
    const tags = await prisma.tag.findMany({
      where: { schoolId, isActive: true, category: { not: null } },
      select: { category: true },
      distinct: ['category'],
    });
    return tags.map(t => t.category!).filter(Boolean);
  }
}

export const tagService = new TagService();
