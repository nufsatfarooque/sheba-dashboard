import React, { useState, useEffect } from 'react';
import { X, Loader } from 'lucide-react';
import apiService from '../services/api';
import ShapExplanation from './ShapExplanation';

const CustomerModal = ({ customer, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [churnDetails, setChurnDetails] = useState(null);
  const [intervention, setIntervention] = useState(null);
  const [error, setError] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [executed, setExecuted] = useState(false);

  useEffect(() => {
    if (customer) {
      fetchCustomerDetails();
    }
  }, [customer]);

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch detailed churn prediction with SHAP values
      const churnData = await apiService.getCustomerChurnPrediction(
        customer.customer_id
      );

      // Fetch intervention recommendation using the rules engine
      const interventionData = await apiService.getInterventionRecommendation(
        customer.customer_id,
        customer // Pass customer data to use rules engine
      );

      setChurnDetails(churnData);
      setIntervention(interventionData);

      // Check if intervention already executed
      const history = await apiService.getInterventionHistory(customer.customer_id);
      if (history && history.length > 0) {
        setExecuted(true);
      }
    } catch (err) {
      setError('Failed to load customer details. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTakeAction = async () => {
    if (!intervention || executing) return;

    try {
      setExecuting(true);
      setError(null);

      // Execute the intervention
      const result = await apiService.executeIntervention(
        customer.customer_id,
        intervention
      );

      console.log('Intervention executed:', result);
      setExecuted(true);

      // Show success message
      alert(`✅ Intervention sent successfully!\n\nAction: ${intervention.recommendation.action}\nMessage: ${intervention.recommendation.message_template}`);
    } catch (err) {
      setError('Failed to execute intervention. Please try again.');
      console.error(err);
    } finally {
      setExecuting(false);
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
                <div className={`border rounded-lg p-6 ${
                  intervention.recommendation.action === 'no_action'
                    ? 'bg-gray-50 border-gray-200'
                    : 'bg-green-50 border-green-200'
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className={`text-lg font-semibold ${
                      intervention.recommendation.action === 'no_action'
                        ? 'text-gray-900'
                        : 'text-green-900'
                    }`}>
                      {intervention.recommendation.action === 'no_action'
                        ? 'No Action Needed'
                        : 'Recommended Action'}
                    </h3>
                    {executed && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                        Already Sent
                      </span>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm text-gray-600">Action Type</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {intervention.recommendation.action.replace('_', ' ').toUpperCase()}
                        </p>
                      </div>
                      {intervention.recommendation.discount_amount > 0 && (
                        <div>
                          <p className="text-sm text-gray-600">Discount Amount</p>
                          <p className="text-sm font-semibold text-gray-900">
                            Tk {intervention.recommendation.discount_amount}
                          </p>
                        </div>
                      )}
                      {intervention.recommendation.discount_code && (
                        <div>
                          <p className="text-sm text-gray-600">Discount Code</p>
                          <p className="text-sm font-mono font-semibold text-blue-600">
                            {intervention.recommendation.discount_code}
                          </p>
                        </div>
                      )}
                      {intervention.recommendation.priority && (
                        <div>
                          <p className="text-sm text-gray-600">Priority</p>
                          <p className={`text-sm font-semibold uppercase ${
                            intervention.recommendation.priority === 'high'
                              ? 'text-red-600'
                              : intervention.recommendation.priority === 'medium'
                              ? 'text-yellow-600'
                              : 'text-gray-600'
                          }`}>
                            {intervention.recommendation.priority}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="bg-white rounded p-3">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        Message Template:
                      </p>
                      <p className="text-sm text-gray-700 italic">
                        {intervention.recommendation.message_template}
                      </p>
                    </div>
                    {intervention.recommendation.sms_template && (
                      <div className="bg-white rounded p-3">
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          SMS Template:
                        </p>
                        <p className="text-xs text-gray-700 font-mono">
                          {intervention.recommendation.sms_template}
                        </p>
                      </div>
                    )}
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
                          {intervention.recommendation.expected_roi.toFixed(1)}%
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
          {intervention && intervention.recommendation.action !== 'no_action' && (
            <button
              onClick={handleTakeAction}
              disabled={executing || executed}
              className={`px-4 py-2 rounded-lg font-semibold ${
                executed
                  ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                  : executing
                  ? 'bg-blue-400 text-white cursor-wait'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {executing ? (
                <span className="flex items-center gap-2">
                  <Loader className="animate-spin" size={16} />
                  Sending...
                </span>
              ) : executed ? (
                'Action Sent'
              ) : (
                'Take Action'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerModal;