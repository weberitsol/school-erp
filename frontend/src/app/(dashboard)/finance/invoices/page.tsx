'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Plus,
  Search,
  Eye,
  Download,
  Trash2,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  MoreVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { financeApi, FeeInvoice, InvoiceStats } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type PageMode = 'list' | 'generate' | 'details';

interface GenerateInvoiceFormData {
  studentId: string;
  feeStructureIds: string[];
  discount: string;
  dueDate: string;
  bulkGenerate: boolean;
  classId: string;
}

const statusBadgeColor = {
  PENDING: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  PAID: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  PARTIAL: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  OVERDUE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

const statusColors = {
  PENDING: 'text-blue-600 dark:text-blue-400',
  PAID: 'text-green-600 dark:text-green-400',
  PARTIAL: 'text-yellow-600 dark:text-yellow-400',
  OVERDUE: 'text-red-600 dark:text-red-400',
  CANCELLED: 'text-gray-600 dark:text-gray-400',
};

const initialFormData: GenerateInvoiceFormData = {
  studentId: '',
  feeStructureIds: [],
  discount: '',
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  bulkGenerate: false,
  classId: '',
};

export default function InvoicesPage() {
  const { accessToken } = useAuthStore();
  const { toast } = useToast();

  const [mode, setMode] = useState<PageMode>('list');
  const [isLoading, setIsLoading] = useState(false);
  const [invoices, setInvoices] = useState<FeeInvoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [formData, setFormData] = useState<GenerateInvoiceFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedInvoice, setSelectedInvoice] = useState<FeeInvoice | null>(null);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const fetchInvoiceStats = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await financeApi.getInvoiceStats(accessToken);
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (error) {
      console.error('Error fetching invoice stats:', error);
    }
  }, [accessToken]);

  const fetchInvoices = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const res = await financeApi.getInvoices(accessToken, {
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        limit: 10,
      });

      if (res.success && res.data) {
        setInvoices(res.data);
        setTotal(res.total || 0);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch invoices',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, searchTerm, statusFilter, dateFrom, dateTo, page, toast]);

  useEffect(() => {
    if (mode === 'list') {
      fetchInvoices();
      fetchInvoiceStats();
    }
  }, [mode, fetchInvoices, fetchInvoiceStats]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (formData.bulkGenerate) {
      if (!formData.classId) errors.classId = 'Class is required for bulk generation';
    } else {
      if (!formData.studentId) errors.studentId = 'Student is required';
      if (formData.feeStructureIds.length === 0) {
        errors.feeStructureIds = 'At least one fee structure is required';
      }
    }
    if (!formData.dueDate) errors.dueDate = 'Due date is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (formData.bulkGenerate) {
        const res = await financeApi.bulkGenerateInvoices(accessToken, {
          classId: formData.classId,
          dueDate: formData.dueDate,
          discount: formData.discount ? parseFloat(formData.discount) : 0,
        });

        if (res.success) {
          toast({
            title: 'Success',
            description: 'Invoices generated successfully',
          });
        }
      } else {
        const res = await financeApi.generateInvoice(accessToken, {
          studentId: formData.studentId,
          feeStructureIds: formData.feeStructureIds,
          dueDate: formData.dueDate,
          discount: formData.discount ? parseFloat(formData.discount) : 0,
        });

        if (res.success) {
          toast({
            title: 'Success',
            description: 'Invoice generated successfully',
          });
        }
      }

      setFormData(initialFormData);
      setFormErrors({});
      setMode('list');
      setPage(0);
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate invoice',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (invoice: FeeInvoice) => {
    setSelectedInvoice(invoice);
    setMode('details');
  };

  const handleDownloadPDF = async (invoiceId: string) => {
    if (!accessToken) return;
    try {
      await financeApi.downloadInvoicePDF(invoiceId, accessToken);
      toast({
        title: 'Success',
        description: 'Invoice downloaded successfully',
      });
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to download invoice',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const res = await financeApi.updateInvoiceStatus(invoiceId, accessToken, {
        status: 'PAID',
      });

      if (res.success) {
        toast({
          title: 'Success',
          description: 'Invoice marked as paid',
        });
        fetchInvoices();
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to update invoice',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setOpenMenuId(null);
    }
  };

  const handleCancelInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to cancel this invoice?')) return;
    if (!accessToken) return;

    setIsLoading(true);
    try {
      const res = await financeApi.cancelInvoice(invoiceId, accessToken);

      if (res.success) {
        toast({
          title: 'Success',
          description: 'Invoice cancelled successfully',
        });
        fetchInvoices();
      }
    } catch (error) {
      console.error('Error cancelling invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel invoice',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setOpenMenuId(null);
    }
  };

  // LIST MODE
  if (mode === 'list') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Invoices</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Generate and manage fee invoices
            </p>
          </div>
          <button
            onClick={() => {
              setFormData(initialFormData);
              setFormErrors({});
              setMode('generate');
            }}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors',
              'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
            )}
          >
            <Plus className="h-5 w-5" />
            Generate Invoice
          </button>
        </div>

        {/* Summary Stats */}
        {stats && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div
              className={cn(
                'rounded-lg p-6 border',
                'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              )}
            >
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Invoices</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                {Number(stats.totalInvoices || 0)}
              </p>
            </div>

            <div
              className={cn(
                'rounded-lg p-6 border',
                'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              )}
            >
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Amount Invoiced</p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                ₹{Number(stats.totalInvoiced || 0).toFixed(2)}
              </p>
            </div>

            <div
              className={cn(
                'rounded-lg p-6 border',
                'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              )}
            >
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Amount Collected</p>
              <p className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
                ₹{Number(stats.totalPaid || 0).toFixed(2)}
              </p>
            </div>

            <div
              className={cn(
                'rounded-lg p-6 border',
                'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              )}
            >
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Outstanding</p>
              <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
                ₹{Number(stats.outstanding || 0).toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className={cn('rounded-lg p-4 space-y-4', 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700')}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by student or invoice #"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(0);
                }}
                className={cn(
                  'w-full pl-10 pr-4 py-2 rounded-lg border transition-colors',
                  'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600',
                  'text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500'
                )}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              className={cn(
                'rounded-lg border px-4 py-2 transition-colors',
                'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600',
                'text-gray-900 dark:text-white',
                'focus:outline-none focus:ring-2 focus:ring-blue-500'
              )}
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="PARTIAL">Partial</option>
              <option value="OVERDUE">Overdue</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(0);
              }}
              className={cn(
                'rounded-lg border px-4 py-2 transition-colors',
                'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600',
                'text-gray-900 dark:text-white',
                'focus:outline-none focus:ring-2 focus:ring-blue-500'
              )}
            />

            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(0);
              }}
              className={cn(
                'rounded-lg border px-4 py-2 transition-colors',
                'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600',
                'text-gray-900 dark:text-white',
                'focus:outline-none focus:ring-2 focus:ring-blue-500'
              )}
            />
          </div>
        </div>

        {/* Table */}
        <div
          className={cn(
            'rounded-lg border overflow-hidden',
            'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          )}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={cn('border-b', 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700')}>
                  <th className={cn('px-6 py-3 text-left text-sm font-medium', 'text-gray-700 dark:text-gray-300')}>
                    Invoice #
                  </th>
                  <th className={cn('px-6 py-3 text-left text-sm font-medium', 'text-gray-700 dark:text-gray-300')}>
                    Student
                  </th>
                  <th className={cn('px-6 py-3 text-left text-sm font-medium', 'text-gray-700 dark:text-gray-300')}>
                    Total Amount
                  </th>
                  <th className={cn('px-6 py-3 text-left text-sm font-medium', 'text-gray-700 dark:text-gray-300')}>
                    Due Date
                  </th>
                  <th className={cn('px-6 py-3 text-left text-sm font-medium', 'text-gray-700 dark:text-gray-300')}>
                    Status
                  </th>
                  <th className={cn('px-6 py-3 text-left text-sm font-medium', 'text-gray-700 dark:text-gray-300')}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Loader2 className="inline h-6 w-6 animate-spin text-gray-400" />
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <FileText className="inline h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-gray-500 dark:text-gray-400 mt-2">No invoices found</p>
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className={cn('px-6 py-4 text-sm font-medium', 'text-gray-900 dark:text-white')}>
                        {invoice.invoiceNo}
                      </td>
                      <td className={cn('px-6 py-4 text-sm', 'text-gray-600 dark:text-gray-400')}>
                        {/* Student name would come from API response */}
                        Student
                      </td>
                      <td className={cn('px-6 py-4 text-sm font-medium', 'text-gray-900 dark:text-white')}>
                        ₹{invoice.totalAmount.toFixed(2)}
                      </td>
                      <td className={cn('px-6 py-4 text-sm', 'text-gray-600 dark:text-gray-400')}>
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
                            statusBadgeColor[invoice.status as keyof typeof statusBadgeColor] ||
                              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          )}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetails(invoice)}
                            className={cn(
                              'p-2 rounded-lg transition-colors',
                              'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                            )}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(invoice.id)}
                            className={cn(
                              'p-2 rounded-lg transition-colors',
                              'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                            )}
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <div className="relative">
                            <button
                              onClick={() =>
                                setOpenMenuId(openMenuId === invoice.id ? null : invoice.id)
                              }
                              className={cn(
                                'p-2 rounded-lg transition-colors',
                                'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                              )}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            {openMenuId === invoice.id && (
                              <div
                                className={cn(
                                  'absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-10',
                                  'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
                                )}
                              >
                                <button
                                  onClick={() => handleMarkAsPaid(invoice.id)}
                                  className={cn(
                                    'block w-full text-left px-4 py-2 text-sm',
                                    'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                                  )}
                                >
                                  Mark as Paid
                                </button>
                                <button
                                  onClick={() => handleCancelInvoice(invoice.id)}
                                  className={cn(
                                    'block w-full text-left px-4 py-2 text-sm',
                                    'text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                                  )}
                                >
                                  Cancel Invoice
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > 10 && (
            <div className={cn('flex items-center justify-between px-6 py-4 border-t', 'border-gray-200 dark:border-gray-700')}>
              <p className={cn('text-sm', 'text-gray-600 dark:text-gray-400')}>
                Showing {Math.min(page * 10 + 1, total)} to {Math.min((page + 1) * 10, total)} of {total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className={cn(
                    'px-4 py-2 rounded-lg font-medium transition-colors',
                    page === 0
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  )}
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={(page + 1) * 10 >= total}
                  className={cn(
                    'px-4 py-2 rounded-lg font-medium transition-colors',
                    (page + 1) * 10 >= total
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  )}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // GENERATE INVOICE MODE
  if (mode === 'generate') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Generate Invoice</h1>
          <button
            onClick={() => setMode('list')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div
          className={cn(
            'rounded-lg p-8 border',
            'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          )}
        >
          <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
            {/* Generation Type Toggle */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!formData.bulkGenerate}
                  onChange={() => setFormData({ ...formData, bulkGenerate: false })}
                  className="w-4 h-4"
                />
                <span className={cn('text-sm font-medium', 'text-gray-700 dark:text-gray-300')}>
                  Generate for Single Student
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={formData.bulkGenerate}
                  onChange={() => setFormData({ ...formData, bulkGenerate: true })}
                  className="w-4 h-4"
                />
                <span className={cn('text-sm font-medium', 'text-gray-700 dark:text-gray-300')}>
                  Bulk Generate for Class
                </span>
              </label>
            </div>

            {/* Single Student Form */}
            {!formData.bulkGenerate && (
              <>
                {/* Student Selection */}
                <div>
                  <label className={cn('block text-sm font-medium mb-2', 'text-gray-700 dark:text-gray-300')}>
                    Student <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Search and select student"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className={cn(
                      'w-full rounded-lg border px-4 py-2 transition-colors',
                      'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600',
                      'text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500',
                      formErrors.studentId && 'ring-2 ring-red-500'
                    )}
                  />
                  {formErrors.studentId && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.studentId}</p>
                  )}
                </div>

                {/* Fee Structures Selection */}
                <div>
                  <label className={cn('block text-sm font-medium mb-2', 'text-gray-700 dark:text-gray-300')}>
                    Fee Structures <span className="text-red-500">*</span>
                  </label>
                  <div className={cn('rounded-lg border p-4', 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600')}>
                    <div className="space-y-2">
                      {/* Fee structure checkboxes would be populated from API */}
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="w-4 h-4" />
                        <span className={cn('text-sm', 'text-gray-700 dark:text-gray-300')}>
                          Fee Structure Name
                        </span>
                      </label>
                    </div>
                  </div>
                  {formErrors.feeStructureIds && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.feeStructureIds}</p>
                  )}
                </div>
              </>
            )}

            {/* Bulk Generate Form */}
            {formData.bulkGenerate && (
              <div>
                <label className={cn('block text-sm font-medium mb-2', 'text-gray-700 dark:text-gray-300')}>
                  Class <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                  className={cn(
                    'w-full rounded-lg border px-4 py-2 transition-colors',
                    'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600',
                    'text-gray-900 dark:text-white',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500',
                    formErrors.classId && 'ring-2 ring-red-500'
                  )}
                >
                  <option value="">Select class</option>
                  {/* Class options would be populated from API */}
                </select>
                {formErrors.classId && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.classId}</p>
                )}
              </div>
            )}

            {/* Discount */}
            <div>
              <label className={cn('block text-sm font-medium mb-2', 'text-gray-700 dark:text-gray-300')}>
                Discount (Optional)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                className={cn(
                  'w-full rounded-lg border px-4 py-2 transition-colors',
                  'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600',
                  'text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500'
                )}
              />
            </div>

            {/* Due Date */}
            <div>
              <label className={cn('block text-sm font-medium mb-2', 'text-gray-700 dark:text-gray-300')}>
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className={cn(
                  'w-full rounded-lg border px-4 py-2 transition-colors',
                  'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600',
                  'text-gray-900 dark:text-white',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  formErrors.dueDate && 'ring-2 ring-red-500'
                )}
              />
              {formErrors.dueDate && (
                <p className="mt-1 text-sm text-red-500">{formErrors.dueDate}</p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors',
                  isLoading
                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
                )}
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Generate Invoice
              </button>
              <button
                type="button"
                onClick={() => setMode('list')}
                className={cn(
                  'flex-1 rounded-lg px-4 py-2 font-medium transition-colors',
                  'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
                )}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // DETAILS MODE
  if (mode === 'details' && selectedInvoice) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Invoice Details</h1>
          <button
            onClick={() => {
              setSelectedInvoice(null);
              setMode('list');
            }}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div
          className={cn(
            'rounded-lg p-8 border',
            'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          )}
        >
          <div className="space-y-8">
            {/* Invoice Header */}
            <div className="flex items-start justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <p className={cn('text-sm', 'text-gray-600 dark:text-gray-400')}>Invoice Number</p>
                <p className={cn('text-2xl font-bold mt-1', 'text-gray-900 dark:text-white')}>
                  {selectedInvoice.invoiceNo}
                </p>
              </div>
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-4 py-2 text-sm font-medium',
                  statusBadgeColor[selectedInvoice.status as keyof typeof statusBadgeColor]
                )}
              >
                {selectedInvoice.status}
              </span>
            </div>

            {/* Invoice Details */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className={cn('text-sm font-medium mb-4', 'text-gray-700 dark:text-gray-300')}>
                  Invoice Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className={cn('text-xs', 'text-gray-600 dark:text-gray-400')}>Created Date</p>
                    <p className={cn('text-sm font-medium', 'text-gray-900 dark:text-white')}>
                      {new Date(selectedInvoice.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className={cn('text-xs', 'text-gray-600 dark:text-gray-400')}>Due Date</p>
                    <p className={cn('text-sm font-medium', 'text-gray-900 dark:text-white')}>
                      {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className={cn('text-sm font-medium mb-4', 'text-gray-700 dark:text-gray-300')}>
                  Amount Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <p className={cn('text-xs', 'text-gray-600 dark:text-gray-400')}>Subtotal</p>
                    <p className={cn('text-sm font-medium', 'text-gray-900 dark:text-white')}>
                      ₹{selectedInvoice.subtotal.toFixed(2)}
                    </p>
                  </div>
                  {selectedInvoice.discount > 0 && (
                    <div className="flex justify-between">
                      <p className={cn('text-xs', 'text-gray-600 dark:text-gray-400')}>Discount</p>
                      <p className={cn('text-sm font-medium', 'text-gray-900 dark:text-white')}>
                        -₹{selectedInvoice.discount.toFixed(2)}
                      </p>
                    </div>
                  )}
                  {selectedInvoice.tax > 0 && (
                    <div className="flex justify-between">
                      <p className={cn('text-xs', 'text-gray-600 dark:text-gray-400')}>Tax</p>
                      <p className={cn('text-sm font-medium', 'text-gray-900 dark:text-white')}>
                        ₹{selectedInvoice.tax.toFixed(2)}
                      </p>
                    </div>
                  )}
                  <div className={cn('border-t pt-2', 'border-gray-200 dark:border-gray-700')}>
                    <div className="flex justify-between">
                      <p className={cn('text-sm font-bold', 'text-gray-900 dark:text-white')}>Total Amount</p>
                      <p className={cn('text-lg font-bold', 'text-blue-600 dark:text-blue-400')}>
                        ₹{selectedInvoice.totalAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items */}
            {selectedInvoice.lineItems && selectedInvoice.lineItems.length > 0 && (
              <div>
                <h3 className={cn('text-sm font-medium mb-4', 'text-gray-700 dark:text-gray-300')}>
                  Line Items
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={cn('border-b', 'border-gray-200 dark:border-gray-700')}>
                        <th className={cn('text-left py-2 px-3', 'text-gray-700 dark:text-gray-300')}>Description</th>
                        <th className={cn('text-center py-2 px-3', 'text-gray-700 dark:text-gray-300')}>Qty</th>
                        <th className={cn('text-right py-2 px-3', 'text-gray-700 dark:text-gray-300')}>Unit Price</th>
                        <th className={cn('text-right py-2 px-3', 'text-gray-700 dark:text-gray-300')}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.lineItems.map((item) => (
                        <tr key={item.id} className={cn('border-b', 'border-gray-200 dark:border-gray-700')}>
                          <td className={cn('py-2 px-3', 'text-gray-900 dark:text-white')}>{item.description}</td>
                          <td className={cn('text-center py-2 px-3', 'text-gray-900 dark:text-white')}>{item.quantity}</td>
                          <td className={cn('text-right py-2 px-3', 'text-gray-900 dark:text-white')}>
                            ₹{item.unitPrice.toFixed(2)}
                          </td>
                          <td className={cn('text-right py-2 px-3', 'text-gray-900 dark:text-white')}>
                            ₹{item.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className={cn('border-t pt-6', 'border-gray-200 dark:border-gray-700')}>
              <div className="flex gap-4">
                <button
                  onClick={() => handleDownloadPDF(selectedInvoice.id)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors',
                    'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
                  )}
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </button>
                {selectedInvoice.status !== 'PAID' && (
                  <button
                    onClick={() => handleMarkAsPaid(selectedInvoice.id)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors',
                      'bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800'
                    )}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Mark as Paid
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedInvoice(null);
                    setMode('list');
                  }}
                  className={cn(
                    'flex-1 rounded-lg px-4 py-2 font-medium transition-colors',
                    'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
                  )}
                >
                  Back to Invoices
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
