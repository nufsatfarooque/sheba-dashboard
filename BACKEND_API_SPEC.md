# Backend API Specification: Intervention Recommendations System

## Overview

This document specifies the backend API endpoints needed to implement the Intervention Recommendations system for Sheba's Customer Retention AI platform. The system uses a **rules-based engine** (not ML) to generate personalized retention actions based on customer churn risk and segment.

---

## Business Rules

The intervention recommendation engine follows these rules:

| Risk Level | Segment | Intervention | Discount Amount |
|-----------|---------|--------------|-----------------|
| High/Critical | Price-Sensitive | Discount Offer | Tk 300 |
| High/Critical | High-Value | Premium Discount | Tk 500 |
| High/Critical | Quality-Focused | Premium Upgrade | Tk 200 |
| High/Critical | Loyal | Loyalty Discount | Tk 400 |
| High/Critical | Occasional | Win-back Discount | Tk 250 |
| Medium | Any | Maintenance Reminder | Tk 0 |
| Low | Any | No Action | Tk 0 |

---

## API Endpoints

### 1. Generate Intervention Recommendation

**Endpoint:** `POST /api/interventions/recommend`

**Description:** Generates a personalized intervention recommendation for a customer based on their churn risk and segment using the rules-based engine.

**Request Body:**
```json
{
  "customer_id": "CUST12345"
}
```

**Response:**
```json
{
  "customer_id": "CUST12345",
  "churn_probability": 0.78,
  "segment": "Price-Sensitive",
  "risk_category": "High",
  "recommendation": {
    "action": "discount_offer",
    "discount_amount": 300,
    "discount_code": "SAVE300",
    "message_template": "Hi Rahima! We miss you 😊 Get Tk 300 off your next service with code SAVE300. Book now!",
    "sms_template": "Sheba.xyz: Rahima, we value you! Use code SAVE300 for Tk 300 off. Book: sheba.xyz",
    "email_subject": "Rahima, Here's Tk 300 Just For You!",
    "expected_retention_rate": 0.45,
    "intervention_cost": 300,
    "estimated_ltv": 6000,
    "expected_roi": 18.0,
    "priority": "high",
    "validity_days": 14
  },
  "generated_at": "2025-11-05T10:30:00Z"
}
```

**Implementation Logic:**

```python
def generate_intervention_recommendation(customer_id):
    # 1. Fetch customer data
    customer = get_customer(customer_id)

    # 2. Get churn prediction
    churn_prob = customer.churn_probability
    segment = customer.segment

    # 3. Determine risk category
    risk_category = get_risk_category(churn_prob)

    # 4. Apply business rules
    if risk_category in ['High', 'Critical']:
        if segment == 'Price-Sensitive':
            return create_discount_offer(300, customer)
        elif segment == 'High-Value':
            return create_discount_offer(500, customer)
        elif segment == 'Quality-Focused':
            return create_premium_upgrade(200, customer)
        elif segment == 'Loyal':
            return create_discount_offer(400, customer)
        elif segment == 'Occasional':
            return create_discount_offer(250, customer)

    elif risk_category == 'Medium':
        return create_maintenance_reminder(customer)

    else:  # Low risk
        return create_no_action(customer)

def get_risk_category(churn_probability):
    if churn_probability >= 0.7:
        return 'Critical'
    elif churn_probability >= 0.5:
        return 'High'
    elif churn_probability >= 0.3:
        return 'Medium'
    else:
        return 'Low'

def calculate_expected_retention(churn_prob, discount_amount):
    base_retention = 1 - churn_prob
    discount_impact = min(discount_amount / 1000, 0.4)  # Max 40% boost
    return min(base_retention + discount_impact, 0.85)

def calculate_roi(ltv, cost, retention_rate):
    if cost == 0:
        return 0
    expected_return = ltv * retention_rate
    return ((expected_return - cost) / cost) * 100

def estimate_ltv(total_spent):
    base_estimate = total_spent * 2.5
    return max(min(base_estimate, 15000), 3000)
```

