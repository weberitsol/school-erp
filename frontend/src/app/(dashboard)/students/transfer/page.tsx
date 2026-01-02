'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ArrowRightLeft,
  Search,
  Loader2,
  Users,
  CheckCircle,
  XCircle,
  Calendar,
  FileText,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import {
  studentsApi,
  classesApi,
  transfersApi,
  Student,
  BatchTransfer,
} from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ClassOption {
  id: string;
  name: string;
  code: string;
  sections: { id: string; name: string }[];
}

type TabType = 'transfer' | 'history';

export default function StudentTransferPage() {
  const { accessToken } = useAuthStore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>('transfer');
  const [isLoading, setIsLoading] = useState(false);
  const [classes, setClasses] = useState<ClassOption[]>([]);

  // Transfer form state
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [toClassId, setToClassId] = useState('');
  const [toSectionId, setToSectionId] = useState('');
  const [reason, setReason] = useState('');

  // History state
  const [transfers, setTransfers] = useState<BatchTransfer[]>([]);
  const [historyStudentId, setHistoryStudentId] = useState('');

  // Fetch classes
  useEffect(() => {
    const fetchClasses = async () => {
      if (!accessToken) return;
      try {
        const res = await classesApi.getAll(accessToken);
        if (res.success && res.data) {
          setClasses(res.data as ClassOption[]);
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
      }
    };
    fetchClasses();
  }, [accessToken]);

  // Search students
  const handleSearch = useCallback(async () => {
    if (!accessToken || !searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await studentsApi.getAll(accessToken, { search: searchTerm, limit: 10 });
      if (res.success && res.data) {
        const students = res.data.students || res.data || [];
        setSearchResults(Array.isArray(students) ? students : []);
      }
    } catch (error) {
      console.error('Error searching students:', error);
    } finally {
      setIsSearching(false);
    }
  }, [accessToken, searchTerm]);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(handleSearch, 300);
    return () => clearTimeout(timeout);
  }, [searchTerm, handleSearch]);

  // Get sections for target class
  const targetClass = classes.find((c) => c.id === toClassId);
  const targetSections = targetClass?.sections || [];

  // Handle transfer
  const handleTransfer = async () => {
    if (!accessToken || !selectedStudent) return;

    if (!toClassId || !toSectionId) {
      toast({
        title: 'Error',
        description: 'Please select target class and section',
        variant: 'destructive',
      });
      return;
    }

    // Check if same section
    if (
      selectedStudent.currentClassId === toClassId &&
      selectedStudent.currentSectionId === toSectionId
    ) {
      toast({
        title: 'Error',
        description: 'Student is already in this class and section',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await transfersApi.transfer(
        {
          studentId: selectedStudent.id,
          toClassId,
          toSectionId,
          reason: reason || undefined,
        },
        accessToken
      );

      if (res.success) {
        toast({
          title: 'Success',
          description: 'Student transferred successfully',
        });
        // Reset form
        setSelectedStudent(null);
        setSearchTerm('');
        setSearchResults([]);
        setToClassId('');
        setToSectionId('');
        setReason('');
      } else {
        toast({
          title: 'Error',
          description: res.error || 'Failed to transfer student',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error transferring student:', error);
      toast({
        title: 'Error',
        description: 'Failed to transfer student',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch transfer history
  const fetchHistory = useCallback(async () => {
    if (!accessToken) return;

    setIsLoading(true);
    try {
      const res = await transfersApi.getHistory(accessToken, {
        studentId: historyStudentId || undefined,
      });
      if (res.success && res.data) {
        setTransfers(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, historyStudentId]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, fetchHistory]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ArrowRightLeft className="h-7 w-7 text-blue-600" />
          Student Batch Transfer
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Transfer students between classes and sections
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('transfer')}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-colors',
            activeTab === 'transfer'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          )}
        >
          Transfer Student
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-colors',
            activeTab === 'history'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          )}
        >
          Transfer History
        </button>
      </div>

      {/* Transfer Tab */}
      {activeTab === 'transfer' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Student Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Select Student
            </h2>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or admission number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-blue-600" />
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && !selectedStudent && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700 max-h-64 overflow-y-auto">
                {searchResults.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => {
                      setSelectedStudent(student);
                      setSearchResults([]);
                      setSearchTerm('');
                    }}
                    className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
                  >
                    <p className="font-medium text-gray-900 dark:text-white">
                      {student.firstName} {student.lastName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {student.admissionNo} | {student.currentClass?.name} -{' '}
                      {student.currentSection?.name}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {/* Selected Student */}
            {selectedStudent && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {selectedStudent.firstName} {selectedStudent.lastName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Admission: {selectedStudent.admissionNo}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Current:</span>
                      <span className="inline-flex px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                        {selectedStudent.currentClass?.name || 'N/A'} -{' '}
                        {selectedStudent.currentSection?.name || 'N/A'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}

            {!selectedStudent && searchResults.length === 0 && searchTerm && !isSearching && (
              <div className="text-center py-8">
                <Users className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500 dark:text-gray-400">No students found</p>
              </div>
            )}
          </div>

          {/* Transfer Form */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Transfer To
            </h2>

            <div className="space-y-4">
              {/* Target Class */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target Class <span className="text-red-500">*</span>
                </label>
                <select
                  value={toClassId}
                  onChange={(e) => {
                    setToClassId(e.target.value);
                    setToSectionId('');
                  }}
                  disabled={!selectedStudent}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="">Select Class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target Section <span className="text-red-500">*</span>
                </label>
                <select
                  value={toSectionId}
                  onChange={(e) => setToSectionId(e.target.value)}
                  disabled={!toClassId || !selectedStudent}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <option value="">Select Section</option>
                  {targetSections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason (Optional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={!selectedStudent}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  placeholder="Enter reason for transfer..."
                />
              </div>

              {/* Transfer Preview */}
              {selectedStudent && toClassId && toSectionId && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex-1">
                      <p className="text-gray-600 dark:text-gray-400">From</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedStudent.currentClass?.name || 'N/A'} -{' '}
                        {selectedStudent.currentSection?.name || 'N/A'}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div className="flex-1">
                      <p className="text-gray-600 dark:text-gray-400">To</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {targetClass?.name} - {targetSections.find((s) => s.id === toSectionId)?.name}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Warning */}
              {selectedStudent &&
                toClassId &&
                toSectionId &&
                selectedStudent.currentClassId === toClassId &&
                selectedStudent.currentSectionId === toSectionId && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Student is already in this class and section
                    </p>
                  </div>
                )}

              {/* Submit Button */}
              <button
                onClick={handleTransfer}
                disabled={!selectedStudent || !toClassId || !toSectionId || isLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ArrowRightLeft className="h-5 w-5" />
                )}
                Transfer Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          {/* Filter */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Filter by student ID..."
                value={historyStudentId}
                onChange={(e) => setHistoryStudentId(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : transfers.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No transfer history found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      From
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Transferred By
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {transfers.map((transfer) => (
                    <tr key={transfer.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {transfer.student?.firstName} {transfer.student?.lastName}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {transfer.student?.admissionNo}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900 dark:text-white">
                          {transfer.fromClass?.name} - {transfer.fromSection?.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900 dark:text-white">
                          {transfer.toClass?.name} - {transfer.toSection?.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-600 dark:text-gray-400 text-sm truncate max-w-xs">
                          {transfer.reason || '-'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="h-4 w-4" />
                          {new Date(transfer.effectiveDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600 dark:text-gray-400">
                          {transfer.transferredBy?.email || '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
