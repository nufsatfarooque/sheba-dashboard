import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import apiService from '../services/api';

const initialFormState = {
  tenure: '',
  citytier: '',
  warehousetohome: '',
  hourspendonapp: '',
  numberofdeviceregistered: '',
  satisfactionscore: '',
  maritalstatus: 'Single',
  numberofaddress: '',
  orderamounthikefromlastyear: '',
  couponused: '',
  ordercount: '',
  daysincelastorder: '',
  cashbackamount: '',
  gender: 'Female',
  complain: '',
  preferredlogindevice: '',
  preferredpaymentmode: '',
  preferedordercat: '',
};

const integerFields = [
  'citytier',
  'numberofdeviceregistered',
  'satisfactionscore',
  'numberofaddress',
  'couponused',
  'ordercount',
  'complain',
];

const floatFields = [
  'tenure',
  'warehousetohome',
  'hourspendonapp',
  'orderamounthikefromlastyear',
  'daysincelastorder',
  'cashbackamount',
];

const ChurnPrediction = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const buildPayload = () => {
    const payload = {};

    for (const key of Object.keys(formData)) {
      const value = formData[key];

      if (value === '' || value === null) {
        continue;
      }

      if (integerFields.includes(key)) {
        payload[key] = Number.parseInt(value, 10);
      } else if (floatFields.includes(key)) {
        payload[key] = Number.parseFloat(value);
      } else {
        payload[key] = value;
      }
    }

    return payload;
  };

  const validatePayload = (payload) => {
    const requiredFields = [
      'tenure',
      'citytier',
      'warehousetohome',
      'hourspendonapp',
      'numberofdeviceregistered',
      'satisfactionscore',
      'maritalstatus',
      'numberofaddress',
      'orderamounthikefromlastyear',
      'couponused',
      'ordercount',
      'daysincelastorder',
      'cashbackamount',
      'gender',
      'complain',
    ];

    const missing = requiredFields.filter((field) => payload[field] === undefined || payload[field] === null || Number.isNaN(payload[field]));

    if (missing.length > 0) {
      return `Please fill all required fields (${missing.join(', ')}).`;
    }

    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setResult(null);

    const payload = buildPayload();
    const validationError = validatePayload(payload);

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const response = await apiService.submitChurnPrediction(payload);
      setResult(response);
    } catch (err) {
      console.error('Prediction error:', err);
      const message = err?.response?.data?.detail || 'Failed to get prediction. Make sure the churn API server is running.';
      setError(Array.isArray(message) ? message.map((item) => item.msg).join(', ') : message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setError(null);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles size={26} className="text-blue-600" />
              Manual Churn Prediction
            </h1>
            <p className="text-sm text-gray-500 mt-1">Submit customer attributes to get churn probability with SHAP explanations.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100"
              type="button"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-1 gap-8">
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Customer Attributes</h2>
            <p className="text-sm text-gray-500 mb-6">
              Required fields match the FastAPI `CustomerInput` schema. Optional categorical overrides can be provided for device, payment mode, and order category.
            </p>

            <form className="grid md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
              {Object.entries(formData).map(([field, value]) => {
                const isOptional = ['preferredlogindevice', 'preferredpaymentmode', 'preferedordercat'].includes(field);
                const label = field
                  .replace(/([a-z])([A-Z])/g, '$1 $2')
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, (char) => char.toUpperCase());

                if (field === 'gender' || field === 'maritalstatus') {
                  const options = field === 'gender'
                    ? ['Female', 'Male', 'Other']
                    : ['Single', 'Married', 'Divorced', 'Widowed'];

                  return (
                    <label key={field} className="flex flex-col gap-2 text-sm text-gray-700">
                      <span className="font-medium">
                        {label}
                        {!isOptional && <span className="text-red-500"> *</span>}
                      </span>
                      <select
                        name={field}
                        value={value}
                        onChange={handleChange}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  );
                }

                const inputType = integerFields.includes(field) || floatFields.includes(field) ? 'number' : 'text';
                const step = floatFields.includes(field) ? '0.01' : '1';

                return (
                  <label key={field} className="flex flex-col gap-2 text-sm text-gray-700">
                    <span className="font-medium">
                      {label}
                      {!isOptional && <span className="text-red-500"> *</span>}
                    </span>
                    <input
                      type={inputType}
                      inputMode={inputType === 'number' ? 'decimal' : undefined}
                      step={inputType === 'number' ? step : undefined}
                      name={field}
                      value={value}
                      onChange={handleChange}
                      placeholder={isOptional ? 'Optional' : ''}
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={!isOptional}
                    />
                  </label>
                );
              })}

              <div className="md:col-span-2 flex flex-col sm:flex-row gap-3 mt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white ${
                    loading ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Predicting...
                    </>
                  ) : (
                    'Run Prediction'
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Clear Form
                </button>
              </div>
            </form>

            {error && (
              <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
          </section>

          {result && (
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-6">Prediction Result</h2>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-center">
                  <p className="text-sm text-blue-700 uppercase tracking-wide">Churn Probability</p>
                  <p className="text-3xl font-bold text-blue-900">{(result.churn_probability * 100).toFixed(1)}%</p>
                </div>
                <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 text-center">
                  <p className="text-sm text-purple-700 uppercase tracking-wide">Risk Category</p>
                  <p className="text-2xl font-semibold text-purple-900">{result.risk_category}</p>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-center">
                  <p className="text-sm text-green-700 uppercase tracking-wide">Prediction</p>
                  <p className="text-2xl font-semibold text-green-900">{result.prediction === 1 ? 'Likely to Churn' : 'Likely to Stay'}</p>
                </div>
              </div>

              {result.top_factors && result.top_factors.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Top Contributing Factors</h3>
                  <div className="space-y-3">
                    {result.top_factors.map((factor, index) => {
                      const impactValue = Number(factor.impact ?? 0);
                      const impactClass = impactValue >= 0 ? 'text-red-600' : 'text-green-600';
                      const badgeClass = impactValue >= 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
                      const readableName = factor.readable_name || factor.feature;
                      return (
                        <div key={`${factor.feature}-${index}`} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <div>
                              <p className="text-sm text-gray-500">{factor.feature}</p>
                              <p className="text-base font-semibold text-gray-900">{readableName}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>
                              Impact {impactValue >= 0 ? '+' : ''}{impactValue.toFixed(3)}
                            </span>
                          </div>
                          <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                            <div>
                              <p className="text-gray-500">Input Value</p>
                              <p className="font-semibold text-gray-900">{factor.value}</p>
                            </div>
                            <div className="md:col-span-2">
                              <p className="text-gray-500">Contribution</p>
                              <p className={`font-semibold ${impactClass}`}>
                                {impactValue >= 0 ? 'Increases churn risk' : 'Reduces churn risk'}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default ChurnPrediction;


