'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, AlertTriangle, Copy } from 'lucide-react';
import { mealVariantService, mealService, recipeService, type MealVariant, type CreateMealVariantDto } from '@/services/mess';

export default function MealVariantsManagementPage() {
  const [variants, setVariants] = useState<MealVariant[]>([]);
  const [meals, setMeals] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingVariant, setEditingVariant] = useState<MealVariant | null>(null);

  const [variantForm, setVariantForm] = useState<CreateMealVariantDto>({
    mealId: '',
    recipeId: '',
    variantType: 'VEG',
    cost: 0,
  });

  const [filters, setFilters] = useState({
    mealId: '',
    variantType: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [variantsData, mealsData, recipesData] = await Promise.all([
        mealVariantService.getAll(filters),
        mealService.getAll({}),
        recipeService.getAll({}),
      ]);
      setVariants(variantsData.data);
      setMeals(mealsData.data);
      setRecipes(recipesData.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVariant = async () => {
    if (!variantForm.mealId || !variantForm.recipeId || !variantForm.variantType) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await mealVariantService.create(variantForm);
      await fetchData();
      setVariantForm({
        mealId: '',
        recipeId: '',
        variantType: 'VEG',
        cost: 0,
      });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create variant');
    }
  };

  const handleUpdateVariant = async () => {
    if (!editingVariant) return;

    try {
      await mealVariantService.update(editingVariant.id, variantForm);
      await fetchData();
      setEditingVariant(null);
      setVariantForm({
        mealId: '',
        recipeId: '',
        variantType: 'VEG',
        cost: 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update variant');
    }
  };

  const handleDeleteVariant = async (id: string) => {
    if (!confirm('Are you sure you want to delete this variant?')) return;

    try {
      await mealVariantService.delete(id);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete variant');
    }
  };

  const getVariantTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      VEG: 'bg-green-100 text-green-800',
      NON_VEG: 'bg-red-100 text-red-800',
      VEGAN: 'bg-yellow-100 text-yellow-800',
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
            <AlertTriangle className="w-8 h-8 text-purple-600" />
            Meal Variants (VEG/NON-VEG/VEGAN)
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
              value={filters.mealId}
              onChange={(e) => setFilters({ ...filters, mealId: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="">All Meals</option>
              {meals.map((meal) => (
                <option key={meal.id} value={meal.id}>
                  {meal.name}
                </option>
              ))}
            </select>
            <select
              value={filters.variantType}
              onChange={(e) => setFilters({ ...filters, variantType: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="">All Types</option>
              <option value="VEG">Veg</option>
              <option value="NON_VEG">Non-Veg</option>
              <option value="VEGAN">Vegan</option>
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
          Add Variant
        </button>

        {/* Create/Edit Form */}
        {(showForm || editingVariant) && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">{editingVariant ? 'Edit Variant' : 'Add New Variant'}</h2>
            <div className="space-y-4">
              <select
                value={variantForm.mealId}
                onChange={(e) => setVariantForm({ ...variantForm, mealId: e.target.value })}
                disabled={editingVariant !== null}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Meal</option>
                {meals.map((meal) => (
                  <option key={meal.id} value={meal.id}>
                    {meal.name}
                  </option>
                ))}
              </select>
              <select
                value={variantForm.recipeId}
                onChange={(e) => setVariantForm({ ...variantForm, recipeId: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Recipe</option>
                {recipes.map((recipe) => (
                  <option key={recipe.id} value={recipe.id}>
                    {recipe.name} ({recipe.type})
                  </option>
                ))}
              </select>
              <select
                value={variantForm.variantType}
                onChange={(e) => setVariantForm({ ...variantForm, variantType: e.target.value as any })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="VEG">Vegetarian</option>
                <option value="NON_VEG">Non-Vegetarian</option>
                <option value="VEGAN">Vegan</option>
              </select>
              <input
                type="number"
                placeholder="Cost (optional)"
                value={variantForm.cost || ''}
                onChange={(e) => setVariantForm({ ...variantForm, cost: e.target.value ? parseFloat(e.target.value) : 0 })}
                step="0.01"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={editingVariant ? handleUpdateVariant : handleCreateVariant}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                >
                  {editingVariant ? 'Update' : 'Create'}
                </button>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingVariant(null);
                    setVariantForm({
                      mealId: '',
                      recipeId: '',
                      variantType: 'VEG',
                      cost: 0,
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

        {/* Variants Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Meal</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Recipe</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Type</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Cost</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {variants.map((variant) => (
                <tr key={variant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium">
                    {meals.find(m => m.id === variant.mealId)?.name || variant.mealId}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {recipes.find(r => r.id === variant.recipeId)?.name || variant.recipeId}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getVariantTypeColor(variant.variantType)}`}>
                      {variant.variantType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">₹{variant.cost.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button
                      onClick={() => {
                        setEditingVariant(variant);
                        setVariantForm({
                          mealId: variant.mealId,
                          recipeId: variant.recipeId,
                          variantType: variant.variantType,
                          cost: variant.cost,
                        });
                        setShowForm(false);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-xs font-semibold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteVariant(variant.id)}
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
