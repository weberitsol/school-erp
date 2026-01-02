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
  Clock,
  Award,
  Activity,
  PieChart,
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
  CHART_COLORS,
} from '@/components/charts';

type TabType = 'overview' | 'tests' | 'classes';

// Mock data for teacher analytics
const testPerformanceTrend = [
  { test: 'Test 1', avgScore: 65, passRate: 78 },
  { test: 'Test 2', avgScore: 70, passRate: 82 },
  { test: 'Test 3', avgScore: 68, passRate: 80 },
  { test: 'Test 4', avgScore: 75, passRate: 88 },
  { test: 'Test 5', avgScore: 72, passRate: 85 },
];

const classComparison = [
  { name: '10-A', avgScore: 78, students: 42 },
  { name: '10-B', avgScore: 72, students: 40 },
  { name: '9-A', avgScore: 75, students: 38 },
  { name: '9-B', avgScore: 70, students: 41 },
];

const questionTypeAnalysis = [
  { name: 'Single Correct', value: 45, color: '#8b5cf6' },
  { name: 'Multiple Correct', value: 25, color: '#06b6d4' },
  { name: 'Integer Type', value: 20, color: '#10b981' },
  { name: 'Matrix Match', value: 10, color: '#f59e0b' },
];

const difficultyDistribution = [
  { name: 'Easy', value: 30, color: '#10b981' },
  { name: 'Medium', value: 50, color: '#f59e0b' },
  { name: 'Hard', value: 20, color: '#ef4444' },
];

const weeklyActivity = [
  { day: 'Mon', testsCreated: 2, questionsAdded: 15 },
  { day: 'Tue', testsCreated: 1, questionsAdded: 20 },
  { day: 'Wed', testsCreated: 3, questionsAdded: 25 },
  { day: 'Thu', testsCreated: 2, questionsAdded: 18 },
  { day: 'Fri', testsCreated: 1, questionsAdded: 12 },
];

