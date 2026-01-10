'use client';

import { useState, useEffect } from 'react';
import { Plus, Calendar, Edit2, Trash2, Copy, TrendingUp, AlertCircle } from 'lucide-react';
import { menuService, messService, type Menu, type CreateMenuDto } from '@/services/mess';

export default function MenusManagementPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [messes, setMesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [showCloneForm, setShowCloneForm] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedMenuStats, setSelectedMenuStats] = useState<any>(null);

  const [menuForm, setMenuForm] = useState<CreateMenuDto>({
    messId: '',
    date: new Date().toISOString().split('T')[0],
    dayOfWeek: '',
    season: '',
  });

  const [cloneForm, setCloneForm] = useState({
    sourceDate: '',
    targetDate: '',
  });

  const [filters, setFilters] = useState({
    messId: '',
    status: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [menusData, messesData] = await Promise.all([
        menuService.getAll(filters),
        messService.getAll({}),
      ]);
      setMenus(menusData.data);
      setMesses(messesData.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMenu = async () => {
    if (!menuForm.messId || !menuForm.date || !menuForm.dayOfWeek) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await menuService.create(menuForm);
      await fetchData();
      setMenuForm({
        messId: '',
        date: new Date().toISOString().split('T')[0],
        dayOfWeek: '',
        season: '',
      });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create menu');
    }
  };

  const handleUpdateMenu = async () => {
    if (!editingMenu) return;

    try {
      await menuService.update(editingMenu.id, menuForm);
      await fetchData();
      setEditingMenu(null);
      setMenuForm({
        messId: '',
        date: new Date().toISOString().split('T')[0],
        dayOfWeek: '',
        season: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update menu');
    }
  };

  const handleDeleteMenu = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu?')) return;

    try {
      await menuService.delete(id);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete menu');
    }
  };

  const handlePublishMenu = async (id: string) => {
    try {
      await menuService.publish(id);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish menu');
    }
  };

  const handleCloneMenu = async () => {
    if (!menuForm.messId || !cloneForm.sourceDate || !cloneForm.targetDate) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await menuService.cloneFromDate(menuForm.messId, cloneForm.sourceDate, cloneForm.targetDate);
      await fetchData();
      setShowCloneForm(false);
      setCloneForm({ sourceDate: '', targetDate: '' });
      setMenuForm({ messId: '', date: '', dayOfWeek: '', season: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clone menu');
    }
  };

  const handleViewStats = async (menuId: string) => {
    try {
      const stats = await menuService.getStatistics(menuId);
      setSelectedMenuStats(stats);
      setShowStatsModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-8 h-8 text-blue-600" />
            Menu Planning
          </h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-4 gap-4">
            <select
              value={filters.messId}
              onChange={(e) => setFilters({ ...filters, messId: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="">All Messes</option>
              {messes.map((mess) => (
                <option key={mess.id} value={mess.id}>
                  {mess.name}
                </option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="px-3 py-2 border rounded-lg"
              placeholder="Start Date"
            />
            <button
              onClick={fetchData}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Filter
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Menu
          </button>
          <button
            onClick={() => setShowCloneForm(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Copy className="w-5 h-5" />
            Clone from Date
          </button>
        </div>

        {/* Create Menu Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Create New Menu</h2>
            <div className="space-y-4">
              <select
                value={menuForm.messId}
                onChange={(e) => setMenuForm({ ...menuForm, messId: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Mess</option>
                {messes.map((mess) => (
                  <option key={mess.id} value={mess.id}>
                    {mess.name}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={menuForm.date}
                onChange={(e) => setMenuForm({ ...menuForm, date: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={menuForm.dayOfWeek}
                onChange={(e) => setMenuForm({ ...menuForm, dayOfWeek: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Day</option>
                {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Season (optional)"
                value={menuForm.season || ''}
                onChange={(e) => setMenuForm({ ...menuForm, season: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateMenu}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Clone Menu Form */}
        {showCloneForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-l-4 border-purple-600">
            <h2 className="text-2xl font-bold mb-4">Clone Menu from Date</h2>
            <div className="space-y-4">
              <select
                value={menuForm.messId}
                onChange={(e) => setMenuForm({ ...menuForm, messId: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select Mess</option>
                {messes.map((mess) => (
                  <option key={mess.id} value={mess.id}>
                    {mess.name}
                  </option>
                ))}
              </select>
              <input
                type="date"
                placeholder="Source Date"
                value={cloneForm.sourceDate}
                onChange={(e) => setCloneForm({ ...cloneForm, sourceDate: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="date"
                placeholder="Target Date"
                value={cloneForm.targetDate}
                onChange={(e) => setCloneForm({ ...cloneForm, targetDate: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCloneMenu}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg"
                >
                  Clone
                </button>
                <button
                  onClick={() => setShowCloneForm(false)}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Menus Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Day</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Mess</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Season</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {menus.map((menu) => (
                <tr key={menu.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">{new Date(menu.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm font-medium">{menu.dayOfWeek}</td>
                  <td className="px-6 py-4 text-sm">{messes.find(m => m.id === menu.messId)?.name || menu.messId}</td>
                  <td className="px-6 py-4 text-sm">{menu.season || '-'}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(menu.status)}`}>
                      {menu.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    {menu.status === 'DRAFT' && (
                      <button
                        onClick={() => handlePublishMenu(menu.id)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-semibold"
                      >
                        Publish
                      </button>
                    )}
                    <button
                      onClick={() => handleViewStats(menu.id)}
                      className="text-green-600 hover:text-green-800 text-xs font-semibold"
                    >
                      Stats
                    </button>
                    <button className="text-gray-600 hover:text-gray-800 text-xs font-semibold">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Statistics Modal */}
        {showStatsModal && selectedMenuStats && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold">Menu Statistics</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Meals:</span>
                  <span className="font-semibold">{selectedMenuStats.totalMeals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Meals with Attendance:</span>
                  <span className="font-semibold">{selectedMenuStats.mealsWithAttendance}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Feedback Rating:</span>
                  <span className="font-semibold">{selectedMenuStats.avgFeedbackRating.toFixed(1)}/5</span>
                </div>
                <div>
                  <span className="text-gray-600">Meal Types:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedMenuStats.mealTypes.map((type: string) => (
                      <span key={type} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowStatsModal(false)}
                className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
