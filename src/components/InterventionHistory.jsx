import React, { useState, useEffect } from 'react';
import { History, CheckCircle, Download } from 'lucide-react';
import apiService from '../services/api';

const InterventionHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await apiService.getInterventionHistory();
      setHistory(data);
    } catch (err) {
      setError('Failed to load intervention history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (history.length === 0) return;

    const headers = [
      'Customer ID',
      'Action Type',
      'Discount Amount',
      'Expected ROI',
      'Executed At',
      'Status'
    ];

    const rows = history.map(item => [
      item.customer_id,
      item.intervention.recommendation.action,
      `Tk ${item.intervention.recommendation.discount_amount}`,
      `${item.intervention.recommendation.expected_roi.toFixed(1)}%`,
      new Date(item.executed_at).toLocaleString(),
      item.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `intervention-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="text-purple-600" size={20} />
          <h3 className="text-lg font-semibold">Intervention History</h3>
        </div>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="text-purple-600" size={20} />
          <h3 className="text-lg font-semibold">Intervention History</h3>
        </div>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <History className="text-purple-600" size={20} />
          <h3 className="text-lg font-semibold">Intervention History</h3>
          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
            {history.length}
          </span>
        </div>
        {history.length > 0 && (
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Download size={16} />
            Export CSV
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-8">
          <History className="mx-auto text-gray-300 mb-2" size={48} />
          <p className="text-gray-500">No interventions executed yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Execute interventions from the customer details modal
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {history.map((item, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-gray-900">
                    {item.customer_id}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(item.executed_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-green-500" size={16} />
                  <span className="text-xs font-semibold text-green-600 uppercase">
                    {item.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Action</p>
                  <p className="font-semibold capitalize">
                    {item.intervention.recommendation.action.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Discount</p>
                  <p className="font-semibold">
                    Tk {item.intervention.recommendation.discount_amount}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Expected ROI</p>
                  <p className="font-semibold text-green-600">
                    {item.intervention.recommendation.expected_roi.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Retention Rate</p>
                  <p className="font-semibold">
                    {(item.intervention.recommendation.expected_retention_rate * 100).toFixed(0)}%
                  </p>
                </div>
              </div>

              {item.intervention.recommendation.message_template && (
                <div className="mt-3 bg-gray-50 rounded p-2">
                  <p className="text-xs text-gray-700 italic">
                    "{item.intervention.recommendation.message_template}"
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InterventionHistory;
