'use client';

import Link from 'next/link';
import {
  Users,
  BookOpen,
  ClipboardCheck,
  FileText,
  Calendar,
  Clock,
  TrendingUp,
  Bell,
  CheckCircle,
  AlertCircle,
  Upload,
  Brain,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';

const todayClasses = [
  {
    id: 1,
    subject: 'Mathematics',
    class: '10-A',
    time: '9:00 AM - 9:45 AM',
    room: 'Room 101',
    status: 'completed',
  },
  {
    id: 2,
    subject: 'Mathematics',
    class: '9-B',
    time: '10:00 AM - 10:45 AM',
    room: 'Room 103',
    status: 'in-progress',
  },
  {
    id: 3,
    subject: 'Physics',
    class: '11-A',
    time: '11:30 AM - 12:15 PM',
    room: 'Lab 2',
    status: 'upcoming',
  },
  {
    id: 4,
    subject: 'Mathematics',
    class: '8-C',
    time: '2:00 PM - 2:45 PM',
    room: 'Room 105',
    status: 'upcoming',
  },
];

const stats = [
  {
    title: 'My Classes',
    value: '8',
    icon: BookOpen,
    color: 'green',
  },
  {
    title: 'Total Students',
    value: '324',
    icon: Users,
    color: 'blue',
  },
  {
    title: 'Pending Tasks',
    value: '5',
    icon: ClipboardCheck,
    color: 'yellow',
  },
  {
    title: 'Assignments Due',
    value: '3',
    icon: FileText,
    color: 'red',
  },
];

const pendingTasks = [
  { id: 1, task: 'Mark attendance for Class 10-A', type: 'attendance' },
  { id: 2, task: 'Grade Unit Test papers (28 pending)', type: 'grading' },
  { id: 3, task: 'Submit lesson plans for next week', type: 'planning' },
  { id: 4, task: 'Review assignment submissions', type: 'review' },
  { id: 5, task: 'Prepare exam questions for mid-term', type: 'exam' },
];

const recentSubmissions = [
  {
    id: 1,
    student: 'Aisha Khan',
    assignment: 'Chapter 5 Problems',
    class: '10-A',
    time: '2 hours ago',
    status: 'pending',
  },
  {
    id: 2,
    student: 'Rohit Verma',
    assignment: 'Lab Report #3',
    class: '11-A',
    time: '3 hours ago',
    status: 'graded',
  },
  {
    id: 3,
    student: 'Priya Patel',
    assignment: 'Chapter 5 Problems',
    class: '10-A',
    time: '5 hours ago',
    status: 'pending',
  },
];

export function TeacherDashboard() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome, {user?.firstName}!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            You have 4 classes scheduled for today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/attendance"
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <ClipboardCheck className="h-4 w-4" />
            Mark Attendance
          </Link>
          <Link
            href="/document-ai/upload"
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Brain className="h-4 w-4" />
            Document AI
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    stat.color === 'green' && 'bg-green-100 dark:bg-green-900/30',
                    stat.color === 'blue' && 'bg-blue-100 dark:bg-blue-900/30',
                    stat.color === 'yellow' && 'bg-yellow-100 dark:bg-yellow-900/30',
                    stat.color === 'red' && 'bg-red-100 dark:bg-red-900/30'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5',
                      stat.color === 'green' && 'text-green-600 dark:text-green-400',
                      stat.color === 'blue' && 'text-blue-600 dark:text-blue-400',
                      stat.color === 'yellow' && 'text-yellow-600 dark:text-yellow-400',
                      stat.color === 'red' && 'text-red-600 dark:text-red-400'
                    )}
                  />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {stat.title}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Today&apos;s Schedule
              </h2>
            </div>
            <Link
              href="/classes/timetable"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              Full Timetable
            </Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {todayClasses.map((classItem) => (
              <div
                key={classItem.id}
                className="p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      'w-3 h-3 rounded-full',
                      classItem.status === 'completed' && 'bg-green-500',
                      classItem.status === 'in-progress' && 'bg-blue-500 animate-pulse',
                      classItem.status === 'upcoming' && 'bg-gray-300 dark:bg-gray-600'
                    )}
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {classItem.subject} - {classItem.class}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                      <Clock className="h-3 w-3" />
                      {classItem.time}
                      <span className="text-gray-300 dark:text-gray-600">|</span>
                      {classItem.room}
                    </div>
                  </div>
                </div>
                <span
                  className={cn(
                    'px-3 py-1 text-xs font-medium rounded-full',
                    classItem.status === 'completed' &&
                      'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
                    classItem.status === 'in-progress' &&
                      'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                    classItem.status === 'upcoming' &&
                      'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  )}
                >
                  {classItem.status === 'in-progress' ? 'In Progress' : classItem.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Pending Tasks
            </h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {pendingTasks.map((task) => (
              <div
                key={task.id}
                className="p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <p className="text-sm text-gray-900 dark:text-white flex-1">
                  {task.task}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Assignment Submissions
          </h2>
          <Link
            href="/assignments/submissions"
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Student
                </th>
                <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Assignment
                </th>
                <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Class
                </th>
                <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Submitted
                </th>
                <th className="text-left p-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="text-right p-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {recentSubmissions.map((submission) => (
                <tr key={submission.id}>
                  <td className="p-4">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {submission.student}
                    </p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {submission.assignment}
                    </p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {submission.class}
                    </p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {submission.time}
                    </p>
                  </td>
                  <td className="p-4">
                    <span
                      className={cn(
                        'px-2 py-1 text-xs font-medium rounded-full',
                        submission.status === 'pending' &&
                          'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
                        submission.status === 'graded' &&
                          'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                      )}
                    >
                      {submission.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
