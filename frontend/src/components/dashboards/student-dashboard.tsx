'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Calendar,
  Clock,
  FileText,
  Trophy,
  Target,
  TrendingUp,
  Bell,
  CheckCircle,
  AlertCircle,
  Play,
  FileQuestion,
  Sparkles,
  ArrowRight,
  Flame,
  Star,
  Award,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';

const todaySchedule = [
  {
    id: 1,
    subject: 'Mathematics',
    teacher: 'Mr. Sharma',
    time: '9:00 AM - 9:45 AM',
    room: 'Room 101',
    status: 'completed',
    color: 'blue',
  },
  {
    id: 2,
    subject: 'Physics',
    teacher: 'Mrs. Gupta',
    time: '10:00 AM - 10:45 AM',
    room: 'Lab 2',
    status: 'in-progress',
    color: 'purple',
  },
  {
    id: 3,
    subject: 'English',
    teacher: 'Ms. Roy',
    time: '11:30 AM - 12:15 PM',
    room: 'Room 105',
    status: 'upcoming',
    color: 'green',
  },
  {
    id: 4,
    subject: 'Chemistry',
    teacher: 'Dr. Patel',
    time: '2:00 PM - 2:45 PM',
    room: 'Lab 1',
    status: 'upcoming',
    color: 'amber',
  },
];

const stats = [
  {
    title: 'Attendance',
    value: 92,
    suffix: '%',
    icon: CheckCircle,
    gradient: 'from-emerald-500 to-teal-400',
    shadowColor: 'shadow-emerald-500/25',
    subtitle: 'This month',
  },
  {
    title: 'Pending',
    value: 3,
    icon: FileText,
    gradient: 'from-amber-500 to-orange-400',
    shadowColor: 'shadow-amber-500/25',
    subtitle: 'Assignments',
  },
  {
    title: 'Test Score',
    value: 85,
    suffix: '%',
    icon: Target,
    gradient: 'from-blue-500 to-cyan-400',
    shadowColor: 'shadow-blue-500/25',
    subtitle: 'Last test',
  },
  {
    title: 'Class Rank',
    value: 5,
    prefix: '#',
    icon: Trophy,
    gradient: 'from-purple-500 to-pink-400',
    shadowColor: 'shadow-purple-500/25',
    subtitle: 'Out of 45',
  },
];

const pendingAssignments = [
  {
    id: 1,
    subject: 'Mathematics',
    title: 'Chapter 7 - Trigonometry Problems',
    dueDate: 'Dec 18, 2024',
    status: 'pending',
    daysLeft: 2,
    progress: 30,
  },
  {
    id: 2,
    subject: 'Physics',
    title: 'Lab Report: Optics Experiment',
    dueDate: 'Dec 20, 2024',
    status: 'in-progress',
    daysLeft: 4,
    progress: 60,
  },
  {
    id: 3,
    subject: 'English',
    title: 'Essay: Climate Change Impact',
    dueDate: 'Dec 22, 2024',
    status: 'not-started',
    daysLeft: 6,
    progress: 0,
  },
];

const availableTests = [
  {
    id: 1,
    subject: 'Mathematics',
    title: 'Unit Test - Algebra',
    duration: '45 mins',
    questions: 25,
    deadline: 'Dec 17, 2024',
    difficulty: 'Medium',
  },
  {
    id: 2,
    subject: 'Science',
    title: 'Chapter Quiz - Motion',
    duration: '30 mins',
    questions: 20,
    deadline: 'Dec 19, 2024',
    difficulty: 'Easy',
  },
];

const recentResults = [
  { subject: 'Mathematics', score: 88, total: 100, grade: 'A', trend: 'up' },
  { subject: 'Physics', score: 82, total: 100, grade: 'A-', trend: 'up' },
  { subject: 'English', score: 78, total: 100, grade: 'B+', trend: 'down' },
  { subject: 'Chemistry', score: 85, total: 100, grade: 'A', trend: 'same' },
];

// Animated counter component
function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const steps = 40;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return <>{prefix}{displayValue}{suffix}</>;
}

