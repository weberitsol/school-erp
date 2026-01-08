'use client';

import { useState, useEffect } from 'react';
import { Plus, Check, LogOut } from 'lucide-react';
import { employeeSeparationService, type EmployeeSeparation } from '@/services/hr/employee-separation.service';
import { employeeService } from '@/services/hr/employee.service';

export default function SeparationsPage() {
  const [separations, setSeparations] = useState<EmployeeSeparation[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedSeparation, setSelectedSeparation] = useState<EmployeeSeparation | null>(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    separationDate: new Date().toISOString().split('T')[0],
    separationType: 'RESIGNATION',
    reason: '',
    effectiveDate: new Date().toISOString().split('T')[0],
  });
  const [settlementForm, setSettlementForm] = useState({
    basicSalaryDue: 0,
    earnedLeavePayout: 0,
    gratuity: 0,
    loanRecovery: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [separationsData, employeesData] = await Promise.all([
        employeeSeparationService.getAll(),
        employeeService.getAll(),
      ]);
      setSeparations(separationsData.data);
      setEmployees(employeesData.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId) {
      alert('Please select an employee');
      return;
    }

    try {
      await employeeSeparationService.create({
        ...formData,
      });
      await fetchData();
      setShowForm(false);
      setFormData({
        employeeId: '',
        separationDate: new Date().toISOString().split('T')[0],
        separationType: 'RESIGNATION',
        reason: '',
        effectiveDate: new Date().toISOString().split('T')[0],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create separation');
    }
  };

  const handleCalculateSettlement = async (id: string) => {
    try {
      await employeeSeparationService.calculateSettlement(id, settlementForm);
      await fetchData();
      setSelectedSeparation(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate settlement');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <LogOut className="w-8 h-8 text-blue-600" />
            Employee Separations
          </h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Separation
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Initiate Separation</h2>
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
                    {employees.filter(emp => emp.status === 'ACTIVE').map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Separation Type *</label>
                  <select
                    value={formData.separationType}
                    onChange={e => setFormData({ ...formData, separationType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="RESIGNATION">Resignation</option>
                    <option value="RETIREMENT">Retirement</option>
                    <option value="TERMINATION">Termination</option>
                    <option value="REDUNDANCY">Redundancy</option>
                    <option value="DEATH">Death</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Separation Date</label>
                  <input
                    type="date"
                    value={formData.separationDate}
                    onChange={e => setFormData({ ...formData, separationDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date</label>
                  <input
                    type="date"
                    value={formData.effectiveDate}
                    onChange={e => setFormData({ ...formData, effectiveDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <textarea
                    value={formData.reason}
                    onChange={e => setFormData({ ...formData, reason: e.target.value })}
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
                  Create Separation
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

        {selectedSeparation && selectedSeparation.settlementStatus === 'PENDING' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Calculate Settlement</h2>
            <p className="mb-4 text-gray-600">
              Employee: {selectedSeparation.employee?.firstName} {selectedSeparation.employee?.lastName}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary Due</label>
                <input
                  type="number"
                  value={settlementForm.basicSalaryDue}
                  onChange={e => setSettlementForm({ ...settlementForm, basicSalaryDue: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Earned Leave Payout</label>
                <input
                  type="number"
                  value={settlementForm.earnedLeavePayout}
                  onChange={e => setSettlementForm({ ...settlementForm, earnedLeavePayout: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gratuity</label>
                <input
                  type="number"
                  value={settlementForm.gratuity}
                  onChange={e => setSettlementForm({ ...settlementForm, gratuity: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loan Recovery</label>
                <input
                  type="number"
                  value={settlementForm.loanRecovery}
                  onChange={e => setSettlementForm({ ...settlementForm, loanRecovery: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={() => handleCalculateSettlement(selectedSeparation.id)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
              >
                Calculate Settlement
              </button>
              <button
                onClick={() => setSelectedSeparation(null)}
                className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {separations.map(s => (
            <div key={s.id} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-2">
                {s.employee?.firstName} {s.employee?.lastName}
              </h3>
              <div className="space-y-2 text-sm mb-4">
                <div>Type: <span className="font-semibold">{s.separationType}</span></div>
                <div>Separation Date: <span className="font-semibold">{new Date(s.separationDate).toLocaleDateString()}</span></div>
                <div>Status: <span className="font-semibold">{s.settlementStatus}</span></div>
                {s.finalSettlementAmount && (
                  <div>Settlement: <span className="font-semibold">₹{s.finalSettlementAmount}</span></div>
                )}
              </div>

              {s.settlementStatus === 'PENDING' && (
                <button
                  onClick={() => setSelectedSeparation(s)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Calculate Settlement
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
