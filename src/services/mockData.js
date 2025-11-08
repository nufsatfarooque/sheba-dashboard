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

// Mock segment data - SYNCED WITH REAL MODEL DATA from segment_metadata.json
export const mockSegmentList = {
  total_customers: 10000,
  segment_count: 4,
  segments: {
    "High-Value": 1100,
    "Loyal": 2151,
    "Price-Sensitive": 2580,
    "Occasional": 4169
  },
  metadata: {
    "High-Value": {
      cluster_id: 0,
      count: 1100,
      percentage: 11.0,
      characteristics: {
        avg_spent: 16.17,
        num_bookings: 5.17,
        price_sensitivity_score: 0.374,
        complaints_count: 0.26,
        satisfaction_score: 3.62,
        tenure: 38.15,
        days_since_last_order: 26.56,
        order_growth: 13.45
      },
      description: "Premium customers with high spending and frequent bookings. Highest lifetime value and engagement.",
      color: "#10B981"
    },
    "Loyal": {
      cluster_id: 1,
      count: 2151,
      percentage: 21.5,
      characteristics: {
        avg_spent: 15.52,
        num_bookings: 5.4,
        price_sensitivity_score: 0.357,
        complaints_count: 1.47,
        satisfaction_score: 3.55,
        tenure: 9.12,
        days_since_last_order: 23.19,
        order_growth: 14.87
      },
      description: "Long-term customers with consistent booking patterns and high retention. Low churn risk.",
      color: "#8B5CF6"
    },
    "Price-Sensitive": {
      cluster_id: 2,
      count: 2580,
      percentage: 25.8,
      characteristics: {
        avg_spent: 34.15,
        num_bookings: 3.59,
        price_sensitivity_score: 0.758,
        complaints_count: 0.27,
        satisfaction_score: 3.62,
        tenure: 10.16,
        days_since_last_order: 55.13,
        order_growth: 12.65
      },
      description: "Customers who are highly responsive to discounts, coupons, and cashback offers. Focus on value and pricing.",
      color: "#3B82F6"
    },
    "Occasional": {
      cluster_id: 3,
      count: 4169,
      percentage: 41.7,
      characteristics: {
        avg_spent: 14.47,
        num_bookings: 5.64,
        price_sensitivity_score: 0.325,
        complaints_count: 0.0,
        satisfaction_score: 3.6,
        tenure: 8.16,
        days_since_last_order: 20.32,
        order_growth: 16.5
      },
      description: "Infrequent users with sporadic booking patterns. Potential for reactivation campaigns.",
      color: "#FCD34D"
    }
  }
};

