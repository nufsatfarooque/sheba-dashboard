import axios from 'axios';
import {
  mockDashboardStats,
  mockAtRiskCustomers,
  mockChurnPrediction,
  mockIntervention
} from './mockData';
import { generateInterventionRecommendation } from './interventionEngine';

// Backend API base URLs
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const CHURN_API_BASE_URL = process.env.REACT_APP_CHURN_API_URL || 'http://localhost:8000';
const PREDICTION_USE_MOCK = process.env.REACT_APP_PREDICTION_USE_MOCK === 'true';

const normalizeBaseUrl = (url) => {
  if (!url) {
    return '';
  }
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

// Toggle this to use mock data when backend is not available
const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK === 'true';

const api = axios.create({
  baseURL: normalizeBaseUrl(API_BASE_URL),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to simulate API delay
const mockDelay = (data, delay = 500) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
};

export const apiService = {
  // 1. GET /predictions/dashboard
  getDashboardStats: async () => {
    if (USE_MOCK_DATA) {
      console.log('🔧 Using mock dashboard stats');
      return mockDelay(mockDashboardStats);
    }
    
    try {
      const response = await api.get('/predictions/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  // 2. GET /predictions/at-risk
  getAtRiskCustomers: async (limit = 50) => {
    if (USE_MOCK_DATA) {
      console.log('🔧 Using mock at-risk customers');
      return mockDelay(mockAtRiskCustomers);
    }

    try {
      const response = await api.get(`/predictions/at-risk?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching at-risk customers:', error);
      throw error;
    }
  },

  // 3. POST /predict/churn - 🎯 KEY FOR SHAP EXPLANATIONS
  getCustomerChurnPrediction: async (customerId) => {
    if (USE_MOCK_DATA) {
      console.log('🔧 Using mock churn prediction for:', customerId);
      return mockDelay(mockChurnPrediction);
    }

    try {
      const response = await api.post('/predict/churn', {
        customer_id: customerId,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching churn prediction:', error);
      throw error;
    }
  },

  submitChurnPrediction: async (customerPayload) => {
    if (PREDICTION_USE_MOCK) {
      console.log('🔧 Using mock churn prediction payload submission');
      const enrichedFactors = (mockChurnPrediction.top_factors || []).map((factor) => ({
        ...factor,
        readable_name: factor.feature.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
      }));

      return mockDelay({
        ...mockChurnPrediction,
        prediction: mockChurnPrediction.prediction ?? 1,
        top_factors: enrichedFactors,
      });
    }

    try {
      const baseUrl = normalizeBaseUrl(CHURN_API_BASE_URL);
      const response = await axios.post(`${baseUrl}/predict/churn`, customerPayload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting churn prediction payload:', error);
      throw error;
    }
  },

  // 4. GET /segments
  getSegments: async () => {
    if (USE_MOCK_DATA) {
      console.log('🔧 Using mock segment data from dashboard stats');
      return mockDelay({ segments: mockDashboardStats.segment_distribution });
    }

    try {
      const response = await api.get('/segments');
      return response.data;
    } catch (error) {
      console.error('Error fetching segments:', error);
      throw error;
    }
  },

  // 5. POST /interventions/recommend
  getInterventionRecommendation: async (customerId, customerData = null) => {
    if (USE_MOCK_DATA) {
      console.log('🔧 Using intervention engine for:', customerId);

      // If customer data provided, use the rules engine
      if (customerData) {
        const recommendation = generateInterventionRecommendation(customerData);
        return mockDelay(recommendation);
      }

      // Otherwise use mock data
      return mockDelay(mockIntervention);
    }

    try {
      const response = await api.post('/interventions/recommend', {
        customer_id: customerId,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching intervention:', error);
      throw error;
    }
  },

  // 6. POST /interventions/execute - Execute an intervention action
  executeIntervention: async (customerId, interventionData) => {
    if (USE_MOCK_DATA) {
      console.log('✅ Executing intervention for:', customerId, interventionData);
      // In mock mode, just log to localStorage
      const executedInterventions = JSON.parse(localStorage.getItem('executed_interventions') || '[]');
      const execution = {
        customer_id: customerId,
        intervention: interventionData,
        executed_at: new Date().toISOString(),
        status: 'sent'
      };
      executedInterventions.push(execution);
      localStorage.setItem('executed_interventions', JSON.stringify(executedInterventions));

      return mockDelay({
        success: true,
        message: 'Intervention executed successfully',
        execution_id: `EXE-${Date.now()}`,
        ...execution
      });
    }

    try {
      const response = await api.post('/interventions/execute', {
        customer_id: customerId,
        intervention: interventionData
      });
      return response.data;
    } catch (error) {
      console.error('Error executing intervention:', error);
      throw error;
    }
  },

  // 7. GET /interventions/history - Get intervention history
  getInterventionHistory: async (customerId = null) => {
    if (USE_MOCK_DATA) {
      console.log('📜 Fetching intervention history');
      const history = JSON.parse(localStorage.getItem('executed_interventions') || '[]');

      if (customerId) {
        return mockDelay(history.filter(i => i.customer_id === customerId));
      }
      return mockDelay(history);
    }

    try {
      const url = customerId
        ? `/interventions/history?customer_id=${customerId}`
        : '/interventions/history';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching intervention history:', error);
      throw error;
    }
  },
};

export default apiService;