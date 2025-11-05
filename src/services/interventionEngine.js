/**
 * Intervention Recommendations Engine
 *
 * Rules-based system (not ML) that generates personalized retention actions
 * based on customer churn risk and segment.
 *
 * Business Rules:
 * - High-risk + Price-Sensitive → Tk 300 discount
 * - High-risk + High-Value → Tk 500 discount
 * - Medium-risk → Maintenance reminder
 * - Low-risk → No action
 */

// Intervention types
export const InterventionType = {
  DISCOUNT_OFFER: 'discount_offer',
  MAINTENANCE_REMINDER: 'maintenance_reminder',
  PREMIUM_UPGRADE: 'premium_upgrade',
  NO_ACTION: 'no_action'
};

// Customer segments
export const CustomerSegment = {
  PRICE_SENSITIVE: 'Price-Sensitive',
  HIGH_VALUE: 'High-Value',
  QUALITY_FOCUSED: 'Quality-Focused',
  LOYAL: 'Loyal',
  OCCASIONAL: 'Occasional'
};

// Risk categories
export const RiskCategory = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical'
};

/**
 * Main recommendation engine
 * @param {Object} customer - Customer data with churn_probability and segment
 * @returns {Object} Intervention recommendation with action details and ROI
 */
export function generateInterventionRecommendation(customer) {
  const {
    customer_id,
    name,
    churn_probability,
    segment,
    risk_category,
    total_spent = 0,
    last_booking_days = 0
  } = customer;

  // Determine risk level from probability if not provided
  const riskLevel = risk_category || getRiskCategory(churn_probability);

  // Apply business rules
  const recommendation = applyInterventionRules(
    riskLevel,
    segment,
    churn_probability,
    total_spent,
    last_booking_days,
    name
  );

  return {
    customer_id,
    churn_probability,
    segment,
    risk_category: riskLevel,
    recommendation,
    generated_at: new Date().toISOString()
  };
}

/**
 * Apply intervention rules based on risk + segment
 */
function applyInterventionRules(riskLevel, segment, churnProb, totalSpent, daysSinceBooking, name) {
  const firstName = name ? name.split(' ')[0] : 'Valued Customer';

  // Rule 1: High/Critical risk + Price-Sensitive → Tk 300 discount
  if ((riskLevel === RiskCategory.HIGH || riskLevel === RiskCategory.CRITICAL) &&
      segment === CustomerSegment.PRICE_SENSITIVE) {
    return createDiscountOffer(300, firstName, totalSpent, churnProb);
  }

  // Rule 2: High/Critical risk + High-Value → Tk 500 discount
  if ((riskLevel === RiskCategory.HIGH || riskLevel === RiskCategory.CRITICAL) &&
      segment === CustomerSegment.HIGH_VALUE) {
    return createDiscountOffer(500, firstName, totalSpent, churnProb);
  }

  // Rule 3: High/Critical risk + Quality-Focused → Premium service upgrade
  if ((riskLevel === RiskCategory.HIGH || riskLevel === RiskCategory.CRITICAL) &&
      segment === CustomerSegment.QUALITY_FOCUSED) {
    return createPremiumUpgradeOffer(firstName, totalSpent, churnProb);
  }

  // Rule 4: High/Critical risk + Loyal → Personalized discount
  if ((riskLevel === RiskCategory.HIGH || riskLevel === RiskCategory.CRITICAL) &&
      segment === CustomerSegment.LOYAL) {
    return createDiscountOffer(400, firstName, totalSpent, churnProb);
  }

  // Rule 5: High/Critical risk + Occasional → Win-back campaign
  if ((riskLevel === RiskCategory.HIGH || riskLevel === RiskCategory.CRITICAL) &&
      segment === CustomerSegment.OCCASIONAL) {
    return createDiscountOffer(250, firstName, totalSpent, churnProb);
  }

  // Rule 6: Medium risk → Maintenance reminder
  if (riskLevel === RiskCategory.MEDIUM) {
    return createMaintenanceReminder(firstName, daysSinceBooking);
  }

  // Rule 7: Low risk → No action needed
  return createNoAction(firstName);
}

/**
 * Create discount offer recommendation
 */
function createDiscountOffer(discountAmount, firstName, totalSpent, churnProb) {
  const discountCode = generateDiscountCode(discountAmount);
  const estimatedLTV = estimateCustomerLifetimeValue(totalSpent);
  const interventionCost = discountAmount;
  const expectedRetentionRate = calculateExpectedRetention(churnProb, discountAmount);
  const expectedROI = calculateROI(estimatedLTV, interventionCost, expectedRetentionRate);

  return {
    action: InterventionType.DISCOUNT_OFFER,
    discount_amount: discountAmount,
    discount_code: discountCode,
    message_template: `Hi ${firstName}! We miss you 😊 Get Tk ${discountAmount} off your next service with code ${discountCode}. Book now!`,
    sms_template: `Sheba.xyz: ${firstName}, we value you! Use code ${discountCode} for Tk ${discountAmount} off. Book: sheba.xyz`,
    email_subject: `${firstName}, Here's Tk ${discountAmount} Just For You!`,
    expected_retention_rate: expectedRetentionRate,
    intervention_cost: interventionCost,
    estimated_ltv: estimatedLTV,
    expected_roi: expectedROI,
    priority: 'high',
    validity_days: 14
  };
}

/**
 * Create maintenance reminder recommendation
 */
