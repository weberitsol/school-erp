'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ChefHat, Package } from 'lucide-react';
import { recipeService, foodItemService, type Recipe, type CreateRecipeDto, type MealVariantType } from '@/services/mess';

export default function RecipesManagementPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mealVariantFilter, setMealVariantFilter] = useState<MealVariantType | ''>('');
  const [showIngredientForm, setShowIngredientForm] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [foodItems, setFoodItems] = useState<any[]>([]);

  const [formData, setFormData] = useState<CreateRecipeDto>({
    name: '',
    mealVariantType: 'VEG',
    description: '',
    cuisineType: '',
    cookingInstructions: '',
    cookingTimeMinutes: 0,
    servings: 1,
  });

  const [ingredientData, setIngredientData] = useState({
    foodItemId: '',
    quantity: 0,
    unit: 'grams',
    ingredientCost: 0,
  });

  const mealVariantTypes: MealVariantType[] = ['VEG', 'NON_VEG', 'VEGAN'];
  const units = ['grams', 'kg', 'ml', 'liters', 'pieces', 'cups', 'tbsp', 'tsp'];

  useEffect(() => {
    fetchRecipes();
    fetchFoodItems();
  }, []);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters: any = {};
      if (searchTerm) filters.search = searchTerm;
      if (mealVariantFilter) filters.mealVariantType = mealVariantFilter;
      const data = await recipeService.getAll(filters);
      setRecipes(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recipes');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFoodItems = async () => {
    try {
      const data = await foodItemService.getAll({});
      setFoodItems(data.data);
    } catch (err) {
      console.error('Error fetching food items:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.mealVariantType) {
      alert('Please fill in required fields');
      return;
    }

    try {
      setError(null);

      if (editingRecipe) {
        await recipeService.update(editingRecipe.id, formData);
      } else {
        await recipeService.create(formData);
      }

      await fetchRecipes();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save recipe');
      console.error('Error:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recipe?')) return;

    try {
      await recipeService.delete(id);
      await fetchRecipes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete recipe');
    }
  };

  const handleEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setFormData({
      name: recipe.name,
      mealVariantType: recipe.mealVariantType,
      description: recipe.description || '',
      cuisineType: recipe.cuisineType || '',
      cookingInstructions: recipe.cookingInstructions || '',
      cookingTimeMinutes: recipe.cookingTimeMinutes || 0,
      servings: recipe.servings,
    });
    setShowForm(true);
  };

  const handleAddIngredient = async () => {
    if (!selectedRecipeId || !ingredientData.foodItemId || !ingredientData.quantity) {
      alert('Please fill in all ingredient fields');
      return;
    }

    try {
      await recipeService.addIngredient(selectedRecipeId, ingredientData);
      await fetchRecipes();
      setIngredientData({ foodItemId: '', quantity: 0, unit: 'grams', ingredientCost: 0 });
      setShowIngredientForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add ingredient');
    }
  };

  const handleCalculateCost = async (recipeId: string) => {
    try {
      const result = await recipeService.calculateCost(recipeId);
      alert(`Total Cost: ₹${result.totalCost.toFixed(2)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate cost');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      mealVariantType: 'VEG',
      description: '',
      cuisineType: '',
      cookingInstructions: '',
      cookingTimeMinutes: 0,
      servings: 1,
    });
    setEditingRecipe(null);
    setShowForm(false);
  };

  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (!mealVariantFilter || recipe.mealVariantType === mealVariantFilter)
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
            <ChefHat className="w-8 h-8 text-orange-600" />
            Recipes Management
          </h1>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Recipe
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
                placeholder="Search recipes by name..."
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  if (e.target.value) {
                    setTimeout(fetchRecipes, 300);
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <select
              value={mealVariantFilter}
              onChange={e => {
                setMealVariantFilter(e.target.value as MealVariantType | '');
                setTimeout(fetchRecipes, 300);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="">All Variants</option>
              {mealVariantTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">
              {editingRecipe ? 'Edit Recipe' : 'Add New Recipe'}
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meal Variant Type *
                  </label>
                  <select
                    value={formData.mealVariantType}
                    onChange={e => setFormData({ ...formData, mealVariantType: e.target.value as MealVariantType })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    {mealVariantTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cuisine Type
                  </label>
                  <input
                    type="text"
                    value={formData.cuisineType}
                    onChange={e => setFormData({ ...formData, cuisineType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Servings
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.servings}
                    onChange={e => setFormData({ ...formData, servings: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cooking Time (minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.cookingTimeMinutes}
                    onChange={e => setFormData({ ...formData, cookingTimeMinutes: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cooking Instructions
                </label>
                <textarea
                  value={formData.cookingInstructions}
                  onChange={e => setFormData({ ...formData, cookingInstructions: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg"
                >
                  {editingRecipe ? 'Update' : 'Create'}
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

        {/* Ingredient Form Modal */}
        {showIngredientForm && selectedRecipeId && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-l-4 border-orange-600">
            <h3 className="text-xl font-bold mb-4">Add Ingredient</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Food Item *
                </label>
                <select
                  value={ingredientData.foodItemId}
                  onChange={e => setIngredientData({ ...ingredientData, foodItemId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select Food Item</option>
                  {foodItems.map(item => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={ingredientData.quantity}
                  onChange={e => setIngredientData({ ...ingredientData, quantity: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit
                </label>
                <select
                  value={ingredientData.unit}
                  onChange={e => setIngredientData({ ...ingredientData, unit: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  {units.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ingredient Cost
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={ingredientData.ingredientCost}
                  onChange={e => setIngredientData({ ...ingredientData, ingredientCost: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddIngredient}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg"
              >
                Add Ingredient
              </button>
              <button
                onClick={() => setShowIngredientForm(false)}
                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Variant Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Cuisine</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Servings</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Cooking Time</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredRecipes.length > 0 ? (
                  filteredRecipes.map(recipe => (
                    <tr key={recipe.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium">{recipe.name}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                          {recipe.mealVariantType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">{recipe.cuisineType || '-'}</td>
                      <td className="px-6 py-4 text-sm">{recipe.servings}</td>
                      <td className="px-6 py-4 text-sm">{recipe.cookingTimeMinutes || '-'} min</td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button
                          onClick={() => {
                            setSelectedRecipeId(recipe.id);
                            setShowIngredientForm(true);
                          }}
                          className="text-green-600 hover:text-green-800 inline-flex items-center gap-1"
                        >
                          <Package className="w-4 h-4" />
                          Add Ingredient
                        </button>
                        <button
                          onClick={() => handleCalculateCost(recipe.id)}
                          className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                        >
                          💰 Cost
                        </button>
                        <button
                          onClick={() => handleEdit(recipe)}
                          className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(recipe.id)}
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
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No recipes found. Create one to get started.
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
