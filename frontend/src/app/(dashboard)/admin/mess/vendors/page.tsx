'use client';

import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { vendorService, Vendor } from '@/services/mess/vendor.service';

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [types, setTypes] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    vendorType: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
  });

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await vendorService.getVendors();
      setVendors(response.data);
      setTotalRecords(response.total);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await vendorService.getVendorStats();
      setStats(response);
    } catch (err: any) {
      console.error('Failed to fetch stats:', err.message);
    }
  };

  const fetchVendorTypes = async () => {
    try {
      const response = await vendorService.getVendorTypes();
      setTypes(response);
    } catch (err: any) {
      console.error('Failed to fetch vendor types:', err.message);
    }
  };

  useEffect(() => {
    fetchVendors();
    fetchStats();
    fetchVendorTypes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.name || !formData.code || !formData.vendorType) {
        setError('Name, code, and vendor type are required');
        return;
      }

      await vendorService.createVendor(formData);
      setShowForm(false);
      setFormData({
        name: '',
        code: '',
        vendorType: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
      });
      setError('');
      await fetchVendors();
      await fetchStats();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteVendor = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this vendor?')) return;

    try {
      await vendorService.deleteVendor(id);
      setError('');
      await fetchVendors();
      await fetchStats();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        await vendorService.deactivateVendor(id);
      } else {
        await vendorService.reactivateVendor(id);
      }
      await fetchVendors();
      await fetchStats();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Vendor Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <Plus size={20} />
          Add Vendor
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && stats.totalVendors > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Total Vendors</div>
            <div className="text-2xl font-bold">{stats.totalVendors}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Active</div>
            <div className="text-2xl font-bold text-green-600">{stats.activeVendors}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Inactive</div>
            <div className="text-2xl font-bold text-red-600">{stats.inactiveVendors}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Avg Rating</div>
            <div className="text-2xl font-bold">
              {stats.averagePerformanceRating.toFixed(1)}/5
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Add Vendor Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Add New Vendor</h2>
            <button onClick={() => setShowForm(false)}>
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Vendor Name*</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Vendor Code*</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Vendor Type*</label>
              <select
                value={formData.vendorType}
                onChange={(e) => setFormData({ ...formData, vendorType: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="">Select Type</option>
                {types.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contact Person</label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full border rounded px-3 py-2"
                rows={3}
              />
            </div>
            <div className="col-span-2 flex gap-4 justify-end">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Add Vendor
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
        <div className="text-center py-8">Loading vendors...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Vendor Name</th>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Contact</th>
                <th className="px-4 py-3 text-center">Rating</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors && vendors.length > 0 ? (
                vendors.map((vendor) => (
                  <tr key={vendor.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold">{vendor.name}</td>
                    <td className="px-4 py-3 text-sm">{vendor.code}</td>
                    <td className="px-4 py-3 text-sm">{vendor.vendorType}</td>
                    <td className="px-4 py-3 text-sm">
                      {vendor.contactPerson && <div>{vendor.contactPerson}</div>}
                      {vendor.phone && <div>{vendor.phone}</div>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-3 py-1 rounded text-sm ${vendorService.getRatingColor(vendor.performanceRating)}`}>
                        {vendorService.formatRating(vendor.performanceRating)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-3 py-1 rounded text-sm ${
                          vendor.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {vendor.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleStatus(vendor.id, vendor.isActive)}
                          className={`text-sm ${
                            vendor.isActive
                              ? 'text-red-600 hover:text-red-800'
                              : 'text-green-600 hover:text-green-800'
                          }`}
                        >
                          {vendor.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteVendor(vendor.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No vendors found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="px-4 py-3 text-sm text-gray-600">
            Total: {totalRecords} vendor(s)
          </div>
        </div>
      )}
    </div>
  );
}
