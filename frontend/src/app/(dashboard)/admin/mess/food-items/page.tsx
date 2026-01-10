'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Tag } from 'lucide-react';
import { foodItemService, type FoodItem, type CreateFoodItemDto } from '@/services/mess';

export default function FoodItemsManagementPage() {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateFoodItemDto>({
    name: '',
    category: '',
    caloriesPer100g: 0,
    proteinPer100g: 0,
    carbsPer100g: 0,
    fatPer100g: 0,
    costPerUnit: 0,
    unitOfMeasurement: 'grams',
    allergenIds: [],
  });

  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [availableAllergens, setAvailableAllergens] = useState<any[]>([]);

  const categories = ['Vegetables', 'Fruits', 'Grains', 'Proteins', 'Dairy', 'Oils', 'Spices', 'Others'];

  useEffect(() => {
    fetchFoodItems();
    fetchAllergens();
  }, []);

  const fetchFoodItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await foodItemService.getAll({ search: searchTerm || undefined, category: selectedCategory || undefined });
      setFoodItems(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch food items');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllergens = async () => {
    try {
      const data = await foodItemService.getAllergensList();
      setAvailableAllergens(data);
    } catch (err) {
      console.error('Error fetching allergens:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.category.trim()) {
      alert('Please fill in required fields');
      return;
    }

    try {
      setError(null);
      const submitData = {
        ...formData,
        allergenIds: selectedAllergens,
      };

      if (editingItem) {
        await foodItemService.update(editingItem.id, submitData);
      } else {
        await foodItemService.create(submitData);
      }

      await fetchFoodItems();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save food item');
      console.error('Error:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this food item?')) return;

    try {
      await foodItemService.delete(id);
      await fetchFoodItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete food item');
    }
  };

  const handleEdit = (item: FoodItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      caloriesPer100g: item.caloriesPer100g,
      proteinPer100g: item.proteinPer100g,
      carbsPer100g: item.carbsPer100g,
      fatPer100g: item.fatPer100g,
      costPerUnit: item.costPerUnit,
      unitOfMeasurement: item.unitOfMeasurement,
      allergenIds: item.allergenIds || [],
    });
    setSelectedAllergens(item.allergenIds || []);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      caloriesPer100g: 0,
      proteinPer100g: 0,
      carbsPer100g: 0,
      fatPer100g: 0,
      costPerUnit: 0,
      unitOfMeasurement: 'grams',
      allergenIds: [],
    });
    setSelectedAllergens([]);
    setEditingItem(null);
    setShowForm(false);
  };

  const filteredItems = foodItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (!selectedCategory || item.category === selectedCategory)
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
            <Tag className="w-8 h-8 text-green-600" />
            Food Items Management
          </h1>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Food Item
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
                placeholder="Search food items by name..."
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  if (e.target.value) {
                    setTimeout(fetchFoodItems, 300);
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            <select
              value={selectedCategory || ''}
              onChange={e => {
                setSelectedCategory(e.target.value || null);
                setTimeout(fetchFoodItems, 300);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">
              {editingItem ? 'Edit Food Item' : 'Add New Food Item'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Basic Info */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Nutritional Info */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Calories (per 100g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.caloriesPer100g}
                    onChange={e => setFormData({ ...formData, caloriesPer100g: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Protein (g per 100g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.proteinPer100g}
                    onChange={e => setFormData({ ...formData, proteinPer100g: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Carbs (g per 100g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.carbsPer100g}
                    onChange={e => setFormData({ ...formData, carbsPer100g: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fat (g per 100g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.fatPer100g}
                    onChange={e => setFormData({ ...formData, fatPer100g: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Cost and Unit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost per Unit
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costPerUnit}
                    onChange={e => setFormData({ ...formData, costPerUnit: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit of Measurement
                  </label>
                  <select
                    value={formData.unitOfMeasurement}
                    onChange={e => setFormData({ ...formData, unitOfMeasurement: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="grams">Grams</option>
                    <option value="kg">Kilograms</option>
                    <option value="ml">Milliliters</option>
                    <option value="liters">Liters</option>
                    <option value="pieces">Pieces</option>
                  </select>
                </div>
              </div>

              {/* Allergens */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allergens
                </label>
                <div className="space-y-2">
                  {availableAllergens.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {availableAllergens.map(allergen => (
                        <label key={allergen.id} className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={selectedAllergens.includes(allergen.id)}
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedAllergens([...selectedAllergens, allergen.id]);
                              } else {
                                setSelectedAllergens(selectedAllergens.filter(id => id !== allergen.id));
                              }
                            }}
                            className="w-4 h-4 rounded"
                          />
                          <span className="text-sm">{allergen.name}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No allergens available</p>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
                >
                  {editingItem ? 'Update' : 'Create'}
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
                  <th className="px-6 py-3 text-left text-sm font-semibold">Category</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Calories</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Protein (g)</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Cost</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Allergens</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredItems.length > 0 ? (
                  filteredItems.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium">{item.name}</td>
                      <td className="px-6 py-4 text-sm">{item.category}</td>
                      <td className="px-6 py-4 text-sm">{item.caloriesPer100g}</td>
                      <td className="px-6 py-4 text-sm">{item.proteinPer100g}g</td>
                      <td className="px-6 py-4 text-sm">₹{item.costPerUnit.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm">
                        {item.allergenIds && item.allergenIds.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {item.allergenIds.map((allergId, idx) => (
                              <span key={idx} className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">
                                {allergId.substring(0, 3)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
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
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      No food items found. Create one to get started.
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
