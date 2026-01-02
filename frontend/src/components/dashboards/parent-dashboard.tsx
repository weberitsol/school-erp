'use client';

import Link from 'next/link';
import {
  Users,
  Calendar,
  DollarSign,
  Bus,
  BookOpen,
  Bell,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  MessageSquare,
  FileText,
  CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';

const children = [
  {
    id: 1,
    name: 'Aarav Sharma',
    class: '10-A',
    rollNo: '15',
    attendance: 94,
    lastTestScore: 88,
    rank: 5,
    avatar: 'AS',
  },
  {
    id: 2,
    name: 'Ananya Sharma',
    class: '7-B',
    rollNo: '12',
    attendance: 98,
    lastTestScore: 92,
    rank: 2,
    avatar: 'AS',
  },
];

const feeDetails = [
  {
    id: 1,
    childName: 'Aarav Sharma',
    description: 'Term 2 Fee',
    amount: 25000,
    dueDate: 'Dec 25, 2024',
    status: 'pending',
  },
  {
    id: 2,
    childName: 'Ananya Sharma',
    description: 'Term 2 Fee',
    amount: 22000,
    dueDate: 'Dec 25, 2024',
    status: 'pending',
  },
];

const recentUpdates = [
  {
    id: 1,
    type: 'attendance',
    message: 'Aarav was marked present today',
    time: '9:15 AM',
    icon: CheckCircle,
    color: 'green',
  },
  {
    id: 2,
    type: 'result',
    message: 'Ananya scored 95% in Mathematics test',
    time: 'Yesterday',
    icon: TrendingUp,
    color: 'blue',
  },
  {
    id: 3,
    type: 'notice',
    message: 'Parent-Teacher Meeting scheduled for Dec 20',
    time: '2 days ago',
    icon: Bell,
    color: 'yellow',
  },
  {
    id: 4,
    type: 'transport',
    message: 'School bus Route #5 delayed by 10 minutes',
    time: '3 days ago',
    icon: Bus,
    color: 'red',
  },
];

const upcomingEvents = [
  {
    id: 1,
    title: 'Parent-Teacher Meeting',
    date: 'Dec 20, 2024',
    time: '10:00 AM',
    child: 'Both',
  },
  {
    id: 2,
    title: 'Annual Day Function',
    date: 'Dec 28, 2024',
    time: '5:00 PM',
    child: 'Both',
  },
  {
    id: 3,
    title: 'Science Exhibition',
    date: 'Jan 5, 2025',
    time: '11:00 AM',
    child: 'Aarav',
  },
];

export function ParentDashboard() {
  const { user } = useAuthStore();

  const totalPendingFees = feeDetails
    .filter((f) => f.status === 'pending')
    .reduce((sum, f) => sum + f.amount, 0);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome, {user?.firstName}!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Monitor your children&apos;s academic progress and activities.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/communication/messages"
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Message Teacher
          </Link>
          <Link
            href="/finance/payments"
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <CreditCard className="h-4 w-4" />
            Pay Fees
          </Link>
        </div>
      </div>

      {/* Children Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children.map((child) => (
          <div
            key={child.id}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <span className="text-lg font-bold text-red-600 dark:text-red-400">
                    {child.avatar}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {child.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Class {child.class} | Roll No. {child.rollNo}
                  </p>
                </div>
              </div>
              <Link
                href={`/children/${child.id}`}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                View Details
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {child.attendance}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Attendance
                </p>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {child.lastTestScore}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Last Test
                </p>
              </div>
              <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  #{child.rank}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Class Rank
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Updates */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Updates
            </h2>
            <Link
              href="/notifications"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              View All
            </Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {recentUpdates.map((update) => {
              const Icon = update.icon;
              return (
                <div key={update.id} className="p-4 flex items-start gap-4">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                      update.color === 'green' && 'bg-green-100 dark:bg-green-900/30',
                      update.color === 'blue' && 'bg-blue-100 dark:bg-blue-900/30',
                      update.color === 'yellow' && 'bg-yellow-100 dark:bg-yellow-900/30',
                      update.color === 'red' && 'bg-red-100 dark:bg-red-900/30'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5',
                        update.color === 'green' && 'text-green-600 dark:text-green-400',
                        update.color === 'blue' && 'text-blue-600 dark:text-blue-400',
                        update.color === 'yellow' && 'text-yellow-600 dark:text-yellow-400',
                        update.color === 'red' && 'text-red-600 dark:text-red-400'
                      )}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {update.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {update.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Fee Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Pending Fees
              </h2>
            </div>
            <div className="p-4">
              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                  ₹{totalPendingFees.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total Due
                </p>
              </div>
              <div className="space-y-3">
                {feeDetails.map((fee) => (
                  <div
                    key={fee.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {fee.childName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Due: {fee.dueDate}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      ₹{fee.amount.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
              <Link
                href="/finance/payments"
                className="mt-4 w-full py-2 px-4 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                Pay Now
              </Link>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Upcoming Events
              </h2>
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="p-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {event.title}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{event.date}</span>
                      <span>•</span>
                      <span>{event.time}</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                      {event.child}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
