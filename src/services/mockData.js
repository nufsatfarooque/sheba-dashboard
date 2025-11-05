// Mock data for testing dashboard before backend is ready
export const mockDashboardStats = {
  total_customers: 10000,
  at_risk_count: 127,
  critical_risk_count: 45,
  retention_rate: 0.68,
  avg_churn_probability: 0.32,
  risk_distribution: {
    Low: 6500,
    Medium: 3373,
    High: 82,
    Critical: 45
  },
  segment_distribution: {
    "Price-Sensitive": 3200,
    "High-Value": 1500,
    "Quality-Focused": 2100,
    "Loyal": 2000,
    "Occasional": 1200
  }
};

export const mockAtRiskCustomers = {
  count: 127,
  customers: [
    {
      customer_id: "CUST12345",
      name: "Rahima Khan",
      churn_probability: 0.78,
      risk_category: "High",
      segment: "Price-Sensitive",
      last_booking_days: 52,
      total_spent: 4500
    },
    {
      customer_id: "CUST67890",
      name: "Ahmed Ali",
      churn_probability: 0.85,
      risk_category: "Critical",
      segment: "High-Value",
      last_booking_days: 38,
      total_spent: 12000
    },
    {
      customer_id: "CUST11223",
      name: "Fatima Begum",
      churn_probability: 0.72,
      risk_category: "High",
      segment: "Quality-Focused",
      last_booking_days: 45,
      total_spent: 8500
    },
    {
      customer_id: "CUST44556",
      name: "Karim Hassan",
      churn_probability: 0.65,
      risk_category: "High",
      segment: "Occasional",
      last_booking_days: 60,
      total_spent: 2300
    }
  ]
};

export const mockChurnPrediction = {
  customer_id: "CUST12345",
  churn_probability: 0.78,
  risk_category: "High",
  top_factors: [
    {
      feature: "days_since_last_booking",
      value: 52,
      impact: 0.34
    },
    {
      feature: "searched_competitor",
      value: true,
      impact: 0.21
    },
    {
      feature: "complaints_count",
      value: 2,
      impact: 0.13
    }
  ]
};

export const mockIntervention = {
  customer_id: "CUST12345",
  churn_probability: 0.78,
  segment: "Price-Sensitive",
  recommendation: {
    action: "discount_offer",
    discount_amount: 300,
    message_template: "Hi Rahima! We miss you. Get Tk 300 off your next booking. Use code: WELCOME300",
    discount_code: "WELCOME300",
    expected_retention_rate: 0.45,
    intervention_cost: 300,
    estimated_ltv: 6000,
    expected_roi: 18.0
  }
};