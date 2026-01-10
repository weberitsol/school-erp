'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, Award, BookOpen } from 'lucide-react';
import { messStaffService, messService, type MessStaff, type CreateMessStaffDto } from '@/services/mess';

export default function MessStaffManagementPage() {
  const [staff, setStaff] = useState<MessStaff[]>([]);
  const [messes, setMesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<MessStaff | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMess, setSelectedMess] = useState<string | null>(null);
  const [activeOnly, setActiveOnly] = useState(true);
  const [showCertificationForm, setShowCertificationForm] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [certificationInput, setCertificationInput] = useState('');
  const [trainingInput, setTrainingInput] = useState('');

  const [formData, setFormData] = useState<CreateMessStaffDto>({
    firstName: '',
    lastName: '',
    position: '',
    messId: '',
    dateOfJoining: new Date().toISOString().split('T')[0],
    email: '',
    phone: '',
    department: '',
    certifications: [],
    trainingsCompleted: [],
  });

  const positions = ['Chef', 'Cook', 'Helper', 'Cleaner', 'Manager', 'Supervisor'];

  useEffect(() => {
    fetchStaff();
    fetchMesses();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters: any = {};
      if (selectedMess) filters.messId = selectedMess;
      if (activeOnly) filters.isActive = true;
      const data = await messStaffService.getAll(filters);
      setStaff(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch staff');
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

    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.position.trim() || !formData.messId) {
      alert('Please fill in required fields');
      return;
    }

    try {
      setError(null);

      if (editingStaff) {
        await messStaffService.update(editingStaff.id, formData);
      } else {
        await messStaffService.create(formData);
      }

      await fetchStaff();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save staff member');
      console.error('Error:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;

    try {
      await messStaffService.delete(id);
      await fetchStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete staff member');
    }
  };

  const handleEdit = (member: MessStaff) => {
    setEditingStaff(member);
    setFormData({
      firstName: member.firstName,
      lastName: member.lastName,
      position: member.position,
      messId: '', // This would need to be populated from the staff record
      dateOfJoining: member.dateOfJoining,
      email: member.email || '',
      phone: member.phone || '',
      department: member.department || '',
      certifications: member.certifications || [],
      trainingsCompleted: member.trainingsCompleted || [],
    });
    setShowForm(true);
  };

  const handleAddCertification = async () => {
    if (!selectedStaffId || !certificationInput.trim()) {
      alert('Please enter certification name');
      return;
    }

    try {
      await messStaffService.addCertification(selectedStaffId, certificationInput);
      await fetchStaff();
      setCertificationInput('');
      setShowCertificationForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add certification');
    }
  };

  const handleAddTraining = async () => {
    if (!selectedStaffId || !trainingInput.trim()) {
      alert('Please enter training name');
      return;
    }

    try {
      await messStaffService.recordTraining(selectedStaffId, trainingInput);
      await fetchStaff();
      setTrainingInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record training');
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      position: '',
      messId: '',
      dateOfJoining: new Date().toISOString().split('T')[0],
      email: '',
      phone: '',
      department: '',
      certifications: [],
      trainingsCompleted: [],
    });
    setEditingStaff(null);
    setShowForm(false);
  };

  const filteredStaff = staff.filter(member =>
    (member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.position.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!selectedMess || member.id) // Mess filtering would need messId in staff record
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
            <Users className="w-8 h-8 text-indigo-600" />
            Mess Staff Management
          </h1>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Staff
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
                placeholder="Search staff by name or position..."
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  if (e.target.value) {
                    setTimeout(fetchStaff, 300);
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              value={selectedMess || ''}
              onChange={e => {
                setSelectedMess(e.target.value || null);
                setTimeout(fetchStaff, 300);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Messes</option>
              {messes.map(mess => (
                <option key={mess.id} value={mess.id}>{mess.name}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <input
                type="checkbox"
                checked={activeOnly}
                onChange={e => {
                  setActiveOnly(e.target.checked);
                  setTimeout(fetchStaff, 300);
                }}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm">Active Only</span>
            </label>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">
              {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position *
                  </label>
                  <select
                    value={formData.position}
                    onChange={e => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Position</option>
                    {positions.map(pos => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mess *
                  </label>
                  <select
                    value={formData.messId}
                    onChange={e => setFormData({ ...formData, messId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Mess</option>
                    {messes.map(mess => (
                      <option key={mess.id} value={mess.id}>{mess.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Joining
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfJoining}
                    onChange={e => setFormData({ ...formData, dateOfJoining: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg"
                >
                  {editingStaff ? 'Update' : 'Create'}
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

        {/* Certification/Training Form */}
        {showCertificationForm && selectedStaffId && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-l-4 border-indigo-600">
            <h3 className="text-xl font-bold mb-4">Add Certification & Training</h3>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certification Name
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={certificationInput}
                    onChange={e => setCertificationInput(e.target.value)}
                    placeholder="e.g., Food Safety Certification"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleAddCertification}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                  >
                    Add
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Training Name
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={trainingInput}
                    onChange={e => setTrainingInput(e.target.value)}
                    placeholder="e.g., Advanced Cooking Techniques"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleAddTraining}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowCertificationForm(false)}
              className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Position</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Contact</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Certifications</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Trainings</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredStaff.length > 0 ? (
                  filteredStaff.map(member => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium">
                        {member.firstName} {member.lastName}
                      </td>
                      <td className="px-6 py-4 text-sm">{member.position}</td>
                      <td className="px-6 py-4 text-sm">
                        <div>
                          {member.email && <div className="text-gray-600">{member.email}</div>}
                          {member.phone && <div className="text-gray-600">{member.phone}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex flex-wrap gap-1">
                          {member.certifications && member.certifications.length > 0 ? (
                            member.certifications.map((cert, idx) => (
                              <span key={idx} className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                                {cert.substring(0, 15)}...
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 text-xs">None</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex flex-wrap gap-1">
                          {member.trainingsCompleted && member.trainingsCompleted.length > 0 ? (
                            member.trainingsCompleted.map((training, idx) => (
                              <span key={idx} className="bg-cyan-100 text-cyan-800 text-xs px-2 py-1 rounded">
                                {training.substring(0, 15)}...
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 text-xs">None</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button
                          onClick={() => {
                            setSelectedStaffId(member.id);
                            setShowCertificationForm(true);
                          }}
                          className="text-green-600 hover:text-green-800 inline-flex items-center gap-1"
                        >
                          <Award className="w-4 h-4" />
                          Cert
                        </button>
                        <button
                          onClick={() => handleEdit(member)}
                          className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(member.id)}
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
                      No staff members found. Add one to get started.
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
