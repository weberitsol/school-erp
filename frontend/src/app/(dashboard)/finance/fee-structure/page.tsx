'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Loader2,
  Copy,
  Download,
  Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { financeApi, FeeStructure } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type PageMode = 'list' | 'add' | 'edit';

interface FeeFormData {
  name: string;
  description: string;
  academicYearId: string;
  classId: string;
  amount: string;
  frequency: string;
  dueDay: string;
  lateFee: string;
  lateFeeAfterDays: string;
  isActive: boolean;
}

const initialFormData: FeeFormData = {
  name: '',
  description: '',
  academicYearId: '',
  classId: '',
  amount: '',
  frequency: 'Monthly',
  dueDay: '10',
  lateFee: '0',
  lateFeeAfterDays: '10',
  isActive: true,
};

const frequencyOptions = [
  { value: 'One-time', label: 'One-time' },
  { value: 'Monthly', label: 'Monthly' },
  { value: 'Quarterly', label: 'Quarterly' },
  { value: 'Annually', label: 'Annually' },
];

export default function FeeStructurePage() {
  const { accessToken } = useAuthStore();
  const { toast } = useToast();

  const [mode, setMode] = useState<PageMode>('list');
  const [isLoading, setIsLoading] = useState(false);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [formData, setFormData] = useState<FeeFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedFee, setSelectedFee] = useState<FeeStructure | null>(null);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  // Fetch fee structures
  const fetchFeeStructures = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const res = await financeApi.getFeeStructures(accessToken, {
        search: searchTerm || undefined,
        classId: classFilter || undefined,
        page,
        limit: 10,
      });
      if (res.success && res.data) {
        setFeeStructures(res.data.data || []);
        setTotal(res.data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching fee structures:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch fee structures',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, searchTerm, classFilter, page, toast]);

  useEffect(() => {
    if (mode === 'list') {
      fetchFeeStructures();
    }
  }, [mode, fetchFeeStructures]);

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.academicYearId) errors.academicYearId = 'Academic year is required';
    if (!formData.amount || parseFloat(formData.amount) <= 0) errors.amount = 'Valid amount is required';
    if (!formData.frequency) errors.frequency = 'Frequency is required';

    if (formData.frequency !== 'One-time' && (!formData.dueDay || parseInt(formData.dueDay) < 1 || parseInt(formData.dueDay) > 31)) {
      errors.dueDay = 'Valid due day is required (1-31)';
    }

    if (formData.lateFee && parseFloat(formData.lateFee) < 0) errors.lateFee = 'Late fee cannot be negative';
    if (formData.lateFeeAfterDays && parseInt(formData.lateFeeAfterDays) < 0) errors.lateFeeAfterDays = 'Grace period cannot be negative';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const submitData = {
        name: formData.name,
        description: formData.description || undefined,
        amount: parseFloat(formData.amount),
        frequency: formData.frequency,
        dueDay: formData.frequency !== 'One-time' ? parseInt(formData.dueDay) : undefined,
        lateFee: formData.lateFee ? parseFloat(formData.lateFee) : 0,
        lateFeeAfterDays: formData.lateFeeAfterDays ? parseInt(formData.lateFeeAfterDays) : 10,
        academicYearId: formData.academicYearId,
        classId: formData.classId || undefined,
        isActive: formData.isActive,
      };

      if (mode === 'add') {
        const res = await financeApi.createFeeStructure(accessToken, submitData);
        if (res.success) {
          toast({ title: 'Success', description: 'Fee structure created successfully' });
          setFormData(initialFormData);
          setMode('list');
          setPage(0);
        } else {
          toast({ title: 'Error', description: res.error || 'Failed to create fee structure', variant: 'destructive' });
        }
      } else if (mode === 'edit' && selectedFee) {
        const res = await financeApi.updateFeeStructure(selectedFee.id, accessToken, submitData);
        if (res.success) {
          toast({ title: 'Success', description: 'Fee structure updated successfully' });
          setSelectedFee(null);
          setFormData(initialFormData);
          setMode('list');
        } else {
          toast({ title: 'Error', description: res.error || 'Failed to update fee structure', variant: 'destructive' });
        }
      }
    } catch (error) {
      console.error('Error saving fee structure:', error);
      toast({ title: 'Error', description: 'Failed to save fee structure', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (fee: FeeStructure) => {
    if (!accessToken) return;
    if (!confirm(`Are you sure you want to delete "${fee.name}"?`)) return;

    setIsLoading(true);
    try {
      const res = await financeApi.deleteFeeStructure(fee.id, accessToken);
      if (res.success) {
        toast({ title: 'Success', description: 'Fee structure deleted successfully' });
        fetchFeeStructures();
      } else {
        toast({ title: 'Error', description: res.error || 'Failed to delete fee structure', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error deleting fee structure:', error);
      toast({ title: 'Error', description: 'Failed to delete fee structure', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle edit click
  const handleEdit = (fee: FeeStructure) => {
    setSelectedFee(fee);
    setFormData({
      name: fee.name,
      description: fee.description || '',
      academicYearId: fee.academicYearId,
      classId: fee.classId || '',
      amount: fee.amount.toString(),
      frequency: fee.frequency,
      dueDay: fee.dueDay?.toString() || '10',
      lateFee: fee.lateFee?.toString() || '0',
      lateFeeAfterDays: fee.lateFeeAfterDays?.toString() || '10',
      isActive: fee.isActive,
    });
    setFormErrors({});
    setMode('edit');
  };

  // Filter fees locally for instant search
  const filteredFees = feeStructures.filter((f) =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.description && f.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(total / 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign className="h-7 w-7 text-green-600" />
            Fee Structures
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage student fee structures and payment configurations</p>
        </div>
        {mode === 'list' && (
          <button
            onClick={() => {
              setFormData(initialFormData);
              setFormErrors({});
              setMode('add');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Add Fee Structure
          </button>
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
                  placeholder="Search by name or description..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(0);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          {/* Fee Structures Table */}
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              </div>
            ) : filteredFees.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No fee structures found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Amount</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Frequency</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Due Day</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Late Fee</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900 dark:text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFees.map((fee) => (
                    <tr key={fee.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{fee.name}</p>
                          {fee.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{fee.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900 dark:text-white">₹{fee.amount.toFixed(2)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full">
                          {fee.frequency}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-700 dark:text-gray-300">
                          {fee.frequency === 'One-time' ? '-' : `${fee.dueDay || '-'}`}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-700 dark:text-gray-300">
                          ₹{(fee.lateFee || 0).toFixed(2)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          'px-2 py-1 text-xs rounded-full font-medium',
                          fee.isActive
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                        )}>
                          {fee.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEdit(fee)}
                            className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(fee)}
                            className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
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
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing page {page + 1} of {totalPages} ({total} total)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page === totalPages - 1}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Form */}
      {(mode === 'add' || mode === 'edit') && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {mode === 'add' ? 'Add New Fee Structure' : 'Edit Fee Structure'}
            </h2>
            <button
              onClick={() => {
                setMode('list');
                setSelectedFee(null);
                setFormData(initialFormData);
                setFormErrors({});
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fee Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={cn(
                    'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500',
                    formErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  )}
                  placeholder="e.g., Tuition Fee, Transport Fee"
                />
                {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className={cn(
                    'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500',
                    formErrors.amount ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  )}
                  placeholder="0.00"
                />
                {formErrors.amount && <p className="text-red-500 text-sm mt-1">{formErrors.amount}</p>}
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Frequency <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className={cn(
                    'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500',
                    formErrors.frequency ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  )}
                >
                  {frequencyOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {formErrors.frequency && <p className="text-red-500 text-sm mt-1">{formErrors.frequency}</p>}
              </div>

              {/* Due Day */}
              {formData.frequency !== 'One-time' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Due Day of Month <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.dueDay}
                    onChange={(e) => setFormData({ ...formData, dueDay: e.target.value })}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500',
                      formErrors.dueDay ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    )}
                    placeholder="1-31"
                  />
                  {formErrors.dueDay && <p className="text-red-500 text-sm mt-1">{formErrors.dueDay}</p>}
                </div>
              )}

              {/* Late Fee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Late Fee (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.lateFee}
                  onChange={(e) => setFormData({ ...formData, lateFee: e.target.value })}
                  className={cn(
                    'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500',
                    formErrors.lateFee ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  )}
                  placeholder="0.00"
                />
                {formErrors.lateFee && <p className="text-red-500 text-sm mt-1">{formErrors.lateFee}</p>}
              </div>

              {/* Late Fee Grace Period */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Grace Period (days)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.lateFeeAfterDays}
                  onChange={(e) => setFormData({ ...formData, lateFeeAfterDays: e.target.value })}
                  className={cn(
                    'w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500',
                    formErrors.lateFeeAfterDays ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  )}
                  placeholder="10"
                />
                {formErrors.lateFeeAfterDays && <p className="text-red-500 text-sm mt-1">{formErrors.lateFeeAfterDays}</p>}
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                  placeholder="Additional details about this fee..."
                  rows={3}
                />
              </div>

              {/* Status Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      formData.isActive ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        formData.isActive ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                  <span className={cn(
                    'text-sm font-medium',
                    formData.isActive ? 'text-green-600' : 'text-gray-500'
                  )}>
                    {formData.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                    Saving...
                  </>
                ) : (
                  mode === 'add' ? 'Create Fee Structure' : 'Update Fee Structure'
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('list');
                  setSelectedFee(null);
                  setFormData(initialFormData);
                  setFormErrors({});
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
