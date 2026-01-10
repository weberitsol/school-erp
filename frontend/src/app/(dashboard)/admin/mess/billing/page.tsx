'use client';

import { useState, useEffect } from 'react';
import { Plus, DollarSign, AlertCircle, Download } from 'lucide-react';
import { messBillService, MessBill } from '@/services/mess/mess-bill.service';

export default function BillingPage() {
  const [bills, setBills] = useState<MessBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [totalRecords, setTotalRecords] = useState(0);
  const [stats, setStats] = useState<any>(null);

  const [generateData, setGenerateData] = useState({
    enrollmentId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  const [paymentData, setPaymentData] = useState({
    billId: '',
    amount: '',
    paymentMethod: 'CASH',
    transactionId: '',
  });

  const fetchBills = async () => {
    try {
      setLoading(true);
      const response = await messBillService.getBills({
        month: selectedMonth,
        year: selectedYear,
      });
      setBills(response.data);
      setTotalRecords(response.total);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await messBillService.getBillStats('');
      setStats(response);
    } catch (err: any) {
      console.error('Failed to fetch stats:', err.message);
    }
  };

  useEffect(() => {
    fetchBills();
    fetchStats();
  }, [selectedMonth, selectedYear]);

  const handleGenerateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!generateData.enrollmentId) {
        setError('Please enter enrollment ID');
        return;
      }
      await messBillService.generateBill(
        generateData.enrollmentId,
        generateData.month,
        generateData.year
      );
      setError('');
      setShowGenerateForm(false);
      setGenerateData({
        enrollmentId: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      });
      fetchBills();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRecordPayment = async (billId: string) => {
    try {
      if (!paymentData.amount) {
        setError('Please enter payment amount');
        return;
      }
      await messBillService.recordPayment(
        billId,
        parseFloat(paymentData.amount),
        paymentData.paymentMethod,
        paymentData.transactionId || undefined
      );
      setError('');
      setPaymentData({
        billId: '',
        amount: '',
        paymentMethod: 'CASH',
        transactionId: '',
      });
      fetchBills();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSyncToFinance = async (billId: string) => {
    try {
      await messBillService.syncToFinance(billId);
      setError('');
      fetchBills();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Mess Billing</h1>
        <button
          onClick={() => setShowGenerateForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <Plus size={20} />
          Generate Bill
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Total Bills</div>
            <div className="text-2xl font-bold">{stats.totalBills}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Total Amount</div>
            <div className="text-2xl font-bold">{messBillService.formatCurrency(stats.totalAmount)}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Paid Amount</div>
            <div className="text-2xl font-bold text-green-600">
              {messBillService.formatCurrency(stats.paidAmount)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Pending Amount</div>
            <div className="text-2xl font-bold text-red-600">
              {messBillService.formatCurrency(stats.pendingAmount)}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          className="border rounded px-3 py-2"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(2024, i).toLocaleDateString('en-US', { month: 'long' })}
            </option>
          ))}
        </select>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="border rounded px-3 py-2"
        >
          {Array.from({ length: 5 }, (_, i) => (
            <option key={i} value={new Date().getFullYear() + i}>
              {new Date().getFullYear() + i}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Generate Bill Form */}
      {showGenerateForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-2xl font-bold mb-4">Generate New Bill</h2>
          <form onSubmit={handleGenerateBill} className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Enrollment ID</label>
              <input
                type="text"
                value={generateData.enrollmentId}
                onChange={(e) => setGenerateData({ ...generateData, enrollmentId: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Month</label>
              <select
                value={generateData.month}
                onChange={(e) => setGenerateData({ ...generateData, month: parseInt(e.target.value) })}
                className="w-full border rounded px-3 py-2"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2024, i).toLocaleDateString('en-US', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Year</label>
              <select
                value={generateData.year}
                onChange={(e) => setGenerateData({ ...generateData, year: parseInt(e.target.value) })}
                className="w-full border rounded px-3 py-2"
              >
                {Array.from({ length: 5 }, (_, i) => (
                  <option key={i} value={new Date().getFullYear() + i}>
                    {new Date().getFullYear() + i}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-3 flex gap-4 justify-end">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Generate Bill
              </button>
              <button
                type="button"
                onClick={() => setShowGenerateForm(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bills Table */}
      {loading ? (
        <div className="text-center py-8">Loading bills...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Student</th>
                <th className="px-4 py-3 text-left">Month</th>
                <th className="px-4 py-3 text-right">Base Cost</th>
                <th className="px-4 py-3 text-right">Additional</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill) => (
                <tr key={bill.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {bill.enrollment?.student?.firstName} {bill.enrollment?.student?.lastName}
                  </td>
                  <td className="px-4 py-3">
                    {messBillService.getMonthName(bill.billingMonth)} {bill.billingYear}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {messBillService.formatCurrency(bill.baseMealPlanCost)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {messBillService.formatCurrency(bill.additionalCharges)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold">
                    {messBillService.formatCurrency(bill.totalAmount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {messBillService.formatCurrency(bill.paidAmount || 0)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded text-sm ${messBillService.getStatusColor(bill.status)}`}>
                      {bill.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {bill.status !== 'PAID' && (
                        <button
                          onClick={() => {
                            setPaymentData({ ...paymentData, billId: bill.id });
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Pay
                        </button>
                      )}
                      {!bill.invoiceId && (
                        <button
                          onClick={() => handleSyncToFinance(bill.id)}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          Sync
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 text-sm text-gray-600">
            Total: {totalRecords} bill(s)
          </div>
        </div>
      )}
    </div>
  );
}
