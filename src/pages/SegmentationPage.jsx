import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Users, TrendingUp, AlertCircle, Target, RefreshCw, Zap } from 'lucide-react';
import apiService from '../services/api';

const SegmentationPage = () => {
  const navigate = useNavigate();
  const { segmentName } = useParams();

  const [segments, setSegments] = useState(null);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [selectedSegmentDetails, setSelectedSegmentDetails] = useState(null);
  const [segmentCustomers, setSegmentCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recalculating, setRecalculating] = useState(false);
  const [recalcResult, setRecalcResult] = useState(null);

  useEffect(() => {
    fetchSegments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (segmentName && segments) {
      handleSegmentClick(segmentName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segmentName, segments]);

  const fetchSegments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getAllSegments();
      setSegments(data);
    } catch (err) {
      setError('Failed to load segments. Please try again.');
      console.error('Segments error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSegmentClick = async (segment) => {
    try {
      setLoading(true);
      setSelectedSegment(segment);

      // Fetch segment details
      const details = await apiService.getSegmentDetails(segment);
      setSelectedSegmentDetails(details);

      // Fetch segment customers
      const customers = await apiService.getSegmentCustomers(segment, 10);
      setSegmentCustomers(customers.customers || []);

    } catch (err) {
      console.error('Error fetching segment details:', err);
      setError('Failed to load segment details');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedSegment(null);
    setSelectedSegmentDetails(null);
    setSegmentCustomers([]);
    if (segmentName) {
      navigate('/segments');
    }
  };

  const handleRecalculate = async () => {
    if (!window.confirm('Are you sure you want to recalculate customer segments? This will update all segment assignments.')) {
      return;
    }

    try {
      setRecalculating(true);
      setRecalcResult(null);
      setError(null);

      console.log('Starting re-segmentation...');
      const result = await apiService.recalculateSegments();

      console.log('Re-segmentation result:', result);
      setRecalcResult(result);

      // Refresh segments data
      setTimeout(async () => {
        await fetchSegments();
        setRecalculating(false);
      }, 1000);

    } catch (err) {
      console.error('Recalculation error:', err);
      setError('Failed to recalculate segments: ' + err.message);
      setRecalculating(false);
    }
  };

  if (loading && !segments) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4 text-blue-500" size={48} />
          <p className="text-gray-600">Loading segments...</p>
        </div>
      </div>
    );
  }

  if (error && !segments) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={fetchSegments}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={20} />
                <span>Dashboard</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Customer Segmentation</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {segments?.total_customers?.toLocaleString()} customers across {segments?.segment_count} segments
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRecalculate}
                disabled={recalculating}
                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {recalculating ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Recalculating...
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    Recalculate
                  </>
                )}
              </button>
              <button
                onClick={fetchSegments}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Success Message */}
        {recalcResult && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <Zap className="text-green-600" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-900 mb-1">
                  Segmentation Recalculated Successfully!
                </h3>
                <p className="text-sm text-green-700 mb-2">{recalcResult.message}</p>
                {recalcResult.summary && (
                  <div className="text-sm text-green-800">
                    <p>Total Customers: {recalcResult.summary.total_customers?.toLocaleString()}</p>
                    <p>Segments: {recalcResult.summary.segment_count}</p>
                    <div className="mt-2">
                      {Object.entries(recalcResult.summary.segments || {}).map(([segment, count]) => (
                        <span key={segment} className="inline-block mr-3 text-xs">
                          {segment}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setRecalcResult(null)}
                  className="mt-3 text-xs text-green-600 hover:text-green-700 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {!selectedSegment ? (
          <>
            {/* Overview Section */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Segment Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {segments?.metadata && Object.entries(segments.metadata).map(([name, data]) => (
                  <div
                    key={name}
                    onClick={() => handleSegmentClick(name)}
                    className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
                    style={{ borderLeft: `4px solid ${data.color}` }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
                      <Users size={20} style={{ color: data.color }} />
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">
                      {data.count.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500 mb-3">
                      {data.percentage}% of customers
                    </p>
                    <p className="text-xs text-gray-600 line-clamp-2">{data.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Segment Characteristics Comparison */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Segment Characteristics</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Segment</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Customers</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Avg Spent</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Avg Bookings</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Satisfaction</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Tenure (months)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {segments?.metadata && Object.entries(segments.metadata).map(([name, data]) => (
                      <tr
                        key={name}
                        onClick={() => handleSegmentClick(name)}
                        className="border-b hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: data.color }}
                            ></div>
                            <span className="font-medium text-gray-900">{name}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4 text-gray-700">{data.count.toLocaleString()}</td>
                        <td className="text-right py-3 px-4 text-gray-700">
                          Tk {data.characteristics.avg_spent.toFixed(2)}
                        </td>
                        <td className="text-right py-3 px-4 text-gray-700">
                          {data.characteristics.num_bookings.toFixed(1)}
                        </td>
                        <td className="text-right py-3 px-4 text-gray-700">
                          {data.characteristics.satisfaction_score.toFixed(1)}/5
                        </td>
                        <td className="text-right py-3 px-4 text-gray-700">
                          {data.characteristics.tenure.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Segment Detail View */}
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
            >
              <ArrowLeft size={18} />
              Back to All Segments
            </button>

            {selectedSegmentDetails && (
              <>
                {/* Segment Header */}
                <div
                  className="bg-white rounded-lg shadow p-6 mb-6"
                  style={{ borderLeft: `6px solid ${selectedSegmentDetails.color}` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {selectedSegmentDetails.segment_name}
                      </h2>
                      <p className="text-gray-600 mb-4">{selectedSegmentDetails.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Total Customers</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {selectedSegmentDetails.count.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Percentage</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {selectedSegmentDetails.percentage}%
                          </p>
                        </div>
                        {selectedSegmentDetails.churn_rate && (
                          <div>
                            <p className="text-sm text-gray-500">Churn Rate</p>
                            <p className="text-2xl font-bold text-red-600">
                              {(selectedSegmentDetails.churn_rate * 100).toFixed(0)}%
                            </p>
                          </div>
                        )}
                        {selectedSegmentDetails.avg_lifetime_value && (
                          <div>
                            <p className="text-sm text-gray-500">Avg LTV</p>
                            <p className="text-2xl font-bold text-green-600">
                              Tk {selectedSegmentDetails.avg_lifetime_value.toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Segment Metrics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Characteristics */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Target className="text-blue-600" size={20} />
                      Key Characteristics
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(selectedSegmentDetails.characteristics).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 capitalize">
                            {key.replace(/_/g, ' ')}
                          </span>
                          <span className="font-medium text-gray-900">
                            {typeof value === 'number' ? value.toFixed(2) : value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommended Interventions */}
                  {selectedSegmentDetails.recommended_interventions && (
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp className="text-green-600" size={20} />
                        Recommended Interventions
                      </h3>
                      <ul className="space-y-2">
                        {selectedSegmentDetails.recommended_interventions.map((intervention, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                            <AlertCircle size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                            <span>{intervention}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Sample Customers */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Sample Customers</h3>
                  {segmentCustomers.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Customer ID</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Segment</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Cluster</th>
                          </tr>
                        </thead>
                        <tbody>
                          {segmentCustomers.map((customer) => (
                            <tr key={customer.customer_id} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4 text-sm font-medium text-gray-900">
                                {customer.customer_id}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-700">{customer.segment}</td>
                              <td className="py-3 px-4 text-sm text-gray-700">{customer.cluster}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No customers found in this segment.</p>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default SegmentationPage;