export const mockSegmentDetails = {
  "Price-Sensitive": {
    segment_name: "Price-Sensitive",
    cluster_id: 2,
    count: 2580,
    percentage: 25.8,
    characteristics: {
      avg_spent: 34.15,
      num_bookings: 3.59,
      price_sensitivity_score: 0.893,
      complaints_count: 0.42,
      satisfaction_score: 3.62,
      tenure: 10.45,
      days_since_last_order: 52.14,
      order_growth: 12.18
    },
    description: "Customers who are highly responsive to discounts, coupons, and cashback offers. Focus on value and pricing.",
    color: "#3B82F6",
    churn_rate: 0.42,
    avg_lifetime_value: 5200,
    recommended_interventions: [
      "Discount offers (Tk 200-500)",
      "Cashback campaigns",
      "Budget service category promotion",
      "Seasonal discount bundles"
    ]
  },
  "High-Value": {
    segment_name: "High-Value",
    cluster_id: 1,
    count: 2151,
    percentage: 21.5,
    characteristics: {
      avg_spent: 15.52,
      num_bookings: 5.4,
      price_sensitivity_score: 0.401,
      complaints_count: 0.38,
      satisfaction_score: 3.55,
      tenure: 12.98,
      days_since_last_order: 23.19,
      order_growth: 14.87
    },
    description: "Premium customers with high spending and frequent bookings. Highest lifetime value and engagement.",
    color: "#10B981",
    churn_rate: 0.28,
    avg_lifetime_value: 18500,
    recommended_interventions: [
      "VIP loyalty program",
      "Premium service providers",
      "Priority booking access",
      "Personalized service packages"
    ]
  },
  "Loyal": {
    segment_name: "Loyal",
    cluster_id: 0,
    count: 1100,
    percentage: 11.0,
    characteristics: {
      avg_spent: 16.17,
      num_bookings: 5.17,
      price_sensitivity_score: 0.425,
      complaints_count: 0.41,
      satisfaction_score: 3.62,
      tenure: 12.45,
      days_since_last_order: 26.56,
      order_growth: 13.45
    },
    description: "Long-term customers with consistent booking patterns and high retention. Low churn risk.",
    color: "#8B5CF6",
    churn_rate: 0.18,
    avg_lifetime_value: 12800,
    recommended_interventions: [
      "Loyalty rewards program",
      "Referral incentives",
      "Exclusive early access",
      "Anniversary bonuses"
    ]
  },
  "Occasional": {
    segment_name: "Occasional",
    cluster_id: 3,
    count: 4169,
    percentage: 41.7,
    characteristics: {
      avg_spent: 14.47,
      num_bookings: 5.64,
      price_sensitivity_score: 0.385,
      complaints_count: 0.43,
      satisfaction_score: 3.6,
      tenure: 11.87,
      days_since_last_order: 20.32,
      order_growth: 16.5
    },
    description: "Infrequent users with sporadic booking patterns. Potential for reactivation campaigns.",
    color: "#FCD34D",
    churn_rate: 0.52,
    avg_lifetime_value: 3400,
    recommended_interventions: [
      "Re-engagement campaigns",
      "Service reminders (AC, electrical)",
      "First booking back discount",
      "Seasonal service promotions"
    ]
  }
};

export const mockSegmentCustomers = {
  "Price-Sensitive": {
    segment_name: "Price-Sensitive",
    total_count: 2580,
    offset: 0,
    limit: 50,
    customers: [
      {
        customer_id: "CUST00012",
        segment: "Price-Sensitive",
        cluster: 2
      },
      {
        customer_id: "CUST00025",
        segment: "Price-Sensitive",
        cluster: 2
      },
      {
        customer_id: "CUST00038",
        segment: "Price-Sensitive",
        cluster: 2
      },
      {
        customer_id: "CUST00041",
        segment: "Price-Sensitive",
        cluster: 2
      },
      {
        customer_id: "CUST00054",
        segment: "Price-Sensitive",
        cluster: 2
      }
    ]
  },
  "High-Value": {
    segment_name: "High-Value",
    total_count: 2151,
    offset: 0,
    limit: 50,
    customers: [
      {
        customer_id: "CUST00002",
        segment: "High-Value",
        cluster: 1
      },
      {
        customer_id: "CUST00015",
        segment: "High-Value",
        cluster: 1
      },
      {
        customer_id: "CUST00028",
        segment: "High-Value",
        cluster: 1
      }
    ]
  },
  "Loyal": {
    segment_name: "Loyal",
    total_count: 1100,
    offset: 0,
    limit: 50,
    customers: [
      {
        customer_id: "CUST00001",
        segment: "Loyal",
        cluster: 0
      },
      {
        customer_id: "CUST00014",
        segment: "Loyal",
        cluster: 0
      }
    ]
  },
  "Occasional": {
    segment_name: "Occasional",
    total_count: 4169,
    offset: 0,
    limit: 50,
    customers: [
      {
        customer_id: "CUST00003",
        segment: "Occasional",
        cluster: 3
      },
      {
        customer_id: "CUST00016",
        segment: "Occasional",
        cluster: 3
      },
      {
        customer_id: "CUST00029",
        segment: "Occasional",
        cluster: 3
      }
    ]
  }
};