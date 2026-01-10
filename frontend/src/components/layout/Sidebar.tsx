'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  ClipboardCheck,
  FileText,
  DollarSign,
  Bus,
  Library,
  Bell,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Upload,
  Brain,
  FileQuestion,
  ClipboardList,
  BarChart3,
  Building2,
  UserCog,
  Settings2,
  Tags,
  GitBranch,
  Layers,
  CheckSquare,
  FileCheck,
  ArrowRightLeft,
  Play,
  Video,
  Target,
  UtensilsCrossed,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';

interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  children?: { label: string; href: string }[];
  roles?: string[];
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Students',
    icon: Users,
    roles: ['ADMIN', 'TEACHER'],
    children: [
      { label: 'All Students', href: '/students' },
      { label: 'Admissions', href: '/students/admissions' },
      { label: 'Promotions', href: '/students/promotions' },
      { label: 'Batch Transfer', href: '/students/transfer' },
    ],
  },
  {
    label: 'Teachers',
    icon: UserCog,
    roles: ['ADMIN'],
    children: [
      { label: 'All Teachers', href: '/teachers' },
      { label: 'Assignments', href: '/teachers/assignments' },
    ],
  },
  {
    label: 'Classes',
    icon: Building2,
    roles: ['ADMIN', 'TEACHER'],
    children: [
      { label: 'All Classes', href: '/classes' },
      { label: 'Sections', href: '/classes/sections' },
      { label: 'Subjects', href: '/classes/subjects' },
      { label: 'Timetable', href: '/classes/timetable' },
    ],
  },
  {
    label: 'Attendance',
    href: '/attendance',
    icon: ClipboardCheck,
    roles: ['ADMIN', 'TEACHER'],
  },
  {
    label: 'Academics',
    icon: BookOpen,
    roles: ['ADMIN', 'TEACHER'],
    children: [
      { label: 'Exams', href: '/academics/exams' },
      { label: 'Results', href: '/academics/results' },
      { label: 'Report Cards', href: '/academics/report-cards' },
      { label: 'Chapters', href: '/academics/chapters' },
    ],
  },
  {
    label: 'Document AI',
    icon: Brain,
    roles: ['ADMIN', 'TEACHER'],
    children: [
      { label: 'Upload Documents', href: '/document-ai/upload' },
      { label: 'Question Bank', href: '/document-ai/questions' },
      { label: 'Generate Tests', href: '/document-ai/generate-test' },
    ],
  },
  {
    label: 'Online Tests',
    icon: FileQuestion,
    children: [
      { label: 'All Tests', href: '/tests' },
      { label: 'Upload Test (Word)', href: '/tests/upload' },
      { label: 'Create Test', href: '/tests/create' },
      { label: 'My Attempts', href: '/tests/attempts' },
    ],
  },
  {
    label: 'Assignments',
    icon: ClipboardList,
    children: [
      { label: 'All Assignments', href: '/assignments' },
      { label: 'Submissions', href: '/assignments/submissions' },
    ],
  },
  {
    label: 'Finance',
    icon: DollarSign,
    roles: ['ADMIN', 'PARENT'],
    children: [
      { label: 'Fee Structure', href: '/finance/fee-structure' },
      { label: 'Payments', href: '/finance/payments' },
      { label: 'Invoices', href: '/finance/invoices' },
    ],
  },
  {
    label: 'Library',
    href: '/library',
    icon: Library,
  },
  {
    label: 'Transportation',
    icon: Bus,
    roles: ['ADMIN'],
    children: [
      { label: 'Routes', href: '/admin/transportation/routes' },
      { label: 'Vehicles', href: '/admin/transportation/vehicles' },
      { label: 'Drivers', href: '/admin/transportation/drivers' },
      { label: 'Trips', href: '/admin/transportation/trips' },
      { label: 'Stops', href: '/admin/transportation/stops' },
      { label: 'Live Tracking', href: '/admin/transportation/live-tracking' },
      { label: 'Trip Progress', href: '/admin/transportation/trip-progress' },
      { label: 'Boarding', href: '/admin/transportation/boarding' },
      { label: 'Attendance', href: '/admin/transportation/attendance-integration' },
      { label: 'Analytics', href: '/admin/transportation/analytics' },
    ],
  },
  {
    label: 'Practice MCQs',
    href: '/practice',
    icon: Brain,
    roles: ['STUDENT'],
  },
  {
    label: 'Video Library',
    href: '/videos',
    icon: Video,
    roles: ['STUDENT'],
  },
  {
    label: 'Study Planner',
    href: '/study-planner',
    icon: Target,
    roles: ['STUDENT'],
  },
  {
    label: 'Calendar',
    href: '/calendar',
    icon: Calendar,
  },
  {
    label: 'Reports',
    icon: BarChart3,
    children: [
      { label: 'Overview', href: '/reports' },
      { label: 'Video Analytics', href: '/reports/videos' },
    ],
  },
  {
    label: 'HR Management',
    icon: UserCog,
    roles: ['ADMIN'],
    children: [
      { label: 'Employees', href: '/admin/hr/employees' },
      { label: 'Designations', href: '/admin/hr/designations' },
      { label: 'Salaries', href: '/admin/hr/salaries' },
      { label: 'Payslips', href: '/admin/hr/payslips' },
      { label: 'Promotions', href: '/admin/hr/promotions' },
      { label: 'Transfers', href: '/admin/hr/transfers' },
      { label: 'Separations', href: '/admin/hr/separations' },
      { label: 'Leave Management', href: '/admin/hr/leave-management' },
      { label: 'Performance Reviews', href: '/admin/hr/performance-reviews' },
    ],
  },
  {
    label: 'Parents',
    icon: Users,
    roles: ['ADMIN'],
    children: [
      { label: 'All Parents', href: '/admin/parents' },
    ],
  },
  {
    label: 'Boarding/Hostel',
    icon: Building2,
    roles: ['ADMIN'],
    children: [
      { label: 'Room Management', href: '/admin/boarding' },
    ],
  },
  {
    label: 'Mess Management',
    icon: UtensilsCrossed,
    roles: ['ADMIN'],
    children: [
      { label: 'Overview', href: '/admin/mess' },
      { label: 'Food Items', href: '/admin/mess/food-items' },
      { label: 'Recipes', href: '/admin/mess/recipes' },
      { label: 'Meal Plans', href: '/admin/mess/meal-plans' },
      { label: 'Staff', href: '/admin/mess/staff' },
      { label: 'Allergens', href: '/admin/mess/allergens' },
      { label: 'Menus', href: '/admin/mess/menus' },
      { label: 'Meals', href: '/admin/mess/meals' },
      { label: 'Meal Variants', href: '/admin/mess/meal-variants' },
      { label: 'Meal Choices', href: '/admin/mess/meal-choices' },
      { label: 'Student Enrollments', href: '/admin/mess/enrollments' },
      { label: 'Meal Attendance', href: '/admin/mess/attendance' },
      { label: 'Holiday Calendar', href: '/admin/mess/holidays' },
    ],
  },
  {
    label: 'Examinations',
    icon: FileQuestion,
    roles: ['ADMIN', 'TEACHER'],
    children: [
      { label: 'Exams & Results', href: '/admin/exams' },
    ],
  },
  {
    label: 'Announcements',
    icon: Bell,
    roles: ['ADMIN'],
    children: [
      { label: 'Manage Announcements', href: '/admin/announcements' },
    ],
  },
  {
    label: 'Analytics',
    icon: BarChart3,
    roles: ['ADMIN'],
    children: [
      { label: 'Student Analytics', href: '/admin/analytics' },
    ],
  },
  {
    label: 'Admin',
    icon: Settings2,
    roles: ['ADMIN', 'SUPER_ADMIN'],
    children: [
      { label: 'Classes & Subjects', href: '/admin/classes' },
      { label: 'Branches', href: '/admin/branches' },
      { label: 'Batches', href: '/admin/batches' },
      { label: 'Exam Patterns', href: '/admin/patterns' },
      { label: 'Tags', href: '/admin/tags' },
      { label: 'Assessment Reasons', href: '/admin/assessment-reasons' },
      { label: 'Tasks', href: '/admin/tasks' },
      { label: 'Manage Videos', href: '/admin/videos' },
      { label: 'Upload Word Tests', href: '/admin/test-upload' },
    ],
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-72 z-50 transform transition-all duration-300 ease-out lg:translate-x-0 lg:static',
          'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl',
          'border-r border-gray-200/50 dark:border-gray-800/50',
          'shadow-xl shadow-gray-200/20 dark:shadow-gray-900/50',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-5 border-b border-gray-200/50 dark:border-gray-800/50">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                School ERP
              </span>
            </Link>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isExpanded = expandedItems.includes(item.label);
              const hasChildren = item.children && item.children.length > 0;
              const isActive = item.href
                ? pathname === item.href
                : item.children?.some((child) => pathname === child.href);

              if (hasChildren) {
                return (
                  <div key={item.label}>
                    <button
                      onClick={() => toggleExpand(item.label)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 hover:translate-x-1'
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <div className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                          isActive
                            ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
                        {item.label}
                      </span>
                      <ChevronDown className={cn(
                        'h-4 w-4 transition-transform duration-200',
                        isExpanded ? 'rotate-0' : '-rotate-90'
                      )} />
                    </button>
                    <div className={cn(
                      'overflow-hidden transition-all duration-200',
                      isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    )}>
                      <div className="mt-1 ml-11 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                        {item.children!.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={onClose}
                            className={cn(
                              'block px-3 py-2 rounded-lg text-sm transition-all duration-200',
                              pathname === child.href
                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium translate-x-1'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 hover:translate-x-1'
                            )}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={item.label}
                  href={item.href!}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 hover:translate-x-1'
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                    isActive
                      ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-gray-200/50 dark:border-gray-800/50">
            <div className="p-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50 mb-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                    <span className="text-sm font-bold text-white">
                      {user?.firstName?.[0]}
                      {user?.lastName?.[0]}
                    </span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate capitalize">
                    {user?.role?.toLowerCase().replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 border border-red-200/50 dark:border-red-900/30 transition-all duration-200 hover:scale-[1.02]"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