**Status Codes:**
- `200 OK` - Recommendation generated successfully
- `404 Not Found` - Customer not found
- `500 Internal Server Error` - Server error

---

### 2. Execute Intervention

**Endpoint:** `POST /api/interventions/execute`

**Description:** Executes an intervention by sending the message to the customer via SMS/email/push notification.

**Request Body:**
```json
{
  "customer_id": "CUST12345",
  "intervention": {
    "customer_id": "CUST12345",
    "churn_probability": 0.78,
    "segment": "Price-Sensitive",
    "recommendation": {
      "action": "discount_offer",
      "discount_amount": 300,
      "discount_code": "SAVE300",
      "message_template": "Hi Rahima! Get Tk 300 off...",
      "sms_template": "Sheba.xyz: Use code SAVE300...",
      "expected_retention_rate": 0.45,
      "intervention_cost": 300,
      "estimated_ltv": 6000,
      "expected_roi": 18.0,
      "priority": "high",
      "validity_days": 14
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Intervention executed successfully",
  "execution_id": "EXE-1730806800000",
  "customer_id": "CUST12345",
  "intervention": { ... },
  "executed_at": "2025-11-05T10:35:00Z",
  "status": "sent",
  "channels": ["sms", "push_notification"]
}
```

**Implementation Logic:**

```python
def execute_intervention(customer_id, intervention):
    # 1. Validate customer and intervention
    customer = get_customer(customer_id)
    if not customer:
        raise CustomerNotFoundError()

    # 2. Check if intervention already sent recently
    recent_interventions = get_recent_interventions(customer_id, days=7)
    if recent_interventions:
        return {
            "success": False,
            "message": "Intervention already sent within last 7 days"
        }

    # 3. Send via multiple channels
    channels_sent = []

    # Send SMS
    if customer.phone:
        send_sms(customer.phone, intervention['recommendation']['sms_template'])
        channels_sent.append('sms')

    # Send push notification
    if customer.has_app:
        send_push_notification(customer_id, intervention['recommendation']['message_template'])
        channels_sent.append('push_notification')

    # Send email (optional)
    if customer.email:
        send_email(
            customer.email,
            intervention['recommendation']['email_subject'],
            intervention['recommendation']['message_template']
        )
        channels_sent.append('email')

    # 4. Log intervention execution
    execution = {
        'execution_id': f"EXE-{int(time.time() * 1000)}",
        'customer_id': customer_id,
        'intervention': intervention,
        'executed_at': datetime.utcnow().isoformat(),
        'status': 'sent',
        'channels': channels_sent
    }

    save_intervention_execution(execution)

    return {
        'success': True,
        'message': 'Intervention executed successfully',
        **execution
    }
```

**Status Codes:**
- `200 OK` - Intervention executed successfully
- `400 Bad Request` - Invalid request or duplicate intervention
- `404 Not Found` - Customer not found
- `500 Internal Server Error` - Server error

---

### 3. Get Intervention History

**Endpoint:** `GET /api/interventions/history`

**Description:** Retrieves the history of executed interventions.

**Query Parameters:**
- `customer_id` (optional) - Filter by specific customer
- `limit` (optional, default: 50) - Number of records to return
- `offset` (optional, default: 0) - Pagination offset

**Request:**
```
GET /api/interventions/history?customer_id=CUST12345&limit=10
```

**Response:**
```json
[
  {
    "execution_id": "EXE-1730806800000",
    "customer_id": "CUST12345",
    "intervention": {
      "churn_probability": 0.78,
      "segment": "Price-Sensitive",
      "recommendation": {
        "action": "discount_offer",
        "discount_amount": 300,
        "discount_code": "SAVE300",
        "expected_roi": 18.0
      }
    },
    "executed_at": "2025-11-05T10:35:00Z",
    "status": "sent",
    "channels": ["sms", "push_notification"]
  }
]
```

