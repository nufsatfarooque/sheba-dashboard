import React from 'react';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

const ShapExplanation = ({ topFactors }) => {
  const getImpactIcon = (impact) => {
    return impact > 0 ? (
      <TrendingUp className="text-red-500" size={16} />
    ) : (
      <TrendingDown className="text-green-500" size={16} />
    );
  };

  const getFeatureLabel = (feature) => {
    const labels = {
      days_since_last_booking: 'Days Since Last Booking',
      searched_competitor: 'Searched Competitors',
      complaints_count: 'Number of Complaints',
      num_bookings: 'Total Bookings',
      avg_spent: 'Average Spending',
      price_sensitivity_score: 'Price Sensitivity',
    };
    return labels[feature] || feature;
  };

  const getFeatureDescription = (feature, value) => {
    const descriptions = {
      days_since_last_booking: `${value} days inactive`,
      searched_competitor: value ? 'Recently searched competitors' : 'No competitor searches',
      complaints_count: `${value} complaints filed`,
      num_bookings: `${value} total bookings`,
      avg_spent: `Tk ${value} average spending`,
      price_sensitivity_score: `Score: ${value}`,
    };
    return descriptions[feature] || `Value: ${value}`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="text-blue-500" size={20} />
        <h3 className="text-lg font-semibold">Why is this customer at risk?</h3>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        These are the top factors contributing to the churn prediction:
      </p>
      <div className="space-y-4">
        {topFactors.map((factor, index) => (
          <div key={index} className="border-l-4 border-blue-500 pl-4">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-gray-900">
                {getFeatureLabel(factor.feature)}
              </span>
              <div className="flex items-center gap-2">
                {getImpactIcon(factor.impact)}
                <span className="text-sm font-semibold text-gray-700">
                  Impact: {(factor.impact * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              {getFeatureDescription(factor.feature, factor.value)}
            </p>
            <div className="mt-2 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${Math.abs(factor.impact) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-gray-700">
          <strong>How to read this:</strong> Higher impact values mean the feature
          contributes more to the churn prediction. Positive impacts increase churn
          risk, while negative impacts decrease it.
        </p>
      </div>
    </div>
  );
};

export default ShapExplanation;