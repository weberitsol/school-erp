'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  FileQuestion,
  Target,
  Calendar,
  AlertCircle,
  CheckCircle,
  Play,
  Trophy,
  BookOpen,
  Loader2,
  Info,
  Shield,
  RefreshCw,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { testsApi, Test, TestAttempt } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function TestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.id as string;
  const { user, accessToken } = useAuthStore();
  const { toast } = useToast();

  const [test, setTest] = useState<Test | null>(null);
  const [previousAttempts, setPreviousAttempts] = useState<TestAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

  const isStudent = user?.role === 'STUDENT';

  useEffect(() => {
    if (accessToken && testId) {
      fetchTestDetails();
    }
  }, [accessToken, testId]);

  const fetchTestDetails = async () => {
    setIsLoading(true);
    try {
      const response = await testsApi.getById(testId, accessToken!);

      if (response.success && response.data) {
        setTest(response.data);

        // Fetch previous attempts for students
        if (isStudent && user?.id) {
          const attemptsResponse = await testsApi.getStudentAttempts(user.id, accessToken!);
          if (attemptsResponse.success && attemptsResponse.data) {
            const testAttempts = attemptsResponse.data.filter((a: TestAttempt) => a.testId === testId);
            setPreviousAttempts(testAttempts);
          }
        }
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load test details',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching test:', error);
      toast({
        title: 'Error',
        description: 'Failed to load test details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTest = async () => {
    if (!accessToken || !user?.id || !test) return;

    setIsStarting(true);
    try {
      const response = await testsApi.startAttempt(
        { testId: test.id, studentId: user.id },
        accessToken
      );

      if (response.success && response.data) {
        router.push(`/tests/${test.id}/attempt?attemptId=${response.data.id}`);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to start test',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start test',
        variant: 'destructive',
      });
    } finally {
      setIsStarting(false);
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  const getStatusInfo = () => {
    if (!test) return null;

    const now = new Date();
    const startTime = test.startTime ? new Date(test.startTime) : null;
    const endTime = test.endTime ? new Date(test.endTime) : null;

    if (test.status !== 'PUBLISHED' && test.status !== 'ACTIVE') {
      return {
        canStart: false,
        message: 'This test is not available',
        color: 'text-gray-500',
        bgColor: 'bg-gray-100 dark:bg-gray-700',
      };
    }

    if (startTime && startTime > now) {
      return {
        canStart: false,
        message: `Test starts on ${formatDate(test.startTime)}`,
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      };
    }

    if (endTime && endTime < now) {
      return {
        canStart: false,
        message: 'This test has ended',
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
      };
    }

    const completedAttempts = previousAttempts.filter(
      (a) => a.status === 'SUBMITTED' || a.status === 'GRADED'
    ).length;

    if (completedAttempts >= test.maxAttempts) {
      return {
        canStart: false,
        message: 'Maximum attempts reached',
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      };
    }

    // Check for in-progress attempt
    const inProgressAttempt = previousAttempts.find((a) => a.status === 'IN_PROGRESS');
    if (inProgressAttempt) {
      return {
        canStart: true,
        resumeAttempt: inProgressAttempt,
        message: 'You have an attempt in progress',
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      };
    }

    return {
      canStart: true,
      message: `${test.maxAttempts - completedAttempts} attempt${test.maxAttempts - completedAttempts !== 1 ? 's' : ''} remaining`,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading test details...</p>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Test not found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            The test you're looking for doesn't exist or has been removed.
          </p>
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

  const statusInfo = getStatusInfo();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        href="/tests"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Tests
      </Link>

      {/* Test Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 p-6 md:p-8">
        <div className="absolute inset-0 opacity-10 bg-grid-white"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <FileQuestion className="h-5 w-5 text-purple-200" />
            <span className="text-sm font-medium text-purple-200">
              {test.subject?.name || 'General'} • {test.class?.name || 'All Classes'}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
            {test.title}
          </h1>

          {test.description && (
            <p className="text-purple-100 text-sm md:text-base max-w-2xl">
              {test.description}
            </p>
          )}
        </div>
      </div>

      {/* Test Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-100 dark:border-gray-700/50 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <FileQuestion className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {test.questionCount || test.questions?.length || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Questions</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-100 dark:border-gray-700/50 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {test.totalMarks}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Marks</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-100 dark:border-gray-700/50 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {test.duration}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Minutes</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-100 dark:border-gray-700/50 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {test.passingMarks}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Pass Marks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      {test.instructions && (
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-purple-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Instructions
            </h2>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line">
              {test.instructions}
            </p>
          </div>
        </div>
      )}

      {/* Test Rules */}
      <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-purple-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Test Rules
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center',
                test.shuffleQuestions
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
              )}>
                {test.shuffleQuestions ? <CheckCircle className="h-3.5 w-3.5" /> : <Info className="h-3.5 w-3.5" />}
              </div>
              <span className="text-gray-600 dark:text-gray-300">
                Questions {test.shuffleQuestions ? 'are' : 'are not'} shuffled
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center',
                test.shuffleOptions
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
              )}>
                {test.shuffleOptions ? <CheckCircle className="h-3.5 w-3.5" /> : <Info className="h-3.5 w-3.5" />}
              </div>
              <span className="text-gray-600 dark:text-gray-300">
                Options {test.shuffleOptions ? 'are' : 'are not'} shuffled
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center',
                test.showResults
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
              )}>
                {test.showResults ? <CheckCircle className="h-3.5 w-3.5" /> : <Info className="h-3.5 w-3.5" />}
              </div>
              <span className="text-gray-600 dark:text-gray-300">
                Results {test.showResults ? 'shown immediately' : 'shown later'}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center',
                test.showAnswers
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
              )}>
                {test.showAnswers ? <CheckCircle className="h-3.5 w-3.5" /> : <Info className="h-3.5 w-3.5" />}
              </div>
              <span className="text-gray-600 dark:text-gray-300">
                Correct answers {test.showAnswers ? 'are' : 'are not'} shown after test
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center',
                test.allowReview
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
              )}>
                {test.allowReview ? <CheckCircle className="h-3.5 w-3.5" /> : <Info className="h-3.5 w-3.5" />}
              </div>
              <span className="text-gray-600 dark:text-gray-300">
                Review {test.allowReview ? 'allowed' : 'not allowed'} before submission
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-purple-100 dark:bg-purple-900/30 text-purple-600">
                <RefreshCw className="h-3.5 w-3.5" />
              </div>
              <span className="text-gray-600 dark:text-gray-300">
                {test.maxAttempts} attempt{test.maxAttempts !== 1 ? 's' : ''} allowed
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Time Window */}
      {(test.startTime || test.endTime) && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/30 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Test Window
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {test.startTime && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Starts</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatDate(test.startTime)}
                </p>
              </div>
            )}
            {test.endTime && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ends</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatDate(test.endTime)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Previous Attempts */}
      {isStudent && previousAttempts.length > 0 && (
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Your Attempts
            </h2>
          </div>

          <div className="space-y-3">
            {previousAttempts.map((attempt) => (
              <div
                key={attempt.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold',
                    attempt.status === 'SUBMITTED' || attempt.status === 'GRADED'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                      : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                  )}>
                    #{attempt.attemptNumber}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Attempt {attempt.attemptNumber}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(attempt.startedAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {attempt.status === 'SUBMITTED' || attempt.status === 'GRADED' ? (
                    <>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {attempt.totalScore?.toFixed(1) || 0}/{test.totalMarks}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {attempt.percentage?.toFixed(1)}%
                        </p>
                      </div>
                      <Link
                        href={`/tests/${test.id}/results?attemptId=${attempt.id}`}
                        className="px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
                      >
                        View Results
                      </Link>
                    </>
                  ) : (
                    <span className="px-3 py-1.5 text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 rounded-lg">
                      In Progress
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Start Test Section */}
      {isStudent && statusInfo && (
        <div className={cn(
          'rounded-2xl border p-6',
          statusInfo.bgColor,
          statusInfo.canStart ? 'border-green-200 dark:border-green-800/30' : 'border-gray-200 dark:border-gray-700/30'
        )}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              {statusInfo.canStart ? (
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                  <Play className="h-6 w-6 text-white" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-white" />
                </div>
              )}
              <div>
                <h3 className={cn('font-semibold', statusInfo.color)}>
                  {statusInfo.canStart
                    ? statusInfo.resumeAttempt
                      ? 'Resume Your Test'
                      : 'Ready to Start'
                    : 'Cannot Start Test'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {statusInfo.message}
                </p>
              </div>
            </div>

            {statusInfo.canStart && (
              <button
                onClick={handleStartTest}
                disabled={isStarting}
                className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : statusInfo.resumeAttempt ? (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Resume Test
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Start Test
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Teacher Actions */}
      {!isStudent && (
        <div className="flex items-center gap-4">
          <Link
            href={`/tests/${test.id}/edit`}
            className="px-5 py-2.5 text-sm font-medium text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
          >
            Edit Test
          </Link>
          <Link
            href={`/tests/${test.id}/analytics`}
            className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg shadow-purple-500/25 flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            View Analytics
          </Link>
        </div>
      )}
    </div>
  );
}
