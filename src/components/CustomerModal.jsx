import React, { useState, useEffect } from 'react';
import { X, Loader } from 'lucide-react';
import apiService from '../services/api';
import ShapExplanation from './ShapExplanation';

const CustomerModal = ({ customer, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [churnDetails, setChurnDetails] = useState(null);
  const [intervention, setIntervention] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (customer) {
      fetchCustomerDetails();
    }
  }, [customer]);

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // 🔌 PLACEHOLDER: Fetch detailed churn prediction with SHAP values
      const churnData = await apiService.getCustomerChurnPrediction(
        customer.customer_id
      );

      // 🔌 PLACEHOLDER: Fetch intervention recommendation
      const interventionData = await apiService.getInterventionRecommendation(
        customer.customer_id
      );

      setChurnDetails(churnData);
      setIntervention(interventionData);
    } catch (err) {
      setError('Failed to load customer details. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!customer) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">{customer.name}</h2>
            <p className="text-sm text-gray-500">{customer.customer_id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="animate-spin text-blue-500" size={32} />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Customer Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500">Churn Risk</p>
                  <p className="text-2xl font-bold text-red-600">
                    {(churnDetails.churn_probability * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500">Segment</p>
                  <p className="text-lg font-semibold">{customer.segment}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500">Total Spent</p>
                  <p className="text-lg font-semibold">
                    Tk {customer.total_spent?.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500">Last Booking</p>
                  <p className="text-lg font-semibold">
                    {customer.last_booking_days}d ago
                  </p>
                </div>
              </div>

              {/* SHAP Explanation */}
              {churnDetails?.top_factors && (
                <ShapExplanation topFactors={churnDetails.top_factors} />
              )}

              {/* Recommended Intervention */}
              {intervention && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-3 text-green-900">
                    Recommended Action
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-700">
                        <strong>Action:</strong> {intervention.recommendation.action}
                      </p>
                      <p className="text-sm text-gray-700">
                        <strong>Discount:</strong> Tk{' '}
                        {intervention.recommendation.discount_amount}
                      </p>
                    </div>
                    <div className="bg-white rounded p-3">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        Message Template:
                      </p>
                      <p className="text-sm text-gray-700 italic">
                        {intervention.recommendation.message_template}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">Expected Retention</p>
                        <p className="font-semibold">
                          {(intervention.recommendation.expected_retention_rate * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Cost</p>
                        <p className="font-semibold">
                          Tk {intervention.recommendation.intervention_cost}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Expected ROI</p>
                        <p className="font-semibold text-green-600">
                          {intervention.recommendation.expected_roi.toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Close
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Take Action
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerModal;