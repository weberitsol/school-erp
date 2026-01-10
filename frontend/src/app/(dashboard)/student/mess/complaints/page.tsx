'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { complaintService, MessComplaint } from '@/services/mess/complaint.service';

export default function StudentComplaintsPage() {
  const [complaints, setComplaints] = useState<MessComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
  });

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const response = await complaintService.getStudentComplaints();
      setComplaints(response);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.title || !formData.description) {
        setError('Title and description are required');
        return;
      }

      await complaintService.createComplaint(
        formData.title,
        formData.description,
        formData.category
      );

      setShowForm(false);
      setFormData({
        title: '',
        description: '',
        category: '',
      });
      setError('');
      await fetchComplaints();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Complaints</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <Plus size={20} />
          File Complaint
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Complaint Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-2xl font-bold mb-4">File New Complaint</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title*</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="Brief title of complaint"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select Category</option>
                <option value="FOOD_QUALITY">Food Quality</option>
                <option value="HYGIENE">Hygiene</option>
                <option value="QUANTITY">Quantity/Portion</option>
                <option value="BEHAVIOR">Staff Behavior</option>
                <option value="FACILITY">Facility</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description*</label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
                rows={5}
                placeholder="Provide detailed description of your complaint..."
                required
              />
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Submit Complaint
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
        <div className="text-center py-8">Loading complaints...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {complaints && complaints.length > 0 ? (
            complaints.map((complaint) => (
              <div key={complaint.id} className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold">{complaint.title}</h3>
                    <p className="text-sm text-gray-600">
                      {complaintService.formatDate(complaint.createdAt)}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded text-sm ${complaintService.getStatusColor(complaint.status)}`}>
                    {complaintService.formatStatus(complaint.status)}
                  </span>
                </div>
                {complaint.category && (
                  <div className="mb-3 text-sm">
                    <span className="text-gray-600">Category: </span>
                    <span className="font-medium">{complaint.category}</span>
                  </div>
                )}
                <p className="text-gray-700 mb-3">{complaint.description}</p>
                {complaint.resolutionNotes && (
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <p className="text-gray-600 font-medium">Resolution Notes:</p>
                    <p className="text-gray-700">{complaint.resolutionNotes}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
              No complaints filed yet
            </div>
          )}
        </div>
      )}
    </div>
  );
}
