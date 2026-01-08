'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, TrendingUp, Search } from 'lucide-react';
import { salaryService, type Salary } from '@/services/hr/salary.service';
import { employeeService } from '@/services/hr/employee.service';

export default function SalariesPage() {
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingSalary, setEditingSalary] = useState<Salary | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [formData, setFormData] = useState({
    employeeId: '',
    basicSalary: 0,
    dearness: 0,
    houseRent: 0,
    conveyance: 0,
    medical: 0,
  });

  useEffect(() => {
    fetchData();
  }, [month, year]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [salariesData, employeesData] = await Promise.all([
        salaryService.getAll({ month, year }),
        employeeService.getAll(),
      ]);
      setSalaries(salariesData.data);
      setEmployees(employeesData.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      basicSalary: 0,
      dearness: 0,
      houseRent: 0,
      conveyance: 0,
      medical: 0,
    });
    setEditingSalary(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.employeeId || formData.basicSalary <= 0) {
      alert('Please fill all required fields');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (editingSalary) {
        await salaryService.update(editingSalary.id, {
          ...formData,
          basicSalary: parseFloat(formData.basicSalary.toString()),
          dearness: parseFloat(formData.dearness.toString()),
          houseRent: parseFloat(formData.houseRent.toString()),
          conveyance: parseFloat(formData.conveyance.toString()),
          medical: parseFloat(formData.medical.toString()),
          month,
          year,
        });
      } else {
        await salaryService.create({
          ...formData,
          basicSalary: parseFloat(formData.basicSalary.toString()),
          dearness: parseFloat(formData.dearness.toString()),
          houseRent: parseFloat(formData.houseRent.toString()),
          conveyance: parseFloat(formData.conveyance.toString()),
          medical: parseFloat(formData.medical.toString()),
          month,
          year,
        });
      }

      await fetchData();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save salary');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await salaryService.delete(id);
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const handleEdit = (salary: Salary) => {
    setEditingSalary(salary);
    setFormData({
      employeeId: salary.employeeId,
      basicSalary: salary.basicSalary,
      dearness: salary.dearness || 0,
      houseRent: salary.houseRent || 0,
      conveyance: salary.conveyance || 0,
      medical: salary.medical || 0,
    });
    setShowForm(true);
  };

  const filtered = salaries.filter(s =>
    !searchTerm ||
    s.employee?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.employee?.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            Salary Management
          </h1>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Salary
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Month/Year Filter */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <select
                value={month}
                onChange={e => setMonth(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <select
                value={year}
                onChange={e => setYear(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {[2023, 2024, 2025].map(y => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by employee name..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">
              {editingSalary ? 'Edit Salary' : 'Add Salary'}
            </h2>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary *</label>
                  <input
                    type="number"
                    value={formData.basicSalary}
                    onChange={e => setFormData({ ...formData, basicSalary: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dearness Allowance</label>
                  <input
                    type="number"
                    value={formData.dearness}
                    onChange={e => setFormData({ ...formData, dearness: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">House Rent Allowance</label>
                  <input
                    type="number"
                    value={formData.houseRent}
                    onChange={e => setFormData({ ...formData, houseRent: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Conveyance</label>
                  <input
                    type="number"
                    value={formData.conveyance}
                    onChange={e => setFormData({ ...formData, conveyance: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medical Allowance</label>
                  <input
                    type="number"
                    value={formData.medical}
                    onChange={e => setFormData({ ...formData, medical: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingSalary ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
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
                  <th className="px-6 py-3 text-left text-sm font-semibold">Basic Salary</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Gross Salary</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Deductions</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Net Salary</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium">
                      {s.employee?.firstName} {s.employee?.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm">₹{s.basicSalary.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm">₹{s.grossSalary.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm">₹{s.totalDeductions.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm font-semibold">₹{s.netSalary.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleEdit(s)}
                        className="text-blue-600 hover:text-blue-800 mr-4 inline-flex items-center gap-1"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="text-red-600 hover:text-red-800 inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
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
