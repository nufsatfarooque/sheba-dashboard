import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import apiService from './services/api';
import KPICards from './components/KPICards';
import ChurnTable from './components/ChurnTable';
import SegmentChart from './components/SegmentChart';
import CustomerModal from './components/CustomerModal';

function App() {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [atRiskCustomers, setAtRiskCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 🔌 PLACEHOLDER: Fetch dashboard stats
      const stats = await apiService.getDashboardStats();
      setDashboardStats(stats);

      // 🔌 PLACEHOLDER: Fetch at-risk customers
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
          <button
            onClick={fetchDashboardData}
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Sheba Retention AI
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Customer Churn Prevention Dashboard
              </p>
            </div>
            <button
              onClick={fetchDashboardData}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* KPI Cards */}
        <KPICards stats={dashboardStats} />

        {/* Charts and Tables Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Segment Chart */}
          <div className="lg:col-span-1">
            <SegmentChart segments={dashboardStats?.segment_distribution} />
          </div>

          {/* Risk Distribution Chart */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Risk Distribution</h2>
            <div className="grid grid-cols-4 gap-4">
              {Object.entries(dashboardStats?.risk_distribution || {}).map(
                ([risk, count]) => (
                  <div key={risk} className="text-center">
                    <p className="text-3xl font-bold">{count}</p>
                    <p className="text-sm text-gray-500">{risk}</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* At-Risk Customers Table */}
        <ChurnTable
          customers={atRiskCustomers}
          onCustomerClick={handleCustomerClick}
        />
      </main>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <CustomerModal
          customer={selectedCustomer}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

export default App;