export function StudentDashboard() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 p-6 md:p-8">
        <div className="absolute inset-0 opacity-10 bg-grid-white"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-white">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-yellow-300 animate-pulse" />
              <span className="text-sm font-medium text-pink-100">Good morning!</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Welcome, {user?.firstName}!
            </h1>
            <p className="text-pink-100 mt-2 max-w-md">
              You have 4 classes today and 3 pending assignments. Keep up the great work!
            </p>

            {/* Streak Badge */}
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full">
              <Flame className="h-4 w-4 text-orange-300" />
              <span className="text-sm font-medium">7 day attendance streak!</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/assignments"
              className="px-4 py-2.5 text-sm font-medium text-white bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all duration-200 flex items-center gap-2 border border-white/20"
            >
              <FileText className="h-4 w-4" />
              Assignments
            </Link>
            <Link
              href="/tests"
              className="px-4 py-2.5 text-sm font-medium text-purple-600 bg-white rounded-xl hover:bg-purple-50 transition-all duration-200 shadow-lg shadow-purple-500/25 flex items-center gap-2"
            >
              <FileQuestion className="h-4 w-4" />
              Take Test
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className={cn(
                'group relative bg-white dark:bg-gray-800/50 rounded-2xl p-5 overflow-hidden',
                'border border-gray-100 dark:border-gray-700/50',
                'hover:shadow-xl transition-all duration-300 hover:-translate-y-1',
                'backdrop-blur-sm'
              )}
            >
              {/* Gradient background on hover */}
              <div className={cn(
                'absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300',
                `bg-gradient-to-br ${stat.gradient}`
              )}></div>

              <div className="relative flex items-center gap-3">
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center',
                  `bg-gradient-to-br ${stat.gradient}`,
                  `shadow-lg ${stat.shadowColor}`,
                  'transform group-hover:scale-110 transition-transform duration-300'
                )}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    <AnimatedNumber value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {stat.title}
                  </p>
                </div>
              </div>
              <p className="relative text-xs text-gray-400 dark:text-gray-500 mt-3 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                {stat.subtitle}
              </p>
            </div>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700/50 flex items-center justify-between bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Today&apos;s Classes
              </h2>
            </div>
            <Link
              href="/classes/timetable"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1 group"
            >
              Full Schedule
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {todaySchedule.map((classItem) => (
              <div
                key={classItem.id}
                className="p-4 flex items-center justify-between hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div
                      className={cn(
                        'w-3 h-3 rounded-full',
                        classItem.status === 'completed' && 'bg-green-500',
                        classItem.status === 'in-progress' && 'bg-purple-500',
                        classItem.status === 'upcoming' && 'bg-gray-300 dark:bg-gray-600'
                      )}
                    />
                    {classItem.status === 'in-progress' && (
                      <div className="absolute inset-0 w-3 h-3 rounded-full bg-purple-500 animate-ping opacity-75"></div>
                    )}
                  </div>
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center',
                    classItem.color === 'blue' && 'bg-blue-100 dark:bg-blue-900/30',
                    classItem.color === 'purple' && 'bg-purple-100 dark:bg-purple-900/30',
                    classItem.color === 'green' && 'bg-green-100 dark:bg-green-900/30',
                    classItem.color === 'amber' && 'bg-amber-100 dark:bg-amber-900/30',
                  )}>
                    <BookOpen className={cn(
                      'h-5 w-5',
                      classItem.color === 'blue' && 'text-blue-600 dark:text-blue-400',
                      classItem.color === 'purple' && 'text-purple-600 dark:text-purple-400',
                      classItem.color === 'green' && 'text-green-600 dark:text-green-400',
                      classItem.color === 'amber' && 'text-amber-600 dark:text-amber-400',
                    )} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {classItem.subject}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      <span>{classItem.teacher}</span>
                      <span className="text-gray-300 dark:text-gray-600">|</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {classItem.time}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-lg">
                    {classItem.room}
                  </span>
                  {classItem.status === 'in-progress' && (
                    <span className="px-2.5 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg animate-pulse">
                      Live
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Available Tests */}
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700/50 bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
                <FileQuestion className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Available Tests
              </h2>
            </div>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {availableTests.map((test) => (
              <div key={test.id} className="p-4 hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {test.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {test.subject}
                    </p>
                  </div>
                  <span className={cn(
                    'px-2 py-0.5 text-xs font-medium rounded-full',
                    test.difficulty === 'Easy' && 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
                    test.difficulty === 'Medium' && 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
                    test.difficulty === 'Hard' && 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
                  )}>
                    {test.difficulty}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {test.duration}
                    </span>
                    <span>•</span>
                    <span>{test.questions} Questions</span>
                  </div>
                  <Link
                    href={`/tests/${test.id}`}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg shadow-purple-500/25 flex items-center gap-1"
                  >
                    <Play className="h-3 w-3" />
                    Start
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Assignments & Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Assignments */}
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700/50 flex items-center justify-between bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Pending Assignments
              </h2>
            </div>
            <Link
              href="/assignments"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1 group"
            >
              View All
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {pendingAssignments.map((assignment) => (
              <div key={assignment.id} className="p-4 hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {assignment.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {assignment.subject}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'px-2.5 py-1 text-xs font-medium rounded-full',
                      assignment.daysLeft <= 2
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                        : assignment.daysLeft <= 4
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                    )}
                  >
                    {assignment.daysLeft} days left
                  </span>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-gray-500 dark:text-gray-400">Progress</span>
                    <span className="font-medium text-gray-900 dark:text-white">{assignment.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        assignment.daysLeft <= 2
                          ? 'bg-gradient-to-r from-red-500 to-pink-500'
                          : assignment.daysLeft <= 4
                          ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
                          : 'bg-gradient-to-r from-green-500 to-emerald-500'
                      )}
                      style={{ width: `${assignment.progress}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Due: {assignment.dueDate}
                  </span>
                  <Link
                    href={`/assignments/${assignment.id}`}
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
                  >
                    Continue
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Results */}
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700/50 flex items-center justify-between bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/25">
                <Award className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Results
              </h2>
            </div>
            <Link
              href="/academics/results"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1 group"
            >
              View All
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="p-4 space-y-4">
            {recentResults.map((result, index) => (
              <div key={index} className="group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {result.subject}
                    </span>
                    {result.trend === 'up' && (
                      <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                    )}
                    {result.trend === 'down' && (
                      <TrendingUp className="h-3.5 w-3.5 text-red-500 rotate-180" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {result.score}/{result.total}
                    </span>
                    <span
                      className={cn(
                        'px-2 py-0.5 text-xs font-bold rounded-md',
                        result.score >= 85
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                          : result.score >= 75
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                          : 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white'
                      )}
                    >
                      {result.grade}
                    </span>
                  </div>
                </div>
                <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-700 group-hover:brightness-110',
                      result.score >= 85
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                        : result.score >= 75
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                        : 'bg-gradient-to-r from-yellow-500 to-amber-500'
                    )}
                    style={{ width: `${result.score}%` }}
                  />
                </div>
              </div>
            ))}

            {/* Performance Summary */}
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-200/50 dark:border-purple-800/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Great Progress!</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Your average score is 83.25% - Keep it up!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
