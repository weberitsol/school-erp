'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, AlertTriangle, User } from 'lucide-react';
import { allergenService, studentAllergyService, type Allergen, type StudentAllergy, type AllergenSeverity } from '@/services/mess';

export default function AllergensManagementPage() {
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [studentAllergies, setStudentAllergies] = useState<StudentAllergy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'allergens' | 'student-allergies'>('allergens');
  const [showForm, setShowForm] = useState(false);
  const [editingAllergen, setEditingAllergen] = useState<Allergen | null>(null);
  const [showAllergyForm, setShowAllergyForm] = useState(false);
  const [editingAllergy, setEditingAllergy] = useState<StudentAllergy | null>(null);

  const [allergenForm, setAllergenForm] = useState<{ name: string; code: string; severity: AllergenSeverity }>({ name: '', code: '', severity: 'MILD' });
  const [allergyForm, setAllergyForm] = useState<{
    studentId: string;
    allergenId: string;
    severity: AllergenSeverity;
    doctorName: string;
    doctorContactNumber: string;
    verificationDocumentUrl: string;
  }>({
    studentId: '',
    allergenId: '',
    severity: 'MILD',
    doctorName: '',
    doctorContactNumber: '',
    verificationDocumentUrl: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [allergensData, allergiesData] = await Promise.all([
        allergenService.getAll({}),
        studentAllergyService.getAll({}),
      ]);
      setAllergens(allergensData.data);
      setStudentAllergies(allergiesData.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAllergen = async () => {
    if (!allergenForm.name.trim() || !allergenForm.code.trim()) {
      alert('Please enter both allergen name and code');
      return;
    }

    try {
      await allergenService.create(allergenForm);
      await fetchData();
      setAllergenForm({ name: '', code: '', severity: 'MILD' });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create allergen');
    }
  };

  const handleCreateAllergy = async () => {
    if (!allergyForm.studentId || !allergyForm.allergenId || !allergyForm.doctorName) {
      alert('Please fill in all required fields including doctor information');
      return;
    }

    try {
      await studentAllergyService.create(allergyForm);
      await fetchData();
      setAllergyForm({
        studentId: '',
        allergenId: '',
        severity: 'MILD',
        doctorName: '',
        doctorContactNumber: '',
        verificationDocumentUrl: '',
      });
      setShowAllergyForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create allergy');
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors: { [key: string]: string } = {
      MILD: 'bg-yellow-100 text-yellow-800',
      MODERATE: 'bg-orange-100 text-orange-800',
      SEVERE: 'bg-red-100 text-red-800',
      ANAPHYLAXIS: 'bg-red-200 text-red-900',
    };
    return colors[severity] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            Allergen Safety Management
          </h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6 border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('allergens')}
              className={`px-6 py-4 font-medium ${
                activeTab === 'allergens'
                  ? 'border-b-2 border-red-600 text-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Master Allergens
            </button>
            <button
              onClick={() => setActiveTab('student-allergies')}
              className={`px-6 py-4 font-medium ${
                activeTab === 'student-allergies'
                  ? 'border-b-2 border-red-600 text-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Student Allergies (Doctor-Verified)
            </button>
          </div>
        </div>

        {/* Allergens Tab */}
        {activeTab === 'allergens' && (
          <div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 mb-6"
            >
              <Plus className="w-5 h-5" />
              Add Master Allergen
            </button>

            {showForm && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4">Add New Allergen</h2>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Allergen name (e.g., Peanuts, Shellfish)"
                    value={allergenForm.name}
                    onChange={e => setAllergenForm({ ...allergenForm, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                  <input
                    type="text"
                    placeholder="Allergen code (e.g., PNT, SHF)"
                    value={allergenForm.code}
                    onChange={e => setAllergenForm({ ...allergenForm, code: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                  <select
                    value={allergenForm.severity}
                    onChange={e => setAllergenForm({ ...allergenForm, severity: e.target.value as AllergenSeverity })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                  >
                    <option value="MILD">Mild</option>
                    <option value="MODERATE">Moderate</option>
                    <option value="SEVERE">Severe</option>
                    <option value="ANAPHYLAXIS">Anaphylaxis (Life-Threatening)</option>
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateAllergen}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
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

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Allergen Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Severity Level</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {allergens.map(allergen => (
                    <tr key={allergen.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium">{allergen.name}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(allergen.severity)}`}>
                          {allergen.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button className="text-blue-600 hover:text-blue-800">Edit</button>
                        <button className="text-red-600 hover:text-red-800">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Student Allergies Tab */}
        {activeTab === 'student-allergies' && (
          <div>
            <button
              onClick={() => setShowAllergyForm(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 mb-6"
            >
              <Plus className="w-5 h-5" />
              Record Student Allergy
            </button>

            {showAllergyForm && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-l-4 border-red-600">
                <h2 className="text-2xl font-bold mb-4">⚠️ Doctor-Verified Allergy Record</h2>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Student ID"
                    value={allergyForm.studentId}
                    onChange={e => setAllergyForm({ ...allergyForm, studentId: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                  <select
                    value={allergyForm.allergenId}
                    onChange={e => setAllergyForm({ ...allergyForm, allergenId: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Select Allergen</option>
                    {allergens.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.severity})</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Doctor Name (Required)"
                    value={allergyForm.doctorName}
                    onChange={e => setAllergyForm({ ...allergyForm, doctorName: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                  <input
                    type="tel"
                    placeholder="Doctor Contact Number"
                    value={allergyForm.doctorContactNumber}
                    onChange={e => setAllergyForm({ ...allergyForm, doctorContactNumber: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                  <input
                    type="url"
                    placeholder="Verification Document URL"
                    value={allergyForm.verificationDocumentUrl}
                    onChange={e => setAllergyForm({ ...allergyForm, verificationDocumentUrl: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateAllergy}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
                    >
                      Record Allergy
                    </button>
                    <button
                      onClick={() => setShowAllergyForm(false)}
                      className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Student ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Allergen</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Severity</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Doctor</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {studentAllergies.map(allergy => (
                    <tr key={allergy.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">{allergy.studentId}</td>
                      <td className="px-6 py-4 text-sm font-medium">{allergy.allergenId}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityColor(allergy.severity)}`}>
                          {allergy.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">{allergy.doctorName || '-'}</td>
                      <td className="px-6 py-4 text-sm">
                        {allergy.isVerified ? (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">✓ Verified</span>
                        ) : (
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold">⏳ Pending</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        {!allergy.isVerified && (
                          <button className="text-green-600 hover:text-green-800 text-xs font-semibold">Verify</button>
                        )}
                        <button className="text-red-600 hover:text-red-800 text-xs font-semibold">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
