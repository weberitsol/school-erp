'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Clock, Users } from 'lucide-react';
import { mealService, menuService, type Meal, type CreateMealDto } from '@/services/mess';

export default function MealsManagementPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [menus, setMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);

  const [mealForm, setMealForm] = useState<CreateMealDto>({
    menuId: '',
    name: '',
    mealType: 'BREAKFAST',
    serveTimeStart: '07:00',
    serveTimeEnd: '09:00',
  });

  const [filters, setFilters] = useState({
    menuId: '',
    mealType: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [mealsData, menusData] = await Promise.all([
        mealService.getAll(filters),
        menuService.getAll({}),
      ]);
      setMeals(mealsData.data);
      setMenus(menusData.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeal = async () => {
    if (!mealForm.menuId || !mealForm.name || !mealForm.mealType) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await mealService.create(mealForm);
      await fetchData();
      setMealForm({
        menuId: '',
        name: '',
        mealType: 'BREAKFAST',
        serveTimeStart: '07:00',
        serveTimeEnd: '09:00',
      });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create meal');
    }
  };

  const handleUpdateMeal = async () => {
    if (!editingMeal) return;

    try {
      await mealService.update(editingMeal.id, mealForm);
      await fetchData();
      setEditingMeal(null);
      setMealForm({
        menuId: '',
        name: '',
        mealType: 'BREAKFAST',
        serveTimeStart: '07:00',
        serveTimeEnd: '09:00',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update meal');
    }
  };

  const handleDeleteMeal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this meal?')) return;

    try {
      await mealService.delete(id);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete meal');
    }
  };

  const handleToggleServing = async (id: string, currentStatus: boolean) => {
    try {
      await mealService.updateServingStatus(id, !currentStatus);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update serving status');
    }
  };

  const getMealTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      BREAKFAST: 'bg-orange-100 text-orange-800',
      LUNCH: 'bg-blue-100 text-blue-800',
      DINNER: 'bg-purple-100 text-purple-800',
      SNACK: 'bg-green-100 text-green-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-8 h-8 text-blue-600" />
            Meal Management
          </h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-3 gap-4">
            <select
              value={filters.menuId}
              onChange={(e) => setFilters({ ...filters, menuId: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="">All Menus</option>
              {menus.map((menu) => (
                <option key={menu.id} value={menu.id}>
                  {menu.dayOfWeek} - {new Date(menu.date).toLocaleDateString()}
                </option>
              ))}
            </select>
            <select
              value={filters.mealType}
              onChange={(e) => setFilters({ ...filters, mealType: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="">All Types</option>
              <option value="BREAKFAST">Breakfast</option>
              <option value="LUNCH">Lunch</option>
              <option value="DINNER">Dinner</option>
              <option value="SNACK">Snack</option>
            </select>
            <button
              onClick={fetchData}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Filter
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 mb-6"
        >
          <Plus className="w-5 h-5" />
          Add Meal
        </button>

        {/* Create/Edit Meal Form */}
        {(showForm || editingMeal) && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">{editingMeal ? 'Edit Meal' : 'Add New Meal'}</h2>
            <div className="space-y-4">
              <select
                value={mealForm.menuId}
                onChange={(e) => setMealForm({ ...mealForm, menuId: e.target.value })}
                disabled={editingMeal !== null}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Menu</option>
                {menus.map((menu) => (
                  <option key={menu.id} value={menu.id}>
                    {menu.dayOfWeek} - {new Date(menu.date).toLocaleDateString()}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Meal Name (e.g., Paneer Tikka)"
                value={mealForm.name}
                onChange={(e) => setMealForm({ ...mealForm, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={mealForm.mealType}
                onChange={(e) => setMealForm({ ...mealForm, mealType: e.target.value as any })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="BREAKFAST">Breakfast</option>
                <option value="LUNCH">Lunch</option>
                <option value="DINNER">Dinner</option>
                <option value="SNACK">Snack</option>
              </select>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Serve Start Time</label>
                  <input
                    type="time"
                    value={mealForm.serveTimeStart}
                    onChange={(e) => setMealForm({ ...mealForm, serveTimeStart: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Serve End Time</label>
                  <input
                    type="time"
                    value={mealForm.serveTimeEnd}
                    onChange={(e) => setMealForm({ ...mealForm, serveTimeEnd: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={editingMeal ? handleUpdateMeal : handleCreateMeal}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                >
                  {editingMeal ? 'Update' : 'Create'}
                </button>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingMeal(null);
                    setMealForm({
                      menuId: '',
                      name: '',
                      mealType: 'BREAKFAST',
                      serveTimeStart: '07:00',
                      serveTimeEnd: '09:00',
                    });
                  }}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Meals Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Meal Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Type</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Menu Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Serving Time</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {meals.map((meal) => (
                <tr key={meal.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium">{meal.name}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getMealTypeColor(meal.mealType)}`}>
                      {meal.mealType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">{new Date(meal.menuId).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {meal.serveTimeStart} - {meal.serveTimeEnd}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleToggleServing(meal.id, meal.isServing)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        meal.isServing ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {meal.isServing ? 'Serving' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button
                      onClick={() => {
                        setEditingMeal(meal);
                        setMealForm({
                          menuId: meal.menuId,
                          name: meal.name,
                          mealType: meal.mealType,
                          serveTimeStart: meal.serveTimeStart,
                          serveTimeEnd: meal.serveTimeEnd,
                        });
                        setShowForm(false);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-xs font-semibold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteMeal(meal.id)}
                      className="text-red-600 hover:text-red-800 text-xs font-semibold"
                    >
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
  );
}