export function TeacherReports() {
  const { user, accessToken } = useAuthStore();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get('tab');
  const initialTab: TabType = tabParam === 'tests' ? 'tests' : tabParam === 'classes' ? 'classes' : 'overview';

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [isLoading, setIsLoading] = useState(true);
  const [tests, setTests] = useState<Test[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [testReport, setTestReport] = useState<TestReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Stats
  const [stats, setStats] = useState({
    totalTests: 15,
    totalAttempts: 420,
    avgPassRate: 85,
    avgScore: 72,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!accessToken) return;
      setIsLoading(true);
      try {
        const [testsRes, classesRes] = await Promise.all([
          testsApi.getAll(accessToken),
          classesApi.getAll(accessToken),
        ]);

        if (testsRes.success && testsRes.data) {
          setTests(testsRes.data.tests || []);
          // Calculate stats
          const testsList = testsRes.data.tests || [];
          const totalAttempts = testsList.reduce((acc: number, t: Test) => acc + (t.attemptCount || 0), 0);
          setStats({
            totalTests: testsList.length,
            totalAttempts,
            avgPassRate: 85,
            avgScore: 72,
          });
        }
        if (classesRes.success && classesRes.data) {
          setClasses(classesRes.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [accessToken]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'tests') setActiveTab('tests');
    else if (tab === 'classes') setActiveTab('classes');
    else setActiveTab('overview');
  }, [searchParams]);

  // Fetch test report
  const fetchTestReport = async (testId: string) => {
    if (!accessToken) return;
    setLoadingReport(true);
    try {
      const response = await reportsApi.getTestReport(testId, accessToken);
      if (response.success && response.data) {
        setTestReport(response.data);
      }
    } catch (error) {
      console.error('Error fetching test report:', error);
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    if (selectedTest) {
      fetchTestReport(selectedTest);
    } else {
      setTestReport(null);
    }
  }, [selectedTest]);

  // Export CSV
  const handleExportCsv = async () => {
    if (!selectedTest || !accessToken) return;

    try {
      const result = await reportsApi.exportTestReportCsv(selectedTest, accessToken);
      if (result.success && result.data) {
        const url = window.URL.createObjectURL(result.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `test_report_${selectedTest}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: 'Export successful',
          description: 'CSV file has been downloaded.',
        });
      }
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'An error occurred while exporting.',
        variant: 'destructive',
      });
    }
  };

  const filteredTests = tests.filter((test) => {
    if (searchQuery && !test.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return test.attemptCount && test.attemptCount > 0;
  });

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: Activity },
    { id: 'tests' as TabType, label: 'Test Reports', icon: FileText },
    { id: 'classes' as TabType, label: 'Class Reports', icon: Users },
  ];

  const statCards = [
    { title: 'Total Tests', value: stats.totalTests, icon: FileText, color: 'blue' },
    { title: 'Total Attempts', value: stats.totalAttempts, icon: Target, color: 'purple' },
    { title: 'Avg Pass Rate', value: `${stats.avgPassRate}%`, icon: CheckCircle, color: 'green' },
    { title: 'Avg Score', value: `${stats.avgScore}%`, icon: Trophy, color: 'amber' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 md:p-8">
        <div className="absolute inset-0 opacity-10 bg-grid-white"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-white">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-6 w-6" />
              <span className="text-sm font-medium text-emerald-200">Teacher Dashboard</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">Reports & Analytics</h1>
            <p className="text-emerald-100 mt-2 max-w-md">
              Track test performance, class analytics, and student progress
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors self-start"
          >
            <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-2">
        <div className="flex gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.title}
                  className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-5"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center',
                      stat.color === 'blue' && 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
                      stat.color === 'purple' && 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
                      stat.color === 'green' && 'bg-green-100 dark:bg-green-900/30 text-green-600',
                      stat.color === 'amber' && 'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
                    )}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Test Performance Trend */}
            <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                Test Performance Trend
              </h3>
              <SimpleLineChart
                data={testPerformanceTrend}
                lines={[
                  { dataKey: 'avgScore', color: '#8b5cf6', name: 'Avg Score' },
                  { dataKey: 'passRate', color: '#10b981', name: 'Pass Rate' },
                ]}
                xAxisKey="test"
                height={280}
              />
            </div>

            {/* Class Comparison */}
            <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Class Performance Comparison
              </h3>
              <MultiBarChart
                data={classComparison}
                bars={[{ dataKey: 'avgScore', color: '#3b82f6', name: 'Avg Score' }]}
                xAxisKey="name"
                height={280}
              />
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Question Type Distribution */}
            <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <PieChart className="h-5 w-5 text-purple-500" />
                Question Types
              </h3>
              <DonutChart data={questionTypeAnalysis} height={220} showLabel={false} />
              <div className="space-y-2 mt-4">
                {questionTypeAnalysis.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Difficulty Distribution */}
            <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Target className="h-5 w-5 text-amber-500" />
                Difficulty Distribution
              </h3>
              <DonutChart data={difficultyDistribution} height={220} showLabel={false} />
              <div className="space-y-2 mt-4">
                {difficultyDistribution.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Activity */}
            <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-500" />
                Weekly Activity
              </h3>
              <MultiBarChart
                data={weeklyActivity}
                bars={[
                  { dataKey: 'testsCreated', color: '#8b5cf6', name: 'Tests' },
                  { dataKey: 'questionsAdded', color: '#10b981', name: 'Questions' },
                ]}
                xAxisKey="day"
                height={220}
              />
            </div>
          </div>
        </>
      )}

      {/* Tests Tab */}
      {activeTab === 'tests' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Test List */}
          <div className="lg:col-span-1 bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-500" />
              Select Test
            </h3>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tests..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
              />
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                </div>
              ) : filteredTests.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No tests with attempts found</p>
                </div>
              ) : (
                filteredTests.map((test) => (
                  <button
                    key={test.id}
                    onClick={() => setSelectedTest(test.id)}
                    className={cn(
                      'w-full text-left p-4 rounded-xl border transition-all duration-200',
                      selectedTest === test.id
                        ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800'
                        : 'border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{test.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {test.subject?.name} • {test.class?.name}
                        </p>
                      </div>
                      <ChevronRight className={cn(
                        "h-4 w-4 text-gray-400 transition-transform",
                        selectedTest === test.id && "text-emerald-500 rotate-90"
                      )} />
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {test.attemptCount || 0} attempts
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Test Report */}
          <div className="lg:col-span-2 space-y-6">
            {!selectedTest ? (
              <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-12 text-center">
                <BarChart3 className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Select a Test</h3>
                <p className="text-gray-500 dark:text-gray-400">Choose a test from the list to view detailed analytics</p>
              </div>
            ) : loadingReport ? (
              <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-12 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Loading report...</p>
              </div>
            ) : testReport ? (
              <>
                {/* Test Info */}
                <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{testReport.test.title}</h2>
                      <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {testReport.test.subject.name} • {testReport.test.class.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/reports/test/${selectedTest}`}
                        className="px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl hover:bg-emerald-100 transition-colors flex items-center gap-2"
                      >
                        <BarChart3 className="h-4 w-4" />
                        Full Report
                      </Link>
                      <button
                        onClick={handleExportCsv}
                        className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Export
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Attempts', value: testReport.stats.totalAttempts, color: 'blue' },
                    { label: 'Average', value: `${testReport.stats.averagePercentage.toFixed(0)}%`, color: 'amber' },
                    { label: 'Pass Rate', value: `${testReport.stats.passRate.toFixed(0)}%`, color: 'green' },
                    { label: 'Highest', value: testReport.stats.highestScore, color: 'purple' },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-100 dark:border-gray-700/50 p-4 text-center"
                    >
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                      <p className="text-sm text-gray-500">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Score Distribution */}
                <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Score Distribution</h3>
                  <MultiBarChart
                    data={testReport.scoreDistribution.map((d) => ({
                      range: d.range,
                      count: d.count,
                    }))}
                    bars={[{ dataKey: 'count', color: '#10b981', name: 'Students' }]}
                    xAxisKey="range"
                    height={200}
                  />
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Classes Tab */}
      {activeTab === 'classes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.length === 0 ? (
            <div className="col-span-full bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-12 text-center">
              <Users className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Classes Found</h3>
              <p className="text-gray-500 dark:text-gray-400">Classes will appear here once created</p>
            </div>
          ) : (
            classes.map((cls) => (
              <Link
                key={cls.id}
                href={`/reports/class/${cls.id}`}
                className="group bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                      {cls.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{cls.section || 'All Sections'}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-sm text-emerald-600 font-medium">View Analytics</p>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
