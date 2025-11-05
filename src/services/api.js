import axios from 'axios';
import {
  mockDashboardStats,
  mockAtRiskCustomers,
  mockChurnPrediction,
  mockIntervention
} from './mockData';

// 🔌 PLACEHOLDER: Backend API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Toggle this to use mock data when backend is not available
const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK === 'true';

const api = axios.create({
  baseURL: API_BASE_URL,
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
  getInterventionRecommendation: async (customerId) => {
    if (USE_MOCK_DATA) {
      console.log('🔧 Using mock intervention for:', customerId);
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
};

export default apiService;