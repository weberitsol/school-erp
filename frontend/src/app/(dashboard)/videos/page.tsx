'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { videosApi } from '@/lib/api';
import {
  Play,
  Clock,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Search,
  Filter,
  BookOpen,
  Eye,
  Award,
} from 'lucide-react';

interface VideoTag {
  id: string;
  name: string;
  color?: string;
}

interface Video {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  subject: { id: string; name: string } | null;
  tags: VideoTag[];
  watchStats?: {
    totalWatchTime: number;
    isCompleted: boolean;
    lastWatched: string | null;
    progressPercent: number;
  };
}

interface TagFolder {
  tag: VideoTag;
  videos: Video[];
  isExpanded: boolean;
}

export default function StudentVideosPage() {
  const router = useRouter();
  const { user, accessToken, isLoading: authLoading } = useAuthStore();
  const [videos, setVideos] = useState<Video[]>([]);
  const [tagFolders, setTagFolders] = useState<TagFolder[]>([]);
  const [untaggedVideos, setUntaggedVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!authLoading && accessToken) {
      fetchVideos();
    }
  }, [authLoading, accessToken]);

  const fetchVideos = async () => {
    if (!accessToken) return;

    setLoading(true);
    setError(null);

    try {
      const response = await videosApi.getAvailable(accessToken);
      const videosData = (response.data || []).map((v: any) => ({
        ...v,
        tags: v.videoTags?.map((vt: any) => vt.tag) || [],
      })) as Video[];
      setVideos(videosData);

      // Extract unique subjects
      const subjectMap = new Map<string, { id: string; name: string }>();
      videosData.forEach((video: Video) => {
        if (video.subject) {
          subjectMap.set(video.subject.id, video.subject);
        }
      });
      setSubjects(Array.from(subjectMap.values()));

      // Organize videos by tags
      organizeByTags(videosData);
    } catch (err: any) {
      console.error('Error fetching videos:', err);
      setError(err.message || 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const organizeByTags = (videosData: Video[]) => {
    const tagMap = new Map<string, TagFolder>();
    const noTagVideos: Video[] = [];

    videosData.forEach((video) => {
      if (video.tags && video.tags.length > 0) {
        video.tags.forEach((tag) => {
          if (!tagMap.has(tag.id)) {
            tagMap.set(tag.id, {
              tag,
              videos: [],
              isExpanded: true,
            });
          }
          tagMap.get(tag.id)!.videos.push(video);
        });
      } else {
        noTagVideos.push(video);
      }
    });

    // Sort folders by tag name
    const folders = Array.from(tagMap.values()).sort((a, b) =>
      a.tag.name.localeCompare(b.tag.name)
    );

    setTagFolders(folders);
    setUntaggedVideos(noTagVideos);
  };

  const toggleFolder = (tagId: string) => {
    setTagFolders((prev) =>
      prev.map((folder) =>
        folder.tag.id === tagId
          ? { ...folder, isExpanded: !folder.isExpanded }
          : folder
      )
    );
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatWatchTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleWatchVideo = (videoId: string) => {
    router.push(`/videos/${videoId}`);
  };

  const filterVideos = (videoList: Video[]) => {
    return videoList.filter((video) => {
      const matchesSearch =
        !searchQuery ||
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSubject =
        !selectedSubject || video.subject?.id === selectedSubject;

      return matchesSearch && matchesSubject;
    });
  };

  const getFilteredFolders = () => {
    return tagFolders
      .map((folder) => ({
        ...folder,
        videos: filterVideos(folder.videos),
      }))
      .filter((folder) => folder.videos.length > 0);
  };

  const VideoCard = ({ video }: { video: Video }) => {
    const progress = video.watchStats?.progressPercent || 0;
    const isCompleted = video.watchStats?.isCompleted || false;

    return (
      <div
        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
        onClick={() => handleWatchVideo(video.id)}
      >
        {/* Thumbnail */}
        <div className="relative aspect-video bg-gray-100">
          {video.thumbnailUrl ? (
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
              <Play className="h-12 w-12 text-white opacity-80" />
            </div>
          )}

          {/* Play overlay */}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="bg-white rounded-full p-3">
              <Play className="h-8 w-8 text-indigo-600 fill-current" />
            </div>
          </div>

          {/* Duration badge */}
          {video.duration && (
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
              {formatDuration(video.duration)}
            </div>
          )}

          {/* Completed badge */}
          {isCompleted && (
            <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
              <CheckCircle className="h-4 w-4" />
            </div>
          )}

          {/* Progress bar */}
          {progress > 0 && !isCompleted && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-300">
              <div
                className="h-full bg-indigo-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">
            {video.title}
          </h3>

          {video.subject && (
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {video.subject.name}
            </p>
          )}

          {video.watchStats && video.watchStats.totalWatchTime > 0 && (
            <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {formatWatchTime(video.watchStats.totalWatchTime)} watched
              </span>
              {isCompleted && (
                <span className="flex items-center gap-1 text-green-600">
                  <Award className="h-3 w-3" />
                  Completed
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  const filteredFolders = getFilteredFolders();
  const filteredUntagged = filterVideos(untaggedVideos);
  const totalVideos = videos.length;
  const completedVideos = videos.filter((v) => v.watchStats?.isCompleted).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Video Library</h1>
        <p className="text-gray-600 mt-1">
          Watch educational videos assigned to your class
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Play className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Videos</p>
              <p className="text-xl font-semibold text-gray-900">{totalVideos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-xl font-semibold text-gray-900">{completedVideos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Remaining</p>
              <p className="text-xl font-semibold text-gray-900">{totalVideos - completedVideos}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Video Folders */}
      {filteredFolders.length === 0 && filteredUntagged.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Play className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No Videos Found</h3>
          <p className="text-gray-500 mt-1">
            {searchQuery || selectedSubject
              ? 'Try adjusting your filters'
              : 'No videos have been assigned to your class yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tagged Folders */}
          {filteredFolders.map((folder) => (
            <div
              key={folder.tag.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* Folder Header */}
              <button
                onClick={() => toggleFolder(folder.tag.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {folder.isExpanded ? (
                    <FolderOpen className="h-6 w-6 text-indigo-600" />
                  ) : (
                    <Folder className="h-6 w-6 text-indigo-600" />
                  )}
                  <span className="font-medium text-gray-900">{folder.tag.name}</span>
                  <span className="bg-gray-100 text-gray-600 text-sm px-2 py-0.5 rounded-full">
                    {folder.videos.length} video{folder.videos.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {folder.isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                )}
              </button>

              {/* Folder Content */}
              {folder.isExpanded && (
                <div className="p-4 pt-0 border-t border-gray-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {folder.videos.map((video) => (
                      <VideoCard key={video.id} video={video} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Untagged Videos */}
          {filteredUntagged.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                <Folder className="h-6 w-6 text-gray-400" />
                <span className="font-medium text-gray-900">Other Videos</span>
                <span className="bg-gray-100 text-gray-600 text-sm px-2 py-0.5 rounded-full">
                  {filteredUntagged.length} video{filteredUntagged.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredUntagged.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
