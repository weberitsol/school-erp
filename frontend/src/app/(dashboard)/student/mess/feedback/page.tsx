'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { feedbackService, MealFeedback } from '@/services/mess/feedback.service';

export default function StudentFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<MealFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    mealId: '',
    rating: 'GOOD' as 'POOR' | 'AVERAGE' | 'GOOD' | 'EXCELLENT',
    comments: '',
  });

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await feedbackService.getStudentFeedback();
      setFeedbacks(response);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.mealId || !formData.rating) {
        setError('Meal and rating are required');
        return;
      }

      await feedbackService.createFeedback(
        formData.mealId,
        formData.rating,
        formData.comments
      );

      setShowForm(false);
      setFormData({
        mealId: '',
        rating: 'GOOD',
        comments: '',
      });
      setError('');
      await fetchFeedbacks();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Meal Feedback</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <Plus size={20} />
          Give Feedback
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Feedback Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-2xl font-bold mb-4">Give Feedback</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Meal*</label>
              <input
                type="text"
                placeholder="Enter meal ID"
                value={formData.mealId}
                onChange={(e) => setFormData({ ...formData, mealId: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Rating*</label>
              <select
                value={formData.rating}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rating: e.target.value as 'POOR' | 'AVERAGE' | 'GOOD' | 'EXCELLENT',
                  })
                }
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="POOR">Poor</option>
                <option value="AVERAGE">Average</option>
                <option value="GOOD">Good</option>
                <option value="EXCELLENT">Excellent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Comments</label>
              <textarea
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                className="w-full border rounded px-3 py-2"
                rows={4}
                placeholder="Share your feedback..."
              />
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Submit Feedback
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
        <div className="text-center py-8">Loading feedbacks...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {feedbacks && feedbacks.length > 0 ? (
            feedbacks.map((feedback) => (
              <div key={feedback.id} className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold">{feedback.meal?.name || 'Meal'}</h3>
                    <p className="text-sm text-gray-600">
                      {feedbackService.formatDate(feedback.createdAt)}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded text-sm ${feedbackService.getRatingColor(feedback.rating)}`}>
                    {feedbackService.formatRating(feedback.rating)}
                  </span>
                </div>
                {feedback.comments && (
                  <p className="text-gray-700">{feedback.comments}</p>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
              No feedbacks given yet
            </div>
          )}
        </div>
      )}
    </div>
  );
}
