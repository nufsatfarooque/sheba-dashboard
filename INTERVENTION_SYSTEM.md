# Intervention Recommendations System

## Overview

The Intervention Recommendations System is a rules-based engine that generates personalized retention actions for at-risk customers. It analyzes customer churn risk and segment data to recommend targeted interventions like discount offers, maintenance reminders, and premium upgrades.

**Key Features:**
- ✅ Rules-based logic (not ML) for MVP simplicity
- ✅ Personalized actions based on risk + segment
- ✅ ROI calculation for each intervention
- ✅ Multi-channel delivery (SMS, push, email)
- ✅ Intervention tracking and history
- ✅ Real-time execution from dashboard

---

## Business Rules

| Risk Level | Segment | Action | Discount | Expected ROI |
|-----------|---------|--------|----------|--------------|
| **High/Critical** | Price-Sensitive | Discount Offer | Tk 300 | ~18% |
| **High/Critical** | High-Value | Premium Discount | Tk 500 | ~22% |
| **High/Critical** | Quality-Focused | Premium Upgrade | Tk 200 | ~20% |
| **High/Critical** | Loyal | Loyalty Discount | Tk 400 | ~19% |
| **High/Critical** | Occasional | Win-back Offer | Tk 250 | ~15% |
| **Medium** | Any | Maintenance Reminder | Tk 0 | ~175% |
| **Low** | Any | No Action | Tk 0 | N/A |

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Dashboard                       │
│  (React + Tailwind CSS)                                      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │ Customer     │  │ Intervention │  │ Intervention     │ │
│  │ Modal        │  │ Engine       │  │ History          │ │
│  └──────────────┘  └──────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                       API Layer                              │
│  (api.js)                                                    │
│  • getInterventionRecommendation()                          │
│  • executeIntervention()                                     │
│  • getInterventionHistory()                                  │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                   Backend API (Future)                       │
│  POST /api/interventions/recommend                           │
│  POST /api/interventions/execute                             │
│  GET  /api/interventions/history                             │
│  GET  /api/interventions/analytics                           │
└─────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
sheba-dashboard/
├── src/
│   ├── services/
│   │   ├── interventionEngine.js    # Rules-based recommendation engine
│   │   ├── api.js                    # API integration + mock handlers
│   │   └── mockData.js               # Test data with segments
│   │
│   ├── components/
│   │   ├── CustomerModal.jsx         # Displays recommendations + execution
│   │   └── InterventionHistory.jsx   # Shows executed interventions
│   │
│   └── App.js                        # Main dashboard with history section
│
├── BACKEND_API_SPEC.md               # Complete API specification
└── INTERVENTION_SYSTEM.md            # This document
```

---

## How It Works

### 1. Recommendation Generation

When a user clicks on an at-risk customer:

```javascript
// CustomerModal.jsx
const interventionData = await apiService.getInterventionRecommendation(
  customer.customer_id,
  customer  // Pass full customer data
);
```

The intervention engine applies business rules:

```javascript
// interventionEngine.js
export function generateInterventionRecommendation(customer) {
  const { churn_probability, segment, total_spent } = customer;

  const riskLevel = getRiskCategory(churn_probability);

  // Apply rules
  if (riskLevel === 'High' && segment === 'Price-Sensitive') {
    return createDiscountOffer(300, customer);
  }
  // ... more rules
}
```

### 2. Recommendation Display

The modal shows:
- **Action Type**: discount_offer, maintenance_reminder, premium_upgrade
- **Discount Amount**: Tk 300, Tk 500, etc.
- **Discount Code**: SAVE300, PREMIUM500, etc.
- **Message Templates**: For SMS, push, and email
- **ROI Metrics**: Expected retention rate, cost, ROI %

### 3. Intervention Execution

When user clicks "Take Action":

```javascript
// CustomerModal.jsx
const handleTakeAction = async () => {
  const result = await apiService.executeIntervention(
    customer.customer_id,
    intervention
  );

  setExecuted(true);
  alert('✅ Intervention sent successfully!');
};
```

In mock mode, this stores to localStorage:

```javascript
// api.js
executeIntervention: async (customerId, interventionData) => {
  const execution = {
    customer_id: customerId,
    intervention: interventionData,
    executed_at: new Date().toISOString(),
    status: 'sent'
  };

  const history = JSON.parse(localStorage.getItem('executed_interventions') || '[]');
  history.push(execution);
  localStorage.setItem('executed_interventions', JSON.stringify(history));
}
```

### 4. History Tracking

The `InterventionHistory` component displays all executed interventions:

```javascript
// InterventionHistory.jsx
const [history, setHistory] = useState([]);

