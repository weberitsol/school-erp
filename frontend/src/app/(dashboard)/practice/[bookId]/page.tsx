'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  Play,
  Clock,
  Target,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  BookMarked,
  BarChart3,
  Timer,
  Brain,
  FileText,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { practiceApi, BookPracticeStats, PracticeProgress, PracticeMode } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function BookPracticePage() {
  const router = useRouter();
  const params = useParams();
  const bookId = params.bookId as string;
  const { user, accessToken } = useAuthStore();
  const { toast } = useToast();

  const [stats, setStats] = useState<BookPracticeStats | null>(null);
  const [progress, setProgress] = useState<PracticeProgress | null>(null);
  const [bookTitle, setBookTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

  // Selection state
  const [selectedMode, setSelectedMode] = useState<PracticeMode>('READING');
  const [selectedCount, setSelectedCount] = useState<10 | 20 | 30 | 50>(10);

  const fetchData = async () => {
    if (!accessToken || !bookId) return;
    setIsLoading(true);
    try {
      const [statsRes, progressRes] = await Promise.all([
        practiceApi.getBookStats(bookId, accessToken),
        practiceApi.getProgress(bookId, accessToken),
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
      if (progressRes.success && progressRes.data) {
        setProgress(progressRes.data);
      }
    } catch (error) {
      console.error('Error fetching book data:', error);
      toast({
        title: 'Error',
        description: 'Could not fetch book data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [accessToken, bookId]);

  const handleStartPractice = async () => {
    if (!accessToken || !bookId) return;

    setIsStarting(true);
    try {
      const response = await practiceApi.startSession({
        bookId,
        mode: selectedMode,
        questionCount: selectedCount,
      }, accessToken);

      if (response.success && response.data) {
        const sessionId = response.data.id;
        if (selectedMode === 'READING') {
          router.push(`/practice/${bookId}/reading?session=${sessionId}`);
        } else {
          router.push(`/practice/${bookId}/test?session=${sessionId}`);
        }
      } else {
        throw new Error(response.error || 'Failed to start session');
      }
    } catch (error: any) {
      console.error('Error starting session:', error);
      toast({
        title: 'Error',
        description: error.message || 'Could not start practice session',
        variant: 'destructive',
      });
    } finally {
      setIsStarting(false);
    }
  };

  // Calculate estimated time for test mode
  const estimatedTime = selectedCount * 1.5; // Average 1.5 min per question

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const hasQuestions = stats && stats.totalQuestions > 0;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        href="/practice"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Practice
      </Link>

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
            <BookOpen className="h-8 w-8 text-purple-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Practice MCQs
            </h1>
            {stats && (
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  {stats.totalQuestions} questions
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  {progress?.attemptedQuestions || 0} attempted
                </span>
                <span className="flex items-center gap-1">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  {progress?.accuracyPercentage?.toFixed(0) || 0}% accuracy
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Question Stats by Difficulty */}
        {stats && hasQuestions && (
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{stats.byDifficulty.easy}</p>
              <p className="text-xs text-green-700 dark:text-green-300">Easy (60s)</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{stats.byDifficulty.medium}</p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">Medium (90s)</p>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{stats.byDifficulty.hard}</p>
              <p className="text-xs text-red-700 dark:text-red-300">Hard (120s)</p>
            </div>
          </div>
        )}
      </div>

      {!hasQuestions ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <BookMarked className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No Questions Available Yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {stats?.isIndexed
              ? 'Ask your teacher to generate practice questions for this book.'
              : 'This book needs to be indexed first before questions can be generated.'}
          </p>
        </div>
      ) : (
        <>
          {/* Mode Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Choose Your Mode
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Practice Mode */}
              <button
                onClick={() => setSelectedMode('READING')}
                className={cn(
                  'p-4 rounded-xl border-2 text-left transition-all',
                  selectedMode === 'READING'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn(
                    'p-2 rounded-lg',
                    selectedMode === 'READING'
                      ? 'bg-purple-100 dark:bg-purple-900/40'
                      : 'bg-gray-100 dark:bg-gray-700'
                  )}>
                    <Brain className={cn(
                      'h-5 w-5',
                      selectedMode === 'READING' ? 'text-purple-600' : 'text-gray-500'
                    )} />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Practice Mode</h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Learn at your own pace. See the answer and explanation immediately after each question.
                </p>
                <ul className="mt-3 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                  <li className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    Instant feedback
                  </li>
                  <li className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    No time pressure
                  </li>
                  <li className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    Detailed explanations
                  </li>
                </ul>
              </button>

              {/* Test Mode */}
              <button
                onClick={() => setSelectedMode('TEST')}
                className={cn(
                  'p-4 rounded-xl border-2 text-left transition-all',
                  selectedMode === 'TEST'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn(
                    'p-2 rounded-lg',
                    selectedMode === 'TEST'
                      ? 'bg-blue-100 dark:bg-blue-900/40'
                      : 'bg-gray-100 dark:bg-gray-700'
                  )}>
                    <Timer className={cn(
                      'h-5 w-5',
                      selectedMode === 'TEST' ? 'text-blue-600' : 'text-gray-500'
                    )} />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Test Mode</h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Simulate exam conditions. Answer all questions within the time limit, then see your results.
                </p>
                <ul className="mt-3 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                  <li className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-yellow-500" />
                    Timed like real exams
                  </li>
                  <li className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-yellow-500" />
                    Results at the end
                  </li>
                  <li className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-yellow-500" />
                    Review all answers
                  </li>
                </ul>
              </button>
            </div>
          </div>

          {/* Question Count Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Number of Questions
            </h2>
            <div className="grid grid-cols-4 gap-3">
              {([10, 20, 30, 50] as const).map((count) => (
                <button
                  key={count}
                  onClick={() => setSelectedCount(count)}
                  disabled={count > (stats?.totalQuestions || 0)}
                  className={cn(
                    'p-3 rounded-lg border-2 font-semibold transition-all',
                    selectedCount === count
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300',
                    count > (stats?.totalQuestions || 0)
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:border-purple-300 dark:hover:border-purple-700'
                  )}
                >
                  {count}
                </button>
              ))}
            </div>
            {selectedMode === 'TEST' && (
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Estimated time: ~{Math.round(estimatedTime)} minutes
              </p>
            )}
          </div>

          {/* Start Button */}
          <button
            onClick={handleStartPractice}
            disabled={isStarting || !hasQuestions}
            className={cn(
              'w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold text-lg transition-all',
              selectedMode === 'READING'
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white',
              (isStarting || !hasQuestions) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isStarting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Play className="h-5 w-5" />
            )}
            {isStarting ? 'Starting...' : `Start ${selectedMode === 'READING' ? 'Practice' : 'Test'} Mode`}
          </button>

          {/* Progress Warning */}
          {progress?.shouldGenerateMore && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 text-center">
              <p className="text-orange-700 dark:text-orange-300 text-sm">
                You have completed most questions in this book.
                Ask your teacher to generate more practice questions!
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
