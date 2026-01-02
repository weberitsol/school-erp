'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Play,
  CheckCircle2,
  Target,
  TrendingUp,
  Loader2,
  RefreshCw,
  BookMarked,
  Brain,
  Clock,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { practiceApi, BookWithPractice } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function PracticePage() {
  const { user, accessToken } = useAuthStore();
  const { toast } = useToast();

  const [books, setBooks] = useState<BookWithPractice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isStudent = user?.role === 'STUDENT';

  const fetchBooks = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const response = await practiceApi.getBooksWithPractice(accessToken);
      if (response.success && response.data) {
        setBooks(response.data);
      }
    } catch (error) {
      console.error('Error fetching practice books:', error);
      toast({
        title: 'Error',
        description: 'Could not fetch practice books',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isStudent) {
      fetchBooks();
    } else {
      setIsLoading(false);
    }
  }, [accessToken, isStudent]);

  // Calculate overall stats
  const totalQuestions = books.reduce((sum, b) => sum + b.totalQuestions, 0);
  const totalAttempted = books.reduce((sum, b) => sum + (b.progress?.attemptedQuestions || 0), 0);
  const totalCorrect = books.reduce((sum, b) => sum + (b.progress?.correctAnswers || 0), 0);
  const overallAccuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

  if (!isStudent) {
    return (
      <div className="p-6">
        <div className="text-center py-16">
          <Brain className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Practice Mode is for Students
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            This feature allows students to practice MCQ questions from indexed books.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Brain className="h-7 w-7 text-purple-600" />
            Practice MCQs
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Practice questions from your books in Reading or Test mode
          </p>
        </div>
        <button
          onClick={fetchBooks}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <BookOpen className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Books Available</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{books.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Questions</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{totalQuestions}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Attempted</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{totalAttempted}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Accuracy</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{overallAccuracy}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Books Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <BookMarked className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No Practice Books Available
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Check back later or contact your teacher to enable practice questions.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book) => (
            <BookPracticeCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}

function BookPracticeCard({ book }: { book: BookWithPractice }) {
  const progress = book.progress;
  const progressPercent = progress?.totalQuestions > 0
    ? Math.round((progress.attemptedQuestions / progress.totalQuestions) * 100)
    : 0;
  const accuracyPercent = progress?.accuracyPercentage || 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Book Cover / Header */}
      <div className="h-32 bg-gradient-to-br from-purple-500 to-indigo-600 relative">
        {book.coverImage ? (
          <img
            src={book.coverImage}
            alt={book.title}
            className="w-full h-full object-cover opacity-80"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <BookOpen className="h-12 w-12 text-white/50" />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <h3 className="text-white font-semibold line-clamp-1">{book.title}</h3>
          {book.subject && (
            <p className="text-white/80 text-sm">{book.subject}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500 dark:text-gray-400">Progress</span>
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              {progress?.attemptedQuestions || 0}/{progress?.totalQuestions || 0}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>{progress?.correctAnswers || 0} correct</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <BarChart3 className="h-4 w-4 text-blue-500" />
            <span>{accuracyPercent.toFixed(0)}% accuracy</span>
          </div>
        </div>

        {/* Difficulty Breakdown */}
        {progress && progress.totalQuestions > 0 && (
          <div className="flex gap-2 text-xs">
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
              Easy: {progress.byDifficulty.easy.total}
            </span>
            <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded">
              Medium: {progress.byDifficulty.medium.total}
            </span>
            <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
              Hard: {progress.byDifficulty.hard.total}
            </span>
          </div>
        )}

        {/* Action Button */}
        <Link
          href={`/practice/${book.id}`}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
        >
          <Play className="h-4 w-4" />
          {progress?.attemptedQuestions > 0 ? 'Continue Practice' : 'Start Practice'}
        </Link>

        {/* Generate More Prompt */}
        {progress?.shouldGenerateMore && (
          <p className="text-center text-xs text-orange-600 dark:text-orange-400">
            You have completed most questions. Ask your teacher for more!
          </p>
        )}
      </div>
    </div>
  );
}
