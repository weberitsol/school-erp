'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  UserCog,
  Plus,
  Upload,
  Search,
  Edit,
  Trash2,
  X,
  Loader2,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import {
  teachersApi,
  branchesApi,
  Teacher,
  Branch,
  TeacherImportPreviewResult,
} from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type PageMode = 'list' | 'add' | 'edit' | 'view' | 'import';
type Gender = 'MALE' | 'FEMALE' | 'OTHER';

interface TeacherFormData {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
  alternatePhone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  qualification: string;
  specialization: string;
  experience: string;
  branchId: string;
  salary: string;
  bankAccount: string;
  bankName: string;
  ifscCode: string;
}

const initialFormData: TeacherFormData = {
  employeeId: '',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  dateOfBirth: '',
  gender: 'MALE',
  phone: '',
  alternatePhone: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  qualification: '',
  specialization: '',
  experience: '',
  branchId: '',
  salary: '',
  bankAccount: '',
  bankName: '',
  ifscCode: '',
};

export default function TeachersPage() {
  const { user, accessToken } = useAuthStore();
  const { toast } = useToast();

  const [mode, setMode] = useState<PageMode>('list');
  const [isLoading, setIsLoading] = useState(false);

  // List state
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');

  // Form state
  const [formData, setFormData] = useState<TeacherFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  // Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<TeacherImportPreviewResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: string[];
    failed: { employeeId: string; error: string }[];
  } | null>(null);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  // Fetch branches
  useEffect(() => {
    const fetchBranches = async () => {
      if (!accessToken) return;
      try {
        const res = await branchesApi.getAll(accessToken);
        if (res.success && res.data) {
          setBranches(res.data);
        }
      } catch (error) {
        console.error('Error fetching branches:', error);
      }
    };
    fetchBranches();
  }, [accessToken]);

  // Fetch teachers
  const fetchTeachers = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const res = await teachersApi.getAll(accessToken, {
        search: searchTerm || undefined,
        branchId: selectedBranchId || undefined,
        page: pagination.page,
        limit: pagination.limit,
      });
      if (res.success && res.data) {
        setTeachers(res.data.data || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch teachers',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, searchTerm, selectedBranchId, pagination.page, pagination.limit, toast]);

  useEffect(() => {
    if (mode === 'list') {
      fetchTeachers();
    }
  }, [mode, fetchTeachers]);

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    const errors: Record<string, string> = {};
    if (!formData.employeeId.trim()) errors.employeeId = 'Employee ID is required';
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (mode === 'add' && !formData.password) errors.password = 'Password is required';
    if (!formData.phone.trim()) errors.phone = 'Phone is required';
    if (!formData.gender) errors.gender = 'Gender is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      const payload: any = {
        ...formData,
        experience: formData.experience ? parseInt(formData.experience) : undefined,
        salary: formData.salary ? parseFloat(formData.salary) : undefined,
      };

      if (mode === 'add') {
        const res = await teachersApi.create(payload, accessToken);
        if (res.success) {
          toast({ title: 'Success', description: 'Teacher created successfully' });
          setFormData(initialFormData);
          setMode('list');
        } else {
          toast({ title: 'Error', description: res.error || 'Failed to create teacher', variant: 'destructive' });
        }
      } else if (mode === 'edit' && selectedTeacher) {
        // Don't send password if empty
        if (!payload.password) delete payload.password;
        const res = await teachersApi.update(selectedTeacher.id, payload, accessToken);
        if (res.success) {
          toast({ title: 'Success', description: 'Teacher updated successfully' });
          setSelectedTeacher(null);
          setFormData(initialFormData);
          setMode('list');
        } else {
          toast({ title: 'Error', description: res.error || 'Failed to update teacher', variant: 'destructive' });
        }
      }
    } catch (error) {
      console.error('Error saving teacher:', error);
      toast({ title: 'Error', description: 'Failed to save teacher', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (teacher: Teacher) => {
    if (!accessToken) return;
    if (!confirm(`Are you sure you want to delete ${teacher.firstName} ${teacher.lastName}?`)) return;

    setIsLoading(true);
    try {
      const res = await teachersApi.delete(teacher.id, accessToken);
      if (res.success) {
        toast({ title: 'Success', description: 'Teacher deleted successfully' });
        fetchTeachers();
      } else {
        toast({ title: 'Error', description: res.error || 'Failed to delete teacher', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error deleting teacher:', error);
      toast({ title: 'Error', description: 'Failed to delete teacher', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle edit click
  const handleEdit = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      employeeId: teacher.employeeId,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.user?.email || '',
      password: '',
      dateOfBirth: teacher.dateOfBirth ? new Date(teacher.dateOfBirth).toISOString().split('T')[0] : '',
      gender: teacher.gender as Gender,
      phone: teacher.phone,
      alternatePhone: teacher.alternatePhone || '',
      address: teacher.address || '',
      city: teacher.city || '',
      state: teacher.state || '',
      pincode: teacher.pincode || '',
      qualification: teacher.qualification || '',
      specialization: teacher.specialization || '',
      experience: teacher.experience?.toString() || '',
      branchId: teacher.branchId || '',
      salary: teacher.salary?.toString() || '',
      bankAccount: teacher.bankAccount || '',
      bankName: teacher.bankName || '',
      ifscCode: teacher.ifscCode || '',
    });
    setFormErrors({});
    setMode('edit');
  };

  // Handle view click
  const handleView = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setMode('view');
  };

  // Handle file upload for preview
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;

    setImportFile(file);
    setPreviewData(null);
    setImportResult(null);
    setIsImporting(true);

    try {
      const res = await teachersApi.previewImport(file, accessToken);
      if (res.success && res.data) {
        setPreviewData(res.data);
      } else {
        toast({ title: 'Error', description: res.error || 'Failed to preview file', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error previewing file:', error);
      toast({ title: 'Error', description: 'Failed to preview file', variant: 'destructive' });
    } finally {
      setIsImporting(false);
    }
  };

  // Handle import
  const handleImport = async () => {
    if (!importFile || !accessToken) return;

    setIsImporting(true);
    try {
      const res = await teachersApi.importTeachers(importFile, accessToken);
      if (res.success && res.data) {
        setImportResult(res.data);
        toast({
          title: 'Import Complete',
          description: `${res.data.success.length} teachers imported, ${res.data.failed.length} failed`,
        });
        if (res.data.failed.length === 0) {
          setTimeout(() => {
            setMode('list');
            setImportFile(null);
            setPreviewData(null);
            setImportResult(null);
          }, 2000);
        }
      } else {
        toast({ title: 'Error', description: res.error || 'Import failed', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error importing:', error);
      toast({ title: 'Error', description: 'Import failed', variant: 'destructive' });
    } finally {
      setIsImporting(false);
    }
  };

  // Download template
  const handleDownloadTemplate = async (format: 'csv' | 'xlsx') => {
    if (!accessToken) return;
    try {
      const blob = await teachersApi.downloadTemplate(format, accessToken);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `teachers_template.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading template:', error);
      toast({ title: 'Error', description: 'Failed to download template', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UserCog className="h-7 w-7 text-blue-600" />
            Teachers
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage teacher records</p>
        </div>
        {mode === 'list' && isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setFormData(initialFormData);
                setFormErrors({});
                setMode('add');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" />
              Add Teacher
            </button>
            <button
              onClick={() => {
                setImportFile(null);
                setPreviewData(null);
                setImportResult(null);
                setMode('import');
              }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Upload className="h-4 w-4" />
              Bulk Import
            </button>
          </div>
        )}
      </div>

      {/* List View */}
      {mode === 'list' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          {/* Filters */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search teachers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : teachers.length === 0 ? (
              <div className="text-center py-12">
                <UserCog className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No teachers found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Teacher
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Qualification
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Branch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {teachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {teacher.firstName} {teacher.lastName}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{teacher.employeeId}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm space-y-1">
                          <p className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                            <Mail className="h-3 w-3" />
                            {teacher.user?.email}
                          </p>
                          <p className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                            <Phone className="h-3 w-3" />
                            {teacher.phone}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-gray-900 dark:text-white">{teacher.qualification || '-'}</p>
                          {teacher.specialization && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">{teacher.specialization}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {teacher.branch ? (
                          <span className="inline-flex px-2 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                            {teacher.branch.name}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'inline-flex px-2 py-1 text-xs font-medium rounded-full',
                            teacher.isActive
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          )}
                        >
                          {teacher.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleView(teacher)}
                            className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => handleEdit(teacher)}
                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(teacher)}
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.totalPages}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View Mode */}
      {mode === 'view' && selectedTeacher && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Teacher Details</h2>
            <button
              onClick={() => {
                setMode('list');
                setSelectedTeacher(null);
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400">Employee ID</label>
              <p className="font-medium text-gray-900 dark:text-white">{selectedTeacher.employeeId}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400">Full Name</label>
              <p className="font-medium text-gray-900 dark:text-white">
                {selectedTeacher.firstName} {selectedTeacher.lastName}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400">Email</label>
              <p className="font-medium text-gray-900 dark:text-white">{selectedTeacher.user?.email}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400">Phone</label>
              <p className="font-medium text-gray-900 dark:text-white">{selectedTeacher.phone}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400">Gender</label>
              <p className="font-medium text-gray-900 dark:text-white">{selectedTeacher.gender}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400">Date of Birth</label>
              <p className="font-medium text-gray-900 dark:text-white">
                {selectedTeacher.dateOfBirth
                  ? new Date(selectedTeacher.dateOfBirth).toLocaleDateString()
                  : '-'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400">Qualification</label>
              <p className="font-medium text-gray-900 dark:text-white">{selectedTeacher.qualification || '-'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400">Specialization</label>
              <p className="font-medium text-gray-900 dark:text-white">{selectedTeacher.specialization || '-'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400">Experience</label>
              <p className="font-medium text-gray-900 dark:text-white">
                {selectedTeacher.experience ? `${selectedTeacher.experience} years` : '-'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400">Branch</label>
              <p className="font-medium text-gray-900 dark:text-white">{selectedTeacher.branch?.name || '-'}</p>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-gray-500 dark:text-gray-400">Address</label>
              <p className="font-medium text-gray-900 dark:text-white">
                {[selectedTeacher.address, selectedTeacher.city, selectedTeacher.state, selectedTeacher.pincode]
                  .filter(Boolean)
                  .join(', ') || '-'}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => {
                setMode('list');
                setSelectedTeacher(null);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
            {isAdmin && (
              <button
                onClick={() => handleEdit(selectedTeacher)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {(mode === 'add' || mode === 'edit') && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {mode === 'add' ? 'Add New Teacher' : 'Edit Teacher'}
            </h2>
            <button
              onClick={() => {
                setMode('list');
                setSelectedTeacher(null);
                setFormData(initialFormData);
                setFormErrors({});
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Employee ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    disabled={mode === 'edit'}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50',
                      formErrors.employeeId ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500',
                      formErrors.firstName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500',
                      formErrors.lastName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={mode === 'edit'}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50',
                      formErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Password {mode === 'add' && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={mode === 'edit' ? 'Leave blank to keep current' : ''}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500',
                      formErrors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500',
                      formErrors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Branch</label>
                  <select
                    value={formData.branchId}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Branch</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Professional Info */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Professional Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Qualification</label>
                  <input
                    type="text"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., M.Sc., B.Ed."
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Specialization</label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Mathematics, Physics"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Experience (years)</label>
                  <input
                    type="number"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    min={0}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="md:col-span-2 lg:col-span-4">
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setMode('list');
                  setSelectedTeacher(null);
                  setFormData(initialFormData);
                  setFormErrors({});
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === 'add' ? 'Create Teacher' : 'Update Teacher'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Import Mode */}
      {mode === 'import' && (
        <div className="space-y-6">
          {/* Instructions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Bulk Import Teachers</h2>
              <button
                onClick={() => setMode('list')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownloadTemplate('xlsx')}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Download Excel Template
                </button>
                <button
                  onClick={() => handleDownloadTemplate('csv')}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Download CSV Template
                </button>
              </div>

              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8">
                <div className="text-center">
                  <FileSpreadsheet className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <label className="cursor-pointer">
                    <span className="text-blue-600 hover:text-blue-700 font-medium">Click to upload</span>
                    <span className="text-gray-600 dark:text-gray-400"> or drag and drop</span>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">CSV or Excel files up to 10MB</p>
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          {previewData && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preview</h3>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Rows</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{previewData.totalRows}</p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-green-600 dark:text-green-400">Valid Rows</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">{previewData.validRows}</p>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">Invalid Rows</p>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-400">{previewData.invalidRows}</p>
                </div>
              </div>

              <div className="overflow-x-auto max-h-64">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-3 py-2 text-left">Row</th>
                      <th className="px-3 py-2 text-left">Employee ID</th>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Email</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.data.slice(0, 20).map((row, i) => (
                      <tr key={i} className={cn(row.isValid ? '' : 'bg-red-50 dark:bg-red-900/10')}>
                        <td className="px-3 py-2">{row.row}</td>
                        <td className="px-3 py-2">{row.data.employeeId}</td>
                        <td className="px-3 py-2">{row.data.firstName} {row.data.lastName}</td>
                        <td className="px-3 py-2">{row.data.email}</td>
                        <td className="px-3 py-2">
                          {row.isValid ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <div className="flex items-center gap-1 text-red-500">
                              <AlertCircle className="h-4 w-4" />
                              <span className="text-xs">{row.errors[0]}</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setImportFile(null);
                    setPreviewData(null);
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={isImporting || previewData.validRows === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isImporting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Import {previewData.validRows} Teachers
                </button>
              </div>
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Import Result</h3>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-green-600 dark:text-green-400">Successfully Imported</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                    {importResult.success.length}
                  </p>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">Failed</p>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                    {importResult.failed.length}
                  </p>
                </div>
              </div>

              {importResult.failed.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Failed Imports</h4>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 space-y-2 max-h-40 overflow-y-auto">
                    {importResult.failed.map((f, i) => (
                      <div key={i} className="text-sm text-red-700 dark:text-red-400">
                        <span className="font-medium">{f.employeeId}:</span> {f.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setMode('list');
                  setImportFile(null);
                  setPreviewData(null);
                  setImportResult(null);
                }}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Done
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
