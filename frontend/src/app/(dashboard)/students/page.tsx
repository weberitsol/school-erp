'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserPlus,
  Upload,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  X,
  Loader2,
  Trash2,
  Edit,
  Eye,
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import {
  studentsApi,
  classesApi,
  Student,
  CreateStudentData,
  StudentFilters,
  ImportPreviewResult,
  ImportPreviewRow,
  Category,
  PwDType,
} from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { GenerateReportCardDialog, GenerateCertificateDialog } from '@/components/modals';

type PageMode = 'list' | 'add' | 'edit' | 'view' | 'import';

interface ClassOption {
  id: string;
  name: string;
  code: string;
  sections: { id: string; name: string }[];
}

export default function StudentsPage() {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();
  const { toast } = useToast();

  const [mode, setMode] = useState<PageMode>('list');
  const [isLoading, setIsLoading] = useState(false);

  // List state
  const [students, setStudents] = useState<Student[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState<StudentFilters>({ page: 1, limit: 10, isActive: true });
  const [searchTerm, setSearchTerm] = useState('');
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');

  // Add form state
  const [formData, setFormData] = useState<CreateStudentData>({
    admissionNo: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    dateOfBirth: '',
    gender: 'MALE',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showNeetJeeFields, setShowNeetJeeFields] = useState(false);

  // Import state
  const [importFile, setImportFile] = useState<File | null>(null);

  // Generate document states
  const [showReportCardDialog, setShowReportCardDialog] = useState(false);
  const [showCertificateDialog, setShowCertificateDialog] = useState(false);
  const [selectedStudentForGeneration, setSelectedStudentForGeneration] = useState<Student | null>(null);
  const [previewData, setPreviewData] = useState<ImportPreviewResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: string[];
    failed: { row: number; admissionNo: string; errors: string[] }[];
  } | null>(null);

  // View/Edit state
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<CreateStudentData>>({});

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  // Fetch classes for dropdowns
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

  // Fetch students
  const fetchStudents = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const params: StudentFilters = {
        ...filters,
        search: searchTerm || undefined,
        classId: selectedClassId || undefined,
        sectionId: selectedSectionId || undefined,
      };
      const res = await studentsApi.getAll(accessToken, params);
      if (res.success && res.data) {
        // Handle both { students: [], pagination: {} } and direct array response
        const studentsData = res.data.students || res.data || [];
        const paginationData = res.data.pagination || { page: 1, limit: 10, total: studentsData.length, totalPages: 1 };
        setStudents(Array.isArray(studentsData) ? studentsData : []);
        setPagination(paginationData);
      } else {
        setStudents([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
      toast({
        title: 'Error',
        description: 'Failed to fetch students',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, filters, searchTerm, selectedClassId, selectedSectionId, toast]);

  useEffect(() => {
    if (mode === 'list') {
      fetchStudents();
    }
  }, [mode, fetchStudents]);

  // Get sections for selected class
  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const sections = selectedClass?.sections || [];

  // Handle search
  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, page: 1, search: searchTerm }));
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  // Handle form submit for single add
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    // Validate
    const errors: Record<string, string> = {};
    if (!formData.admissionNo) errors.admissionNo = 'Required';
    if (!formData.firstName) errors.firstName = 'Required';
    if (!formData.lastName) errors.lastName = 'Required';
    if (!formData.email) errors.email = 'Required';
    if (!formData.password) errors.password = 'Required';
    if (!formData.dateOfBirth) errors.dateOfBirth = 'Required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      const res = await studentsApi.create(formData, accessToken);
      if (res.success) {
        toast({
          title: 'Success',
          description: 'Student added successfully',
        });
        setFormData({
          admissionNo: '',
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          dateOfBirth: '',
          gender: 'MALE',
        });
        setFormErrors({});
        setMode('list');
      } else {
        toast({
          title: 'Error',
          description: res.error || 'Failed to add student',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add student',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file drop
  const handleFileDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) {
        await handleFileSelect(file);
      }
    },
    [accessToken]
  );

  const handleFileSelect = async (file: File) => {
    if (!accessToken) return;

    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    const validExts = ['.csv', '.xlsx', '.xls'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
      toast({
        title: 'Invalid file',
        description: 'Please upload a CSV or Excel file',
        variant: 'destructive',
      });
      return;
    }

    setImportFile(file);
    setPreviewData(null);
    setImportResult(null);
    setIsLoading(true);

    try {
      const res = await studentsApi.previewImport(file, accessToken);
      if (res.success && res.data) {
        setPreviewData(res.data);
      } else {
        toast({
          title: 'Error',
          description: res.error || 'Failed to preview file',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to preview file',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle import
  const handleImport = async () => {
    if (!accessToken || !importFile) return;

    setIsImporting(true);
    try {
      const res = await studentsApi.importStudents(importFile, accessToken);
      if (res.success && res.data) {
        setImportResult({
          success: res.data.success,
          failed: res.data.failed,
        });
        toast({
          title: 'Import Complete',
          description: res.message || `${res.data.summary.imported} students imported`,
        });
      } else {
        toast({
          title: 'Import Failed',
          description: res.error || 'Failed to import students',
          variant: 'destructive',
        });
        if (res.data) {
          setImportResult({
            success: res.data.success || [],
            failed: res.data.failed || [],
          });
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to import students',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Download template
  const handleDownloadTemplate = async (format: 'csv' | 'xlsx') => {
    if (!accessToken) return;

    try {
      const blob = await studentsApi.downloadTemplate(format, accessToken);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `students_template.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download template',
        variant: 'destructive',
      });
    }
  };

  // Delete student
  const handleDelete = async (id: string) => {
    if (!accessToken || !confirm('Are you sure you want to delete this student?')) return;

    try {
      const res = await studentsApi.delete(id, accessToken);
      if (res.success) {
        toast({ title: 'Success', description: 'Student deleted successfully' });
        fetchStudents();
      } else {
        toast({ title: 'Error', description: res.error || 'Failed to delete', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete student', variant: 'destructive' });
    }
  };

  // View student
  const handleView = async (student: Student) => {
    setSelectedStudent(student);
    setMode('view');
  };

  // Edit student
  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setEditFormData({
      admissionNo: student.admissionNo,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.user?.email || '',
      dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '',
      gender: student.gender,
      rollNo: student.rollNo || '',
      phone: student.phone || '',
      address: student.address || '',
      city: student.city || '',
      state: student.state || '',
      pincode: student.pincode || '',
      bloodGroup: student.bloodGroup || '',
      currentClassId: student.currentClass?.id || '',
      currentSectionId: student.currentSection?.id || '',
      // NEET/JEE fields
      category: student.category || undefined,
      subCategory: student.subCategory || '',
      isCreamyLayer: student.isCreamyLayer || false,
      domicileState: student.domicileState || '',
      isDomicile: student.isDomicile || false,
      domicileCertNo: student.domicileCertNo || '',
      nationality: student.nationality || 'Indian',
      pwdType: student.pwdType || 'NONE',
      pwdPercentage: student.pwdPercentage || undefined,
      pwdCertNo: student.pwdCertNo || '',
      annualFamilyIncome: student.annualFamilyIncome || undefined,
      isEWS: student.isEWS || false,
      ewsCertNo: student.ewsCertNo || '',
      isDefenseQuota: student.isDefenseQuota || false,
      isKashmiriMigrant: student.isKashmiriMigrant || false,
      isSingleGirl: student.isSingleGirl || false,
      aadharNo: student.aadharNo || '',
      fatherOccupation: student.fatherOccupation || '',
      motherOccupation: student.motherOccupation || '',
    });
    setShowNeetJeeFields(!!student.category || !!student.domicileState || !!student.pwdType);
    setMode('edit');
  };

  // Update student
  const handleUpdate = async () => {
    if (!accessToken || !selectedStudent) return;

    // Validate required fields
    const errors: Record<string, string> = {};
    if (!editFormData.firstName) errors.firstName = 'First name is required';
    if (!editFormData.lastName) errors.lastName = 'Last name is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      const updateData: any = { ...editFormData };
      delete updateData.admissionNo; // Can't update admission number
      delete updateData.email; // Email update might need separate handling
      delete updateData.password;

      const res = await studentsApi.update(selectedStudent.id, updateData, accessToken);
      if (res.success) {
        toast({ title: 'Success', description: 'Student updated successfully' });
        setMode('list');
        setSelectedStudent(null);
        fetchStudents();
      } else {
        toast({ title: 'Error', description: res.error || 'Failed to update student', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update student', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Generate Report Card
  const handleGenerateReportCard = (student: Student) => {
    setSelectedStudentForGeneration(student);
    setShowReportCardDialog(true);
  };

  // Generate Certificate
  const handleGenerateCertificate = (student: Student) => {
    setSelectedStudentForGeneration(student);
    setShowCertificateDialog(true);
  };

  // Reset import state
  const resetImport = () => {
    setImportFile(null);
    setPreviewData(null);
    setImportResult(null);
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">You do not have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Students</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage student records and data
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMode('list')}
            className={cn(
              'px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors',
              mode === 'list'
                ? 'bg-violet-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            <Users className="h-4 w-4" />
            List
          </button>
          <button
            onClick={() => setMode('add')}
            className={cn(
              'px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors',
              mode === 'add'
                ? 'bg-violet-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            <UserPlus className="h-4 w-4" />
            Add Student
          </button>
          <button
            onClick={() => setMode('import')}
            className={cn(
              'px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors',
              mode === 'import'
                ? 'bg-violet-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            <Upload className="h-4 w-4" />
            Import
          </button>
        </div>
      </div>

      {/* List Mode */}
      {mode === 'list' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or admission no..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>
              <div className="w-48">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Class
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => {
                    setSelectedClassId(e.target.value);
                    setSelectedSectionId('');
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Classes</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-48">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Section
                </label>
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  disabled={!selectedClassId}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                >
                  <option value="">All Sections</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Apply
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
              </div>
            ) : !students || students.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No students found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Admission No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Gender
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-medium text-sm">
                            {student.firstName?.[0] || ''}{student.lastName?.[0] || ''}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {student.firstName} {student.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{student.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {student.admissionNo}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {student.currentClass?.name || '-'}
                        {student.currentSection && ` (${student.currentSection.name})`}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {student.gender}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'px-2 py-1 rounded-full text-xs font-medium',
                            student.isActive
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          )}
                        >
                          {student.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleView(student)}
                            className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg text-gray-500 hover:text-blue-600"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(student)}
                            className="p-2 hover:bg-violet-100 dark:hover:bg-violet-900/30 rounded-lg text-gray-500 hover:text-violet-600"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleGenerateReportCard(student)}
                            className="p-2 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg text-gray-500 hover:text-amber-600"
                            title="Generate Report Card"
                          >
                            <FileSpreadsheet className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleGenerateCertificate(student)}
                            className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg text-gray-500 hover:text-green-600"
                            title="Generate Certificate"
                          >
                            <GraduationCap className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(student.id)}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-gray-500 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Mode */}
      {mode === 'add' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Add New Student</h2>
          <form onSubmit={handleAddStudent} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Admission No */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Admission No <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.admissionNo}
                  onChange={(e) => setFormData({ ...formData, admissionNo: e.target.value })}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                    formErrors.admissionNo
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  )}
                />
                {formErrors.admissionNo && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.admissionNo}</p>
                )}
              </div>

              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                    formErrors.firstName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  )}
                />
                {formErrors.firstName && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.firstName}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                    formErrors.lastName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  )}
                />
                {formErrors.lastName && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.lastName}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                    formErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  )}
                />
                {formErrors.email && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                    formErrors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  )}
                />
                {formErrors.password && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>
                )}
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
                    formErrors.dateOfBirth ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  )}
                />
                {formErrors.dateOfBirth && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.dateOfBirth}</p>
                )}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value as 'MALE' | 'FEMALE' | 'OTHER' })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {/* Class */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Class
                </label>
                <select
                  value={formData.currentClassId || ''}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      currentClassId: e.target.value || undefined,
                      currentSectionId: undefined,
                    });
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select Class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Section
                </label>
                <select
                  value={formData.currentSectionId || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, currentSectionId: e.target.value || undefined })
                  }
                  disabled={!formData.currentClassId}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                >
                  <option value="">Select Section</option>
                  {(classes
                    .find((c) => c.id === formData.currentClassId)
                    ?.sections || []).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Roll No */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Roll No
                </label>
                <input
                  type="text"
                  value={formData.rollNo || ''}
                  onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Blood Group */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Blood Group
                </label>
                <select
                  value={formData.bloodGroup || ''}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>

            {/* Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={formData.state || ''}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* NEET/JEE Eligibility Fields - Collapsible Section */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowNeetJeeFields(!showNeetJeeFields)}
                className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 hover:from-orange-100 hover:to-amber-100 dark:hover:from-orange-900/30 dark:hover:to-amber-900/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-5 w-5 text-orange-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">NEET/JEE College Prediction Details</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Optional - Required for college admission predictions</p>
                  </div>
                </div>
                <ChevronDown className={cn("h-5 w-5 text-gray-500 transition-transform", showNeetJeeFields && "rotate-180")} />
              </button>

              {showNeetJeeFields && (
                <div className="p-6 space-y-6 bg-white dark:bg-gray-800">
                  {/* Category & Reservation */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Category & Reservation</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                        <select
                          value={formData.category || ''}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value as Category || undefined })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="">Select Category</option>
                          <option value="GENERAL">General</option>
                          <option value="OBC_NCL">OBC (Non-Creamy Layer)</option>
                          <option value="OBC_CL">OBC (Creamy Layer)</option>
                          <option value="SC">SC (Scheduled Caste)</option>
                          <option value="ST">ST (Scheduled Tribe)</option>
                          <option value="EWS">EWS (Economically Weaker Section)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sub-Category</label>
                        <input
                          type="text"
                          placeholder="e.g., Maratha, Jat, etc."
                          value={formData.subCategory || ''}
                          onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Creamy Layer?</label>
                        <select
                          value={formData.isCreamyLayer === undefined ? '' : formData.isCreamyLayer ? 'true' : 'false'}
                          onChange={(e) => setFormData({ ...formData, isCreamyLayer: e.target.value === '' ? undefined : e.target.value === 'true' })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="">Not Applicable</option>
                          <option value="false">No (Eligible for OBC benefits)</option>
                          <option value="true">Yes (Not eligible for OBC benefits)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nationality</label>
                        <select
                          value={formData.nationality || 'Indian'}
                          onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="Indian">Indian</option>
                          <option value="NRI">NRI</option>
                          <option value="OCI">OCI</option>
                          <option value="PIO">PIO</option>
                          <option value="Foreign">Foreign National</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Domicile Information */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Domicile Information (for State Quota)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Domicile State</label>
                        <input
                          type="text"
                          placeholder="State of permanent residence"
                          value={formData.domicileState || ''}
                          onChange={(e) => setFormData({ ...formData, domicileState: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Has Domicile Certificate?</label>
                        <select
                          value={formData.isDomicile ? 'true' : 'false'}
                          onChange={(e) => setFormData({ ...formData, isDomicile: e.target.value === 'true' })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="false">No</option>
                          <option value="true">Yes</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Domicile Certificate No.</label>
                        <input
                          type="text"
                          value={formData.domicileCertNo || ''}
                          onChange={(e) => setFormData({ ...formData, domicileCertNo: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* PwD Information */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Person with Disability (PwD)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PwD Type</label>
                        <select
                          value={formData.pwdType || 'NONE'}
                          onChange={(e) => setFormData({ ...formData, pwdType: e.target.value as PwDType })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="NONE">None / Not Applicable</option>
                          <option value="LOCOMOTOR">Locomotor Disability</option>
                          <option value="VISUAL">Visual Impairment</option>
                          <option value="HEARING">Hearing Impairment</option>
                          <option value="SPEECH">Speech Impairment</option>
                          <option value="INTELLECTUAL">Intellectual Disability</option>
                          <option value="MENTAL_ILLNESS">Mental Illness</option>
                          <option value="AUTISM">Autism Spectrum</option>
                          <option value="SPECIFIC_LEARNING">Specific Learning Disability</option>
                          <option value="CEREBRAL_PALSY">Cerebral Palsy</option>
                          <option value="MULTIPLE">Multiple Disabilities</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Disability % (40-100)</label>
                        <input
                          type="number"
                          min="40"
                          max="100"
                          value={formData.pwdPercentage || ''}
                          onChange={(e) => setFormData({ ...formData, pwdPercentage: e.target.value ? parseInt(e.target.value) : undefined })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PwD Certificate No.</label>
                        <input
                          type="text"
                          value={formData.pwdCertNo || ''}
                          onChange={(e) => setFormData({ ...formData, pwdCertNo: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Economic Status */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Economic Status (for EWS)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Annual Family Income (INR)</label>
                        <input
                          type="number"
                          placeholder="e.g., 500000"
                          value={formData.annualFamilyIncome || ''}
                          onChange={(e) => setFormData({ ...formData, annualFamilyIncome: e.target.value ? parseFloat(e.target.value) : undefined })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">EWS Certificate?</label>
                        <select
                          value={formData.isEWS ? 'true' : 'false'}
                          onChange={(e) => setFormData({ ...formData, isEWS: e.target.value === 'true' })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="false">No</option>
                          <option value="true">Yes</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">EWS Certificate No.</label>
                        <input
                          type="text"
                          value={formData.ewsCertNo || ''}
                          onChange={(e) => setFormData({ ...formData, ewsCertNo: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Quotas & Documents */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Additional Quotas & Documents</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Defense Quota?</label>
                        <select
                          value={formData.isDefenseQuota ? 'true' : 'false'}
                          onChange={(e) => setFormData({ ...formData, isDefenseQuota: e.target.value === 'true' })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="false">No</option>
                          <option value="true">Yes</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">J&K Migrant?</label>
                        <select
                          value={formData.isKashmiriMigrant ? 'true' : 'false'}
                          onChange={(e) => setFormData({ ...formData, isKashmiriMigrant: e.target.value === 'true' })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="false">No</option>
                          <option value="true">Yes</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Single Girl Child?</label>
                        <select
                          value={formData.isSingleGirl ? 'true' : 'false'}
                          onChange={(e) => setFormData({ ...formData, isSingleGirl: e.target.value === 'true' })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="false">No</option>
                          <option value="true">Yes</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Aadhar Number</label>
                        <input
                          type="text"
                          maxLength={12}
                          placeholder="12-digit Aadhar"
                          value={formData.aadharNo || ''}
                          onChange={(e) => setFormData({ ...formData, aadharNo: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Parent Occupation */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Parent Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Father&apos;s Occupation</label>
                        <input
                          type="text"
                          value={formData.fatherOccupation || ''}
                          onChange={(e) => setFormData({ ...formData, fatherOccupation: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mother&apos;s Occupation</label>
                        <input
                          type="text"
                          value={formData.motherOccupation || ''}
                          onChange={(e) => setFormData({ ...formData, motherOccupation: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setMode('list')}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Add Student
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Import Mode */}
      {mode === 'import' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Area */}
          <div className="lg:col-span-2 space-y-6">
            {!importFile ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 border-dashed border-gray-300 dark:border-gray-600 p-12 text-center hover:border-violet-500 transition-colors cursor-pointer"
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                />
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Drop your file here
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  or click to browse (CSV, Excel)
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{importFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(importFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={resetImport}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                {isLoading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                    <span className="ml-2 text-gray-600 dark:text-gray-400">Processing file...</span>
                  </div>
                )}

                {previewData && (
                  <div className="space-y-4">
                    {/* Summary */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {previewData.totalRows}
                        </p>
                        <p className="text-sm text-gray-500">Total Rows</p>
                      </div>
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{previewData.validRows}</p>
                        <p className="text-sm text-green-600">Valid</p>
                      </div>
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-red-600">{previewData.invalidRows}</p>
                        <p className="text-sm text-red-600">Invalid</p>
                      </div>
                    </div>

                    {/* Preview Table */}
                    <div className="max-h-96 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left">Row</th>
                            <th className="px-4 py-2 text-left">Admission No</th>
                            <th className="px-4 py-2 text-left">Name</th>
                            <th className="px-4 py-2 text-left">Email</th>
                            <th className="px-4 py-2 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {previewData.data.slice(0, 50).map((row) => (
                            <tr
                              key={row.row}
                              className={cn(
                                row.isValid
                                  ? 'bg-white dark:bg-gray-800'
                                  : 'bg-red-50 dark:bg-red-900/10'
                              )}
                            >
                              <td className="px-4 py-2">{row.row}</td>
                              <td className="px-4 py-2">{row.data.admissionNo || '-'}</td>
                              <td className="px-4 py-2">
                                {row.data.firstName} {row.data.lastName}
                              </td>
                              <td className="px-4 py-2">{row.data.email || '-'}</td>
                              <td className="px-4 py-2">
                                {row.isValid ? (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <AlertCircle className="h-5 w-5 text-red-500" />
                                    <span className="text-xs text-red-600 truncate max-w-[200px]">
                                      {row.errors[0]}
                                    </span>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Import Button */}
                    <div className="flex justify-end gap-4">
                      <button
                        onClick={resetImport}
                        className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleImport}
                        disabled={isImporting || previewData.validRows === 0}
                        className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        {isImporting && <Loader2 className="h-4 w-4 animate-spin" />}
                        Import {previewData.validRows} Students
                      </button>
                    </div>
                  </div>
                )}

                {/* Import Result */}
                {importResult && (
                  <div className="mt-6 space-y-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="font-medium text-green-700 dark:text-green-400">
                        {importResult.success.length} students imported successfully
                      </p>
                    </div>
                    {importResult.failed.length > 0 && (
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <p className="font-medium text-red-700 dark:text-red-400 mb-2">
                          {importResult.failed.length} students failed to import:
                        </p>
                        <ul className="text-sm text-red-600 space-y-1">
                          {importResult.failed.slice(0, 10).map((f, i) => (
                            <li key={i}>
                              Row {f.row}: {f.admissionNo} - {f.errors.join(', ')}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        resetImport();
                        setMode('list');
                        fetchStudents();
                      }}
                      className="w-full px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
                    >
                      View Students
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Download Template */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Download Template</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Use our template to ensure your data is formatted correctly.
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => handleDownloadTemplate('csv')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  CSV Template
                </button>
                <button
                  onClick={() => handleDownloadTemplate('xlsx')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Excel Template
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Instructions</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-violet-600 font-bold">1.</span>
                  Download the template file
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-600 font-bold">2.</span>
                  Fill in student data (required: admissionNo, firstName, lastName, email, dateOfBirth, gender)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-600 font-bold">3.</span>
                  Date format: YYYY-MM-DD
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-600 font-bold">4.</span>
                  Gender: MALE, FEMALE, or OTHER
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-600 font-bold">5.</span>
                  Password is auto-generated if not provided
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-600 font-bold">6.</span>
                  Upload and review before importing
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* View Mode */}
      {mode === 'view' && selectedStudent && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Student Details
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(selectedStudent)}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={() => {
                  setSelectedStudent(null);
                  setMode('list');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Back to List
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Basic Information
              </h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                  {selectedStudent.firstName?.[0]}{selectedStudent.lastName?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-lg">
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{selectedStudent.user?.email}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">Admission No:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedStudent.admissionNo}</span></p>
                <p><span className="text-gray-500">Roll No:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedStudent.rollNo || '-'}</span></p>
                <p><span className="text-gray-500">Gender:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedStudent.gender}</span></p>
                <p><span className="text-gray-500">Date of Birth:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedStudent.dateOfBirth ? new Date(selectedStudent.dateOfBirth).toLocaleDateString() : '-'}</span></p>
                <p><span className="text-gray-500">Blood Group:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedStudent.bloodGroup || '-'}</span></p>
                <p><span className="text-gray-500">Phone:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedStudent.phone || '-'}</span></p>
              </div>
            </div>

            {/* Academic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Academic Information
              </h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">Class:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedStudent.currentClass?.name || '-'}</span></p>
                <p><span className="text-gray-500">Section:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedStudent.currentSection?.name || '-'}</span></p>
                <p><span className="text-gray-500">Status:</span> <span className={cn('px-2 py-1 rounded-full text-xs font-medium', selectedStudent.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>{selectedStudent.isActive ? 'Active' : 'Inactive'}</span></p>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Address
              </h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">Address:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedStudent.address || '-'}</span></p>
                <p><span className="text-gray-500">City:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedStudent.city || '-'}</span></p>
                <p><span className="text-gray-500">State:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedStudent.state || '-'}</span></p>
                <p><span className="text-gray-500">Pincode:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedStudent.pincode || '-'}</span></p>
              </div>
            </div>

            {/* NEET/JEE Information */}
            {(selectedStudent.category || selectedStudent.domicileState || selectedStudent.pwdType !== 'NONE') && (
              <div className="space-y-4 md:col-span-2 lg:col-span-3">
                <h3 className="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  NEET/JEE Eligibility Details
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <p><span className="text-gray-500">Category:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedStudent.category || '-'}</span></p>
                  <p><span className="text-gray-500">Domicile State:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedStudent.domicileState || '-'}</span></p>
                  <p><span className="text-gray-500">Is Domicile:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedStudent.isDomicile ? 'Yes' : 'No'}</span></p>
                  <p><span className="text-gray-500">Nationality:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedStudent.nationality || '-'}</span></p>
                  <p><span className="text-gray-500">PwD Type:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedStudent.pwdType || '-'}</span></p>
                  <p><span className="text-gray-500">PwD %:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedStudent.pwdPercentage || '-'}</span></p>
                  <p><span className="text-gray-500">EWS:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedStudent.isEWS ? 'Yes' : 'No'}</span></p>
                  <p><span className="text-gray-500">Annual Income:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedStudent.annualFamilyIncome || '-'}</span></p>
                  <p><span className="text-gray-500">Defense Quota:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedStudent.isDefenseQuota ? 'Yes' : 'No'}</span></p>
                  <p><span className="text-gray-500">Kashmiri Migrant:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedStudent.isKashmiriMigrant ? 'Yes' : 'No'}</span></p>
                  <p><span className="text-gray-500">Single Girl:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedStudent.isSingleGirl ? 'Yes' : 'No'}</span></p>
                  <p><span className="text-gray-500">Aadhar No:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedStudent.aadharNo || '-'}</span></p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Mode */}
      {mode === 'edit' && selectedStudent && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Edit Student: {selectedStudent.firstName} {selectedStudent.lastName}
            </h2>
            <button
              onClick={() => {
                setSelectedStudent(null);
                setEditFormData({});
                setMode('list');
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>

          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Admission No <span className="text-gray-400">(Read Only)</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.admissionNo || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={editFormData.firstName || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                    className={cn(
                      'w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white',
                      formErrors.firstName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                  />
                  {formErrors.firstName && <p className="text-red-500 text-xs mt-1">{formErrors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={editFormData.lastName || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                    className={cn(
                      'w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white',
                      formErrors.lastName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                  />
                  {formErrors.lastName && <p className="text-red-500 text-xs mt-1">{formErrors.lastName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email <span className="text-gray-400">(Read Only)</span>
                  </label>
                  <input
                    type="email"
                    value={editFormData.email || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Roll No
                  </label>
                  <input
                    type="text"
                    value={editFormData.rollNo || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, rollNo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={editFormData.dateOfBirth || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Gender
                  </label>
                  <select
                    value={editFormData.gender || 'MALE'}
                    onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value as 'MALE' | 'FEMALE' | 'OTHER' })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Blood Group
                  </label>
                  <select
                    value={editFormData.bloodGroup || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Academic Info */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Academic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Class
                  </label>
                  <select
                    value={editFormData.currentClassId || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, currentClassId: e.target.value, currentSectionId: '' })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Class</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Section
                  </label>
                  <select
                    value={editFormData.currentSectionId || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, currentSectionId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    disabled={!editFormData.currentClassId}
                  >
                    <option value="">Select Section</option>
                    {(classes.find(c => c.id === editFormData.currentClassId)?.sections || []).map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Address Info */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={editFormData.address || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={editFormData.city || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={editFormData.state || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={editFormData.pincode || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, pincode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* NEET/JEE Fields Toggle */}
            <div>
              <button
                type="button"
                onClick={() => setShowNeetJeeFields(!showNeetJeeFields)}
                className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium"
              >
                <ChevronDown className={cn('h-5 w-5 transition-transform', showNeetJeeFields && 'rotate-180')} />
                {showNeetJeeFields ? 'Hide' : 'Show'} NEET/JEE College Prediction Details
              </button>
            </div>

            {showNeetJeeFields && (
              <div className="border-l-4 border-orange-400 pl-4 space-y-4 bg-orange-50 dark:bg-orange-900/10 p-4 rounded-r-lg">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">NEET/JEE Eligibility Details</h3>

                {/* Category & Reservation */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                    <select
                      value={editFormData.category || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value as Category || undefined })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select</option>
                      <option value="GENERAL">General</option>
                      <option value="OBC_NCL">OBC (Non-Creamy Layer)</option>
                      <option value="OBC_CL">OBC (Creamy Layer)</option>
                      <option value="SC">SC</option>
                      <option value="ST">ST</option>
                      <option value="EWS">EWS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sub-Category</label>
                    <input
                      type="text"
                      value={editFormData.subCategory || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, subCategory: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nationality</label>
                    <input
                      type="text"
                      value={editFormData.nationality || 'Indian'}
                      onChange={(e) => setEditFormData({ ...editFormData, nationality: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                {/* Domicile */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Domicile State</label>
                    <input
                      type="text"
                      value={editFormData.domicileState || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, domicileState: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      checked={editFormData.isDomicile || false}
                      onChange={(e) => setEditFormData({ ...editFormData, isDomicile: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <label className="text-sm text-gray-700 dark:text-gray-300">Has Domicile Certificate</label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Domicile Cert No</label>
                    <input
                      type="text"
                      value={editFormData.domicileCertNo || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, domicileCertNo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                {/* PwD */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PwD Type</label>
                    <select
                      value={editFormData.pwdType || 'NONE'}
                      onChange={(e) => setEditFormData({ ...editFormData, pwdType: e.target.value as PwDType })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    >
                      <option value="NONE">None</option>
                      <option value="LOCOMOTOR">Locomotor</option>
                      <option value="VISUAL">Visual</option>
                      <option value="HEARING">Hearing</option>
                      <option value="SPEECH">Speech</option>
                      <option value="INTELLECTUAL">Intellectual</option>
                      <option value="MENTAL">Mental</option>
                      <option value="MULTIPLE">Multiple</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PwD Percentage</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editFormData.pwdPercentage || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, pwdPercentage: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PwD Cert No</label>
                    <input
                      type="text"
                      value={editFormData.pwdCertNo || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, pwdCertNo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                {/* Economic & Quotas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Annual Family Income</label>
                    <input
                      type="number"
                      value={editFormData.annualFamilyIncome || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, annualFamilyIncome: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Aadhar No</label>
                    <input
                      type="text"
                      value={editFormData.aadharNo || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, aadharNo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                {/* Checkbox Quotas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editFormData.isEWS || false}
                      onChange={(e) => setEditFormData({ ...editFormData, isEWS: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">EWS</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editFormData.isDefenseQuota || false}
                      onChange={(e) => setEditFormData({ ...editFormData, isDefenseQuota: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Defense Quota</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editFormData.isKashmiriMigrant || false}
                      onChange={(e) => setEditFormData({ ...editFormData, isKashmiriMigrant: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Kashmiri Migrant</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editFormData.isSingleGirl || false}
                      onChange={(e) => setEditFormData({ ...editFormData, isSingleGirl: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Single Girl Child</span>
                  </label>
                </div>

                {/* Parent Occupation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Father's Occupation</label>
                    <input
                      type="text"
                      value={editFormData.fatherOccupation || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, fatherOccupation: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mother's Occupation</label>
                    <input
                      type="text"
                      value={editFormData.motherOccupation || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, motherOccupation: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setSelectedStudent(null);
                  setEditFormData({});
                  setMode('list');
                }}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={isLoading}
                className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Student'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Report Card Dialog */}
      {showReportCardDialog && selectedStudentForGeneration && (
        <GenerateReportCardDialog
          studentId={selectedStudentForGeneration.id}
          studentName={`${selectedStudentForGeneration.firstName} ${selectedStudentForGeneration.lastName}`}
          onClose={() => setShowReportCardDialog(false)}
          onSuccess={() => {
            toast({
              title: 'Success',
              description: 'Report card generated successfully!',
            });
            setShowReportCardDialog(false);
          }}
        />
      )}

      {/* Generate Certificate Dialog */}
      {showCertificateDialog && selectedStudentForGeneration && (
        <GenerateCertificateDialog
          studentId={selectedStudentForGeneration.id}
          studentName={`${selectedStudentForGeneration.firstName} ${selectedStudentForGeneration.lastName}`}
          onClose={() => setShowCertificateDialog(false)}
          onSuccess={() => {
            toast({
              title: 'Success',
              description: 'Certificate generated successfully!',
            });
            setShowCertificateDialog(false);
          }}
        />
      )}
    </div>
  );
}
