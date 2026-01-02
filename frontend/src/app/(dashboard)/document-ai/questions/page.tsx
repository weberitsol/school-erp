'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Brain,
  Sparkles,
  BookOpen,
  Target,
  Award,
  FileText,
  Zap,
  GraduationCap,
  Beaker,
  Calculator,
  Dna,
  Languages,
  Loader2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { questionsApi, subjectsApi, Question, DifficultyLevel, QuestionType } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/hooks/use-toast';
import QuestionModal from '@/components/modals/question-modal';

// Animated counter component
function AnimatedNumber({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    const startValue = displayValue;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(startValue + (value - startValue) * easeOut));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{displayValue.toLocaleString()}</span>;
}

// Interface for display question
interface DisplayQuestion {
  id: string;
  questionText: string;
  questionType: QuestionType;
  difficulty: DifficultyLevel;
  subject: string;
  class: string;
  chapter: string;
  marks: number;
  isVerified: boolean;
  source: string;
  createdAt: string;
}

const questionTypes = ['All Types', 'MCQ', 'TRUE_FALSE', 'SHORT_ANSWER', 'LONG_ANSWER', 'FILL_BLANK'];
const difficulties = ['All Levels', 'EASY', 'MEDIUM', 'HARD'];

const subjectIcons: Record<string, React.ReactNode> = {
  Mathematics: <Calculator className="h-4 w-4" />,
  Physics: <Zap className="h-4 w-4" />,
  Chemistry: <Beaker className="h-4 w-4" />,
  Biology: <Dna className="h-4 w-4" />,
  English: <Languages className="h-4 w-4" />,
};

