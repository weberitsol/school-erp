'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  BarChart3,
  FileText,
  Users,
  GraduationCap,
  Search,
  Download,
  ChevronRight,
  Loader2,
  RefreshCw,
  Trophy,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Calendar,
  Target,
  BookOpen,
  DollarSign,
  Clock,
  Award,
  Percent,
  School,
  UserCheck,
  PieChart,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { testsApi, classesApi, reportsApi, Test, Class, TestReport } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  SimpleAreaChart,
  MultiBarChart,
  SimpleLineChart,
  DonutChart,
  SimpleRadarChart,
  ProgressRing,
  SparklineStat,
  CHART_COLORS,
} from '@/components/charts';

// Import role-specific components
import { AdminReports } from './admin-reports';
import { TeacherReports } from './teacher-reports';
import { StudentReports } from './student-reports';
import { ParentReports } from './parent-reports';

export default function ReportsPage() {
  const { user, accessToken } = useAuthStore();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  // Render role-specific reports
  switch (user.role) {
    case 'ADMIN':
    case 'SUPER_ADMIN':
      return <AdminReports />;
    case 'TEACHER':
      return <TeacherReports />;
    case 'STUDENT':
      return <StudentReports />;
    case 'PARENT':
      return <ParentReports />;
    default:
      return <StudentReports />;
  }
}
