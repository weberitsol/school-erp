'use client';

import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { extraMealService, ExtraMealBooking } from '@/services/mess/extra-meal.service';

export default function ExtraMealsPage() {
  const [bookings, setBookings] = useState<ExtraMealBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);

  const [formData, setFormData] = useState({
    enrollmentId: '',
    mealDate: new Date().toISOString().split('T')[0],
    quantity: 1,
    unitCost: '',
    schoolId: '',
  });

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await extraMealService.getExtraMeals();
      setBookings(response.data);
      setTotalRecords(response.total);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.enrollmentId || !formData.unitCost || !formData.schoolId) {
        setError('Please fill in all required fields');
        return;
      }

      const booking = await extraMealService.bookExtraMeal(
        formData.enrollmentId,
        new Date(formData.mealDate),
        formData.quantity,
        parseFloat(formData.unitCost),
        formData.schoolId
      );

      setBookings([booking, ...bookings]);
      setShowForm(false);
      setFormData({
        enrollmentId: '',
        mealDate: new Date().toISOString().split('T')[0],
        quantity: 1,
        unitCost: '',
        schoolId: '',
      });
      setError('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const booking = await extraMealService.approveExtraMeal(id);
      setBookings(bookings.map((b) => (b.id === id ? booking : b)));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleMarkServed = async (id: string) => {
    try {
      const booking = await extraMealService.markAsServed(id);
      setBookings(bookings.map((b) => (b.id === id ? booking : b)));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCancel = async (id: string) => {
    if (window.confirm('Cancel this booking?')) {
      try {
        await extraMealService.cancelExtraMeal(id);
        setBookings(bookings.filter((b) => b.id !== id));
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Extra Meal Bookings</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <Plus size={20} />
          Book Extra Meal
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Book Extra Meal</h2>
            <button onClick={() => setShowForm(false)}>
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Enrollment ID</label>
              <input
                type="text"
                value={formData.enrollmentId}
                onChange={(e) => setFormData({ ...formData, enrollmentId: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">School ID</label>
              <input
                type="text"
                value={formData.schoolId}
                onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Meal Date</label>
              <input
                type="date"
                value={formData.mealDate}
                onChange={(e) => setFormData({ ...formData, mealDate: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Quantity</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                min="1"
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Unit Cost (₹)</label>
              <input
                type="number"
                value={formData.unitCost}
                onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                step="0.01"
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Total Cost</label>
              <div className="w-full border rounded px-3 py-2 bg-gray-100">
                {extraMealService.formatCurrency(
                  (parseFloat(formData.unitCost) || 0) * formData.quantity
                )}
              </div>
            </div>
            <div className="col-span-2 flex gap-4 justify-end">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Book Meal
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
        <div className="text-center py-8">Loading bookings...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Student</th>
                <th className="px-4 py-3 text-left">Meal Date</th>
                <th className="px-4 py-3 text-center">Quantity</th>
                <th className="px-4 py-3 text-right">Unit Cost</th>
                <th className="px-4 py-3 text-right">Total Cost</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings && bookings.length > 0 ? (
                bookings.map((booking) => (
                  <tr key={booking.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {booking.enrollment?.student?.firstName} {booking.enrollment?.student?.lastName}
                    </td>
                    <td className="px-4 py-3">{extraMealService.formatDate(booking.mealDate)}</td>
                    <td className="px-4 py-3 text-center">{booking.quantity}</td>
                    <td className="px-4 py-3 text-right">
                      {extraMealService.formatCurrency(booking.unitCost)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold">
                      {extraMealService.formatCurrency(booking.totalCost)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded text-sm ${extraMealService.getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {booking.status === 'PENDING' && (
                          <button
                            onClick={() => handleApprove(booking.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Approve
                          </button>
                        )}
                        {booking.status === 'APPROVED' && (
                          <button
                            onClick={() => handleMarkServed(booking.id)}
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            Mark Served
                          </button>
                        )}
                        {booking.status !== 'SERVED' && booking.status !== 'CANCELLED' && (
                          <button
                            onClick={() => handleCancel(booking.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No extra meal bookings found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="px-4 py-3 text-sm text-gray-600">
            Total: {totalRecords} booking(s)
          </div>
        </div>
      )}
    </div>
  );
}