**Implementation Logic:**

```python
def get_intervention_history(customer_id=None, limit=50, offset=0):
    query = InterventionExecution.query

    if customer_id:
        query = query.filter_by(customer_id=customer_id)

    interventions = query.order_by(
        InterventionExecution.executed_at.desc()
    ).limit(limit).offset(offset).all()

    return [intervention.to_dict() for intervention in interventions]
```

**Status Codes:**
- `200 OK` - History retrieved successfully
- `500 Internal Server Error` - Server error

---

### 4. Get Intervention Analytics

**Endpoint:** `GET /api/interventions/analytics`

**Description:** Provides analytics on intervention effectiveness.

**Query Parameters:**
- `start_date` (optional) - Filter from date (YYYY-MM-DD)
- `end_date` (optional) - Filter to date (YYYY-MM-DD)

**Request:**
```
GET /api/interventions/analytics?start_date=2025-10-01&end_date=2025-11-05
```

**Response:**
```json
{
  "total_interventions": 127,
  "by_action_type": {
    "discount_offer": 85,
    "maintenance_reminder": 35,
    "premium_upgrade": 7
  },
  "by_segment": {
    "Price-Sensitive": 45,
    "High-Value": 28,
    "Quality-Focused": 20,
    "Loyal": 24,
    "Occasional": 10
  },
  "total_discount_cost": 35400,
  "avg_expected_roi": 16.5,
  "customers_retained": 56,
  "actual_retention_rate": 0.44,
  "roi_achieved": 14.2
}
```

**Implementation Logic:**

```python
def get_intervention_analytics(start_date=None, end_date=None):
    query = InterventionExecution.query

    if start_date:
        query = query.filter(InterventionExecution.executed_at >= start_date)
    if end_date:
        query = query.filter(InterventionExecution.executed_at <= end_date)

    interventions = query.all()

    # Calculate metrics
    total = len(interventions)
    by_action = defaultdict(int)
    by_segment = defaultdict(int)
    total_cost = 0
    total_roi = 0

    for intervention in interventions:
        action = intervention.intervention['recommendation']['action']
        segment = intervention.intervention['segment']
        cost = intervention.intervention['recommendation']['intervention_cost']
        roi = intervention.intervention['recommendation']['expected_roi']

        by_action[action] += 1
        by_segment[segment] += 1
        total_cost += cost
        total_roi += roi

    # Calculate actual retention (customers who booked after intervention)
    customers_retained = count_customers_retained(interventions)
    actual_retention_rate = customers_retained / total if total > 0 else 0

    return {
        'total_interventions': total,
        'by_action_type': dict(by_action),
        'by_segment': dict(by_segment),
        'total_discount_cost': total_cost,
        'avg_expected_roi': total_roi / total if total > 0 else 0,
        'customers_retained': customers_retained,
        'actual_retention_rate': actual_retention_rate,
        'roi_achieved': calculate_actual_roi(interventions, customers_retained)
    }
```

**Status Codes:**
- `200 OK` - Analytics retrieved successfully
- `500 Internal Server Error` - Server error

---

## Database Schema

### `intervention_executions` Table

```sql
CREATE TABLE intervention_executions (
    id SERIAL PRIMARY KEY,
    execution_id VARCHAR(50) UNIQUE NOT NULL,
    customer_id VARCHAR(50) NOT NULL,
    churn_probability DECIMAL(5,4),
    segment VARCHAR(50),
    risk_category VARCHAR(20),

    -- Intervention details
    action_type VARCHAR(50),
    discount_amount INTEGER,
    discount_code VARCHAR(20),
    message_template TEXT,
    expected_retention_rate DECIMAL(5,4),
    intervention_cost INTEGER,
    estimated_ltv INTEGER,
    expected_roi DECIMAL(6,2),
    priority VARCHAR(20),
    validity_days INTEGER,

    -- Execution metadata
    executed_at TIMESTAMP NOT NULL,
    status VARCHAR(20),
    channels JSONB,

    -- Tracking fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

-- Indexes
CREATE INDEX idx_customer_id ON intervention_executions(customer_id);
CREATE INDEX idx_executed_at ON intervention_executions(executed_at DESC);
CREATE INDEX idx_action_type ON intervention_executions(action_type);
CREATE INDEX idx_segment ON intervention_executions(segment);
```