function createMaintenanceReminder(firstName, daysSinceBooking) {
  const estimatedLTV = 3500; // Average LTV for medium-risk customers
  const interventionCost = 5; // Cost of SMS/push notification
  const expectedRetentionRate = 0.25; // 25% likely to book after reminder
  const expectedROI = calculateROI(estimatedLTV, interventionCost, expectedRetentionRate);

  return {
    action: InterventionType.MAINTENANCE_REMINDER,
    discount_amount: 0,
    message_template: `Hi ${firstName}! It's been ${daysSinceBooking} days since your last booking. Time for maintenance? Book your next service with Sheba.`,
    sms_template: `Sheba.xyz: ${firstName}, time for a checkup? Book your maintenance service today: sheba.xyz`,
    email_subject: `${firstName}, Is It Time for Maintenance?`,
    expected_retention_rate: expectedRetentionRate,
    intervention_cost: interventionCost,
    estimated_ltv: estimatedLTV,
    expected_roi: expectedROI,
    priority: 'medium',
    validity_days: 30
  };
}

/**
 * Create premium upgrade offer
 */
function createPremiumUpgradeOffer(firstName, totalSpent, churnProb) {
  const estimatedLTV = estimateCustomerLifetimeValue(totalSpent) * 1.3; // 30% higher for premium
  const interventionCost = 200; // Cost of premium service discount
  const expectedRetentionRate = calculateExpectedRetention(churnProb, 350);
  const expectedROI = calculateROI(estimatedLTV, interventionCost, expectedRetentionRate);

  return {
    action: InterventionType.PREMIUM_UPGRADE,
    discount_amount: 200,
    discount_code: generateDiscountCode(200),
    message_template: `Hi ${firstName}! Upgrade to our Premium Service Package with Tk 200 off. Get priority booking & expert technicians.`,
    sms_template: `Sheba.xyz: ${firstName}, try Premium! Tk 200 off + priority service. Book: sheba.xyz`,
    email_subject: `${firstName}, Experience Premium Service - Tk 200 Off!`,
    expected_retention_rate: expectedRetentionRate,
    intervention_cost: interventionCost,
    estimated_ltv: estimatedLTV,
    expected_roi: expectedROI,
    priority: 'high',
    validity_days: 21
  };
}

/**
 * Create no action recommendation
 */
function createNoAction(firstName) {
  return {
    action: InterventionType.NO_ACTION,
    discount_amount: 0,
    message_template: `No intervention needed. Customer ${firstName} has low churn risk.`,
    expected_retention_rate: 0.95, // Already likely to stay
    intervention_cost: 0,
    estimated_ltv: 0,
    expected_roi: 0,
    priority: 'none',
    validity_days: null
  };
}

/**
 * Helper: Generate discount code
 */
function generateDiscountCode(amount) {
  const codes = {
    250: 'WELCOME250',
    300: 'SAVE300',
    400: 'VIP400',
    500: 'PREMIUM500',
    200: 'UPGRADE200'
  };
  return codes[amount] || `SAVE${amount}`;
}

/**
 * Helper: Estimate customer lifetime value
 */
function estimateCustomerLifetimeValue(totalSpent) {
  // Simple heuristic: Past spending * 2.5 (assuming 30 months retention)
  const baseEstimate = totalSpent * 2.5;
  // Minimum LTV of 3000, maximum of 15000
  return Math.min(Math.max(baseEstimate, 3000), 15000);
}

/**
 * Helper: Calculate expected retention rate after intervention
 */
function calculateExpectedRetention(churnProb, discountAmount) {
  // Base retention = 1 - churn probability
  const baseRetention = 1 - churnProb;

  // Discount impact (diminishing returns)
  const discountImpact = Math.min(discountAmount / 1000, 0.4); // Max 40% boost

  // Combined retention rate (capped at 0.85)
  const expectedRetention = Math.min(baseRetention + discountImpact, 0.85);

  return Math.round(expectedRetention * 100) / 100; // Round to 2 decimals
}

/**
 * Helper: Calculate ROI
 */
function calculateROI(ltv, cost, retentionRate) {
  if (cost === 0) return 0;
  const expectedReturn = ltv * retentionRate;
  const roi = ((expectedReturn - cost) / cost) * 100;
  return Math.round(roi * 10) / 10; // Round to 1 decimal
}

/**
 * Helper: Convert probability to risk category
 */
function getRiskCategory(churnProbability) {
  if (churnProbability >= 0.7) return RiskCategory.CRITICAL;
  if (churnProbability >= 0.5) return RiskCategory.HIGH;
  if (churnProbability >= 0.3) return RiskCategory.MEDIUM;
  return RiskCategory.LOW;
}

/**
 * Batch process multiple customers
 */
export function generateBatchRecommendations(customers) {
  return customers.map(customer => generateInterventionRecommendation(customer));
}

/**
 * Filter recommendations by priority
 */
export function filterByPriority(recommendations, priority) {
  return recommendations.filter(rec => rec.recommendation.priority === priority);
}

/**
 * Get actionable recommendations (exclude no_action)
 */
export function getActionableRecommendations(recommendations) {
  return recommendations.filter(
    rec => rec.recommendation.action !== InterventionType.NO_ACTION
  );
}

/**
 * Sort recommendations by expected ROI
 */
export function sortByROI(recommendations) {
  return [...recommendations].sort(
    (a, b) => b.recommendation.expected_roi - a.recommendation.expected_roi
  );
}
