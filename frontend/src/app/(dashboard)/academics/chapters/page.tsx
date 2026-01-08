'use client';

import { useState, useEffect } from 'react';
import {
  BookOpen,
  Download,
  Loader2,
  RefreshCw,
  FileText,
  Search,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/hooks/use-toast';
import { GenerateStudyMaterialDialog } from '@/components/modals';

interface Chapter {
  id: string;
  name: string;
  description?: string;
  subject?: {
    id: string;
    name: string;
  };
  class?: {
    id: string;
    name: string;
  };
  topicCount?: number;
  _count?: {
    questions?: number;
  };
}

export default function ChaptersPage() {
  const { user, accessToken } = useAuthStore();
  const { toast } = useToast();

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');

  // Dialog states
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [selectedChapterForGeneration, setSelectedChapterForGeneration] = useState<Chapter | null>(null);

  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  // Fetch chapters from API
  const fetchChapters = async () => {
    if (!accessToken) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedSubject !== 'All Subjects') params.append('subject', selectedSubject);

      const response = await fetch(
        `http://localhost:5000/api/v1/chapters?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setChapters(Array.isArray(data.data) ? data.data : data.data?.chapters || []);
      } else {
        toast({
          title: 'Note',
          description: 'Could not fetch chapters from server.',
        });
        setChapters([]);
      }
    } catch (error) {
      console.error('Error fetching chapters:', error);
      toast({
        title: 'Error',
        description: 'Failed to load chapters',
        variant: 'destructive',
      });
      setChapters([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChapters();
  }, [accessToken]);

  // Filter chapters client-side
  const filteredChapters = chapters.filter((chapter) => {
    if (selectedSubject !== 'All Subjects' && chapter.subject?.name !== selectedSubject) {
      return false;
    }
    if (searchQuery && !chapter.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleGenerateStudyMaterial = (chapter: Chapter) => {
    setSelectedChapterForGeneration(chapter);
    setShowGenerateDialog(true);
  };

  // Get unique subjects from chapters
  const subjects = ['All Subjects', ...new Set(chapters.map((ch) => ch.subject?.name).filter(Boolean) as string[])];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 p-6 md:p-8">
        <div className="absolute inset-0 opacity-10 bg-grid-white"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-white">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-6 w-6" />
              <span className="text-sm font-medium text-orange-200">Study Materials</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Chapters
            </h1>
            <p className="text-orange-100 mt-2 max-w-md">
              Generate study materials for each chapter
            </p>
          </div>
          <button
            onClick={fetchChapters}
            className="p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            title="Refresh"
          >
            <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-5">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chapters..."
              className="relative w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-sm transition-all"
            />
          </div>

          {/* Subject Filter */}
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-gray-500 hidden md:block" />
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              {subjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-amber-500 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Loading chapters...</p>
          </div>
        </div>
      ) : filteredChapters.length > 0 ? (
        <div className="space-y-4">
          {filteredChapters.map((chapter, index) => (
            <div
              key={chapter.id}
              className="group bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                        {chapter.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {chapter.description || 'No description available'}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {chapter.subject && (
                          <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-medium">
                            {chapter.subject.name}
                          </span>
                        )}
                        {chapter.class && (
                          <span className="px-2.5 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-lg text-xs font-medium">
                            {chapter.class.name}
                          </span>
                        )}
                        {chapter._count?.questions && (
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {chapter._count.questions} questions
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleGenerateStudyMaterial(chapter)}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-lg shadow-amber-500/25 flex items-center gap-2 w-full md:w-auto justify-center whitespace-nowrap"
                >
                  <Download className="h-4 w-4" />
                  Generate Study Material
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
            <BookOpen className="h-10 w-10 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No chapters found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
            {searchQuery || selectedSubject !== 'All Subjects'
              ? 'Try adjusting your search or filter criteria'
              : 'No chapters available yet'}
          </p>
        </div>
      )}

      {/* Generate Study Material Dialog */}
      {showGenerateDialog && selectedChapterForGeneration && (
        <GenerateStudyMaterialDialog
          chapterId={selectedChapterForGeneration.id}
          chapterName={selectedChapterForGeneration.name}
          onClose={() => setShowGenerateDialog(false)}
          onSuccess={() => {
            toast({
              title: 'Success',
              description: 'Study material generated successfully!',
            });
            setShowGenerateDialog(false);
          }}
        />
      )}
    </div>
  );
}
