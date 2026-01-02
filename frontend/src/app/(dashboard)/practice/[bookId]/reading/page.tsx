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
  BookOpen,
  HelpCircle,
  Lightbulb,
  AlertCircle,
  X,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { practiceApi, PracticeSession, PracticeQuestion } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function ReadingModePage() {
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

  // Answer state
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);

  // Timer for tracking time spent
  const startTimeRef = useRef<number>(Date.now());
  const [timeSpent, setTimeSpent] = useState(0);

  // Stats
  const [correctCount, setCorrectCount] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);

  const fetchSession = useCallback(async () => {
    if (!accessToken || !sessionId) return;

    setIsLoading(true);
    try {
      const response = await practiceApi.getSession(sessionId, accessToken);
      if (response.success && response.data) {
        setSession(response.data);
        setQuestions(response.data.questions || []);

        // Find first unanswered question
        const answeredIds = new Set(
          (response.data.attempts || []).map((a: any) => a.questionId)
        );
        const firstUnanswered = response.data.questions?.findIndex(
          (q: PracticeQuestion) => !answeredIds.has(q.id)
        );

        if (firstUnanswered !== -1 && firstUnanswered !== undefined) {
          setCurrentIndex(firstUnanswered);
        }

        // Calculate stats from existing attempts
        const attempts = response.data.attempts || [];
        setAnsweredCount(attempts.length);
        setCorrectCount(attempts.filter((a: any) => a.isCorrect).length);
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

  // Reset timer when moving to new question
  useEffect(() => {
    startTimeRef.current = Date.now();
    setTimeSpent(0);

    const timer = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex]);

  const currentQuestion = questions[currentIndex];

  const handleSelectAnswer = async (answer: string) => {
    if (isAnswered || isSubmitting || !currentQuestion || !accessToken || !sessionId) return;

    setSelectedAnswer(answer);
    setIsSubmitting(true);

    const timeSpentSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);

    try {
      const response = await practiceApi.answerQuestion({
        questionId: currentQuestion.id,
        selectedAnswer: answer,
        timeSpentSeconds,
        sessionId,
      }, accessToken);

      if (response.success && response.data) {
        setIsAnswered(true);
        setShowExplanation(true);
        setCorrectAnswer(response.data.correctAnswer);
        setExplanation(response.data.explanation || null);
        setAnsweredCount(prev => prev + 1);
        if (response.data.isCorrect) {
          setCorrectCount(prev => prev + 1);
        }
      } else {
        throw new Error(response.error || 'Failed to submit answer');
      }
    } catch (error: any) {
      console.error('Error submitting answer:', error);
      toast({
        title: 'Error',
        description: error.message || 'Could not submit answer',
        variant: 'destructive',
      });
      setSelectedAnswer(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setShowExplanation(false);
      setCorrectAnswer(null);
      setExplanation(null);
    } else {
      // Session complete - go back to practice page
      toast({
        title: 'Practice Complete!',
        description: `You completed ${answeredCount} questions with ${correctCount} correct answers.`,
      });
      router.push(`/practice/${bookId}`);
    }
  };

  const handleExit = () => {
    router.push(`/practice/${bookId}`);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'HARD': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <AlertCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No Questions Available
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            There are no questions in this session.
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

  const options = currentQuestion.options as Array<{ id: string; text: string }>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowExitModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium"
        >
          <LogOut className="h-4 w-4" />
          Exit Practice
        </button>

        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <Clock className="h-4 w-4" />
            {formatTime(timeSpent)}
          </span>
          <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <Target className="h-4 w-4" />
            {answeredCount}/{questions.length}
          </span>
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            {correctCount} correct
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className="bg-purple-600 h-2 rounded-full transition-all"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
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
              getDifficultyColor(currentQuestion.difficulty)
            )}>
              {currentQuestion.difficulty}
            </span>
          </div>
          <span className="text-xs text-gray-400">
            Time limit: {currentQuestion.timeSeconds}s
          </span>
        </div>

        {/* Question Text */}
        <div className="p-6">
          <div className="flex items-start gap-3 mb-6">
            <HelpCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <p className="text-lg text-gray-900 dark:text-white leading-relaxed">
              {currentQuestion.questionText}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {options.map((option) => {
              const isSelected = selectedAnswer === option.id;
              const isCorrectOption = correctAnswer ? option.id === correctAnswer : false;
              const showResult = isAnswered && correctAnswer;

              let optionStyle = 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700';

              if (showResult) {
                if (isCorrectOption) {
                  optionStyle = 'border-green-500 bg-green-50 dark:bg-green-900/20';
                } else if (isSelected && !isCorrectOption) {
                  optionStyle = 'border-red-500 bg-red-50 dark:bg-red-900/20';
                } else {
                  optionStyle = 'border-gray-200 dark:border-gray-700 opacity-60';
                }
              } else if (isSelected) {
                optionStyle = 'border-purple-500 bg-purple-50 dark:bg-purple-900/20';
              }

              return (
                <button
                  key={option.id}
                  onClick={() => handleSelectAnswer(option.id)}
                  disabled={isAnswered || isSubmitting}
                  className={cn(
                    'w-full p-4 rounded-xl border-2 text-left transition-all flex items-start gap-3',
                    optionStyle,
                    !isAnswered && !isSubmitting && 'cursor-pointer',
                    (isAnswered || isSubmitting) && 'cursor-default'
                  )}
                >
                  <span className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0',
                    showResult && isCorrectOption
                      ? 'bg-green-500 text-white'
                      : showResult && isSelected && !isCorrectOption
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  )}>
                    {option.id.toUpperCase()}
                  </span>
                  <span className="flex-1 text-gray-900 dark:text-white pt-1">
                    {option.text}
                  </span>
                  {showResult && isCorrectOption && (
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                  )}
                  {showResult && isSelected && !isCorrectOption && (
                    <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Explanation */}
        {showExplanation && explanation && (
          <div className="mx-6 mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Explanation
                </h4>
                <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">
                  {explanation}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {isAnswered && correctAnswer ? (
              selectedAnswer === correctAnswer ? (
                <span className="text-green-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Correct!
                </span>
              ) : (
                <span className="text-red-600 font-medium flex items-center gap-1">
                  <XCircle className="h-4 w-4" />
                  Incorrect
                </span>
              )
            ) : (
              <span>Select an answer</span>
            )}
          </div>

          {isAnswered && (
            <button
              onClick={handleNextQuestion}
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              {currentIndex < questions.length - 1 ? (
                <>
                  Next Question
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  Finish Practice
                  <CheckCircle2 className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Submitting Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
            <span className="text-gray-700 dark:text-gray-300">Submitting...</span>
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Exit Practice?
              </h3>
              <button
                onClick={() => setShowExitModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <p className="text-gray-600 dark:text-gray-400">
                Your progress has been saved. You have completed <span className="font-semibold text-gray-900 dark:text-white">{answeredCount}</span> out of <span className="font-semibold text-gray-900 dark:text-white">{questions.length}</span> questions.
              </p>
              {answeredCount > 0 && (
                <p className="text-gray-600 dark:text-gray-400">
                  Accuracy: <span className="font-semibold text-green-600">{answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0}%</span> ({correctCount} correct)
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowExitModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Continue Practice
              </button>
              <button
                onClick={handleExit}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