export default function QuestionBankPage() {
  const { accessToken } = useAuthStore();
  const { toast } = useToast();

  // State
  const [questions, setQuestions] = useState<DisplayQuestion[]>([]);
  const [rawQuestions, setRawQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<string[]>(['All Subjects']);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [selectedType, setSelectedType] = useState('All Types');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All Levels');
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const pageSize = 10;

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  // Fetch questions from API
  const fetchQuestions = useCallback(async (showRefresh = false) => {
    if (!accessToken) return;

    if (showRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const params: {
        page?: number;
        limit?: number;
        subjectId?: string;
        questionType?: QuestionType;
        difficulty?: DifficultyLevel;
        isVerified?: boolean;
        search?: string;
      } = {
        page: currentPage,
        limit: pageSize,
      };

      if (selectedType !== 'All Types') {
        params.questionType = selectedType as QuestionType;
      }
      if (selectedDifficulty !== 'All Levels') {
        params.difficulty = selectedDifficulty as DifficultyLevel;
      }
      if (showVerifiedOnly) {
        params.isVerified = true;
      }
      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await questionsApi.getAll(accessToken, params) as any;

      if (response.success && response.data) {
        // Handle both array response and paginated response
        // response.data is the questions array directly
        const apiQuestions = Array.isArray(response.data) ? response.data : (response.data.questions || []);

        // Store raw questions for modal
        setRawQuestions(apiQuestions);

        // Transform API questions to display format
        const displayQuestions: DisplayQuestion[] = apiQuestions.map((q: Question) => ({
          id: q.id,
          questionText: q.questionText,
          questionType: q.questionType,
          difficulty: q.difficulty,
          subject: q.subject?.name || 'Unknown',
          class: q.class?.name || 'Unknown',
          chapter: q.chapter || 'General',
          marks: q.marks,
          isVerified: q.isVerified || false,
          source: q.source || 'MANUAL',
          createdAt: q.createdAt ? new Date(q.createdAt).toLocaleDateString() : '',
        }));

        setQuestions(displayQuestions);
        // Handle pagination - check for pagination.total or total
        const total = response.pagination?.total || displayQuestions.length;
        setTotalQuestions(total);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch questions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [accessToken, currentPage, selectedType, selectedDifficulty, showVerifiedOnly, searchQuery, toast]);

  // Fetch subjects for filter
  const fetchSubjects = useCallback(async () => {
    if (!accessToken) return;

    try {
      const response = await subjectsApi.getAll(accessToken);
      if (response.success && response.data) {
        const subjectNames = response.data.map((s: { name: string }) => s.name);
        setSubjects(['All Subjects', ...subjectNames]);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  }, [accessToken]);

  // Initial data fetch
  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSubject, selectedType, selectedDifficulty, showVerifiedOnly, searchQuery]);

  // Handle verify question
  const handleVerify = async (questionId: string) => {
    if (!accessToken) return;

    try {
      const response = await questionsApi.verify(questionId, accessToken);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Question verified successfully',
        });
        fetchQuestions(true);
      }
    } catch (error) {
      console.error('Error verifying question:', error);
      toast({
        title: 'Error',
        description: 'Failed to verify question',
        variant: 'destructive',
      });
    }
  };

  // Handle delete question
  const handleDelete = async (questionId: string) => {
    if (!accessToken) return;

    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      const response = await questionsApi.delete(questionId, accessToken);
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Question deleted successfully',
        });
        fetchQuestions(true);
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete question',
        variant: 'destructive',
      });
    }
  };

  // Modal handlers
  const openAddModal = () => {
    setSelectedQuestion(null);
    setModalMode('add');
    setIsModalOpen(true);
  };

  const openEditModal = (questionId: string) => {
    const question = rawQuestions.find((q) => q.id === questionId);
    if (question) {
      setSelectedQuestion(question);
      setModalMode('edit');
      setIsModalOpen(true);
    }
  };

  const openViewModal = (questionId: string) => {
    const question = rawQuestions.find((q) => q.id === questionId);
    if (question) {
      setSelectedQuestion(question);
      setModalMode('view');
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedQuestion(null);
  };

  const handleModalSuccess = () => {
    fetchQuestions(true);
  };

  // Filter questions locally for subject filter (API may not support all filters)
  const filteredQuestions = questions.filter((q) => {
    if (selectedSubject !== 'All Subjects' && q.subject !== selectedSubject) return false;
    return true;
  });

  // Stats calculation
  const verifiedCount = questions.filter(q => q.isVerified).length;
  const aiExtractedCount = questions.filter(q => q.source === 'EXTRACTED' || q.source === 'GENERATED').length;
  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  // Pagination
  const totalPages = Math.ceil(totalQuestions / pageSize);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return 'bg-gradient-to-r from-emerald-500 to-green-400 text-white';
      case 'MEDIUM':
        return 'bg-gradient-to-r from-amber-500 to-yellow-400 text-white';
      case 'HARD':
        return 'bg-gradient-to-r from-rose-500 to-red-400 text-white';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'MCQ':
        return 'Multiple Choice';
      case 'TRUE_FALSE':
        return 'True/False';
      case 'SHORT_ANSWER':
        return 'Short Answer';
      case 'LONG_ANSWER':
        return 'Long Answer';
      case 'FILL_BLANK':
        return 'Fill in Blank';
      case 'MATCHING':
        return 'Matching';
      default:
        return type;
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'EXTRACTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-full shadow-sm shadow-blue-500/25">
            <Brain className="h-3 w-3" />
            AI Extracted
          </span>
        );
      case 'GENERATED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-400 text-white rounded-full shadow-sm shadow-purple-500/25">
            <Sparkles className="h-3 w-3" />
            AI Generated
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
            <Edit className="h-3 w-3" />
            Manual
          </span>
        );
    }
  };

  const getSubjectIcon = (subject: string) => {
    return subjectIcons[subject] || <BookOpen className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 md:p-8">
        <div className="absolute inset-0 opacity-10 bg-grid-white"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 text-xs font-semibold bg-white/20 backdrop-blur-sm text-white rounded-full">
                Smart Repository
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Question Bank
            </h1>
            <p className="text-indigo-100 max-w-xl">
              AI-powered question repository. Create, organize, and manage questions across subjects and difficulty levels.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchQuestions(true)}
              disabled={isRefreshing}
              className="group px-3 py-2.5 text-sm font-medium text-white bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all duration-300 flex items-center gap-2 border border-white/20 disabled:opacity-50"
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            </button>
            <Link
              href="/document-ai/upload"
              className="group px-4 py-2.5 text-sm font-medium text-indigo-600 bg-white rounded-xl hover:bg-indigo-50 transition-all duration-300 flex items-center gap-2 shadow-lg shadow-black/10"
            >
              <Brain className="h-4 w-4 group-hover:scale-110 transition-transform" />
              Upload Document
            </Link>
            <button
              onClick={openAddModal}
              className="group px-4 py-2.5 text-sm font-medium text-white bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all duration-300 flex items-center gap-2 border border-white/20"
            >
              <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
              Add Question
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-400 shadow-lg shadow-indigo-500/25">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                <AnimatedNumber value={questions.length} />
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Questions</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-green-400 shadow-lg shadow-emerald-500/25">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                <AnimatedNumber value={verifiedCount} />
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Verified</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/25">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                <AnimatedNumber value={aiExtractedCount} />
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">AI Powered</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-400 shadow-lg shadow-amber-500/25">
              <Award className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                <AnimatedNumber value={totalMarks} />
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Marks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-indigo-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters</span>
        </div>
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all"
            />
          </div>

          {/* Subject Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all cursor-pointer"
          >
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all cursor-pointer"
          >
            {questionTypes.map((t) => (
              <option key={t} value={t}>
                {t === 'All Types' ? t : getTypeLabel(t)}
              </option>
            ))}
          </select>

          {/* Difficulty Filter */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all cursor-pointer"
          >
            {difficulties.map((d) => (
              <option key={d} value={d}>
                {d === 'All Levels' ? d : d.charAt(0) + d.slice(1).toLowerCase()}
              </option>
            ))}
          </select>

          {/* Verified Toggle */}
          <label className="flex items-center gap-2 cursor-pointer px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
            <div className="relative">
              <input
                type="checkbox"
                checked={showVerifiedOnly}
                onChange={(e) => setShowVerifiedOnly(e.target.checked)}
                className="sr-only"
              />
              <div className={cn(
                "w-9 h-5 rounded-full transition-colors duration-200",
                showVerifiedOnly ? "bg-gradient-to-r from-indigo-500 to-purple-500" : "bg-gray-300 dark:bg-gray-600"
              )}>
                <div className={cn(
                  "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200",
                  showVerifiedOnly && "translate-x-4"
                )}></div>
              </div>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
              Verified only
            </span>
          </label>
        </div>
      </div>

      {/* Questions Grid */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No questions found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Try adjusting your filters or search query</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSubject('All Subjects');
                setSelectedType('All Types');
                setSelectedDifficulty('All Levels');
                setShowVerifiedOnly(false);
              }}
              className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          filteredQuestions.map((question, index) => (
            <div
              key={question.id}
              className="group bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-5 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 hover:-translate-y-0.5"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                {/* Question Number & Subject Icon */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/25">
                    {question.id}
                  </div>
                  <div className="lg:hidden flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                      {getSubjectIcon(question.subject)}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{question.subject}</span>
                  </div>
                </div>

                {/* Question Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {getSourceBadge(question.source)}
                    <span className={cn(
                      "px-2.5 py-0.5 text-xs font-medium rounded-full shadow-sm",
                      getDifficultyColor(question.difficulty)
                    )}>
                      {question.difficulty}
                    </span>
                    <span className="px-2.5 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                      {getTypeLabel(question.questionType)}
                    </span>
                    <span className="px-2.5 py-0.5 text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full">
                      {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
                    </span>
                  </div>

                  <p className="text-gray-900 dark:text-white font-medium mb-2 leading-relaxed">
                    {question.questionText}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="hidden lg:flex items-center gap-1.5">
                      <div className="p-1 rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                        {getSubjectIcon(question.subject)}
                      </div>
                      <span>{question.subject}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4" />
                      <span>{question.chapter}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4" />
                      <span>{question.class}</span>
                    </div>
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-3 lg:flex-col lg:items-end">
                  <div className="flex items-center gap-2">
                    {question.isVerified ? (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">Verified</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleVerify(question.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                      >
                        <Target className="h-4 w-4" />
                        <span className="text-xs font-medium">Verify</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openViewModal(question.id)}
                      className="p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      title="View Question"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(question.id)}
                      className="p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      title="Edit Question"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(question.id)}
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-500 transition-colors"
                      title="Delete Question"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!isLoading && filteredQuestions.length > 0 && (
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing <span className="font-medium text-gray-900 dark:text-white">{((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalQuestions)}</span> of <span className="font-medium text-gray-900 dark:text-white">{totalQuestions}</span> questions
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-300 dark:hover:border-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="h-4 w-4 text-gray-500" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 3) {
                  pageNum = i + 1;
                } else if (currentPage === 1) {
                  pageNum = i + 1;
                } else if (currentPage === totalPages) {
                  pageNum = totalPages - 2 + i;
                } else {
                  pageNum = currentPage - 1 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      "w-9 h-9 rounded-xl text-sm font-medium transition-colors",
                      currentPage === pageNum
                        ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-300 dark:hover:border-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {/* Question Modal */}
      {accessToken && (
        <QuestionModal
          isOpen={isModalOpen}
          onClose={closeModal}
          mode={modalMode}
          question={selectedQuestion}
          accessToken={accessToken}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}
