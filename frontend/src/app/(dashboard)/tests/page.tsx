'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  FileQuestion,
  Clock,
  Calendar,
  Users,
  Play,
  Edit,
  Trash2,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertCircle,
  Sparkles,
  Filter,
  ArrowRight,
  Trophy,
  Target,
  Loader2,
  RefreshCw,
  Eye,
  Copy,
  UserPlus,
  MoreVertical,
  X,
  Upload,
  FileText,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { testsApi, Test, TestStatus } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { GenerateQuestionPaperDialog } from '@/components/modals';

const subjects = ['All Subjects', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'];
const statuses: ('All Status' | TestStatus)[] = ['All Status', 'DRAFT', 'PUBLISHED', 'ACTIVE', 'CLOSED', 'ARCHIVED'];

export default function TestsPage() {
  const { user, accessToken } = useAuthStore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [selectedStatus, setSelectedStatus] = useState<'All Status' | TestStatus>('All Status');

  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    scheduled: 0,
    draft: 0,
  });

  // Modal states
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [selectedTestForGeneration, setSelectedTestForGeneration] = useState<Test | null>(null);
  const [newTestName, setNewTestName] = useState('');
  const [assignClassId, setAssignClassId] = useState('');
  const [assignSectionId, setAssignSectionId] = useState('');
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  // Fetch tests from API
  const fetchTests = async () => {
    if (!accessToken || !user) return;

    setIsLoading(true);
    try {
      let testsData: Test[] = [];

      if (isTeacher) {
        // Teachers/Admins: Fetch all tests they created
        const params: any = {};
        if (selectedSubject !== 'All Subjects') {
          params.search = selectedSubject;
        }
        if (selectedStatus !== 'All Status') {
          params.status = selectedStatus;
        }
        if (searchQuery) {
          params.search = searchQuery;
        }

        const response = await testsApi.getAll(accessToken, params);

        if (response.success && response.data) {
          // Handle both array response and { tests: [] } response format
          testsData = Array.isArray(response.data) ? response.data : (response.data.tests || []);
        }
      } else {
        // Students: Fetch available tests for their class/section
        const response = await testsApi.getAvailable(user.id, accessToken);

        if (response.success && response.data) {
          testsData = Array.isArray(response.data) ? response.data : [];
        }
      }

      setTests(testsData);

      // Calculate stats
      setStats({
        total: testsData.length,
        published: testsData.filter((t: Test) => t.status === 'PUBLISHED' || t.status === 'ACTIVE').length,
        scheduled: testsData.filter((t: Test) => t.status === 'PUBLISHED' && (t.startDateTime || t.startTime) && new Date(t.startDateTime || t.startTime!) > new Date()).length,
        draft: testsData.filter((t: Test) => t.status === 'DRAFT').length,
      });
    } catch (error) {
      console.error('Error fetching tests:', error);
      setTests([]);
      toast({
        title: 'Note',
        description: 'Could not fetch tests from server.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [accessToken, selectedStatus]);

  // Filter tests client-side for search and subject
  const filteredTests = tests.filter((test) => {
    if (selectedSubject !== 'All Subjects' && test.subject?.name !== selectedSubject) return false;
    if (searchQuery && !test.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handlePublish = async (testId: string) => {
    if (!accessToken) return;

    try {
      const response = await testsApi.publish(testId, accessToken);
      if (response.success) {
        toast({
          title: 'Test published!',
          description: 'The test is now available for students.',
        });
        fetchTests(); // Refresh the list
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to publish test',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to publish test',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (testId: string) => {
    if (!accessToken) return;

    if (!confirm('Are you sure you want to delete this test?')) return;

    try {
      const response = await testsApi.delete(testId, accessToken);
      if (response.success) {
        toast({
          title: 'Test deleted',
          description: 'The test has been removed.',
        });
        fetchTests(); // Refresh the list
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to delete test',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete test',
        variant: 'destructive',
      });
    }
  };

  const handleCopyTest = (test: Test) => {
    setSelectedTest(test);
    setNewTestName(`${test.title} (Copy)`);
    setShowCopyModal(true);
    setActionMenuOpen(null);
  };

  const handleConfirmCopy = async () => {
    if (!accessToken || !selectedTest || !newTestName.trim()) return;

    try {
      const response = await testsApi.duplicate(selectedTest.id, newTestName.trim(), accessToken);
      if (response.success) {
        toast({
          title: 'Test copied!',
          description: `Created new test: ${newTestName}`,
        });
        setShowCopyModal(false);
        setSelectedTest(null);
        setNewTestName('');
        fetchTests();
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to copy test',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy test',
        variant: 'destructive',
      });
    }
  };

  const handleAssignTest = (test: Test) => {
    setSelectedTest(test);
    setAssignClassId(test.classId || '');
    setAssignSectionId(test.sectionId || '');
    setShowAssignModal(true);
    setActionMenuOpen(null);
  };

  const handleConfirmAssign = async () => {
    if (!accessToken || !selectedTest) return;

    try {
      const response = await testsApi.assign(selectedTest.id, {
        classId: assignClassId || undefined,
        sectionId: assignSectionId || undefined,
      }, accessToken);
      if (response.success) {
        toast({
          title: 'Test assigned!',
          description: 'Test has been assigned successfully.',
        });
        setShowAssignModal(false);
        setSelectedTest(null);
        fetchTests();
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to assign test',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to assign test',
        variant: 'destructive',
      });
    }
  };

  const handlePreview = (testId: string) => {
    window.open(`/tests/${testId}/preview`, '_blank');
    setActionMenuOpen(null);
  };

  const handleGenerateQuestionPaper = (test: Test) => {
    setSelectedTestForGeneration(test);
    setShowGenerateDialog(true);
    setActionMenuOpen(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
            Draft
          </span>
        );
      case 'PUBLISHED':
      case 'ACTIVE':
        return (
          <span className="px-2.5 py-1 text-xs font-medium bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-600 dark:text-green-400 rounded-full flex items-center gap-1 border border-green-200 dark:border-green-800">
            <CheckCircle className="h-3 w-3" />
            Live
          </span>
        );
      case 'CLOSED':
      case 'ARCHIVED':
        return (
          <span className="px-2.5 py-1 text-xs font-medium bg-gradient-to-r from-red-500/10 to-pink-500/10 text-red-600 dark:text-red-400 rounded-full flex items-center gap-1 border border-red-200 dark:border-red-800">
            <XCircle className="h-3 w-3" />
            Closed
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const statsData = [
    {
      label: 'Total Tests',
      value: stats.total,
      icon: FileQuestion,
      gradient: 'from-blue-500 to-cyan-400',
      shadowColor: 'shadow-blue-500/25',
    },
    {
      label: 'Published',
      value: stats.published,
      icon: CheckCircle,
      gradient: 'from-green-500 to-emerald-400',
      shadowColor: 'shadow-green-500/25',
    },
    {
      label: 'Scheduled',
      value: stats.scheduled,
      icon: Calendar,
      gradient: 'from-amber-500 to-orange-400',
      shadowColor: 'shadow-amber-500/25',
    },
    {
      label: 'Drafts',
      value: stats.draft,
      icon: Edit,
      gradient: 'from-gray-500 to-slate-400',
      shadowColor: 'shadow-gray-500/25',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 p-6 md:p-8">
        <div className="absolute inset-0 opacity-10 bg-grid-white"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-white">
            <div className="flex items-center gap-2 mb-2">
              <FileQuestion className="h-6 w-6" />
              <span className="text-sm font-medium text-purple-200">Assessment Center</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Online Tests
            </h1>
            <p className="text-purple-100 mt-2 max-w-md">
              {isTeacher ? 'Create and manage online tests for your students' : 'Take available tests and track your progress'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchTests}
              className="p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              title="Refresh"
            >
              <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
            </button>
            {isTeacher && (
              <div className="flex items-center gap-2">
                <Link
                  href="/tests/upload"
                  className="px-5 py-2.5 text-sm font-medium text-indigo-600 bg-white rounded-xl hover:bg-indigo-50 transition-all duration-200 shadow-lg shadow-indigo-500/25 flex items-center gap-2 w-fit"
                >
                  <Upload className="h-4 w-4" />
                  Upload from Word
                </Link>
                <Link
                  href="/tests/create"
                  className="px-5 py-2.5 text-sm font-medium text-purple-600 bg-white rounded-xl hover:bg-purple-50 transition-all duration-200 shadow-lg shadow-purple-500/25 flex items-center gap-2 w-fit"
                >
                  <Plus className="h-4 w-4" />
                  Create Test
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats (for teachers) */}
      {isTeacher && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsData.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="group relative bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    `bg-gradient-to-br ${stat.gradient}`,
                    `shadow-lg ${stat.shadowColor}`,
                    'transform group-hover:scale-110 transition-transform duration-300'
                  )}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-5">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tests..."
              className="relative w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-sm transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            >
              {subjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {isTeacher && (
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as 'All Status' | TestStatus)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>{s === 'All Status' ? s : s.charAt(0) + s.slice(1).toLowerCase()}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Loading tests...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Tests Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTests.map((test, index) => (
              <div
                key={test.id}
                className="group bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {test.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {test.subject?.name || 'No Subject'} • {test.class?.name || 'No Class'}
                      </p>
                    </div>
                    {getStatusBadge(test.status)}
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-3 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {test._count?.questions || test.questionCount || 0}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Questions</p>
                    </div>
                    <div className="text-center p-3 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {test.totalMarks}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Marks</p>
                    </div>
                    <div className="text-center p-3 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {test.durationMinutes || test.duration}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Minutes</p>
                    </div>
                  </div>

                  {(test.startDateTime || test.startTime) && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4 p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                      <Calendar className="h-4 w-4 text-purple-500" />
                      <span>{formatDate(test.startDateTime || test.startTime)}</span>
                    </div>
                  )}

                  {(test.status === 'PUBLISHED' || test.status === 'ACTIVE' || test.status === 'CLOSED') && (
                    <div className="flex items-center justify-between text-sm mb-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-100 dark:border-purple-800/30">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Users className="h-4 w-4 text-purple-500" />
                        <span>{test._count?.attempts || test.attemptCount || 0} attempts</span>
                      </div>
                      {test.averageScore !== null && test.averageScore !== undefined && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Trophy className="h-4 w-4 text-amber-500" />
                          <span>Avg: {Math.round(test.averageScore)}%</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="px-6 py-4 bg-gray-50/80 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-700/50">
                  {isTeacher ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {/* Preview Button */}
                        <button
                          onClick={() => handlePreview(test.id)}
                          className="p-2.5 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all duration-200 group/btn"
                          title="Preview"
                        >
                          <Eye className="h-4 w-4 text-gray-500 dark:text-gray-400 group-hover/btn:text-green-500" />
                        </button>
                        {/* Assign Button */}
                        <button
                          onClick={() => handleAssignTest(test)}
                          className="p-2.5 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all duration-200 group/btn"
                          title="Assign to Class"
                        >
                          <UserPlus className="h-4 w-4 text-gray-500 dark:text-gray-400 group-hover/btn:text-blue-500" />
                        </button>
                        {/* Copy Button */}
                        <button
                          onClick={() => handleCopyTest(test)}
                          className="p-2.5 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all duration-200 group/btn"
                          title="Make Copy"
                        >
                          <Copy className="h-4 w-4 text-gray-500 dark:text-gray-400 group-hover/btn:text-amber-500" />
                        </button>
                        {/* Analytics */}
                        <Link
                          href={`/tests/${test.id}/analytics`}
                          className="p-2.5 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all duration-200 group/btn"
                          title="Analytics"
                        >
                          <BarChart3 className="h-4 w-4 text-gray-500 dark:text-gray-400 group-hover/btn:text-purple-500" />
                        </Link>
                        {/* Generate Question Paper Button */}
                        <button
                          onClick={() => handleGenerateQuestionPaper(test)}
                          className="p-2.5 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all duration-200 group/btn"
                          title="Generate Question Paper"
                        >
                          <Download className="h-4 w-4 text-gray-500 dark:text-gray-400 group-hover/btn:text-green-500" />
                        </button>
                        {/* Delete Button - Admin Only */}
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(test.id)}
                            className="p-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 group/btn"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-gray-500 dark:text-gray-400 group-hover/btn:text-red-500" />
                          </button>
                        )}
                      </div>
                      {test.status === 'DRAFT' && (
                        <button
                          onClick={() => handlePublish(test.id)}
                          className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg shadow-purple-500/25"
                        >
                          Publish
                        </button>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={`/tests/${test.id}`}
                      className={cn(
                        'w-full py-2.5 text-sm font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2',
                        test.status === 'PUBLISHED' || test.status === 'ACTIVE'
                          ? 'text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/25'
                          : 'text-gray-500 bg-gray-200 dark:bg-gray-700 cursor-not-allowed'
                      )}
                    >
                      {test.status === 'PUBLISHED' || test.status === 'ACTIVE' ? (
                        <>
                          <Play className="h-4 w-4" />
                          Start Test
                        </>
                      ) : test.status === 'DRAFT' ? (
                        <>
                          <Clock className="h-4 w-4" />
                          Coming Soon
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4" />
                          Not Available
                        </>
                      )}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredTests.length === 0 && (
            <div className="text-center py-16 bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
                <FileQuestion className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No tests found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                {isTeacher
                  ? 'Create your first test to get started with online assessments'
                  : 'Check back later for available tests'}
              </p>
              {isTeacher && (
                <div className="flex items-center justify-center gap-3">
                  <Link
                    href="/tests/upload"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl hover:from-indigo-600 hover:to-blue-600 transition-all duration-200 shadow-lg shadow-indigo-500/25"
                  >
                    <Upload className="h-4 w-4" />
                    Upload from Word
                  </Link>
                  <Link
                    href="/tests/create"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg shadow-purple-500/25"
                  >
                    <Plus className="h-4 w-4" />
                    Create Test
                  </Link>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Copy Test Modal */}
      {showCopyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <Copy className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Make a Copy</h3>
              </div>
              <button
                onClick={() => setShowCopyModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Test Name
              </label>
              <input
                type="text"
                value={newTestName}
                onChange={(e) => setNewTestName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                placeholder="Enter new test name"
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Original: {selectedTest?.title}
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setShowCopyModal(false)}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCopy}
                className="px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/25"
              >
                Create Copy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Test Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <UserPlus className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Assign Test</h3>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  {selectedTest?.title}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  {selectedTest?._count?.questions || selectedTest?.questionCount || 0} questions • {selectedTest?.totalMarks} marks
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assign to Class
                </label>
                <select
                  value={assignClassId}
                  onChange={(e) => setAssignClassId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                  <option value="">All Classes</option>
                  <option value="e1816104-2613-413c-ab97-d6e8a13796c7">Class 11</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assign to Section (Optional)
                </label>
                <select
                  value={assignSectionId}
                  onChange={(e) => setAssignSectionId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                  <option value="">All Sections</option>
                  <option value="587b1ef5-bab4-4551-ae4e-589d36846208">Section A</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAssign}
                className="px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/25"
              >
                Assign Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Question Paper Dialog */}
      {showGenerateDialog && selectedTestForGeneration && (
        <GenerateQuestionPaperDialog
          isOpen={true}
          testId={selectedTestForGeneration.id}
          testName={selectedTestForGeneration.title}
          onClose={() => setShowGenerateDialog(false)}
          onSuccess={() => {
            toast({
              title: 'Success',
              description: 'Question paper generated successfully!',
            });
            setShowGenerateDialog(false);
          }}
        />
      )}
    </div>
  );
}
