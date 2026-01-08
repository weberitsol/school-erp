'use client';

import { useState, useEffect } from 'react';
import { Plus, Check, X, ArrowRightLeft } from 'lucide-react';
import { employeeTransferService, type EmployeeTransfer } from '@/services/hr/employee-transfer.service';
import { employeeService } from '@/services/hr/employee.service';

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<EmployeeTransfer[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    fromDepartmentId: '',
    toDepartmentId: '',
    transferDate: new Date().toISOString().split('T')[0],
    transferReason: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [transfersData, employeesData] = await Promise.all([
        employeeTransferService.getAll(),
        employeeService.getAll(),
      ]);
      setTransfers(transfersData.data);
      setEmployees(employeesData.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.toDepartmentId) {
      alert('Please fill all required fields');
      return;
    }

    try {
      await employeeTransferService.create(formData);
      await fetchData();
      setShowForm(false);
      setFormData({
        employeeId: '',
        fromDepartmentId: '',
        toDepartmentId: '',
        transferDate: new Date().toISOString().split('T')[0],
        transferReason: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save transfer');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await employeeTransferService.approve(id, 'admin-user-id');
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await employeeTransferService.reject(id);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ArrowRightLeft className="w-8 h-8 text-blue-600" />
            Employee Transfers
          </h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Transfer
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Create Transfer Request</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
                  <select
                    value={formData.employeeId}
                    onChange={e => {
                      const emp = employees.find(e => e.id === e.target.value);
                      setFormData({
                        ...formData,
                        employeeId: e.target.value,
                        fromDepartmentId: emp?.departmentId || '',
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Department</label>
                  <input
                    type="text"
                    value={formData.fromDepartmentId}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Department *</label>
                  <input
                    type="text"
                    value={formData.toDepartmentId}
                    onChange={e => setFormData({ ...formData, toDepartmentId: e.target.value })}
                    placeholder="Enter department ID"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Date</label>
                  <input
                    type="date"
                    value={formData.transferDate}
                    onChange={e => setFormData({ ...formData, transferDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <textarea
                    value={formData.transferReason}
                    onChange={e => setFormData({ ...formData, transferReason: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
                >
                  Create Transfer
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Employee</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">From</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">To</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Transfer Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {transfers.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium">
                      {t.employee?.firstName} {t.employee?.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm">{t.fromDepartment}</td>
                    <td className="px-6 py-4 text-sm">{t.toDepartment}</td>
                    <td className="px-6 py-4 text-sm">{new Date(t.transferDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        t.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        t.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                        t.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      {t.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleApprove(t.id)}
                            className="text-green-600 hover:text-green-800 inline-flex items-center gap-1"
                          >
                            <Check className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(t.id)}
                            className="text-red-600 hover:text-red-800 inline-flex items-center gap-1"
                          >
                            <X className="w-4 h-4" />
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
