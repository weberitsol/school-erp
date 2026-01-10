'use client';

import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { holidayService, Holiday } from '@/services/mess/holiday.service';

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [totalRecords, setTotalRecords] = useState(0);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    holidayName: '',
    mealArrangement: '',
    notes: '',
  });

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const response = await holidayService.getMonthHolidays(selectedYear, selectedMonth);
      setHolidays(response);
      setTotalRecords(response.length);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, [selectedMonth, selectedYear]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newHoliday = await holidayService.create({
        date: new Date(formData.date),
        holidayName: formData.holidayName,
        mealArrangement: formData.mealArrangement || undefined,
        notes: formData.notes || undefined,
      });
      setHolidays([...holidays, newHoliday]);
      setShowForm(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        holidayName: '',
        mealArrangement: '',
        notes: '',
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this holiday?')) {
      try {
        await holidayService.delete(id);
        setHolidays(holidays.filter((h) => h.id !== id));
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Holiday Calendar</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <Plus size={20} />
          Add Holiday
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          className="border rounded px-3 py-2"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(2024, i).toLocaleDateString('en-US', {
                month: 'long',
              })}
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

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Add Holiday</h2>
            <button onClick={() => setShowForm(false)}>
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Holiday Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Holiday Name</label>
              <input
                type="text"
                value={formData.holidayName}
                onChange={(e) =>
                  setFormData({ ...formData, holidayName: e.target.value })
                }
                placeholder="e.g., Diwali, New Year"
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Meal Arrangement</label>
              <input
                type="text"
                value={formData.mealArrangement}
                onChange={(e) =>
                  setFormData({ ...formData, mealArrangement: e.target.value })
                }
                placeholder="e.g., Special Menu, Packed Meals"
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes"
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="col-span-2 flex gap-4 justify-end">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Add Holiday
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading holidays...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Holiday Name</th>
                <th className="px-4 py-3 text-left">Meal Arrangement</th>
                <th className="px-4 py-3 text-left">Notes</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {holidays.map((holiday) => (
                <tr key={holiday.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {new Date(holiday.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-medium">{holiday.holidayName}</td>
                  <td className="px-4 py-3">{holiday.mealArrangement || '-'}</td>
                  <td className="px-4 py-3">{holiday.notes || '-'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(holiday.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 text-sm text-gray-600">
            Total: {totalRecords} holiday(ies) in {selectedMonth}/{selectedYear}
          </div>
        </div>
      )}
    </div>
  );
}
