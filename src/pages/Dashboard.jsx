import React, { useState, useEffect } from 'react';
import { RefreshCw, Brain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import KPICards from '../components/KPICards';
import ChurnTable from '../components/ChurnTable';
import SegmentChart from '../components/SegmentChart';
import CustomerModal from '../components/CustomerModal';
import InterventionHistory from '../components/InterventionHistory';

const Dashboard = () => {
  const navigate = useNavigate();
  const [dashboardStats, setDashboardStats] = useState(null);
  const [atRiskCustomers, setAtRiskCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const stats = await apiService.getDashboardStats();
      setDashboardStats(stats);

      const atRisk = await apiService.getAtRiskCustomers(50);
      setAtRiskCustomers(atRisk.customers);
    } catch (err) {
      setError('Failed to load dashboard data. Please check if the backend is running.');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerClick = (customer) => {
    setSelectedCustomer(customer);
  };

  const handleCloseModal = () => {
    setSelectedCustomer(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4 text-blue-500" size={48} />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <div className="space-y-3">
            <button
              onClick={fetchDashboardData}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
            <button
              onClick={() => navigate('/predict')}
              className="w-full border border-blue-600 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50"
            >
              Open Prediction Form
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sheba Retention AI</h1>
              <p className="text-sm text-gray-500 mt-1">Customer Churn Prevention Dashboard</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/predict')}
                className="flex items-center justify-center gap-2 border border-blue-600 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50"
              >
                <Brain size={18} />
                Churn Prediction
              </button>
              <button
                onClick={fetchDashboardData}
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
        <KPICards stats={dashboardStats} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-1">
            <SegmentChart segments={dashboardStats?.segment_distribution} />
          </div>

          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Risk Distribution</h2>
            <div className="grid grid-cols-4 gap-4">
              {Object.entries(dashboardStats?.risk_distribution || {}).map(([risk, count]) => (
                <div key={risk} className="text-center">
                  <p className="text-3xl font-bold">{count}</p>
                  <p className="text-sm text-gray-500">{risk}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <InterventionHistory />
        </div>

        <ChurnTable customers={atRiskCustomers} onCustomerClick={handleCustomerClick} />
      </main>

      {selectedCustomer && (
        <CustomerModal customer={selectedCustomer} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default Dashboard;


