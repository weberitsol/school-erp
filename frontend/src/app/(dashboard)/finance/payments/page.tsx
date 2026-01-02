'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  Plus,
  Search,
  Eye,
  Download,
  Loader2,
  X,
  Calendar,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { financeApi, FeePayment, PaymentReport } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type PageMode = 'list' | 'record' | 'details';

interface PaymentFormData {
  studentId: string;
  feeStructureId: string;
  amount: string;
  paymentMethod: string;
  transactionId: string;
  paymentDate: string;
  discount: string;
}

interface SummaryStats {
  totalCollected: number;
  pendingDues: number;
  overdueAmount: number;
  paymentCount: number;
}

const paymentMethodOptions = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CARD', label: 'Card' },
  { value: 'UPI', label: 'UPI' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'ONLINE', label: 'Online' },
];

const statusBadgeColor = {
  PAID: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  PARTIAL: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  OVERDUE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const initialFormData: PaymentFormData = {
  studentId: '',
  feeStructureId: '',
  amount: '',
  paymentMethod: 'CASH',
  transactionId: '',
  paymentDate: new Date().toISOString().split('T')[0],
  discount: '',
};

export default function PaymentsPage() {
  const { accessToken } = useAuthStore();
  const { toast } = useToast();

  const [mode, setMode] = useState<PageMode>('list');
  const [isLoading, setIsLoading] = useState(false);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [paymentReport, setPaymentReport] = useState<PaymentReport | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [formData, setFormData] = useState<PaymentFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedPayment, setSelectedPayment] = useState<FeePayment | null>(null);
  const [stats, setStats] = useState<SummaryStats>({
    totalCollected: 0,
    pendingDues: 0,
    overdueAmount: 0,
    paymentCount: 0,
  });
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState<'list' | 'pending' | 'overdue'>('list');

  const fetchPaymentReport = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const res = await financeApi.getPaymentReport(accessToken, {
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });

      if (res.success && res.data) {
        setPaymentReport(res.data);
        setStats({
          totalCollected: res.data.summary?.totalCollected || 0,
          paymentCount: res.data.summary?.paymentCount || 0,
          pendingDues: 0,
          overdueAmount: 0,
        });
      }
    } catch (error) {
      console.error('Error fetching payment report:', error);
    }
  }, [accessToken, dateFrom, dateTo]);

  const fetchPayments = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const res = await financeApi.getPayments(accessToken, {
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        method: methodFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        limit: 10,
      });

      if (res.success && res.data) {
        setPayments(res.data);
        setTotal(res.total || 0);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch payments',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, searchTerm, statusFilter, methodFilter, dateFrom, dateTo, page, toast]);

  const fetchPendingDues = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const res = await financeApi.getPendingDues(accessToken);
      if (res.success && res.data) {
        setPayments(res.data);
        setTotal(res.data.length);
      }
    } catch (error) {
      console.error('Error fetching pending dues:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch pending dues',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, toast]);

  useEffect(() => {
    if (mode === 'list') {
      if (activeTab === 'list') {
        fetchPayments();
        fetchPaymentReport();
      } else if (activeTab === 'pending') {
        fetchPendingDues();
      }
    }
  }, [mode, activeTab, fetchPayments, fetchPaymentReport, fetchPendingDues]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.studentId) errors.studentId = 'Student is required';
    if (!formData.feeStructureId) errors.feeStructureId = 'Fee structure is required';
    if (!formData.amount || parseFloat(formData.amount) <= 0) errors.amount = 'Valid amount is required';
    if (!formData.paymentMethod) errors.paymentMethod = 'Payment method is required';
    if (!formData.paymentDate) errors.paymentDate = 'Payment date is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const submitData = {
        studentId: formData.studentId,
        feeStructureId: formData.feeStructureId,
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
        transactionId: formData.transactionId || undefined,
        paymentDate: formData.paymentDate,
        discount: formData.discount ? parseFloat(formData.discount) : 0,
      };

      const res = await financeApi.recordPayment(accessToken, submitData);
      if (res.success) {
        toast({
          title: 'Success',
          description: 'Payment recorded successfully',
        });
        setFormData(initialFormData);
        setFormErrors({});
        setMode('list');
        setActiveTab('list');
        setPage(0);
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to record payment',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (payment: FeePayment) => {
    setSelectedPayment(payment);
    setMode('details');
  };

  const handleDownloadReceipt = async (paymentId: string) => {
    if (!accessToken) return;
    try {
      await financeApi.downloadReceiptPDF(paymentId, accessToken);
      toast({
        title: 'Success',
        description: 'Receipt downloaded successfully',
      });
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast({
        title: 'Error',
        description: 'Failed to download receipt',
        variant: 'destructive',
      });
    }
  };

  // LIST MODE
  if (mode === 'list') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payments</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Manage fee payments and track payment status
            </p>
          </div>
          <button
            onClick={() => {
              setFormData(initialFormData);
              setFormErrors({});
              setMode('record');
            }}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors',
              'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
            )}
          >
            <Plus className="h-5 w-5" />
            Record Payment
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div
            className={cn(
              'rounded-lg p-6 border',
              'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Collected</p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  ₹{stats.totalCollected.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div
            className={cn(
              'rounded-lg p-6 border',
              'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Dues</p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  ₹{stats.pendingDues.toFixed(2)}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div
            className={cn(
              'rounded-lg p-6 border',
              'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue Amount</p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  ₹{stats.overdueAmount.toFixed(2)}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <div
            className={cn(
              'rounded-lg p-6 border',
              'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Payments Count</p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.paymentCount}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={cn('flex gap-4 border-b', 'border-gray-200 dark:border-gray-700')}>
          {['list', 'pending', 'overdue'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab as 'list' | 'pending' | 'overdue');
                setPage(0);
              }}
              className={cn(
                'px-4 py-2 font-medium transition-colors border-b-2',
                activeTab === tab
                  ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400'
              )}
            >
              {tab === 'list' && 'All Payments'}
              {tab === 'pending' && 'Pending Dues'}
              {tab === 'overdue' && 'Overdue'}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className={cn('rounded-lg p-4 space-y-4', 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700')}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by student name or receipt #"
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
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="PARTIAL">Partial</option>
              <option value="OVERDUE">Overdue</option>
            </select>

            <select
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value);
                setPage(0);
              }}
              className={cn(
                'rounded-lg border px-4 py-2 transition-colors',
                'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600',
                'text-gray-900 dark:text-white',
                'focus:outline-none focus:ring-2 focus:ring-blue-500'
              )}
            >
              <option value="">All Methods</option>
              {paymentMethodOptions.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(0);
                }}
                className={cn(
                  'flex-1 rounded-lg border px-4 py-2 transition-colors',
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
                  'flex-1 rounded-lg border px-4 py-2 transition-colors',
                  'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600',
                  'text-gray-900 dark:text-white',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500'
                )}
              />
            </div>
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
                    Receipt #
                  </th>
                  <th className={cn('px-6 py-3 text-left text-sm font-medium', 'text-gray-700 dark:text-gray-300')}>
                    Student
                  </th>
                  <th className={cn('px-6 py-3 text-left text-sm font-medium', 'text-gray-700 dark:text-gray-300')}>
                    Fee Type
                  </th>
                  <th className={cn('px-6 py-3 text-left text-sm font-medium', 'text-gray-700 dark:text-gray-300')}>
                    Amount
                  </th>
                  <th className={cn('px-6 py-3 text-left text-sm font-medium', 'text-gray-700 dark:text-gray-300')}>
                    Date
                  </th>
                  <th className={cn('px-6 py-3 text-left text-sm font-medium', 'text-gray-700 dark:text-gray-300')}>
                    Method
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
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <Loader2 className="inline h-6 w-6 animate-spin text-gray-400" />
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <p className="text-gray-500 dark:text-gray-400">No payments found</p>
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className={cn('px-6 py-4 text-sm font-medium', 'text-gray-900 dark:text-white')}>
                        {payment.receiptNo}
                      </td>
                      <td className={cn('px-6 py-4 text-sm', 'text-gray-600 dark:text-gray-400')}>
                        {/* Student name would come from API response */}
                        Student
                      </td>
                      <td className={cn('px-6 py-4 text-sm', 'text-gray-600 dark:text-gray-400')}>
                        {/* Fee structure name would come from API response */}
                        Fee
                      </td>
                      <td className={cn('px-6 py-4 text-sm font-medium', 'text-gray-900 dark:text-white')}>
                        ₹{Number(payment.totalAmount || 0).toFixed(2)}
                      </td>
                      <td className={cn('px-6 py-4 text-sm', 'text-gray-600 dark:text-gray-400')}>
                        {payment.paymentDate
                          ? new Date(payment.paymentDate).toLocaleDateString()
                          : 'N/A'}
                      </td>
                      <td className={cn('px-6 py-4 text-sm', 'text-gray-600 dark:text-gray-400')}>
                        {payment.paymentMethod || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
                            statusBadgeColor[payment.paymentStatus as keyof typeof statusBadgeColor] ||
                              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          )}
                        >
                          {payment.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetails(payment)}
                            className={cn(
                              'p-2 rounded-lg transition-colors',
                              'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                            )}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadReceipt(payment.id)}
                            className={cn(
                              'p-2 rounded-lg transition-colors',
                              'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                            )}
                            title="Download Receipt"
                          >
                            <Download className="h-4 w-4" />
                          </button>
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

  // RECORD PAYMENT MODE
  if (mode === 'record') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Record Payment</h1>
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

            {/* Fee Structure Selection */}
            <div>
              <label className={cn('block text-sm font-medium mb-2', 'text-gray-700 dark:text-gray-300')}>
                Fee Structure <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.feeStructureId}
                onChange={(e) => setFormData({ ...formData, feeStructureId: e.target.value })}
                className={cn(
                  'w-full rounded-lg border px-4 py-2 transition-colors',
                  'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600',
                  'text-gray-900 dark:text-white',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  formErrors.feeStructureId && 'ring-2 ring-red-500'
                )}
              >
                <option value="">Select fee structure</option>
                {/* Options would be populated from API */}
              </select>
              {formErrors.feeStructureId && (
                <p className="mt-1 text-sm text-red-500">{formErrors.feeStructureId}</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className={cn('block text-sm font-medium mb-2', 'text-gray-700 dark:text-gray-300')}>
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className={cn(
                  'w-full rounded-lg border px-4 py-2 transition-colors',
                  'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600',
                  'text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  formErrors.amount && 'ring-2 ring-red-500'
                )}
              />
              {formErrors.amount && <p className="mt-1 text-sm text-red-500">{formErrors.amount}</p>}
            </div>

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

            {/* Payment Method */}
            <div>
              <label className={cn('block text-sm font-medium mb-2', 'text-gray-700 dark:text-gray-300')}>
                Payment Method <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className={cn(
                  'w-full rounded-lg border px-4 py-2 transition-colors',
                  'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600',
                  'text-gray-900 dark:text-white',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  formErrors.paymentMethod && 'ring-2 ring-red-500'
                )}
              >
                {paymentMethodOptions.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
              {formErrors.paymentMethod && (
                <p className="mt-1 text-sm text-red-500">{formErrors.paymentMethod}</p>
              )}
            </div>

            {/* Transaction ID */}
            <div>
              <label className={cn('block text-sm font-medium mb-2', 'text-gray-700 dark:text-gray-300')}>
                Transaction ID (Optional)
              </label>
              <input
                type="text"
                placeholder="For online/card payments"
                value={formData.transactionId}
                onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                className={cn(
                  'w-full rounded-lg border px-4 py-2 transition-colors',
                  'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600',
                  'text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500'
                )}
              />
            </div>

            {/* Payment Date */}
            <div>
              <label className={cn('block text-sm font-medium mb-2', 'text-gray-700 dark:text-gray-300')}>
                Payment Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                className={cn(
                  'w-full rounded-lg border px-4 py-2 transition-colors',
                  'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600',
                  'text-gray-900 dark:text-white',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  formErrors.paymentDate && 'ring-2 ring-red-500'
                )}
              />
              {formErrors.paymentDate && (
                <p className="mt-1 text-sm text-red-500">{formErrors.paymentDate}</p>
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
                Record Payment
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
  if (mode === 'details' && selectedPayment) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payment Details</h1>
          <button
            onClick={() => {
              setSelectedPayment(null);
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
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className={cn('text-sm font-medium mb-4', 'text-gray-700 dark:text-gray-300')}>
                Receipt Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className={cn('text-xs', 'text-gray-600 dark:text-gray-400')}>Receipt Number</p>
                  <p className={cn('text-sm font-medium', 'text-gray-900 dark:text-white')}>
                    {selectedPayment.receiptNo}
                  </p>
                </div>
                <div>
                  <p className={cn('text-xs', 'text-gray-600 dark:text-gray-400')}>Payment Date</p>
                  <p className={cn('text-sm font-medium', 'text-gray-900 dark:text-white')}>
                    {selectedPayment.paymentDate
                      ? new Date(selectedPayment.paymentDate).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className={cn('text-xs', 'text-gray-600 dark:text-gray-400')}>Payment Method</p>
                  <p className={cn('text-sm font-medium', 'text-gray-900 dark:text-white')}>
                    {selectedPayment.paymentMethod}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className={cn('text-sm font-medium mb-4', 'text-gray-700 dark:text-gray-300')}>
                Amount Breakdown
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <p className={cn('text-xs', 'text-gray-600 dark:text-gray-400')}>Fee Amount</p>
                  <p className={cn('text-sm font-medium', 'text-gray-900 dark:text-white')}>
                    ₹{selectedPayment.amount.toFixed(2)}
                  </p>
                </div>
                {selectedPayment.lateFee > 0 && (
                  <div className="flex justify-between">
                    <p className={cn('text-xs', 'text-gray-600 dark:text-gray-400')}>Late Fee</p>
                    <p className={cn('text-sm font-medium', 'text-gray-900 dark:text-white')}>
                      ₹{selectedPayment.lateFee.toFixed(2)}
                    </p>
                  </div>
                )}
                {selectedPayment.discount > 0 && (
                  <div className="flex justify-between">
                    <p className={cn('text-xs', 'text-gray-600 dark:text-gray-400')}>Discount</p>
                    <p className={cn('text-sm font-medium', 'text-gray-900 dark:text-white')}>
                      -₹{selectedPayment.discount.toFixed(2)}
                    </p>
                  </div>
                )}
                <div className={cn('border-t pt-3', 'border-gray-200 dark:border-gray-700')}>
                  <div className="flex justify-between">
                    <p className={cn('text-sm font-medium', 'text-gray-700 dark:text-gray-300')}>Total Amount</p>
                    <p className={cn('text-lg font-bold', 'text-gray-900 dark:text-white')}>
                      ₹{selectedPayment.totalAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={cn('mt-8 pt-8 border-t', 'border-gray-200 dark:border-gray-700')}>
            <div className="flex gap-4">
              <button
                onClick={() => handleDownloadReceipt(selectedPayment.id)}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors',
                  'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
                )}
              >
                <Download className="h-4 w-4" />
                Download Receipt
              </button>
              <button
                onClick={() => {
                  setSelectedPayment(null);
                  setMode('list');
                }}
                className={cn(
                  'flex-1 rounded-lg px-4 py-2 font-medium transition-colors',
                  'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
                )}
              >
                Back to Payments
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
