'use client';

import { useState, useEffect } from 'react';
import { Plus, Check, X, TrendingUp } from 'lucide-react';
import { employeePromotionService, type EmployeePromotion } from '@/services/hr/employee-promotion.service';
import { employeeService } from '@/services/hr/employee.service';
import { designationService } from '@/services/hr/designation.service';

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<EmployeePromotion[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    previousDesignationId: '',
    newDesignationId: '',
    newSalary: 0,
    promotionDate: new Date().toISOString().split('T')[0],
    promotionReason: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [promotionsData, employeesData, designationsData] = await Promise.all([
        employeePromotionService.getAll(),
        employeeService.getAll(),
        designationService.getAll(),
      ]);
      setPromotions(promotionsData.data);
      setEmployees(employeesData.data);
      setDesignations(designationsData.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.newDesignationId) {
      alert('Please fill all required fields');
      return;
    }

    try {
      await employeePromotionService.create({
        ...formData,
        newSalary: parseFloat(formData.newSalary.toString()),
        effectiveFrom: new Date().toISOString(),
      });
      await fetchData();
      setShowForm(false);
      setFormData({
        employeeId: '',
        previousDesignationId: '',
        newDesignationId: '',
        newSalary: 0,
        promotionDate: new Date().toISOString().split('T')[0],
        promotionReason: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save promotion');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await employeePromotionService.approve(id, 'admin-user-id');
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            Employee Promotions
          </h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Promotion
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Create Promotion</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
                  <select
                    value={formData.employeeId}
                    onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Designation *</label>
                  <select
                    value={formData.newDesignationId}
                    onChange={e => setFormData({ ...formData, newDesignationId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Designation</option>
                    {designations.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Salary</label>
                  <input
                    type="number"
                    value={formData.newSalary}
                    onChange={e => setFormData({ ...formData, newSalary: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Promotion Date</label>
                  <input
                    type="date"
                    value={formData.promotionDate}
                    onChange={e => setFormData({ ...formData, promotionDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
                >
                  Create Promotion
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
                  <th className="px-6 py-3 text-left text-sm font-semibold">From Designation</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">To Designation</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">New Salary</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {promotions.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium">
                      {p.employee?.firstName} {p.employee?.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm">{p.previousDesignation?.name}</td>
                    <td className="px-6 py-4 text-sm">{p.newDesignation?.name}</td>
                    <td className="px-6 py-4 text-sm font-semibold">₹{p.newSalary.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        p.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        p.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {p.status === 'PROPOSED' && (
                        <button
                          onClick={() => handleApprove(p.id)}
                          className="text-green-600 hover:text-green-800 inline-flex items-center gap-1"
                        >
                          <Check className="w-4 h-4" />
                          Approve
                        </button>
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