---

## Environment Variables

```bash
# SMS Gateway
SMS_GATEWAY_URL=https://api.smsgateway.com/send
SMS_GATEWAY_API_KEY=your_api_key

# Push Notifications
PUSH_NOTIFICATION_SERVICE_URL=https://fcm.googleapis.com/fcm/send
PUSH_NOTIFICATION_API_KEY=your_firebase_key

# Email Service
EMAIL_SERVICE_URL=https://api.sendgrid.com/v3/mail/send
EMAIL_API_KEY=your_sendgrid_key
EMAIL_FROM_ADDRESS=retention@sheba.xyz

# Intervention Settings
MAX_INTERVENTIONS_PER_CUSTOMER_PER_WEEK=1
DISCOUNT_VALIDITY_DAYS=14
MIN_DAYS_BETWEEN_INTERVENTIONS=7
```

---

## Testing

### Example Test Cases

**Test 1: High-risk Price-Sensitive Customer**
```json
{
  "customer_id": "CUST001",
  "churn_probability": 0.78,
  "segment": "Price-Sensitive",
  "total_spent": 4500,
  "last_booking_days": 52
}
```
Expected: Tk 300 discount offer

**Test 2: High-risk High-Value Customer**
```json
{
  "customer_id": "CUST002",
  "churn_probability": 0.85,
  "segment": "High-Value",
  "total_spent": 12000,
  "last_booking_days": 38
}
```
Expected: Tk 500 discount offer

**Test 3: Medium-risk Customer**
```json
{
  "customer_id": "CUST003",
  "churn_probability": 0.45,
  "segment": "Occasional",
  "total_spent": 2500,
  "last_booking_days": 30
}
```
Expected: Maintenance reminder

**Test 4: Low-risk Customer**
```json
{
  "customer_id": "CUST004",
  "churn_probability": 0.15,
  "segment": "Loyal",
  "total_spent": 8000,
  "last_booking_days": 10
}
```
Expected: No action

---

## Integration Checklist

- [ ] Implement `/api/interventions/recommend` endpoint
- [ ] Implement rules-based recommendation engine
- [ ] Implement `/api/interventions/execute` endpoint
- [ ] Set up SMS gateway integration
- [ ] Set up push notification service
- [ ] Set up email service
- [ ] Create `intervention_executions` database table
- [ ] Implement `/api/interventions/history` endpoint
- [ ] Implement `/api/interventions/analytics` endpoint
- [ ] Add rate limiting to prevent spam
- [ ] Add duplicate intervention checking
- [ ] Write unit tests for recommendation rules
- [ ] Write integration tests for execution flow
- [ ] Set up monitoring and alerting
- [ ] Document API in Swagger/OpenAPI

---

## Frontend Integration

The frontend already implements:
- ✅ Client-side rules engine (`interventionEngine.js`)
- ✅ API service integration (`api.js`)
- ✅ Customer modal with intervention display
- ✅ "Take Action" button with execution
- ✅ Intervention history tracking (localStorage)
- ✅ Intervention history component

To switch from mock mode to real backend:
1. Set `REACT_APP_USE_MOCK=false` in `.env`
2. Set `REACT_APP_API_URL` to your backend URL
3. Deploy backend with endpoints specified in this document

---

## Notes

- The system uses **rules-based logic**, not ML, for MVP simplicity
- ROI calculations are estimates based on historical LTV data
- Discount codes should be unique and tracked in the system
- Consider A/B testing different discount amounts to optimize ROI
- Monitor actual retention rates to refine the recommendation rules
- Add fraud detection to prevent abuse of discount codes
