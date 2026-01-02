import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
  duration?: string;
  viewCount?: string;
}

interface SearchParams {
  query: string;
  maxResults?: number;
  language?: string;
}

class YouTubeService {
  private apiKey: string;
  private baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY || '';
  }

  // Check if service is available
  isAvailable(): boolean {
    return !!this.apiKey;
  }

  // Search videos by query
  async searchVideos(params: SearchParams): Promise<YouTubeVideo[]> {
    if (!this.isAvailable()) {
      return this.getFallbackVideos(params.query);
    }

    try {
      const searchQuery = encodeURIComponent(params.query);
      const maxResults = params.maxResults || 5;

      const searchUrl = `${this.baseUrl}/search?part=snippet&type=video&q=${searchQuery}&maxResults=${maxResults}&relevanceLanguage=${params.language || 'en'}&videoEmbeddable=true&key=${this.apiKey}`;

      const response = await fetch(searchUrl);
      const data = await response.json() as { items: any[]; error?: any };

      if (!response.ok) {
        console.error('YouTube API error:', data);
        return this.getFallbackVideos(params.query);
      }

      return data.items.map((item: any) => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
      }));
    } catch (error) {
      console.error('YouTube search error:', error);
      return this.getFallbackVideos(params.query);
    }
  }

  // Get recommended videos for a question
  async getRecommendedVideos(questionId: string): Promise<YouTubeVideo[]> {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        subject: { select: { name: true } },
        chapterRef: { select: { name: true } },
      },
    });

    if (!question) {
      throw new Error('Question not found');
    }

    // Build search query
    const queryParts = [
      question.subject.name,
      question.chapterRef?.name || question.chapter,
      question.topic,
      'explanation tutorial',
    ].filter(Boolean);

    const query = queryParts.join(' ');

    return this.searchVideos({
      query,
      maxResults: 5,
      language: 'en',
    });
  }

  // Get videos by topic/chapter
  async getVideosByTopic(subjectName: string, chapterName?: string, topic?: string): Promise<YouTubeVideo[]> {
    const queryParts = [
      subjectName,
      chapterName,
      topic,
      'Class 11 12',
      'explanation',
    ].filter(Boolean);

    const query = queryParts.join(' ');

    return this.searchVideos({
      query,
      maxResults: 8,
      language: 'en',
    });
  }

  // Get videos for weak areas
  async getVideosForWeakAreas(weakAreas: { subject: string; chapter: string; topic?: string }[]): Promise<{
    area: string;
    videos: YouTubeVideo[];
  }[]> {
    const results = [];

    for (const area of weakAreas.slice(0, 3)) {
      const videos = await this.getVideosByTopic(area.subject, area.chapter, area.topic);
      results.push({
        area: `${area.subject} - ${area.chapter}${area.topic ? ` - ${area.topic}` : ''}`,
        videos: videos.slice(0, 3),
      });
    }

    return results;
  }

  // Get curated educational channels
  getCuratedChannels(): { name: string; description: string; url: string }[] {
    return [
      {
        name: 'Physics Wallah',
        description: 'Comprehensive Physics and Chemistry tutorials for JEE/NEET',
        url: 'https://www.youtube.com/@PhysicsWallah',
      },
      {
        name: 'Unacademy JEE',
        description: 'JEE preparation with top educators',
        url: 'https://www.youtube.com/@UnacademyJEE',
      },
      {
        name: 'NCERT Solutions',
        description: 'Chapter-wise NCERT solutions and explanations',
        url: 'https://www.youtube.com/@NCERTSolutions',
      },
      {
        name: 'Khan Academy India',
        description: 'Free educational videos covering all subjects',
        url: 'https://www.youtube.com/@kaboreindia',
      },
      {
        name: 'Vedantu JEE',
        description: 'Live classes and doubt sessions for JEE',
        url: 'https://www.youtube.com/@VedantuJEE',
      },
    ];
  }

  // Private helper for fallback videos (curated links)
  private getFallbackVideos(query: string): YouTubeVideo[] {
    // Return curated educational video placeholders when API is not available
    const subject = this.detectSubject(query);

    const fallbackVideos: Record<string, YouTubeVideo[]> = {
      physics: [
        {
          videoId: 'ZM8ECpBuQYE',
          title: 'Physics - Basic Concepts Explained',
          description: 'Fundamental physics concepts for competitive exams',
          thumbnailUrl: 'https://i.ytimg.com/vi/ZM8ECpBuQYE/mqdefault.jpg',
          channelTitle: 'Physics Wallah',
          publishedAt: '2023-01-01',
        },
        {
          videoId: 'WgHmqv_-UbQ',
          title: 'Mechanics Complete Revision',
          description: 'Complete mechanics revision for JEE/NEET',
          thumbnailUrl: 'https://i.ytimg.com/vi/WgHmqv_-UbQ/mqdefault.jpg',
          channelTitle: 'Unacademy JEE',
          publishedAt: '2023-01-01',
        },
      ],
      chemistry: [
        {
          videoId: 'FSyAehMdpyI',
          title: 'Chemistry - Important Concepts',
          description: 'Key chemistry concepts for competitive exams',
          thumbnailUrl: 'https://i.ytimg.com/vi/FSyAehMdpyI/mqdefault.jpg',
          channelTitle: 'Chemistry by Pankaj Sir',
          publishedAt: '2023-01-01',
        },
      ],
      biology: [
        {
          videoId: 'cJL7s6cwDaE',
          title: 'Biology - NCERT Chapter Explanations',
          description: 'Complete NCERT biology explanations for NEET',
          thumbnailUrl: 'https://i.ytimg.com/vi/cJL7s6cwDaE/mqdefault.jpg',
          channelTitle: 'NEET Biology',
          publishedAt: '2023-01-01',
        },
      ],
      mathematics: [
        {
          videoId: 'OmJ-4B-mS-Y',
          title: 'Mathematics - Problem Solving Techniques',
          description: 'Advanced math techniques for JEE',
          thumbnailUrl: 'https://i.ytimg.com/vi/OmJ-4B-mS-Y/mqdefault.jpg',
          channelTitle: 'JEE Mathematics',
          publishedAt: '2023-01-01',
        },
      ],
    };

    return fallbackVideos[subject] || [
      {
        videoId: 'dQw4w9WgXcQ',
        title: 'Educational Video',
        description: 'Search for specific topics on YouTube for more relevant content.',
        thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
        channelTitle: 'Educational Channel',
        publishedAt: '2023-01-01',
      },
    ];
  }

  private detectSubject(query: string): string {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('physics') || lowerQuery.includes('mechanics') || lowerQuery.includes('motion')) {
      return 'physics';
    }
    if (lowerQuery.includes('chemistry') || lowerQuery.includes('organic') || lowerQuery.includes('inorganic')) {
      return 'chemistry';
    }
    if (lowerQuery.includes('biology') || lowerQuery.includes('cell') || lowerQuery.includes('genetics')) {
      return 'biology';
    }
    if (lowerQuery.includes('math') || lowerQuery.includes('calculus') || lowerQuery.includes('algebra')) {
      return 'mathematics';
    }
    return 'general';
  }
}

export const youtubeService = new YouTubeService();
