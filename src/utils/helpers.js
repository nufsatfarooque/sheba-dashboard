// Format numbers with commas
export const formatNumber = (num) => {
  if (!num) return '0';
  return num.toLocaleString();
};

// Format currency in Taka
export const formatCurrency = (amount) => {
  if (!amount) return 'Tk 0';
  return `Tk ${amount.toLocaleString()}`;
};

// Format percentage
export const formatPercentage = (value, decimals = 1) => {
  if (!value) return '0%';
  return `${(value * 100).toFixed(decimals)}%`;
};

// Get risk color class
export const getRiskColor = (riskCategory) => {
  const colors = {
    Low: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-200'
    },
    Medium: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-200'
    },
    High: {
      bg: 'bg-orange-100',
      text: 'text-orange-800',
      border: 'border-orange-200'
    },
    Critical: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-200'
    }
  };
  return colors[riskCategory] || colors.Low;
};

// Calculate days ago text
export const formatDaysAgo = (days) => {
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
};

// Validate API response structure
export const validateDashboardResponse = (data) => {
  const required = [
    'total_customers',
    'at_risk_count',
    'critical_risk_count',
    'retention_rate',
    'risk_distribution',
    'segment_distribution'
  ];
  
  return required.every(field => data.hasOwnProperty(field));
};

// Sort customers by churn probability
export const sortByChurnRisk = (customers, order = 'desc') => {
  return [...customers].sort((a, b) => {
    if (order === 'desc') {
      return b.churn_probability - a.churn_probability;
    }
    return a.churn_probability - b.churn_probability;
  });
};

// Filter customers by risk category
export const filterByRiskCategory = (customers, category) => {
  if (!category || category === 'All') return customers;
  return customers.filter(c => c.risk_category === category);
};

// Export data to CSV
export const exportToCSV = (data, filename = 'export.csv') => {
  if (!data || data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(h => row[h]).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};