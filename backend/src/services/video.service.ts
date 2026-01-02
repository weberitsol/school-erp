import prisma from '../config/database';
import { VideoStatus, Prisma } from '@prisma/client';

// ==================== Types ====================

interface CreateVideoDto {
  youtubeUrl: string;
  title: string;
  description?: string;
  subjectId?: string;
  tagIds?: string[];
  schoolId: string;
  createdById: string;
}

interface UpdateVideoDto {
  title?: string;
  description?: string;
  subjectId?: string;
  tagIds?: string[];
  status?: VideoStatus;
}

interface GrantAccessDto {
  videoId: string;
  classId: string;
  sectionId?: string;
  academicYearId?: string;
  availableFrom?: Date;
  availableUntil?: Date;
  createdById: string;
}

interface VideoFilters {
  status?: VideoStatus;
  subjectId?: string;
  tagId?: string;
  search?: string;
}

// ==================== Video Service ====================

export class VideoService {
  // Extract YouTube video ID from various URL formats
  extractYouTubeVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/, // Just the video ID
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  // Generate thumbnail URL from video ID
  getThumbnailUrl(videoId: string): string {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }

  // Create a new video
  async createVideo(data: CreateVideoDto) {
    const videoId = this.extractYouTubeVideoId(data.youtubeUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    const thumbnailUrl = this.getThumbnailUrl(videoId);

    const video = await prisma.youTubeVideo.create({
      data: {
        youtubeUrl: data.youtubeUrl,
        youtubeVideoId: videoId,
        title: data.title,
        description: data.description,
        thumbnailUrl,
        subjectId: data.subjectId,
        schoolId: data.schoolId,
        createdById: data.createdById,
        status: 'DRAFT',
        videoTags: data.tagIds?.length
          ? {
              create: data.tagIds.map((tagId) => ({ tagId })),
            }
          : undefined,
      },
      include: {
        subject: true,
        videoTags: { include: { tag: true } },
        createdBy: { select: { id: true, email: true } },
      },
    });

    return video;
  }

  // Update a video
  async updateVideo(id: string, data: UpdateVideoDto, schoolId: string) {
    // Verify video belongs to school
    const existing = await prisma.youTubeVideo.findFirst({
      where: { id, schoolId },
    });

    if (!existing) {
      throw new Error('Video not found');
    }

    // Handle tag updates separately
    if (data.tagIds !== undefined) {
      // Delete existing tags
      await prisma.videoTag.deleteMany({
        where: { videoId: id },
      });

      // Add new tags
      if (data.tagIds.length > 0) {
        await prisma.videoTag.createMany({
          data: data.tagIds.map((tagId) => ({ videoId: id, tagId })),
        });
      }
    }

    const { tagIds, ...updateData } = data;

    const video = await prisma.youTubeVideo.update({
      where: { id },
      data: updateData,
      include: {
        subject: true,
        videoTags: { include: { tag: true } },
        createdBy: { select: { id: true, email: true } },
      },
    });

    return video;
  }

  // Delete a video
  async deleteVideo(id: string, schoolId: string) {
    const existing = await prisma.youTubeVideo.findFirst({
      where: { id, schoolId },
    });

    if (!existing) {
      throw new Error('Video not found');
    }

    await prisma.youTubeVideo.delete({
      where: { id },
    });

    return { success: true };
  }

  // Get video by ID
  async getVideoById(id: string, schoolId: string) {
    const video = await prisma.youTubeVideo.findFirst({
      where: { id, schoolId },
      include: {
        subject: true,
        videoTags: { include: { tag: true } },
        videoAccess: {
          include: {
            class: true,
            section: true,
          },
        },
        comprehensionQuestions: {
          where: { isActive: true },
          orderBy: { sequenceOrder: 'asc' },
        },
        createdBy: { select: { id: true, email: true } },
        _count: {
          select: { watchSessions: true },
        },
      },
    });

    return video;
  }

  // Get all videos for a school (admin/teacher view)
  async getVideosForSchool(schoolId: string, filters: VideoFilters = {}) {
    const where: Prisma.YouTubeVideoWhereInput = {
      schoolId,
      isActive: true,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.subjectId) {
      where.subjectId = filters.subjectId;
    }

    if (filters.tagId) {
      where.videoTags = {
        some: { tagId: filters.tagId },
      };
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const videos = await prisma.youTubeVideo.findMany({
      where,
      include: {
        subject: true,
        videoTags: { include: { tag: true } },
        _count: {
          select: {
            watchSessions: true,
            videoAccess: true,
            comprehensionQuestions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return videos;
  }

  // Publish a video
  async publishVideo(id: string, schoolId: string) {
    const existing = await prisma.youTubeVideo.findFirst({
      where: { id, schoolId },
    });

    if (!existing) {
      throw new Error('Video not found');
    }

    const video = await prisma.youTubeVideo.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });

    return video;
  }

  // ==================== Access Control ====================

  // Grant access to a batch
  async grantAccess(data: GrantAccessDto) {
    const access = await prisma.videoAccess.create({
      data: {
        videoId: data.videoId,
        classId: data.classId,
        sectionId: data.sectionId,
        academicYearId: data.academicYearId,
        availableFrom: data.availableFrom,
        availableUntil: data.availableUntil,
        createdById: data.createdById,
      },
      include: {
        class: true,
        section: true,
      },
    });

    return access;
  }

  // Revoke access
  async revokeAccess(accessId: string) {
    await prisma.videoAccess.delete({
      where: { id: accessId },
    });

    return { success: true };
  }

  // Get access rules for a video
  async getVideoAccess(videoId: string) {
    const access = await prisma.videoAccess.findMany({
      where: { videoId },
      include: {
        class: true,
        section: true,
        academicYear: true,
      },
    });

    return access;
  }

  // ==================== Student-Facing ====================

  // Get available videos for a student
  async getAvailableVideosForStudent(studentId: string) {
    // Get student's current class and section
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        currentClassId: true,
        currentSectionId: true,
        user: { select: { schoolId: true } },
      },
    });

    if (!student || !student.currentClassId) {
      return [];
    }

    const now = new Date();

    // Find videos the student has access to
    const videos = await prisma.youTubeVideo.findMany({
      where: {
        schoolId: student.user.schoolId,
        status: 'PUBLISHED',
        isActive: true,
        videoAccess: {
          some: {
            classId: student.currentClassId,
            OR: [
              { sectionId: null }, // Access to all sections
              { sectionId: student.currentSectionId }, // Access to specific section
            ],
            AND: [
              {
                OR: [
                  { availableFrom: null },
                  { availableFrom: { lte: now } },
                ],
              },
              {
                OR: [
                  { availableUntil: null },
                  { availableUntil: { gte: now } },
                ],
              },
            ],
          },
        },
      },
      include: {
        subject: true,
        videoTags: { include: { tag: true } },
        watchSessions: {
          where: { studentId },
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Add watch progress to each video
    return videos.map((video) => ({
      ...video,
      lastSession: video.watchSessions[0] || null,
      watchProgress: video.watchSessions[0]
        ? Math.round(
            (video.watchSessions[0].totalWatchTimeSeconds / (video.duration || 1)) * 100
          )
        : 0,
    }));
  }

  // Get videos by tag for a student
  async getVideosByTag(studentId: string, tagId: string) {
    const allVideos = await this.getAvailableVideosForStudent(studentId);
    return allVideos.filter((video) =>
      video.videoTags.some((vt) => vt.tagId === tagId)
    );
  }

  // Check if student has access to a video
  async checkStudentAccess(videoId: string, studentId: string): Promise<boolean> {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        currentClassId: true,
        currentSectionId: true,
        user: { select: { schoolId: true } },
      },
    });

    if (!student || !student.currentClassId) {
      return false;
    }

    const now = new Date();

    const access = await prisma.videoAccess.findFirst({
      where: {
        videoId,
        classId: student.currentClassId,
        OR: [
          { sectionId: null },
          { sectionId: student.currentSectionId },
        ],
        AND: [
          {
            OR: [
              { availableFrom: null },
              { availableFrom: { lte: now } },
            ],
          },
          {
            OR: [
              { availableUntil: null },
              { availableUntil: { gte: now } },
            ],
          },
        ],
      },
    });

    return !!access;
  }

  // Get video for student (without exposing full YouTube URL)
  async getVideoForStudent(videoId: string, studentId: string) {
    const hasAccess = await this.checkStudentAccess(videoId, studentId);
    if (!hasAccess) {
      throw new Error('Access denied');
    }

    const video = await prisma.youTubeVideo.findUnique({
      where: { id: videoId },
      select: {
        id: true,
        youtubeVideoId: true, // Only expose the video ID, not full URL
        title: true,
        description: true,
        thumbnailUrl: true,
        duration: true,
        subject: true,
        videoTags: { include: { tag: true } },
      },
    });

    return video;
  }

  // Get all tags that have videos assigned to student
  async getTagsWithVideosForStudent(studentId: string) {
    const videos = await this.getAvailableVideosForStudent(studentId);

    // Collect unique tags
    const tagMap = new Map<string, any>();
    for (const video of videos) {
      for (const vt of video.videoTags) {
        if (!tagMap.has(vt.tag.id)) {
          tagMap.set(vt.tag.id, {
            ...vt.tag,
            videoCount: 0,
          });
        }
        tagMap.get(vt.tag.id).videoCount++;
      }
    }

    return Array.from(tagMap.values());
  }
}

export const videoService = new VideoService();
