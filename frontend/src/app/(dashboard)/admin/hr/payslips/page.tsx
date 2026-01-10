'use client';

import { useState, useEffect } from 'react';
import { Plus, Download, Eye, DollarSign } from 'lucide-react';
import { payslipService, type Payslip } from '@/services/hr/payslip.service';
import { employeeService } from '@/services/hr/employee.service';

export default function PayslipsPage() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [formData, setFormData] = useState({
    employeeIds: [] as string[],
  });

  useEffect(() => {
    fetchData();
  }, [month, year]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [payslipsData, employeesData] = await Promise.all([
        payslipService.getAll({ month, year }),
        employeeService.getAll(),
      ]);
      setPayslips(payslipsData.data);
      setEmployees(employeesData.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayslips = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const employeesToGenerate = formData.employeeIds.length > 0 ? formData.employeeIds : undefined;
      await payslipService.generate(month, year, employeesToGenerate);
      await fetchData();
      setShowForm(false);
      setFormData({ employeeIds: [] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate payslips');
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await payslipService.markAsPaid(id);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as paid');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-8 h-8 text-blue-600" />
            Payslips
          </h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Generate Payslips
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Month/Year Filter */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-4 items-center">
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
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Generate Payslips</h2>
            <form onSubmit={handleGeneratePayslips} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Employees (Leave empty for all)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {employees.map(emp => (
                    <label key={emp.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.employeeIds.includes(emp.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              employeeIds: [...formData.employeeIds, emp.id],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              employeeIds: formData.employeeIds.filter(id => id !== emp.id),
                            });
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">
                        {emp.firstName} {emp.lastName}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
                >
                  Generate
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

        {selectedPayslip && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 max-h-96 overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Payslip Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium">Employee:</span> {selectedPayslip.employee?.firstName} {selectedPayslip.employee?.lastName}</div>
              <div><span className="font-medium">Month/Year:</span> {selectedPayslip.month}/{selectedPayslip.year}</div>
              <div><span className="font-medium">Basic Salary:</span> ₹{(selectedPayslip.basicSalary || 0).toLocaleString()}</div>
              <div><span className="font-medium">Gross Salary:</span> ₹{(selectedPayslip.grossSalary || 0).toLocaleString()}</div>
              <div><span className="font-medium">Total Deductions:</span> ₹{(selectedPayslip.totalDeductions || 0).toLocaleString()}</div>
              <div><span className="font-medium">Net Salary:</span> ₹{(selectedPayslip.netSalary || 0).toLocaleString()}</div>
              <div className="col-span-2"><span className="font-medium">Status:</span> {selectedPayslip.status}</div>
            </div>
            <button
              onClick={() => setSelectedPayslip(null)}
              className="mt-4 bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg w-full"
            >
              Close
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Employee</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Gross Salary</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Deductions</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Net Salary</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payslips.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium">
                      {p.employee?.firstName} {p.employee?.lastName}
                    </td>
                    <td className="px-6 py-4 text-sm">₹{(p.grossSalary || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm">₹{(p.totalDeductions || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm font-semibold">₹{(p.netSalary || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        p.status === 'PAID' ? 'bg-green-100 text-green-800' :
                        p.status === 'FINALIZED' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button
                        onClick={() => setSelectedPayslip(p)}
                        className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      {p.status === 'FINALIZED' && (
                        <button
                          onClick={() => handleMarkPaid(p.id)}
                          className="text-green-600 hover:text-green-800 inline-flex items-center gap-1"
                        >
                          <Download className="w-4 h-4" />
                          Mark Paid
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
