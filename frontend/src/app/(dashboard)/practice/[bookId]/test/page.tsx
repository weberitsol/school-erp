'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Target,
  AlertTriangle,
  Send,
  ChevronLeft,
  ChevronRight,
  Flag,
  Trophy,
  BarChart3,
  RefreshCw,
  BookOpen,
  Lightbulb,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { practiceApi, PracticeSession, PracticeQuestion } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function TestModePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const bookId = params.bookId as string;
  const sessionId = searchParams.get('session');

  const { accessToken } = useAuthStore();
  const { toast } = useToast();

  const [session, setSession] = useState<PracticeSession | null>(null);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Answers map: questionId -> selected answer
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());

  // Timer state
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Confirmation modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Results state
  const [showResults, setShowResults] = useState(false);
  const [resultsData, setResultsData] = useState<{
    correctCount: number;
    incorrectCount: number;
    totalTime: number;
    answersWithCorrect: Record<string, { selected: string; correct: string; isCorrect: boolean; explanation?: string }>;
  } | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  const fetchSession = useCallback(async () => {
    if (!accessToken || !sessionId) return;

    setIsLoading(true);
    try {
      const response = await practiceApi.getSession(sessionId, accessToken);
      if (response.success && response.data) {
        setSession(response.data);
        const sessionQuestions = response.data.questions || [];
        setQuestions(sessionQuestions);

        // Calculate total time based on question difficulties
        const total = sessionQuestions.reduce(
          (sum: number, q: PracticeQuestion) => sum + (q.timeSeconds || 90),
          0
        );
        setTotalSeconds(total);
        setTimeRemaining(total);

        // Load any existing answers
        const existingAnswers: Record<string, string> = {};
        (response.data.attempts || []).forEach((attempt: any) => {
          if (attempt.selectedAnswer) {
            existingAnswers[attempt.questionId] = attempt.selectedAnswer;
          }
        });
        setAnswers(existingAnswers);
      } else {
        throw new Error(response.error || 'Failed to load session');
      }
    } catch (error: any) {
      console.error('Error fetching session:', error);
      toast({
        title: 'Error',
        description: error.message || 'Could not load practice session',
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

  // Timer countdown
  useEffect(() => {
    if (isLoading || timeRemaining <= 0) return;

    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          // Auto-submit on timeout
          handleSubmitTest(true);
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isLoading, totalSeconds]);

  const handleSelectAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const toggleFlagged = (questionId: string) => {
    setFlagged(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handleSubmitTest = async (isTimeout = false) => {
    if (!accessToken || !sessionId || isSubmitting) return;

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setIsSubmitting(true);
    setShowSubmitModal(false);

    try {
      // Submit all answers first
      const timeSpent = totalSeconds - timeRemaining;

      // Submit answers and collect results
      const answersWithCorrect: Record<string, { selected: string; correct: string; isCorrect: boolean; explanation?: string }> = {};
      let correctCount = 0;

      const submitPromises = questions.map(async (q) => {
        const answer = answers[q.id] || '';
        try {
          const response = await practiceApi.answerQuestion({
            questionId: q.id,
            selectedAnswer: answer,
            timeSpentSeconds: Math.floor(timeSpent / questions.length),
            sessionId,
          }, accessToken);

          if (response.success && response.data) {
            answersWithCorrect[q.id] = {
              selected: answer,
              correct: response.data.correctAnswer,
              isCorrect: response.data.isCorrect,
              explanation: response.data.explanation,
            };
            if (response.data.isCorrect) {
              correctCount++;
            }
          }
        } catch (err) {
          console.error('Error submitting answer for', q.id, err);
        }
      });

      await Promise.all(submitPromises);

      // Complete the session
      const response = await practiceApi.completeSession(sessionId, accessToken);

      if (response.success) {
        toast({
          title: isTimeout ? 'Time\'s Up!' : 'Test Submitted',
          description: 'Your test has been submitted successfully.',
        });

        // Show results inline
        setResultsData({
          correctCount,
          incorrectCount: questions.length - correctCount,
          totalTime: timeSpent,
          answersWithCorrect,
        });
        setShowResults(true);
        setIsSubmitting(false);
      } else {
        throw new Error(response.error || 'Failed to complete session');
      }
    } catch (error: any) {
      console.error('Error submitting test:', error);
      toast({
        title: 'Error',
        description: error.message || 'Could not submit test',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeResult = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

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
    setExpandedQuestions(new Set(questions.map(q => q.id)));
  };

  const collapseAll = () => {
    setExpandedQuestions(new Set());
  };

  const getScoreGrade = (percent: number) => {
    if (percent >= 90) return { label: 'Excellent!', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', border: 'border-green-200 dark:border-green-800' };
    if (percent >= 75) return { label: 'Great Job!', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-800' };
    if (percent >= 60) return { label: 'Good', color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30', border: 'border-yellow-200 dark:border-yellow-800' };
    if (percent >= 40) return { label: 'Keep Practicing', color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30', border: 'border-orange-200 dark:border-orange-800' };
    return { label: 'Needs Improvement', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', border: 'border-red-200 dark:border-red-800' };
  };

  const getTimerColor = () => {
    const percentRemaining = (timeRemaining / totalSeconds) * 100;
    if (percentRemaining <= 10) return 'text-red-600 bg-red-100 dark:bg-red-900/30';
    if (percentRemaining <= 25) return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
    return 'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700';
  };

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <AlertTriangle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No Questions Available
          </h3>
          <Link
            href={`/practice/${bookId}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Practice
          </Link>
        </div>
      </div>
    );
  }

  const options = currentQuestion.options as Array<{ id: string; text: string }>;

  // Show results after test submission
  if (showResults && resultsData) {
    const scorePercent = questions.length > 0 ? Math.round((resultsData.correctCount / questions.length) * 100) : 0;
    const grade = getScoreGrade(scorePercent);

    // Calculate difficulty breakdown
    const byDifficulty = {
      EASY: { total: 0, correct: 0 },
      MEDIUM: { total: 0, correct: 0 },
      HARD: { total: 0, correct: 0 },
    };

    questions.forEach(q => {
      const diff = q.difficulty || 'MEDIUM';
      if (byDifficulty[diff as keyof typeof byDifficulty]) {
        byDifficulty[diff as keyof typeof byDifficulty].total++;
        if (resultsData.answersWithCorrect[q.id]?.isCorrect) {
          byDifficulty[diff as keyof typeof byDifficulty].correct++;
        }
      }
    });

    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <Link
          href={`/practice/${bookId}`}
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Practice
        </Link>

        {/* Score Card */}
        <div className={cn(
          'rounded-xl border p-6',
          grade.bg,
          grade.border
        )}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn('p-3 rounded-xl', grade.bg)}>
                <Trophy className={cn('h-8 w-8', grade.color)} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Test Complete
                </h1>
                <p className={cn('text-lg font-semibold', grade.color)}>{grade.label}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={cn('text-5xl font-bold', grade.color)}>{scorePercent}%</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {resultsData.correctCount}/{questions.length} correct
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
            <p className="text-2xl font-bold text-green-600">{resultsData.correctCount}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Incorrect</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{resultsData.incorrectCount}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Time</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{formatTimeResult(resultsData.totalTime)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-purple-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Questions</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{questions.length}</p>
          </div>
        </div>

        {/* Difficulty Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
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
              <BookOpen className="h-5 w-5 text-blue-600" />
              Question Review
            </h2>
            <div className="flex gap-2">
              <button
                onClick={expandAll}
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                Expand All
              </button>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <button
                onClick={collapseAll}
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                Collapse All
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {questions.map((question, idx) => {
              const qOptions = question.options as Array<{ id: string; text: string }>;
              const isExpanded = expandedQuestions.has(question.id);
              const answerData = resultsData.answersWithCorrect[question.id];
              const isCorrect = answerData?.isCorrect;

              return (
                <div key={question.id} className="p-4">
                  <button
                    onClick={() => toggleQuestion(question.id)}
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
                        {qOptions.map((option) => {
                          const isSelected = answerData?.selected === option.id;
                          const isCorrectOption = option.id === answerData?.correct;

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
                      {answerData?.explanation && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-start gap-2">
                            <Lightbulb className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                Explanation
                              </p>
                              <p className="text-sm text-blue-800 dark:text-blue-200">
                                {answerData.explanation}
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
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
          >
            <RefreshCw className="h-5 w-5" />
            Take Another Test
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href={`/practice/${bookId}`}
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Exit Test
          </Link>

          <div className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold',
            getTimerColor()
          )}>
            <Clock className="h-5 w-5" />
            {formatTime(timeRemaining)}
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            Submit Test
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 pb-32 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Question Navigator */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Questions ({answeredCount}/{questions.length} answered)
              </h3>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-blue-600"></span>
                  Answered
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-orange-500"></span>
                  Flagged
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-gray-200 dark:bg-gray-600"></span>
                  Unanswered
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id];
                const isFlagged = flagged.has(q.id);
                const isCurrent = idx === currentIndex;

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={cn(
                      'w-10 h-10 rounded-lg font-medium text-sm transition-all relative',
                      isCurrent
                        ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800'
                        : '',
                      isAnswered
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600',
                      isFlagged && 'ring-2 ring-orange-500'
                    )}
                  >
                    {idx + 1}
                    {isFlagged && (
                      <Flag className="absolute -top-1 -right-1 h-3 w-3 text-orange-500 fill-orange-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Question Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className={cn(
                  'px-2 py-0.5 text-xs font-medium rounded-full',
                  currentQuestion.difficulty === 'EASY'
                    ? 'text-green-600 bg-green-100 dark:bg-green-900/30'
                    : currentQuestion.difficulty === 'MEDIUM'
                      ? 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30'
                      : 'text-red-600 bg-red-100 dark:bg-red-900/30'
                )}>
                  {currentQuestion.difficulty}
                </span>
              </div>
              <button
                onClick={() => toggleFlagged(currentQuestion.id)}
                className={cn(
                  'flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors',
                  flagged.has(currentQuestion.id)
                    ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                )}
              >
                <Flag className={cn(
                  'h-4 w-4',
                  flagged.has(currentQuestion.id) && 'fill-orange-500'
                )} />
                {flagged.has(currentQuestion.id) ? 'Flagged' : 'Flag'}
              </button>
            </div>

            {/* Question Text */}
            <div className="p-6">
              <p className="text-lg text-gray-900 dark:text-white leading-relaxed mb-6">
                {currentQuestion.questionText}
              </p>

              {/* Options */}
              <div className="space-y-3">
                {options.map((option) => {
                  const isSelected = answers[currentQuestion.id] === option.id;

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleSelectAnswer(currentQuestion.id, option.id)}
                      className={cn(
                        'w-full p-4 rounded-xl border-2 text-left transition-all flex items-start gap-3',
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                      )}
                    >
                      <span className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0',
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      )}>
                        {option.id.toUpperCase()}
                      </span>
                      <span className="flex-1 text-gray-900 dark:text-white pt-1">
                        {option.text}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <button
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                  currentIndex === 0
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <span className="text-sm text-gray-500 dark:text-gray-400">
                {answers[currentQuestion.id] ? 'Answered' : 'Not answered'}
              </span>

              <button
                onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                disabled={currentIndex === questions.length - 1}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                  currentIndex === questions.length - 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Submit Test?
            </h3>

            <div className="space-y-2 text-sm">
              <p className="text-gray-600 dark:text-gray-400">
                You have answered <span className="font-semibold text-gray-900 dark:text-white">{answeredCount}</span> out of <span className="font-semibold text-gray-900 dark:text-white">{questions.length}</span> questions.
              </p>

              {answeredCount < questions.length && (
                <p className="text-orange-600 dark:text-orange-400 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {questions.length - answeredCount} question(s) unanswered
                </p>
              )}

              {flagged.size > 0 && (
                <p className="text-orange-600 dark:text-orange-400 flex items-center gap-2">
                  <Flag className="h-4 w-4" />
                  {flagged.size} question(s) flagged for review
                </p>
              )}

              <p className="text-gray-600 dark:text-gray-400">
                Time remaining: <span className="font-mono font-semibold">{formatTime(timeRemaining)}</span>
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Continue Test
              </button>
              <button
                onClick={() => handleSubmitTest(false)}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Test'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submitting Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="text-gray-700 dark:text-gray-300 font-medium">Submitting your test...</span>
          </div>
        </div>
      )}
    </div>
  );
}
