'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Award, Search } from 'lucide-react';
import { performanceReviewService, type PerformanceReview } from '@/services/hr/performance-review.service';
import { employeeService } from '@/services/hr/employee.service';

export default function PerformanceReviewsPage() {
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    reviewCycleId: 'ANNUAL_2024',
    year: new Date().getFullYear(),
    technicalSkills: 3,
    communication: 3,
    teamwork: 3,
    initiative: 3,
    reliability: 3,
    customerService: 3,
    reviewedById: '',
    promotionEligible: false,
    raisesPercentage: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reviewsData, employeesData] = await Promise.all([
        performanceReviewService.getAll(),
        employeeService.getAll(),
      ]);
      setReviews(reviewsData.data);
      setEmployees(employeesData.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.reviewedById) {
      alert('Please fill all required fields');
      return;
    }

    try {
      await performanceReviewService.create({
        ...formData,
        reviewDate: new Date().toISOString(),
      });
      await fetchData();
      setShowForm(false);
      setFormData({
        employeeId: '',
        reviewCycleId: 'ANNUAL_2024',
        year: new Date().getFullYear(),
        technicalSkills: 3,
        communication: 3,
        teamwork: 3,
        initiative: 3,
        reliability: 3,
        customerService: 3,
        reviewedById: '',
        promotionEligible: false,
        raisesPercentage: 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save review');
    }
  };

  const filtered = reviews.filter(r =>
    r.employee?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.employee?.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-8 h-8 text-blue-600" />
            Performance Reviews
          </h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Review
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="mb-6 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by employee name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Add Performance Review</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
                  <select
                    value={formData.employeeId}
                    onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reviewer *</label>
                  <select
                    value={formData.reviewedById}
                    onChange={e => setFormData({ ...formData, reviewedById: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Reviewer</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                {['technicalSkills', 'communication', 'teamwork', 'initiative', 'reliability', 'customerService'].map(
                  skill => (
                    <div key={skill}>
                      <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                        {skill.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={(formData as any)[skill]}
                        onChange={e =>
                          setFormData({ ...formData, [skill]: parseInt(e.target.value) })
                        }
                        className="w-full"
                      />
                      <div className="text-center text-sm text-gray-600">
                        Rating: {(formData as any)[skill]}
                      </div>
                    </div>
                  )
                )}

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.promotionEligible}
                      onChange={e =>
                        setFormData({ ...formData, promotionEligible: e.target.checked })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium text-gray-700">Promotion Eligible</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
                >
                  Save Review
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(review => (
            <div key={review.id} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-2">
                {review.employee?.firstName} {review.employee?.lastName}
              </h3>
              <p className="text-sm text-gray-600 mb-4">Year: {review.year}</p>

              <div className="space-y-2 text-sm mb-4">
                <div>Technical Skills: <span className="font-semibold">{review.technicalSkills}/5</span></div>
                <div>Communication: <span className="font-semibold">{review.communication || 0}/5</span></div>
                <div>Teamwork: <span className="font-semibold">{review.teamwork || 0}/5</span></div>
                <div className="pt-2 border-t">
                  {review.promotionEligible && (
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded text-xs font-semibold">
                      Promotion Eligible
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