useEffect(() => {
  const data = await apiService.getInterventionHistory();
  setHistory(data);
}, []);
```

---

## Key Functions

### `generateInterventionRecommendation(customer)`

Main function that applies business rules to generate recommendations.

**Input:**
```javascript
{
  customer_id: "CUST12345",
  name: "Rahima Khan",
  churn_probability: 0.78,
  segment: "Price-Sensitive",
  total_spent: 4500,
  last_booking_days: 52
}
```

**Output:**
```javascript
{
  customer_id: "CUST12345",
  churn_probability: 0.78,
  segment: "Price-Sensitive",
  risk_category: "High",
  recommendation: {
    action: "discount_offer",
    discount_amount: 300,
    discount_code: "SAVE300",
    message_template: "Hi Rahima! We miss you...",
    expected_retention_rate: 0.45,
    intervention_cost: 300,
    estimated_ltv: 6000,
    expected_roi: 18.0,
    priority: "high",
    validity_days: 14
  }
}
```

### Helper Functions

#### `getRiskCategory(churnProbability)`
Converts probability to risk level:
- ≥ 0.7 → Critical
- ≥ 0.5 → High
- ≥ 0.3 → Medium
- < 0.3 → Low

#### `calculateExpectedRetention(churnProb, discountAmount)`
Estimates retention rate after intervention:
```javascript
const baseRetention = 1 - churnProb;
const discountImpact = min(discountAmount / 1000, 0.4);  // Max 40% boost
return min(baseRetention + discountImpact, 0.85);
```

#### `calculateROI(ltv, cost, retentionRate)`
Calculates expected ROI:
```javascript
const expectedReturn = ltv * retentionRate;
return ((expectedReturn - cost) / cost) * 100;
```

#### `estimateCustomerLifetimeValue(totalSpent)`
Estimates LTV from past spending:
```javascript
const baseEstimate = totalSpent * 2.5;
return max(min(baseEstimate, 15000), 3000);
```

---

## Usage Examples

### Example 1: High-Risk Price-Sensitive Customer

**Input:**
```javascript
{
  customer_id: "CUST001",
  name: "Rahima Khan",
  churn_probability: 0.78,
  segment: "Price-Sensitive",
  total_spent: 4500,
  last_booking_days: 52
}
```

**Recommendation:**
- **Action**: Discount Offer
- **Amount**: Tk 300
- **Code**: SAVE300
- **Message**: "Hi Rahima! We miss you 😊 Get Tk 300 off your next service with code SAVE300. Book now!"
- **Expected Retention**: 45%
- **Expected ROI**: 18%

### Example 2: High-Risk High-Value Customer

**Input:**
```javascript
{
  customer_id: "CUST002",
  name: "Ahmed Ali",
  churn_probability: 0.85,
  segment: "High-Value",
  total_spent: 12000,
  last_booking_days: 38
}
```

**Recommendation:**
- **Action**: Premium Discount
- **Amount**: Tk 500
- **Code**: PREMIUM500
- **Message**: "Hi Ahmed! Get Tk 500 off your next service with code PREMIUM500. Book now!"
- **Expected Retention**: 50%
- **Expected ROI**: 22%

### Example 3: Medium-Risk Customer

**Input:**
```javascript
{
  customer_id: "CUST003",
  name: "Fatima Begum",
  churn_probability: 0.45,
  segment: "Quality-Focused",
  total_spent: 8500,
  last_booking_days: 45
}
```

**Recommendation:**
- **Action**: Maintenance Reminder
- **Amount**: Tk 0
- **Message**: "Hi Fatima! It's been 45 days since your last booking. Time for maintenance?"
- **Expected Retention**: 25%
- **Expected ROI**: 175% (very low cost)

---

## ROI Calculation Details

### Formula

```
Expected Return = Customer LTV × Expected Retention Rate
ROI = ((Expected Return - Intervention Cost) / Intervention Cost) × 100
```

### Example Calculation

For a high-risk price-sensitive customer:

```
Customer Total Spent: Tk 4,500
Estimated LTV: 4,500 × 2.5 = Tk 11,250 (capped at Tk 15,000)
Churn Probability: 0.78
Base Retention: 1 - 0.78 = 0.22 (22%)

Discount Amount: Tk 300
Discount Impact: min(300/1000, 0.4) = 0.30
Expected Retention: min(0.22 + 0.30, 0.85) = 0.52 (52%)

