'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Coffee } from 'lucide-react';
import { mealPlanService, messService, type MealPlan, type CreateMealPlanDto } from '@/services/mess';

export default function MealPlansManagementPage() {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [messes, setMesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MealPlan | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMess, setSelectedMess] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateMealPlanDto>({
    name: '',
    messId: '',
    monthlyPrice: 0,
    description: '',
    annualPrice: 0,
    includeBreakfast: true,
    includeLunch: true,
    includeDinner: true,
    includeSnacks: false,
  });

  useEffect(() => {
    fetchMealPlans();
    fetchMesses();
  }, []);

  const fetchMealPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters: any = {};
      if (selectedMess) filters.messId = selectedMess;
      const data = await mealPlanService.getAll(filters);
      setMealPlans(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch meal plans');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMesses = async () => {
    try {
      const data = await messService.getAll({});
      setMesses(data.data);
    } catch (err) {
      console.error('Error fetching messes:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.messId || !formData.monthlyPrice) {
      alert('Please fill in required fields');
      return;
    }

    try {
      setError(null);

      if (editingPlan) {
        await mealPlanService.update(editingPlan.id, formData);
      } else {
        await mealPlanService.create(formData);
      }

      await fetchMealPlans();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save meal plan');
      console.error('Error:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this meal plan?')) return;

    try {
      await mealPlanService.delete(id);
      await fetchMealPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete meal plan');
    }
  };

  const handleEdit = (plan: MealPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      messId: plan.id, // This needs to be fixed - should get messId from plan
      monthlyPrice: plan.monthlyPrice,
      description: plan.description || '',
      annualPrice: plan.annualPrice,
      includeBreakfast: plan.includeBreakfast,
      includeLunch: plan.includeLunch,
      includeDinner: plan.includeDinner,
      includeSnacks: plan.includeSnacks,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      messId: '',
      monthlyPrice: 0,
      description: '',
      annualPrice: 0,
      includeBreakfast: true,
      includeLunch: true,
      includeDinner: true,
      includeSnacks: false,
    });
    setEditingPlan(null);
    setShowForm(false);
  };

  const filteredPlans = mealPlans.filter(plan =>
    plan.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Coffee className="w-8 h-8 text-amber-600" />
            Meal Plans Management
          </h1>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Meal Plan
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search meal plans by name..."
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  if (e.target.value) {
                    setTimeout(fetchMealPlans, 300);
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <select
              value={selectedMess || ''}
              onChange={e => {
                setSelectedMess(e.target.value || null);
                setTimeout(fetchMealPlans, 300);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Messes</option>
              {messes.map(mess => (
                <option key={mess.id} value={mess.id}>{mess.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">
              {editingPlan ? 'Edit Meal Plan' : 'Add New Meal Plan'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mess *
                  </label>
                  <select
                    value={formData.messId}
                    onChange={e => setFormData({ ...formData, messId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Select Mess</option>
                    {messes.map(mess => (
                      <option key={mess.id} value={mess.id}>{mess.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.monthlyPrice}
                    onChange={e => setFormData({ ...formData, monthlyPrice: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Annual Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.annualPrice || 0}
                    onChange={e => setFormData({ ...formData, annualPrice: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Meal Inclusions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Meal Inclusions
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.includeBreakfast}
                      onChange={e => setFormData({ ...formData, includeBreakfast: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm font-medium">Breakfast</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.includeLunch}
                      onChange={e => setFormData({ ...formData, includeLunch: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm font-medium">Lunch</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.includeDinner}
                      onChange={e => setFormData({ ...formData, includeDinner: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm font-medium">Dinner</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.includeSnacks}
                      onChange={e => setFormData({ ...formData, includeSnacks: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm font-medium">Snacks</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg"
                >
                  {editingPlan ? 'Update' : 'Create'}
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

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Monthly Price</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Annual Price</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Meals Included</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredPlans.length > 0 ? (
                  filteredPlans.map(plan => (
                    <tr key={plan.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium">{plan.name}</td>
                      <td className="px-6 py-4 text-sm">₹{plan.monthlyPrice.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm">₹{(plan.annualPrice || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex flex-wrap gap-1">
                          {plan.includeBreakfast && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">B</span>}
                          {plan.includeLunch && <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">L</span>}
                          {plan.includeDinner && <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">D</span>}
                          {plan.includeSnacks && <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">S</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button
                          onClick={() => handleEdit(plan)}
                          className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(plan.id)}
                          className="text-red-600 hover:text-red-800 inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No meal plans found. Create one to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
