'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, Search } from 'lucide-react';
import { leaveBalanceService, type LeaveBalance } from '@/services/hr/leave-balance.service';
import { employeeService } from '@/services/hr/employee.service';

export default function LeaveManagementPage() {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBalance, setSelectedBalance] = useState<LeaveBalance | null>(null);
  const [deductionForm, setDeductionForm] = useState({
    leaveType: 'CASUAL',
    days: 0,
  });

  useEffect(() => {
    fetchLeaveBalances();
  }, []);

  const fetchLeaveBalances = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await leaveBalanceService.getAll();
      setBalances(data.data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch leave balances';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeductLeave = async (balanceId: string) => {
    if (deductionForm.days <= 0) {
      alert('Please enter valid number of days');
      return;
    }

    try {
      setError(null);
      await leaveBalanceService.deductLeave(
        balanceId,
        deductionForm.leaveType,
        deductionForm.days
      );
      await fetchLeaveBalances();
      setSelectedBalance(null);
      setDeductionForm({ leaveType: 'CASUAL', days: 0 });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to deduct leave';
      setError(errorMsg);
    }
  };

  const filtered = balances.filter(b =>
    b.employee?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.employee?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.academicYear.includes(searchTerm)
  );

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-8 h-8 text-blue-600" />
            Leave Management
          </h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="mb-6 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by employee name or year..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {selectedBalance && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Deduct Leave</h2>
            <p className="mb-4 text-gray-600">
              Employee: {selectedBalance.employee?.firstName} {selectedBalance.employee?.lastName} | Year: {selectedBalance.academicYear}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                <select
                  value={deductionForm.leaveType}
                  onChange={e => setDeductionForm({ ...deductionForm, leaveType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CASUAL">Casual Leave</option>
                  <option value="EARNED">Earned Leave</option>
                  <option value="MEDICAL">Medical Leave</option>
                  <option value="UNPAID">Unpaid Leave</option>
                  <option value="STUDY">Study Leave</option>
                  <option value="MATERNITY">Maternity Leave</option>
                  <option value="PATERNITY">Paternity Leave</option>
                  <option value="BEREAVEMENT">Bereavement Leave</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Days to Deduct</label>
                <input
                  type="number"
                  value={deductionForm.days}
                  onChange={e => setDeductionForm({ ...deductionForm, days: parseInt(e.target.value) || 0 })}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDeductLeave(selectedBalance.id)}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
                >
                  Deduct Leave
                </button>
                <button
                  onClick={() => setSelectedBalance(null)}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(balance => (
            <div key={balance.id} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-2">
                {balance.employee?.firstName} {balance.employee?.lastName}
              </h3>
              <p className="text-sm text-gray-600 mb-4">Year: {balance.academicYear}</p>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span>Casual Leave:</span>
                  <span className="font-semibold">
                    {balance.casualLeave - (balance.casualLeaveUsed?.toNumber?.() || 0)}/{balance.casualLeave}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Earned Leave:</span>
                  <span className="font-semibold">
                    {balance.earnedLeave - (balance.earnedLeaveUsed?.toNumber?.() || 0)}/{balance.earnedLeave}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Medical Leave:</span>
                  <span className="font-semibold">
                    {balance.medicalLeave - (balance.medicalLeaveUsed?.toNumber?.() || 0)}/{balance.medicalLeave}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedBalance(balance)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Deduct Leave
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
