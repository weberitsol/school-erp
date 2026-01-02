'use client';

import { useState, useEffect } from 'react';
import {
  CalendarDays,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  Save,
  RefreshCw,
  ChevronDown,
  Search,
  UserCheck,
  UserX,
  Filter,
  Calendar,
  ClipboardCheck,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import {
  attendanceApi,
  classesApi,
  AttendanceStatus,
  StudentWithAttendance,
  AttendanceBySection,
} from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Class {
  id: string;
  name: string;
}

interface Section {
  id: string;
  name: string;
}

export default function AttendancePage() {
  const { user, accessToken } = useAuthStore();
  const { toast } = useToast();

  // Selection state
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Data state
  const [attendanceData, setAttendanceData] = useState<AttendanceBySection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Local attendance changes (before saving)
  const [localAttendance, setLocalAttendance] = useState<Map<string, { status: AttendanceStatus; remarks?: string }>>(
    new Map()
  );
  const [hasChanges, setHasChanges] = useState(false);

  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  // Fetch classes on mount
  useEffect(() => {
    const fetchClasses = async () => {
      if (!accessToken) return;
      try {
        const response = await classesApi.getAll(accessToken);
        if (response.success && response.data) {
          setClasses(response.data);
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
      }
    };
    fetchClasses();
  }, [accessToken]);

  // Fetch sections when class changes
  useEffect(() => {
    const fetchSections = async () => {
      if (!accessToken || !selectedClass) {
        setSections([]);
        setSelectedSection('');
        return;
      }
      try {
        const response = await classesApi.getSections(selectedClass, accessToken);
        if (response.success && response.data) {
          setSections(response.data);
          if (response.data.length === 1) {
            setSelectedSection(response.data[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching sections:', error);
      }
    };
    fetchSections();
  }, [accessToken, selectedClass]);

  // Fetch attendance when section and date are selected
  useEffect(() => {
    const fetchAttendance = async () => {
      if (!accessToken || !selectedSection || !selectedDate) {
        setAttendanceData(null);
        return;
      }
      setIsLoading(true);
      try {
        const response = await attendanceApi.getByDateAndSection(
          selectedSection,
          selectedDate,
          accessToken
        );
        if (response.success && response.data) {
          setAttendanceData(response.data);
          // Initialize local attendance from fetched data
          const initialAttendance = new Map<string, { status: AttendanceStatus; remarks?: string }>();
          response.data.students.forEach((student: StudentWithAttendance) => {
            if (student.attendance) {
              initialAttendance.set(student.id, {
                status: student.attendance.status,
                remarks: student.attendance.remarks,
              });
            }
          });
          setLocalAttendance(initialAttendance);
          setHasChanges(false);
        }
      } catch (error) {
        console.error('Error fetching attendance:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch attendance data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchAttendance();
  }, [accessToken, selectedSection, selectedDate, toast]);

  // Update local attendance
  const updateStudentAttendance = (studentId: string, status: AttendanceStatus, remarks?: string) => {
    const newMap = new Map(localAttendance);
    newMap.set(studentId, { status, remarks });
    setLocalAttendance(newMap);
    setHasChanges(true);
  };

  // Mark all students with a status
  const markAllAs = (status: AttendanceStatus) => {
    if (!attendanceData) return;
    const newMap = new Map(localAttendance);
    attendanceData.students.forEach((student) => {
      const existing = newMap.get(student.id);
      newMap.set(student.id, { status, remarks: existing?.remarks });
    });
    setLocalAttendance(newMap);
    setHasChanges(true);
  };

  // Save attendance
  const saveAttendance = async () => {
    if (!accessToken || !selectedSection || !selectedDate || !attendanceData) return;

    const attendances = Array.from(localAttendance.entries()).map(([studentId, data]) => ({
      studentId,
      status: data.status,
      remarks: data.remarks,
    }));

    if (attendances.length === 0) {
      toast({
        title: 'No Changes',
        description: 'Mark at least one student attendance before saving',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await attendanceApi.bulkMarkStudentAttendance(
        {
          sectionId: selectedSection,
          date: selectedDate,
          attendances,
        },
        accessToken
      );

      if (response.success) {
        toast({
          title: 'Success',
          description: `Attendance saved for ${attendances.length} students`,
        });
        setHasChanges(false);
        // Refresh data
        const refreshResponse = await attendanceApi.getByDateAndSection(
          selectedSection,
          selectedDate,
          accessToken
        );
        if (refreshResponse.success && refreshResponse.data) {
          setAttendanceData(refreshResponse.data);
        }
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast({
        title: 'Error',
        description: 'Failed to save attendance',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Filter students by search
  const filteredStudents = attendanceData?.students.filter((student) => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return (
      fullName.includes(query) ||
      student.admissionNo.toLowerCase().includes(query) ||
      (student.rollNo && student.rollNo.toLowerCase().includes(query))
    );
  });

  // Calculate summary
  const summary = {
    total: attendanceData?.students.length || 0,
    present: Array.from(localAttendance.values()).filter((a) => a.status === 'PRESENT').length,
    absent: Array.from(localAttendance.values()).filter((a) => a.status === 'ABSENT').length,
    late: Array.from(localAttendance.values()).filter((a) => a.status === 'LATE').length,
    halfDay: Array.from(localAttendance.values()).filter((a) => a.status === 'HALF_DAY').length,
    unmarked: (attendanceData?.students.length || 0) - localAttendance.size,
  };

  const statusConfig: Record<AttendanceStatus, { label: string; color: string; bgColor: string; icon: any }> = {
    PRESENT: { label: 'Present', color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', icon: CheckCircle2 },
    ABSENT: { label: 'Absent', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', icon: XCircle },
    LATE: { label: 'Late', color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30', icon: Clock },
    HALF_DAY: { label: 'Half Day', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30', icon: AlertCircle },
    HOLIDAY: { label: 'Holiday', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30', icon: Calendar },
  };

  if (!isTeacher) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <ClipboardCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Access Restricted
          </h2>
          <p className="text-gray-500">
            Only teachers and administrators can access attendance management.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-6 md:p-8">
        <div className="absolute inset-0 opacity-10 bg-grid-white"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-white">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardCheck className="h-6 w-6" />
              <span className="text-sm font-medium text-violet-200">Attendance Management</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">Mark Attendance</h1>
            <p className="text-violet-100 mt-2 max-w-md">
              Select a class and section to mark or view student attendance
            </p>
          </div>
          <div className="flex items-center gap-3">
            {hasChanges && (
              <button
                onClick={saveAttendance}
                disabled={isSaving}
                className="px-5 py-2.5 text-sm font-medium text-violet-600 bg-white rounded-xl hover:bg-violet-50 transition-all duration-200 shadow-lg shadow-violet-500/25 flex items-center gap-2"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Attendance
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Selection Controls */}
      <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Class Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Class
            </label>
            <div className="relative">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50 text-gray-900 dark:text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              >
                <option value="">Choose a class...</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Section Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Section
            </label>
            <div className="relative">
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                disabled={!selectedClass}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50 text-gray-900 dark:text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-500/50 disabled:opacity-50"
              >
                <option value="">Choose a section...</option>
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Date Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
              <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {attendanceData && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Users className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.total}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{summary.present}</p>
                <p className="text-xs text-gray-500">Present</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{summary.absent}</p>
                <p className="text-xs text-gray-500">Absent</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{summary.late}</p>
                <p className="text-xs text-gray-500">Late</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{summary.halfDay}</p>
                <p className="text-xs text-gray-500">Half Day</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-400">{summary.unmarked}</p>
                <p className="text-xs text-gray-500">Unmarked</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {attendanceData && attendanceData.students.length > 0 && (
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Quick Actions:</span>
            <button
              onClick={() => markAllAs('PRESENT')}
              className="px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors flex items-center gap-2"
            >
              <UserCheck className="h-4 w-4" />
              Mark All Present
            </button>
            <button
              onClick={() => markAllAs('ABSENT')}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-red-100 dark:bg-red-900/30 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-2"
            >
              <UserX className="h-4 w-4" />
              Mark All Absent
            </button>
            <div className="flex-1" />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>
          </div>
        </div>
      )}

      {/* Student List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-violet-500 mx-auto mb-4" />
            <p className="text-gray-500">Loading students...</p>
          </div>
        </div>
      ) : !selectedSection ? (
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-12">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <ClipboardCheck className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Select a Class & Section
            </h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              Choose a class and section above to view and mark student attendance
            </p>
          </div>
        </div>
      ) : attendanceData && filteredStudents && filteredStudents.length > 0 ? (
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Roll No
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Attendance Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {filteredStudents.map((student, index) => {
                  const currentAttendance = localAttendance.get(student.id);
                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-medium text-sm">
                            {student.firstName?.[0] || ''}{student.lastName?.[0] || ''}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {student.firstName} {student.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{student.admissionNo}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600 dark:text-gray-400">
                          {student.rollNo || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY'] as AttendanceStatus[]).map((status) => {
                            const config = statusConfig[status];
                            const Icon = config.icon;
                            const isSelected = currentAttendance?.status === status;
                            return (
                              <button
                                key={status}
                                onClick={() => updateStudentAttendance(student.id, status)}
                                className={cn(
                                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5',
                                  isSelected
                                    ? `${config.bgColor} ${config.color} ring-2 ring-offset-2 ring-current`
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'
                                )}
                              >
                                <Icon className="h-3.5 w-3.5" />
                                {config.label}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : attendanceData && attendanceData.students.length === 0 ? (
        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 p-12">
          <div className="text-center">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Students Found
            </h3>
            <p className="text-gray-500">
              No students are enrolled in this section
            </p>
          </div>
        </div>
      ) : null}

      {/* Save Button (Bottom Fixed) */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={saveAttendance}
            disabled={isSaving}
            className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl hover:from-violet-600 hover:to-purple-600 transition-all shadow-lg shadow-violet-500/25 flex items-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            Save Changes ({localAttendance.size} students)
          </button>
        </div>
      )}
    </div>
  );
}
