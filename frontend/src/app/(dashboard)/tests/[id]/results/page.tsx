'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Trophy,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileQuestion,
  Loader2,
  Award,
  TrendingUp,
  BarChart3,
  Eye,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Sparkles,
  Youtube,
  Lightbulb,
  MessageCircle,
  BookOpen,
  Users,
  Medal,
  PieChart,
  Send,
  ExternalLink,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import {
  testsApi,
  resultsApi,
  TestAttempt,
  TestResponse,
  DetailedAnalysis,
  AIExplanation,
  ShortcutsResponse,
  YouTubeVideo,
} from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function TestResultsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const testId = params.id as string;
  const attemptId = searchParams.get('attemptId');
  const { accessToken } = useAuthStore();
  const { toast } = useToast();

  const [attempt, setAttempt] = useState<TestAttempt | null>(null);
  const [analysis, setAnalysis] = useState<DetailedAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'review'>('overview');

  // AI Doubt Modal State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [aiExplanation, setAiExplanation] = useState<AIExplanation | null>(null);
  const [shortcuts, setShortcuts] = useState<ShortcutsResponse | null>(null);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [aiQuery, setAiQuery] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  useEffect(() => {
    if (accessToken && attemptId) {
      fetchResults();
    }
  }, [accessToken, attemptId]);

  const fetchResults = async () => {
    setIsLoading(true);
    try {
      const response = await testsApi.getAttempt(attemptId!, accessToken!);

      if (response.success && response.data) {
        setAttempt(response.data);
        // Fetch detailed analysis
        fetchAnalysis();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load results',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      toast({
        title: 'Error',
        description: 'Failed to load results',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalysis = async () => {
    setIsLoadingAnalysis(true);
    try {
      const response = await resultsApi.getDetailedAnalysis(attemptId!, accessToken!);
      if (response.success && response.data) {
        setAnalysis(response.data);
      }
    } catch (error) {
      console.error('Error fetching analysis:', error);
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  const openAIModal = async (question: any, questionId: string) => {
    setSelectedQuestion(question);
    setAiModalOpen(true);
    setAiExplanation(null);
    setShortcuts(null);
    setVideos([]);
    setAiQuery('');

    // Fetch initial explanation
    setIsLoadingAI(true);
    try {
      const [explainRes, shortcutsRes, videosRes] = await Promise.all([
        resultsApi.explainQuestion(questionId, undefined, accessToken!),
        resultsApi.getShortcutsTricks(questionId, accessToken!),
        resultsApi.getQuestionVideos(questionId, accessToken!),
      ]);

      if (explainRes.success) setAiExplanation(explainRes.data!);
      if (shortcutsRes.success) setShortcuts(shortcutsRes.data!);
      if (videosRes.success) setVideos(videosRes.data!.videos || []);
    } catch (error) {
      console.error('Error fetching AI data:', error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const askFollowUp = async () => {
    if (!aiQuery.trim() || !selectedQuestion) return;

    setIsLoadingAI(true);
    try {
      const response = await resultsApi.explainQuestion(
        selectedQuestion.id,
        aiQuery,
        accessToken!
      );
      if (response.success) {
        setAiExplanation(response.data!);
        setAiQuery('');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to get AI response',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingAI(false);
    }
  };

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const formatTime = (seconds: number | null | undefined) => {
    if (!seconds) return '-';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const getScoreGrade = (percentage: number): { grade: string; color: string; bgColor: string } => {
    if (percentage >= 90) return { grade: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-500' };
    if (percentage >= 75) return { grade: 'Very Good', color: 'text-blue-600', bgColor: 'bg-blue-500' };
    if (percentage >= 60) return { grade: 'Good', color: 'text-cyan-600', bgColor: 'bg-cyan-500' };
    if (percentage >= 40) return { grade: 'Average', color: 'text-amber-600', bgColor: 'bg-amber-500' };
    return { grade: 'Needs Improvement', color: 'text-red-600', bgColor: 'bg-red-500' };
  };

  const isPassed = () => {
    if (!attempt?.test?.passingMarks || !attempt.totalScore) return null;
    return attempt.totalScore >= attempt.test.passingMarks;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Results not found
          </h3>
          <Link
            href="/tests"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tests
          </Link>
        </div>
      </div>
    );
  }

  const percentage = Number(attempt.percentage) || 0;
  const scoreInfo = getScoreGrade(percentage);
  const passed = isPassed();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        href="/tests"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Tests
      </Link>

      {/* Results Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 p-6 md:p-8">
        <div className="absolute inset-0 opacity-10 bg-grid-white"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-5 w-5 text-purple-200" />
              <span className="text-sm font-medium text-purple-200">Test Results</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {attempt.test?.title}
            </h1>

            <p className="text-purple-100 text-sm">
              Attempt #{attempt.attemptNumber} • Submitted {formatDate(attempt.submittedAt)}
            </p>
          </div>

          {/* Rank Badge */}
          {analysis && (
            <div className="flex items-center gap-3 bg-white/10 rounded-xl p-4">
              <Medal className="h-10 w-10 text-yellow-300" />
              <div>
                <p className="text-2xl font-bold text-white">#{analysis.overview.rank}</p>
                <p className="text-purple-200 text-sm">
                  of {analysis.overview.totalStudents} students
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'analysis', label: 'Analysis', icon: PieChart },
          { id: 'review', label: 'Question Review', icon: Eye },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all',
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Score Overview */}
          <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Score Circle */}
                <div className="relative w-40 h-40 flex-shrink-0">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      className="text-gray-200 dark:text-gray-700"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="url(#gradient)"
                      strokeWidth="12"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${(percentage / 100) * 439.8} 439.8`}
                      className="transition-all duration-1000 ease-out"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#EC4899" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      {percentage.toFixed(1)}%
                    </span>
                    <span className={cn('text-sm font-medium', scoreInfo.color)}>
                      {scoreInfo.grade}
                    </span>
                  </div>
                </div>

                {/* Score Details */}
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {Number(attempt.totalScore || 0).toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      out of {attempt.test?.totalMarks}
                    </p>
                  </div>

                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {attempt.correctAnswers}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">Correct</p>
                  </div>

                  <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {attempt.questionsAnswered - attempt.correctAnswers}
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400">Wrong</p>
                  </div>

                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                    <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                      {(attempt.responses?.length || 0) - attempt.questionsAnswered}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Skipped</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pass/Fail Banner */}
            {passed !== null && (
              <div
                className={cn(
                  'px-6 py-4 flex items-center justify-center gap-3',
                  passed
                    ? 'bg-green-50 dark:bg-green-900/20 border-t border-green-100 dark:border-green-800/30'
                    : 'bg-red-50 dark:bg-red-900/20 border-t border-red-100 dark:border-red-800/30'
                )}
              >
                {passed ? (
                  <>
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-700 dark:text-green-400">
                        Congratulations! You Passed!
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-500">
                        Passing marks: {attempt.test?.passingMarks}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                      <XCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-red-700 dark:text-red-400">
                        You did not pass this test
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-500">
                        Passing marks: {attempt.test?.passingMarks}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Comparison with Topper & Class Average */}
          {analysis && (
            <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Users className="h-5 w-5 text-purple-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Comparison with Class
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Your Score */}
                <div className="text-center p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-800">
                  <p className="text-sm text-purple-600 dark:text-purple-400 mb-2">Your Score</p>
                  <p className="text-4xl font-bold text-purple-700 dark:text-purple-300">
                    {Number(analysis.comparison.yourScore || 0).toFixed(1)}
                  </p>
                  <p className="text-sm text-purple-500 mt-1">
                    Percentile: {analysis.comparison.percentile}%
                  </p>
                </div>

                {/* Topper Score */}
                <div className="text-center p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-2">Topper Score</p>
                  <p className="text-4xl font-bold text-yellow-700 dark:text-yellow-300">
                    {Number(analysis.comparison.topperScore || 0).toFixed(1)}
                  </p>
                  <p className="text-sm text-yellow-500 mt-1">
                    Gap: -{Number(analysis.comparison.scoreDifference?.fromTopper || 0).toFixed(1)}
                  </p>
                </div>

                {/* Class Average */}
                <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">Class Average</p>
                  <p className="text-4xl font-bold text-blue-700 dark:text-blue-300">
                    {Number(analysis.comparison.classAverage || 0).toFixed(1)}
                  </p>
                  <p className={cn(
                    'text-sm mt-1',
                    Number(analysis.comparison.scoreDifference?.fromAverage || 0) >= 0
                      ? 'text-green-500'
                      : 'text-red-500'
                  )}>
                    {Number(analysis.comparison.scoreDifference?.fromAverage || 0) >= 0 ? '+' : ''}
                    {Number(analysis.comparison.scoreDifference?.fromAverage || 0).toFixed(1)} from avg
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-100 dark:border-gray-700/50 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                  <FileQuestion className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {attempt.responses?.length || 0}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Questions</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-100 dark:border-gray-700/50 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {attempt.questionsAnswered}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Attempted</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-100 dark:border-gray-700/50 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatTime(attempt.timeTakenSeconds)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Time Taken</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-100 dark:border-gray-700/50 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {attempt.correctAnswers > 0
                      ? ((attempt.correctAnswers / attempt.questionsAnswered) * 100).toFixed(0)
                      : 0}%
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Accuracy</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Tab */}
      {activeTab === 'analysis' && (
        <div className="space-y-6">
          {isLoadingAnalysis ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
          ) : analysis ? (
            <>
              {/* Topic-wise Performance */}
              <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <BookOpen className="h-5 w-5 text-purple-500" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Topic-wise Performance
                  </h2>
                </div>

                <div className="space-y-4">
                  {analysis.topicWise.map((topic, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {topic.topic}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {topic.correct}/{topic.total} ({topic.percentage}%)
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            topic.percentage >= 80
                              ? 'bg-green-500'
                              : topic.percentage >= 60
                                ? 'bg-blue-500'
                                : topic.percentage >= 40
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                          )}
                          style={{ width: `${topic.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Question Type Performance */}
              <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <BarChart3 className="h-5 w-5 text-purple-500" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Question Type Performance
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analysis.questionTypeWise.map((qt, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl"
                    >
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {qt.type.replace(/_/g, ' ')}
                      </p>
                      <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                          {qt.percentage}%
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 pb-1">
                          ({qt.correct}/{qt.total})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths & Weak Areas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-800/30 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <h3 className="font-semibold text-green-700 dark:text-green-300">
                      Your Strengths
                    </h3>
                  </div>
                  {analysis.strengths.length > 0 ? (
                    <ul className="space-y-2">
                      {analysis.strengths.map((strength, index) => (
                        <li
                          key={index}
                          className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400"
                        >
                          <CheckCircle className="h-4 w-4" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Keep practicing to identify your strengths!
                    </p>
                  )}
                </div>

                {/* Weak Areas */}
                <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-800/30 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <h3 className="font-semibold text-red-700 dark:text-red-300">
                      Areas to Improve
                    </h3>
                  </div>
                  {analysis.weakAreas.length > 0 ? (
                    <ul className="space-y-2">
                      {analysis.weakAreas.map((weak, index) => (
                        <li
                          key={index}
                          className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400"
                        >
                          <XCircle className="h-4 w-4" />
                          {weak}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      Great job! No major weak areas identified.
                    </p>
                  )}
                </div>
              </div>

              {/* Time Analysis */}
              <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Clock className="h-5 w-5 text-purple-500" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Time Analysis
                  </h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatTime(analysis.timeAnalysis.totalTimeSeconds)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Time</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {analysis.timeAnalysis.avgTimePerQuestion}s
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Avg per Question</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {analysis.timeAnalysis.fastestQuestionTime}s
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">Fastest</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {analysis.timeAnalysis.slowestQuestionTime}s
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400">Slowest</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Detailed analysis not available
              </p>
            </div>
          )}
        </div>
      )}

      {/* Question Review Tab */}
      {activeTab === 'review' && attempt.test?.showCorrectAnswers && (
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-purple-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Question Review
              </h2>
            </div>
            <button
              onClick={() => setShowAnswers(!showAnswers)}
              className="px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
            >
              {showAnswers ? 'Hide Answers' : 'Show Answers'}
            </button>
          </div>

          {showAnswers && (
            <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {attempt.responses?.map((response: TestResponse, index: number) => {
                const question = response.testQuestion?.question;
                if (!question) return null;

                const isExpanded = expandedQuestions.has(response.id);
                const isCorrect = response.isCorrect;
                const options: { id: string; text: string; isCorrect?: boolean }[] =
                  Array.isArray(question.options) ? question.options : [];

                return (
                  <div key={response.id} className="p-4">
                    <button
                      onClick={() => toggleQuestion(response.id)}
                      className="w-full flex items-start gap-4 text-left"
                    >
                      <div
                        className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold',
                          isCorrect === true
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                            : isCorrect === false
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-600'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600'
                        )}
                      >
                        {isCorrect === true ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : isCorrect === false ? (
                          <XCircle className="h-4 w-4" />
                        ) : (
                          index + 1
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white line-clamp-2">
                          {question.questionText}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {question.questionType.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {response.testQuestion?.marks} marks
                          </span>
                          {response.marksObtained !== undefined && (
                            <span
                              className={cn(
                                'text-xs font-medium',
                                Number(response.marksObtained) > 0
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-red-600 dark:text-red-400'
                              )}
                            >
                              +{response.marksObtained}
                            </span>
                          )}
                        </div>
                      </div>

                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-4 pl-12 space-y-4">
                        {/* Full Question */}
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {question.questionText}
                          </p>
                        </div>

                        {/* Options */}
                        {(question.questionType === 'MCQ' ||
                          question.questionType === 'TRUE_FALSE' ||
                          question.questionType === 'SINGLE_CORRECT') && (
                          <div className="space-y-2">
                            {options.map(
                              (
                                option: { id: string; text: string; isCorrect?: boolean },
                                optIdx: number
                              ) => {
                                const isSelected = response.selectedOptions?.includes(option.id);
                                const isCorrectOption =
                                  option.id === question.correctAnswer || option.isCorrect;

                                return (
                                  <div
                                    key={option.id}
                                    className={cn(
                                      'flex items-center gap-3 p-3 rounded-lg border-2',
                                      isCorrectOption
                                        ? 'border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-700'
                                        : isSelected
                                          ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700'
                                          : 'border-gray-200 dark:border-gray-600'
                                    )}
                                  >
                                    <div
                                      className={cn(
                                        'w-6 h-6 rounded flex items-center justify-center text-xs font-bold',
                                        isCorrectOption
                                          ? 'bg-green-500 text-white'
                                          : isSelected
                                            ? 'bg-red-500 text-white'
                                            : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                                      )}
                                    >
                                      {String.fromCharCode(65 + optIdx)}
                                    </div>
                                    <span
                                      className={cn(
                                        'flex-1 text-sm',
                                        isCorrectOption
                                          ? 'text-green-700 dark:text-green-300 font-medium'
                                          : isSelected
                                            ? 'text-red-700 dark:text-red-300'
                                            : 'text-gray-700 dark:text-gray-300'
                                      )}
                                    >
                                      {option.text}
                                    </span>
                                    {isCorrectOption && (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    )}
                                    {isSelected && !isCorrectOption && (
                                      <XCircle className="h-4 w-4 text-red-500" />
                                    )}
                                  </div>
                                );
                              }
                            )}
                          </div>
                        )}

                        {/* Explanation */}
                        {question.answerExplanation && (
                          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30">
                            <div className="flex items-center gap-2 mb-2">
                              <HelpCircle className="h-4 w-4 text-blue-500" />
                              <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                Explanation
                              </p>
                            </div>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              {question.answerExplanation}
                            </p>
                          </div>
                        )}

                        {/* AI Help Buttons */}
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => openAIModal(question, question.id)}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                          >
                            <Sparkles className="h-4 w-4" />
                            Ask AI
                          </button>
                          <button
                            onClick={() => openAIModal(question, question.id)}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                          >
                            <Lightbulb className="h-4 w-4" />
                            Shortcuts
                          </button>
                          <button
                            onClick={() => openAIModal(question, question.id)}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                          >
                            <Youtube className="h-4 w-4" />
                            Videos
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Link
          href={`/tests/${testId}`}
          className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          View Test Details
        </Link>

        <Link
          href="/tests"
          className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg shadow-purple-500/25"
        >
          Back to All Tests
        </Link>
      </div>

      {/* AI Doubt Modal */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">AI Study Assistant</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Get help with this question</p>
                </div>
              </div>
              <button
                onClick={() => setAiModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Question */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {selectedQuestion?.questionText}
                </p>
              </div>

              {isLoadingAI ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                </div>
              ) : (
                <>
                  {/* AI Explanation */}
                  {aiExplanation && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-purple-500" />
                        <h4 className="font-semibold text-gray-900 dark:text-white">Explanation</h4>
                      </div>
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                        <p className="text-sm text-purple-700 dark:text-purple-300 whitespace-pre-wrap">
                          {aiExplanation.explanation}
                        </p>
                        {aiExplanation.formula && (
                          <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Formula</p>
                            <p className="text-sm font-mono text-gray-900 dark:text-white">
                              {aiExplanation.formula}
                            </p>
                          </div>
                        )}
                        {aiExplanation.steps && aiExplanation.steps.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs text-purple-600 dark:text-purple-400 mb-2">Steps:</p>
                            <ol className="list-decimal list-inside space-y-1">
                              {aiExplanation.steps.map((step, i) => (
                                <li key={i} className="text-sm text-purple-700 dark:text-purple-300">
                                  {step}
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                        {aiExplanation.tip && (
                          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                            <p className="text-sm text-amber-700 dark:text-amber-300">
                              <strong>Tip:</strong> {aiExplanation.tip}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Shortcuts */}
                  {shortcuts && shortcuts.shortcuts.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-amber-500" />
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          Shortcuts & Tricks
                        </h4>
                      </div>
                      <div className="space-y-3">
                        {shortcuts.shortcuts.map((shortcut, i) => (
                          <div
                            key={i}
                            className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl"
                          >
                            <p className="font-medium text-amber-700 dark:text-amber-300 mb-1">
                              {shortcut.title}
                            </p>
                            <p className="text-sm text-amber-600 dark:text-amber-400">
                              {shortcut.description}
                            </p>
                            {shortcut.example && (
                              <p className="mt-2 text-xs text-amber-500 dark:text-amber-500">
                                Example: {shortcut.example}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* YouTube Videos */}
                  {videos.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Youtube className="h-5 w-5 text-red-500" />
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          Recommended Videos
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {videos.slice(0, 4).map((video) => (
                          <a
                            key={video.videoId}
                            href={`https://www.youtube.com/watch?v=${video.videoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                          >
                            <img
                              src={video.thumbnailUrl}
                              alt={video.title}
                              className="w-24 h-16 object-cover rounded-lg flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                                {video.title}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {video.channelTitle}
                              </p>
                            </div>
                            <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Ask Follow-up */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && askFollowUp()}
                  placeholder="Ask a follow-up question..."
                  className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  onClick={askFollowUp}
                  disabled={!aiQuery.trim() || isLoadingAI}
                  className="px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
