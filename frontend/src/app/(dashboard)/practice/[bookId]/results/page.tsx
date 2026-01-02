'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  Loader2,
  BarChart3,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Award,
  TrendingUp,
  BookOpen,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { practiceApi, PracticeSession, PracticeQuestion } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AttemptWithQuestion {
  id: string;
  questionId: string;
  selectedAnswer: string | null;
  isCorrect: boolean | null;
  timeSpentSeconds: number | null;
  question: PracticeQuestion;
}

export default function ResultsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const bookId = params.bookId as string;
  const sessionId = searchParams.get('session');

  const { accessToken } = useAuthStore();
  const { toast } = useToast();

  const [session, setSession] = useState<PracticeSession | null>(null);
  const [attempts, setAttempts] = useState<AttemptWithQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  const fetchSession = useCallback(async () => {
    if (!accessToken || !sessionId) return;

    setIsLoading(true);
    try {
      const response = await practiceApi.getSession(sessionId, accessToken);
      if (response.success && response.data) {
        setSession(response.data);

        // Build attempts with questions
        const questions = response.data.questions || [];
        const sessionAttempts = response.data.attempts || [];

        const attemptsWithQuestions: AttemptWithQuestion[] = sessionAttempts.map((attempt: any) => {
          const question = questions.find((q: PracticeQuestion) => q.id === attempt.questionId);
          return {
            ...attempt,
            question,
          };
        }).filter((a: AttemptWithQuestion) => a.question);

        setAttempts(attemptsWithQuestions);
      } else {
        throw new Error(response.error || 'Failed to load results');
      }
    } catch (error: any) {
      console.error('Error fetching results:', error);
      toast({
        title: 'Error',
        description: error.message || 'Could not load results',
        variant: 'destructive',
      });
      router.push(`/practice/${bookId}`);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, sessionId, bookId, router, toast]);

  useEffect(() => {
    if (!sessionId) {
      router.push(`/practice/${bookId}`);
      return;
    }
    fetchSession();
  }, [sessionId, bookId, router, fetchSession]);

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedQuestions(new Set(attempts.map(a => a.questionId)));
  };

  const collapseAll = () => {
    setExpandedQuestions(new Set());
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  // Calculate stats
  const totalQuestions = attempts.length;
  const correctCount = attempts.filter(a => a.isCorrect).length;
  const incorrectCount = totalQuestions - correctCount;
  const scorePercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const totalTime = attempts.reduce((sum, a) => sum + (a.timeSpentSeconds || 0), 0);

  // Difficulty breakdown
  const byDifficulty = {
    EASY: { total: 0, correct: 0 },
    MEDIUM: { total: 0, correct: 0 },
    HARD: { total: 0, correct: 0 },
  };

  attempts.forEach(a => {
    const diff = a.question?.difficulty || 'MEDIUM';
    if (byDifficulty[diff as keyof typeof byDifficulty]) {
      byDifficulty[diff as keyof typeof byDifficulty].total++;
      if (a.isCorrect) {
        byDifficulty[diff as keyof typeof byDifficulty].correct++;
      }
    }
  });

  const getScoreGrade = (percent: number) => {
    if (percent >= 90) return { label: 'Excellent!', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' };
    if (percent >= 75) return { label: 'Great Job!', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' };
    if (percent >= 60) return { label: 'Good', color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30' };
    if (percent >= 40) return { label: 'Keep Practicing', color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' };
    return { label: 'Needs Improvement', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' };
  };

  const grade = getScoreGrade(scorePercent);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!session || attempts.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <AlertCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No Results Available
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            This session has no completed attempts.
          </p>
          <Link
            href={`/practice/${bookId}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Practice
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        href={`/practice/${bookId}`}
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Practice
      </Link>

      {/* Score Card */}
      <div className={cn(
        'rounded-xl border p-6',
        grade.bg,
        grade.color === 'text-green-600' ? 'border-green-200 dark:border-green-800' :
        grade.color === 'text-blue-600' ? 'border-blue-200 dark:border-blue-800' :
        grade.color === 'text-yellow-600' ? 'border-yellow-200 dark:border-yellow-800' :
        grade.color === 'text-orange-600' ? 'border-orange-200 dark:border-orange-800' :
        'border-red-200 dark:border-red-800'
      )}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn('p-3 rounded-xl', grade.bg)}>
              <Trophy className={cn('h-8 w-8', grade.color)} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {session.mode === 'TEST' ? 'Test' : 'Practice'} Complete
              </h1>
              <p className={cn('text-lg font-semibold', grade.color)}>{grade.label}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={cn('text-5xl font-bold', grade.color)}>{scorePercent}%</p>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {correctCount}/{totalQuestions} correct
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/50 dark:bg-gray-800/50 rounded-full h-4 overflow-hidden">
          <div
            className={cn(
              'h-4 rounded-full transition-all',
              scorePercent >= 75 ? 'bg-green-500' :
              scorePercent >= 50 ? 'bg-yellow-500' :
              'bg-red-500'
            )}
            style={{ width: `${scorePercent}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Correct</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{correctCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Incorrect</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{incorrectCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Time</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{formatTime(totalTime)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-5 w-5 text-purple-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Questions</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">{totalQuestions}</p>
        </div>
      </div>

      {/* Difficulty Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-purple-600" />
          Performance by Difficulty
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {(['EASY', 'MEDIUM', 'HARD'] as const).map((diff) => {
            const data = byDifficulty[diff];
            const percent = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
            const colors = {
              EASY: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600', bar: 'bg-green-500' },
              MEDIUM: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600', bar: 'bg-yellow-500' },
              HARD: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600', bar: 'bg-red-500' },
            };

            return (
              <div key={diff} className={cn('p-4 rounded-xl', colors[diff].bg)}>
                <div className="flex items-center justify-between mb-2">
                  <span className={cn('text-sm font-medium', colors[diff].text)}>{diff}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {data.correct}/{data.total}
                  </span>
                </div>
                <div className="w-full bg-white/50 dark:bg-gray-800/50 rounded-full h-2 mb-2">
                  <div
                    className={cn('h-2 rounded-full', colors[diff].bar)}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className={cn('text-lg font-bold', colors[diff].text)}>{percent}%</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Question Review */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-purple-600" />
            Question Review
          </h2>
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="text-sm text-purple-600 hover:text-purple-700 transition-colors"
            >
              Expand All
            </button>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <button
              onClick={collapseAll}
              className="text-sm text-purple-600 hover:text-purple-700 transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {attempts.map((attempt, idx) => {
            const question = attempt.question;
            const options = question.options as Array<{ id: string; text: string }>;
            const isExpanded = expandedQuestions.has(attempt.questionId);
            const isCorrect = attempt.isCorrect;

            return (
              <div key={attempt.id} className="p-4">
                <button
                  onClick={() => toggleQuestion(attempt.questionId)}
                  className="w-full flex items-start gap-3 text-left"
                >
                  <span className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0',
                    isCorrect
                      ? 'bg-green-100 text-green-600 dark:bg-green-900/30'
                      : 'bg-red-100 text-red-600 dark:bg-red-900/30'
                  )}>
                    {isCorrect ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <XCircle className="h-5 w-5" />
                    )}
                  </span>
                  <div className="flex-1">
                    <p className="text-gray-900 dark:text-white font-medium line-clamp-2">
                      {idx + 1}. {question.questionText}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span className={cn(
                        'px-2 py-0.5 rounded-full',
                        question.difficulty === 'EASY'
                          ? 'bg-green-100 text-green-600 dark:bg-green-900/30'
                          : question.difficulty === 'MEDIUM'
                            ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30'
                            : 'bg-red-100 text-red-600 dark:bg-red-900/30'
                      )}>
                        {question.difficulty}
                      </span>
                      {attempt.timeSpentSeconds && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(attempt.timeSpentSeconds)}
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
                  <div className="mt-4 ml-11 space-y-3">
                    {/* Options */}
                    <div className="space-y-2">
                      {options.map((option) => {
                        const isSelected = attempt.selectedAnswer === option.id;
                        const isCorrectOption = option.id === question.correctAnswer;

                        let optionStyle = 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600';
                        if (isCorrectOption) {
                          optionStyle = 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700';
                        } else if (isSelected && !isCorrectOption) {
                          optionStyle = 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700';
                        }

                        return (
                          <div
                            key={option.id}
                            className={cn(
                              'p-3 rounded-lg border flex items-start gap-2',
                              optionStyle
                            )}
                          >
                            <span className={cn(
                              'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0',
                              isCorrectOption
                                ? 'bg-green-500 text-white'
                                : isSelected && !isCorrectOption
                                  ? 'bg-red-500 text-white'
                                  : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                            )}>
                              {option.id.toUpperCase()}
                            </span>
                            <span className="flex-1 text-sm text-gray-900 dark:text-white">
                              {option.text}
                            </span>
                            {isCorrectOption && (
                              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                            )}
                            {isSelected && !isCorrectOption && (
                              <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {question.explanation && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">
                              Explanation
                            </p>
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                              {question.explanation}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href={`/practice/${bookId}`}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors"
        >
          <RefreshCw className="h-5 w-5" />
          Practice Again
        </Link>
        <Link
          href="/practice"
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl font-semibold transition-colors"
        >
          <BookOpen className="h-5 w-5" />
          All Practice Books
        </Link>
      </div>
    </div>
  );
}
