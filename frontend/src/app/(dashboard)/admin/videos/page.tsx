'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Video,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Play,
  Users,
  Tag,
  BookOpen,
  Loader2,
  ArrowLeft,
  Send,
  Sparkles,
  X,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { videosApi, classesApi, subjectsApi, tagsApi, SchoolYouTubeVideo, VideoStatus, Tag as TagType } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type PageMode = 'list' | 'add' | 'edit' | 'view';

interface FormData {
  youtubeUrl: string;
  title: string;
  description: string;
  subjectId: string;
  tagIds: string[];
}

const initialFormData: FormData = {
  youtubeUrl: '',
  title: '',
  description: '',
  subjectId: '',
  tagIds: [],
};

interface ClassOption {
  id: string;
  name: string;
  sections: { id: string; name: string }[];
}

export default function AdminVideosPage() {
  const { accessToken } = useAuthStore();
  const { toast } = useToast();

  const [mode, setMode] = useState<PageMode>('list');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [videos, setVideos] = useState<SchoolYouTubeVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<SchoolYouTubeVideo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Dropdown data
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);

  // Access control
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [accessClassId, setAccessClassId] = useState('');
  const [accessSectionId, setAccessSectionId] = useState('');

  // Questions
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  // Fetch videos
  const fetchVideos = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const response = await videosApi.getAll(accessToken);
      if (response.success && response.data) {
        setVideos(response.data);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  // Fetch dropdown data
  const fetchDropdownData = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [subjectsRes, tagsRes, classesRes] = await Promise.all([
        subjectsApi.getAll(accessToken),
        tagsApi.getAll(accessToken),
        classesApi.getAll(accessToken),
      ]);

      if (subjectsRes.success && subjectsRes.data) {
        setSubjects(subjectsRes.data);
      }
      if (tagsRes.success && tagsRes.data) {
        setTags(tagsRes.data);
      }
      if (classesRes.success && classesRes.data) {
        // Map classes to include sections array
        const mappedClasses = classesRes.data.map((cls: any) => ({
          id: cls.id,
          name: cls.name,
          sections: cls.sections || [],
        }));
        setClasses(mappedClasses);
      }
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchVideos();
    fetchDropdownData();
  }, [fetchVideos, fetchDropdownData]);

  // Extract video ID from URL for thumbnail preview
  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) return match[1];
    }
    return null;
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    // Validation
    const errors: Record<string, string> = {};
    if (!formData.youtubeUrl.trim()) errors.youtubeUrl = 'YouTube URL is required';
    else if (!extractVideoId(formData.youtubeUrl)) errors.youtubeUrl = 'Invalid YouTube URL';
    if (!formData.title.trim()) errors.title = 'Title is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      if (mode === 'add') {
        const response = await videosApi.create({
          youtubeUrl: formData.youtubeUrl,
          title: formData.title,
          description: formData.description || undefined,
          subjectId: formData.subjectId || undefined,
          tagIds: formData.tagIds.length > 0 ? formData.tagIds : undefined,
        }, accessToken);

        if (response.success) {
          toast({ title: 'Success', description: 'Video added successfully' });
          setMode('list');
          fetchVideos();
        } else {
          throw new Error(response.error);
        }
      } else if (mode === 'edit' && selectedVideo) {
        const response = await videosApi.update(selectedVideo.id, {
          title: formData.title,
          description: formData.description || undefined,
          subjectId: formData.subjectId || undefined,
          tagIds: formData.tagIds,
        }, accessToken);

        if (response.success) {
          toast({ title: 'Success', description: 'Video updated successfully' });
          setMode('list');
          fetchVideos();
        } else {
          throw new Error(response.error);
        }
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete
  const handleDelete = async (video: SchoolYouTubeVideo) => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    if (!accessToken) return;

    try {
      const response = await videosApi.delete(video.id, accessToken);
      if (response.success) {
        toast({ title: 'Success', description: 'Video deleted' });
        fetchVideos();
      } else {
        throw new Error(response.error);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  // Handle publish
  const handlePublish = async (video: SchoolYouTubeVideo) => {
    if (!accessToken) return;
    try {
      const response = await videosApi.publish(video.id, accessToken);
      if (response.success) {
        toast({ title: 'Success', description: 'Video published' });
        fetchVideos();
      } else {
        throw new Error(response.error);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  // Handle grant access
  const handleGrantAccess = async () => {
    if (!accessToken || !selectedVideo || !accessClassId) return;
    try {
      const response = await videosApi.grantAccess(selectedVideo.id, {
        classId: accessClassId,
        sectionId: accessSectionId || undefined,
      }, accessToken);

      if (response.success) {
        toast({ title: 'Success', description: 'Access granted' });
        setShowAccessModal(false);
        setAccessClassId('');
        setAccessSectionId('');
        // Refresh video details
        const videoRes = await videosApi.getById(selectedVideo.id, accessToken);
        if (videoRes.success && videoRes.data) {
          setSelectedVideo(videoRes.data);
        }
      } else {
        throw new Error(response.error);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  // Handle generate questions
  const handleGenerateQuestions = async () => {
    if (!accessToken || !selectedVideo) return;
    setIsGeneratingQuestions(true);
    try {
      const response = await videosApi.generateQuestions(selectedVideo.id, 4, accessToken);
      if (response.success) {
        toast({ title: 'Success', description: `Generated ${response.data?.length || 0} questions` });
        // Refresh video
        const videoRes = await videosApi.getById(selectedVideo.id, accessToken);
        if (videoRes.success && videoRes.data) {
          setSelectedVideo(videoRes.data);
        }
      } else {
        throw new Error(response.error);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // Handle edit mode
  const handleEdit = (video: SchoolYouTubeVideo) => {
    setSelectedVideo(video);
    setFormData({
      youtubeUrl: video.youtubeUrl,
      title: video.title,
      description: video.description || '',
      subjectId: video.subjectId || '',
      tagIds: video.videoTags?.map(vt => vt.tag.id) || [],
    });
    setFormErrors({});
    setMode('edit');
  };

  // Handle view mode
  const handleView = async (video: SchoolYouTubeVideo) => {
    if (!accessToken) return;
    try {
      const response = await videosApi.getById(video.id, accessToken);
      if (response.success && response.data) {
        setSelectedVideo(response.data);
        setMode('view');
      }
    } catch (error) {
      console.error('Error fetching video details:', error);
    }
  };

  // Filter videos
  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle tag selection
  const toggleTag = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter(id => id !== tagId)
        : [...prev.tagIds, tagId],
    }));
  };

  // Get status color
  const getStatusColor = (status: VideoStatus) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'DRAFT': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  // Render list view
  const renderList = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <Video className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Video Library</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage YouTube videos for students</p>
          </div>
        </div>
        <button
          onClick={() => {
            setFormData(initialFormData);
            setFormErrors({});
            setMode('add');
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Add Video
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search videos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      {/* Video Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Video className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No videos found</h3>
          <p className="text-gray-500 dark:text-gray-400">Add your first YouTube video to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <div
              key={video.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-gray-100 dark:bg-gray-700">
                {video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Video className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={cn('px-2 py-1 text-xs font-medium rounded-full', getStatusColor(video.status))}>
                    {video.status}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">{video.title}</h3>
                {video.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">{video.description}</p>
                )}

                {/* Tags */}
                {video.videoTags && video.videoTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {video.videoTags.slice(0, 3).map((vt) => (
                      <span
                        key={vt.id}
                        className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full"
                      >
                        {vt.tag.name}
                      </span>
                    ))}
                    {video.videoTags.length > 3 && (
                      <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                        +{video.videoTags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {video._count?.watchSessions || 0} views
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {video._count?.comprehensionQuestions || 0} questions
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleView(video)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </button>
                  <button
                    onClick={() => handleEdit(video)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </button>
                  {video.status === 'DRAFT' && (
                    <button
                      onClick={() => handlePublish(video)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                    >
                      <Send className="h-4 w-4" />
                      Publish
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render form
  const renderForm = () => {
    const videoId = extractVideoId(formData.youtubeUrl);

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMode('list')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {mode === 'add' ? 'Add Video' : 'Edit Video'}
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          {/* YouTube URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              YouTube URL *
            </label>
            <input
              type="text"
              value={formData.youtubeUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, youtubeUrl: e.target.value }))}
              placeholder="https://www.youtube.com/watch?v=..."
              disabled={mode === 'edit'}
              className={cn(
                'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500',
                formErrors.youtubeUrl ? 'border-red-500' : 'border-gray-200 dark:border-gray-700',
                mode === 'edit' && 'opacity-50 cursor-not-allowed'
              )}
            />
            {formErrors.youtubeUrl && (
              <p className="text-red-500 text-xs mt-1">{formErrors.youtubeUrl}</p>
            )}
          </div>

          {/* Thumbnail Preview */}
          {videoId && (
            <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
              <img
                src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                alt="Video thumbnail"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                }}
              />
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Video title"
              className={cn(
                'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500',
                formErrors.title ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
              )}
            />
            {formErrors.title && (
              <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the video"
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subject
            </label>
            <select
              value={formData.subjectId}
              onChange={(e) => setFormData(prev => ({ ...prev, subjectId: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Select subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags (for folder organization)
            </label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={cn(
                    'px-3 py-1 text-sm rounded-full border transition-colors',
                    formData.tagIds.includes(tag.id)
                      ? 'bg-red-100 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-400'
                      : 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-red-500'
                  )}
                >
                  {formData.tagIds.includes(tag.id) && <CheckCircle2 className="h-3 w-3 inline mr-1" />}
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setMode('list')}
              className="px-6 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {mode === 'add' ? 'Add Video' : 'Update Video'}
            </button>
          </div>
        </form>
      </div>
    );
  };

  // Render view mode
  const renderView = () => {
    if (!selectedVideo) return null;

    const selectedClass = classes.find(c => c.id === accessClassId);

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMode('list')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedVideo.title}</h1>
          <span className={cn('px-2 py-1 text-xs font-medium rounded-full', getStatusColor(selectedVideo.status))}>
            {selectedVideo.status}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Preview */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="aspect-video">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${selectedVideo.youtubeVideoId}?rel=0&modestbranding=1`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="p-4">
                <p className="text-gray-600 dark:text-gray-400">{selectedVideo.description || 'No description'}</p>
              </div>
            </div>

            {/* Questions Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Comprehension Questions ({selectedVideo.comprehensionQuestions?.length || 0})
                </h2>
                <button
                  onClick={handleGenerateQuestions}
                  disabled={isGeneratingQuestions}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors disabled:opacity-50"
                >
                  {isGeneratingQuestions ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Generate with AI
                </button>
              </div>

              {selectedVideo.comprehensionQuestions && selectedVideo.comprehensionQuestions.length > 0 ? (
                <div className="space-y-4">
                  {selectedVideo.comprehensionQuestions.map((q, idx) => (
                    <div key={q.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full flex items-center justify-center text-sm font-medium">
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">{q.questionText}</p>
                          <div className="mt-2 space-y-1">
                            {(q.options as any[]).map((opt: any) => (
                              <div
                                key={opt.id}
                                className={cn(
                                  'px-3 py-1 rounded text-sm',
                                  opt.id === q.correctAnswer
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                    : 'text-gray-600 dark:text-gray-400'
                                )}
                              >
                                {opt.id.toUpperCase()}. {opt.text}
                              </div>
                            ))}
                          </div>
                          {q.isAIGenerated && (
                            <span className="inline-flex items-center gap-1 mt-2 text-xs text-purple-600 dark:text-purple-400">
                              <Sparkles className="h-3 w-3" /> AI Generated
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No questions yet. Generate questions using AI or add them manually.
                </p>
              )}
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
              <button
                onClick={() => handleEdit(selectedVideo)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              >
                <Edit2 className="h-4 w-4" />
                Edit Video
              </button>
              {selectedVideo.status === 'DRAFT' && (
                <button
                  onClick={() => handlePublish(selectedVideo)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                >
                  <Send className="h-4 w-4" />
                  Publish Video
                </button>
              )}
              <button
                onClick={() => handleDelete(selectedVideo)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete Video
              </button>
            </div>

            {/* Batch Access */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Batch Access</h3>
                <button
                  onClick={() => setShowAccessModal(true)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <Plus className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {selectedVideo.videoAccess && selectedVideo.videoAccess.length > 0 ? (
                <div className="space-y-2">
                  {selectedVideo.videoAccess.map((access) => (
                    <div key={access.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {access.class?.name} {access.section ? `- ${access.section.name}` : '(All)'}
                      </span>
                      <button
                        onClick={async () => {
                          if (!accessToken) return;
                          await videosApi.revokeAccess(selectedVideo.id, access.id, accessToken);
                          const videoRes = await videosApi.getById(selectedVideo.id, accessToken);
                          if (videoRes.success && videoRes.data) {
                            setSelectedVideo(videoRes.data);
                          }
                        }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      >
                        <X className="h-3 w-3 text-gray-500" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No batches assigned yet
                </p>
              )}
            </div>

            {/* Tags */}
            {selectedVideo.videoTags && selectedVideo.videoTags.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedVideo.videoTags.map((vt) => (
                    <span
                      key={vt.id}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                    >
                      {vt.tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Access Modal */}
        {showAccessModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Grant Batch Access</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Class</label>
                  <select
                    value={accessClassId}
                    onChange={(e) => {
                      setAccessClassId(e.target.value);
                      setAccessSectionId('');
                    }}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">Select class</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Section (optional)</label>
                  <select
                    value={accessSectionId}
                    onChange={(e) => setAccessSectionId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    disabled={!accessClassId}
                  >
                    <option value="">All sections</option>
                    {selectedClass?.sections.map((section) => (
                      <option key={section.id} value={section.id}>{section.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-6">
                <button
                  onClick={() => setShowAccessModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGrantAccess}
                  disabled={!accessClassId}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  Grant Access
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6">
      {mode === 'list' && renderList()}
      {(mode === 'add' || mode === 'edit') && renderForm()}
      {mode === 'view' && renderView()}
    </div>
  );
}
