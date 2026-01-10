'use client';

import { useState, useEffect } from 'react';
import { Plus, AlertCircle, CheckCircle } from 'lucide-react';
import { feedbackService, MealFeedback, FeedbackAction } from '@/services/mess/feedback.service';

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<MealFeedback[]>([]);
  const [actions, setActions] = useState<FeedbackAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'feedback' | 'actions'>('feedback');
  const [selectedFeedback, setSelectedFeedback] = useState<MealFeedback | null>(null);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await feedbackService.getFeedback();
      setFeedbacks(response.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchActions = async () => {
    try {
      const response = await feedbackService.getFeedbackActions();
      setActions(response.data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchStats = async () => {
    try {
      const stats = await feedbackService.getSchoolFeedbackStats();
      setStats(stats);
    } catch (err: any) {
      console.error('Failed to fetch stats:', err.message);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
    fetchActions();
    fetchStats();
  }, []);

  const handleCreateAction = async (feedbackId: string) => {
    const actionDescription = prompt('Enter action description:');
    if (!actionDescription) return;

    try {
      const actionDate = new Date();
      await feedbackService.createFeedbackAction(feedbackId, actionDescription, actionDate);
      setError('');
      await fetchActions();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCompleteAction = async (actionId: string) => {
    try {
      await feedbackService.completeFeedbackAction(actionId);
      setError('');
      await fetchActions();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Meal Feedback Management</h1>
      </div>

      {/* Statistics Cards */}
      {stats && stats.totalFeedbacks > 0 && (
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Total Feedbacks</div>
            <div className="text-2xl font-bold">{stats.totalFeedbacks}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Excellent</div>
            <div className="text-2xl font-bold text-green-600">{stats.excellentCount}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Good</div>
            <div className="text-2xl font-bold text-blue-600">{stats.goodCount}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Average</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.averageCount}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-gray-600 text-sm">Average Rating</div>
            <div className="text-2xl font-bold">{stats.averageRating.toFixed(2)}</div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('feedback')}
          className={`px-4 py-2 font-semibold ${
            activeTab === 'feedback'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600'
          }`}
        >
          All Feedbacks
        </button>
        <button
          onClick={() => setActiveTab('actions')}
          className={`px-4 py-2 font-semibold ${
            activeTab === 'actions'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600'
          }`}
        >
          Actions ({actions.filter((a) => a.status === 'OPEN').length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading feedbacks...</div>
      ) : (
        <>
          {activeTab === 'feedback' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">Student</th>
                    <th className="px-4 py-3 text-left">Meal</th>
                    <th className="px-4 py-3 text-center">Rating</th>
                    <th className="px-4 py-3 text-left">Comments</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbacks && feedbacks.length > 0 ? (
                    feedbacks.map((feedback) => (
                      <tr key={feedback.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">
                          {feedback.student?.firstName} {feedback.student?.lastName}
                        </td>
                        <td className="px-4 py-3">
                          {feedback.meal?.name || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-3 py-1 rounded text-sm ${feedbackService.getRatingColor(feedback.rating)}`}>
                            {feedbackService.formatRating(feedback.rating)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{feedback.comments || '-'}</td>
                        <td className="px-4 py-3 text-sm">
                          {feedbackService.formatDate(feedback.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => {
                              setSelectedFeedback(feedback);
                              handleCreateAction(feedback.id);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Add Action
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No feedbacks found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="px-4 py-3 text-sm text-gray-600">
                Total: {feedbacks.length} feedback(s)
              </div>
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">Feedback</th>
                    <th className="px-4 py-3 text-left">Action Description</th>
                    <th className="px-4 py-3 text-left">Due Date</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {actions && actions.length > 0 ? (
                    actions.map((action) => (
                      <tr key={action.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">Feedback #{action.feedbackId.slice(0, 8)}</td>
                        <td className="px-4 py-3">{action.actionDescription}</td>
                        <td className="px-4 py-3 text-sm">
                          {feedbackService.formatDate(action.actionDate)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-3 py-1 rounded text-sm bg-yellow-100 text-yellow-800">
                            {action.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {action.status === 'OPEN' && (
                            <button
                              onClick={() => handleCompleteAction(action.id)}
                              className="text-green-600 hover:text-green-800 text-sm flex items-center gap-1"
                            >
                              <CheckCircle size={16} />
                              Complete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        No actions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="px-4 py-3 text-sm text-gray-600">
                Total: {actions.length} action(s)
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
