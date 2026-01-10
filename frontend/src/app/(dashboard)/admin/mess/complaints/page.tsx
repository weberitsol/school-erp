'use client';

import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { complaintService, MessComplaint } from '@/services/mess/complaint.service';

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<MessComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const response = await complaintService.getComplaints({
        status: selectedStatus || undefined,
      });
      setComplaints(response.data);
      setTotalRecords(response.total);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await complaintService.getComplaintStats();
      setStats(response);
    } catch (err: any) {
      console.error('Failed to fetch stats:', err.message);
    }
  };

  useEffect(() => {
    fetchComplaints();
    fetchStats();
  }, [selectedStatus]);

  const handleStatusChange = async (id: string, newStatus: string, notes?: string) => {
    try {
      await complaintService.updateComplaintStatus(id, newStatus as any, notes);
      setError('');
      await fetchComplaints();
      await fetchStats();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Mess Complaints</h1>
      </div>

      {/* Statistics Cards */}
      {stats && stats.totalComplaints > 0 && (
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Total Complaints</div>
            <div className="text-2xl font-bold">{stats.totalComplaints}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Open</div>
            <div className="text-2xl font-bold text-red-600">{stats.openCount}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm">In Progress</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.inProgressCount}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Resolved</div>
            <div className="text-2xl font-bold text-blue-600">{stats.resolvedCount}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Avg Resolution Time</div>
            <div className="text-2xl font-bold">{stats.averageResolutionTime} days</div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Status</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading complaints...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Student</th>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {complaints && complaints.length > 0 ? (
                complaints.map((complaint) => (
                  <tr key={complaint.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {complaint.student?.firstName} {complaint.student?.lastName}
                    </td>
                    <td className="px-4 py-3 font-semibold">{complaint.title}</td>
                    <td className="px-4 py-3 text-sm">{complaint.category || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded text-sm ${complaintService.getStatusColor(complaint.status)}`}>
                        {complaintService.formatStatus(complaint.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {complaintService.formatDate(complaint.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {complaint.status === 'OPEN' && (
                          <button
                            onClick={() => handleStatusChange(complaint.id, 'IN_PROGRESS')}
                            className="text-yellow-600 hover:text-yellow-800 text-sm"
                          >
                            Start
                          </button>
                        )}
                        {complaint.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => handleStatusChange(complaint.id, 'RESOLVED')}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Resolve
                          </button>
                        )}
                        {complaint.status === 'RESOLVED' && (
                          <button
                            onClick={() => handleStatusChange(complaint.id, 'CLOSED')}
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            Close
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No complaints found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="px-4 py-3 text-sm text-gray-600">
            Total: {totalRecords} complaint(s)
          </div>
        </div>
      )}
    </div>
  );
}