Expected Return: 11,250 × 0.52 = Tk 5,850
ROI: ((5,850 - 300) / 300) × 100 = 18.5%
```

---

## Testing

### Mock Data Mode

The system works with mock data by default. Set in `.env`:

```bash
REACT_APP_USE_MOCK=true
```

This enables:
- Client-side rules engine
- localStorage for intervention tracking
- Simulated API delays

### Test Scenarios

**Scenario 1: Generate recommendation for high-risk customer**
1. Open dashboard
2. Click on "Rahima Khan" (78% churn risk)
3. Verify: Tk 300 discount recommendation appears
4. Check ROI calculation is shown

**Scenario 2: Execute intervention**
1. Open customer modal
2. Click "Take Action" button
3. Verify: Success alert appears
4. Check: Button changes to "Action Sent"
5. Verify: Intervention appears in history

**Scenario 3: View intervention history**
1. Scroll to "Intervention History" section
2. Verify: Executed interventions are listed
3. Check: Export CSV button works
4. Verify: Can see action type, discount, ROI

### Unit Tests (TODO)

```javascript
describe('interventionEngine', () => {
  test('generates Tk 300 discount for high-risk price-sensitive', () => {
    const customer = {
      churn_probability: 0.78,
      segment: 'Price-Sensitive',
      total_spent: 4500
    };

    const result = generateInterventionRecommendation(customer);

    expect(result.recommendation.discount_amount).toBe(300);
    expect(result.recommendation.action).toBe('discount_offer');
  });

  test('generates Tk 500 discount for high-risk high-value', () => {
    const customer = {
      churn_probability: 0.85,
      segment: 'High-Value',
      total_spent: 12000
    };

    const result = generateInterventionRecommendation(customer);

    expect(result.recommendation.discount_amount).toBe(500);
  });

  test('generates maintenance reminder for medium-risk', () => {
    const customer = {
      churn_probability: 0.45,
      segment: 'Occasional',
      total_spent: 2500
    };

    const result = generateInterventionRecommendation(customer);

    expect(result.recommendation.action).toBe('maintenance_reminder');
    expect(result.recommendation.discount_amount).toBe(0);
  });
});
```

---

## Backend Integration

### Switching to Real Backend

1. **Set environment variables:**

```bash
# .env
REACT_APP_USE_MOCK=false
REACT_APP_API_URL=https://api.sheba.xyz
```

2. **Implement backend endpoints** (see `BACKEND_API_SPEC.md`):
   - `POST /api/interventions/recommend`
   - `POST /api/interventions/execute`
   - `GET /api/interventions/history`

3. **Deploy backend** with:
   - Rules engine logic
   - SMS gateway integration
   - Push notification service
   - Email service
   - Database for tracking

---

## Performance Considerations

### Client-Side Processing
- ✅ Instant recommendations (no API latency)
- ✅ Works offline for viewing history
- ✅ No backend dependency for MVP

### Future Optimizations
- Cache recommendations for 1 hour
- Batch process multiple customers
- Pre-generate recommendations nightly
- Use Redis for faster lookups

---

## Future Enhancements

### Phase 2: ML-Based Recommendations
- Replace rules with ML model
- Predict optimal discount amount
- Personalize message templates
- A/B test different strategies

### Phase 3: Advanced Features
- Multi-step intervention campaigns
- SMS/email delivery scheduling
- Customer response tracking
- Real-time retention monitoring
- Automated follow-ups

### Phase 4: Analytics
- Intervention effectiveness dashboard
- ROI tracking by segment
- A/B test results
- Cost-benefit analysis

---

## Troubleshooting

### Issue: Recommendations not generating

**Check:**
1. Customer has `segment` field
2. Customer has `churn_probability` field
3. Console for errors

**Fix:**
```javascript
// Ensure customer object has required fields
const customer = {
  customer_id: "...",
  churn_probability: 0.78,  // Required
  segment: "Price-Sensitive" // Required
};
```

### Issue: "Take Action" button not working

**Check:**
1. `REACT_APP_USE_MOCK=true` in `.env`
2. Browser localStorage is enabled
3. Console for errors

**Fix:**
```javascript
// Check localStorage
console.log(localStorage.getItem('executed_interventions'));

// Clear if corrupted
localStorage.removeItem('executed_interventions');
```

### Issue: History not showing

**Check:**
1. Interventions have been executed
2. localStorage has data
3. Component is imported correctly

**Fix:**
```javascript
// Check localStorage
const history = JSON.parse(
  localStorage.getItem('executed_interventions') || '[]'
);
console.log(history);
```

---

## API Reference

See `BACKEND_API_SPEC.md` for complete API documentation including:
- Request/response formats
- Status codes
- Database schema
- Implementation examples
- Testing guidelines

---

## Support

For questions or issues:
1. Check this documentation
2. Review `BACKEND_API_SPEC.md`
3. Check console logs
4. Contact: dev-team@sheba.xyz

---

## License

© 2025 Sheba Platform Limited. All rights reserved.
