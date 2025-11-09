# Customer Segmentation Feature

## Overview

The Customer Segmentation feature uses K-Means clustering to automatically segment Sheba.xyz customers into 5 distinct behavioral groups. This enables targeted interventions, personalized marketing, and improved customer retention strategies.

## Features

### 1. **Automated Segmentation**
- **Algorithm**: K-Means clustering (k=5)
- **Features Used**:
  - `avg_spent`: Average spending per order
  - `num_bookings`: Total number of bookings
  - `price_sensitivity_score`: Coupon usage rate weighted by cashback
  - `complaints_count`: Number of complaints filed
  - `satisfaction_score`: Customer satisfaction level (1-5)
  - `tenure`: Customer tenure in months
  - `days_since_last_order`: Recency metric
  - `order_growth`: Year-over-year order amount growth

### 2. **Five Customer Segments**

#### Price-Sensitive (25.8% of customers)
- **Description**: Customers highly responsive to discounts, coupons, and cashback offers
- **Characteristics**:
  - High coupon usage
  - Responds well to promotional campaigns
  - Price-driven decision making
- **Recommended Interventions**:
  - Discount offers (Tk 200-500)
  - Cashback campaigns
  - Budget service category promotion
  - Seasonal discount bundles

#### High-Value (21.5% of customers)
- **Description**: Premium customers with high spending and frequent bookings
- **Characteristics**:
  - Highest lifetime value (Tk 18,500 avg)
  - Frequent bookings
  - Low churn rate (28%)
- **Recommended Interventions**:
  - VIP loyalty program
  - Premium service providers
  - Priority booking access
  - Personalized service packages

#### Loyal (11.0% of customers)
- **Description**: Long-term customers with consistent booking patterns
- **Characteristics**:
  - Highest tenure
  - Low churn risk (18%)
  - Steady booking frequency
- **Recommended Interventions**:
  - Loyalty rewards program
  - Referral incentives
  - Exclusive early access
  - Anniversary bonuses

#### Occasional (41.7% of customers)
- **Description**: Infrequent users with sporadic booking patterns
- **Characteristics**:
  - Lowest booking frequency
  - Highest churn risk (52%)
  - Potential for reactivation
- **Recommended Interventions**:
  - Re-engagement campaigns
  - Service reminders (AC, electrical)
  - First booking back discount
  - Seasonal service promotions

## Technical Architecture

### Backend (FastAPI)

#### Training Script: `churn_prediction/segment_customers.py`

```bash
cd churn_prediction
python segment_customers.py
```

**Outputs**:
- `models/segmentation_model.pkl` - Trained K-Means model
- `models/segment_scaler.pkl` - StandardScaler for feature normalization
- `models/segment_mapping.json` - Cluster-to-segment name mapping
- `models/segment_metadata.json` - Segment characteristics and descriptions
- `models/customer_segments.csv` - Customer-to-segment assignments

#### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/segments` | GET | Get all segments with distribution |
| `/api/segments/{name}` | GET | Get detailed info for specific segment |
| `/api/segments/{name}/customers` | GET | Get customers in segment (paginated) |
| `/api/segments/recalculate` | POST | Trigger re-segmentation |

**Example Response** (`/api/segments`):
```json
{
  "total_customers": 10000,
  "segment_count": 4,
  "segments": {
    "Price-Sensitive": 2580,
    "High-Value": 2151,
    "Loyal": 1100,
    "Occasional": 4169
  },
  "metadata": {
    "Price-Sensitive": {
      "cluster_id": 2,
      "count": 2580,
      "percentage": 25.8,
      "characteristics": {...},
      "description": "...",
      "color": "#3B82F6"
    }
  }
}
```

### Frontend (React)

#### Pages

**`SegmentationPage.jsx`** - Main segmentation interface
- Overview of all segments
- Clickable segment cards
- Detailed segment view with:
  - Key characteristics
  - Recommended interventions
  - Sample customers
  - Churn rate and LTV metrics

**Routes**:
- `/segments` - All segments overview
- `/segments/:segmentName` - Specific segment details

#### Components

**`SegmentChart.jsx`** - Enhanced pie chart
- Displays segment distribution
- Clickable slices navigate to segment details
- Color-coded by segment type
- "View All" button for quick access

**Navigation**:
- Dashboard → "Segments" button in header
- Dashboard → Click segment chart
- Dashboard → Click segment pie slice

#### API Service Methods

```javascript
// Get all segments
await apiService.getAllSegments();

// Get segment details
await apiService.getSegmentDetails('Price-Sensitive');

// Get customers in segment
await apiService.getSegmentCustomers('High-Value', limit=50, offset=0);

// Trigger re-segmentation
await apiService.recalculateSegments();
```

## Usage Guide

### For Development (Mock Mode)

1. **Ensure mock mode is enabled** in `.env`:
   ```
   REACT_APP_USE_MOCK=true
   ```

2. **Start the React app**:
   ```bash
   npm start
   ```

3. **Navigate to Segments**:
   - Click "Segments" button in Dashboard header
   - OR click on the segment pie chart
   - OR directly visit `http://localhost:3000/segments`

4. **Explore Segments**:
   - Click any segment card to view details
   - See customer characteristics
   - Review recommended interventions
   - View sample customers

### For Production (Real Backend)

1. **Train the segmentation model**:
   ```bash
   cd churn_prediction
   python segment_customers.py
   ```

2. **Start the FastAPI backend**:
   ```bash
   cd churn_prediction
   uvicorn api_server:app --reload --port 8000
   ```

3. **Configure frontend** in `.env`:
   ```
   REACT_APP_API_URL=http://localhost:8000/api
   REACT_APP_USE_MOCK=false
   ```

4. **Start React app**:
   ```bash
   npm start
   ```

5. **Verify segmentation loaded**:
   - Check backend console for: "[OK] Segment metadata loaded (4 segments)"
   - Visit `http://localhost:8000/api/segments` to see raw data

## Integration with Existing Features

### Churn Prediction
- Segment assignment enhances churn predictions
- Segment-specific churn rates improve accuracy
- Combined with SHAP explanations for interpretability

### Intervention Engine
- `interventionEngine.js` uses segment for personalized recommendations
- Different discount tiers based on segment
- Tailored messaging per segment type

**Example**:
```javascript
// Price-Sensitive customers
if (segment === 'Price-Sensitive' && riskLevel === 'High') {
  return createDiscountOffer(300, ...);
}

// High-Value customers
if (segment === 'High-Value' && riskLevel === 'High') {
  return createDiscountOffer(500, ...); // Higher discount
}
```

### Dashboard
- Segment distribution pie chart
- At-risk customers table shows segment column
- Customer modal displays segment badge

## Customization

### Adding New Segments

1. **Update K-Means clusters**:
   - Edit `segment_customers.py`
   - Change `optimal_k = 5` to desired number
   - Re-run training script

2. **Adjust cluster mapping**:
   ```python
   # In segment_customers.py
   cluster_to_segment = {
       0: 'Loyal',
       1: 'High-Value',
       2: 'Price-Sensitive',
       3: 'Quality-Focused',
       4: 'Occasional',
       5: 'Your-New-Segment'  # Add here
   }
   ```

3. **Add color mapping**:
   ```python
   # In segment_customers.py
   def get_segment_color(segment_name):
       colors = {
           'Your-New-Segment': '#ABC123'
       }
   ```

4. **Update frontend colors**:
   ```javascript
   // In SegmentChart.jsx
   const COLORS = {
       'Your-New-Segment': '#ABC123'
   };
   ```

### Modifying Segmentation Features

Edit `segment_customers.py` to add/remove features:

```python
# Add new feature
segmentation_features['new_metric'] = df['some_column'] / df['other_column']

# Remove feature
# Just don't include it in segmentation_features DataFrame
```

## Monitoring & Maintenance

### Re-Segmentation Schedule
- **Recommended**: Monthly
- **Trigger**: When customer behavior changes significantly
- **Method**:
  - **Option 1 (UI)**: Click "Recalculate" button on Segmentation page
  - **Option 2 (API)**: POST to `/api/segments/recalculate`
  - **Option 3 (Script)**: Run `python segment_customers.py`

### How Re-Segmentation Works
The `/api/segments/recalculate` endpoint performs a complete re-segmentation:

1. **Loads Data**: Fetches current customer data (synthetic or from database)
2. **Feature Engineering**: Calculates behavioral metrics
3. **Model Application**: Applies trained K-Means model to assign segments
4. **Updates Storage**: Saves new assignments to CSV and metadata to JSON
5. **Memory Refresh**: Reloads global variables so API serves fresh data
6. **Zero Downtime**: All updates happen atomically

**Execution Time**: ~2-3 seconds for 10K customers
**Files Updated**: `customer_segments.csv`, `segment_metadata.json`
**Memory Updated**: `segment_metadata`, `customer_segments_df`

### Key Metrics to Track
- Segment distribution changes over time
- Segment-specific churn rates
- Intervention effectiveness per segment
- Average LTV per segment
- Migration between segments

### Model Performance
- **Silhouette Score**: ~0.15 (current)
- **Target**: > 0.20 for well-separated clusters
- **Improvement**: Add more behavioral features, tune k

## Troubleshooting

### Backend Issues

**"Segmentation model not loaded"**
```bash
# Solution: Train the model
cd churn_prediction
python segment_customers.py
```

**ModuleNotFoundError: sklearn**
```bash
# Solution: Install dependencies
pip install -r requirements.txt
```

### Frontend Issues

**Segments not displaying**
- Check `.env` has `REACT_APP_USE_MOCK=true` for mock mode
- Or ensure backend is running for real mode
- Verify console for API errors

**Segment colors not showing**
- Check `COLORS` mapping in `SegmentChart.jsx`
- Ensure segment names match exactly (case-sensitive)

## Future Enhancements

### Planned Features
1. **Dynamic Re-Segmentation**: Schedule-based automatic re-segmentation
2. **Segment Migration Tracking**: Track customers moving between segments
3. **A/B Testing by Segment**: Test interventions on specific segments
4. **Segment-Specific Dashboards**: Dedicated analytics per segment
5. **Predictive Segment Movement**: Predict which segment a customer will move to

### Advanced Analytics
- Segment lifecycle analysis
- Cross-segment comparison charts
- Segment health scores
- ROI tracking per segment
- Conversion funnels by segment

## API Reference

### GET /api/segments
Get all customer segments with distribution

**Response**:
```json
{
  "total_customers": 10000,
  "segment_count": 4,
  "segments": {...},
  "metadata": {...}
}
```

### GET /api/segments/{segment_name}
Get detailed information for a specific segment

**Parameters**:
- `segment_name` (path): Name of segment (URL-encoded)

**Response**:
```json
{
  "segment_name": "Price-Sensitive",
  "cluster_id": 2,
  "count": 2580,
  "percentage": 25.8,
  "characteristics": {...},
  "description": "...",
  "color": "#3B82F6",
  "churn_rate": 0.42,
  "avg_lifetime_value": 5200,
  "recommended_interventions": [...]
}
```

### GET /api/segments/{segment_name}/customers
Get list of customers in a segment

**Parameters**:
- `segment_name` (path): Name of segment
- `limit` (query): Max customers to return (default: 50)
- `offset` (query): Pagination offset (default: 0)

**Response**:
```json
{
  "segment_name": "Price-Sensitive",
  "total_count": 2580,
  "offset": 0,
  "limit": 50,
  "customers": [
    {
      "customer_id": "CUST00012",
      "segment": "Price-Sensitive",
      "cluster": 2
    },
    ...
  ]
}
```

### POST /api/segments/recalculate
Trigger re-segmentation of all customers

**What it does**:
1. Loads customer data (synthetic or from database)
2. Engineers segmentation features
3. Applies the trained K-Means model
4. Updates segment assignments
5. Saves updated customer_segments.csv
6. Recalculates segment metadata
7. Reloads global variables in memory

**Response**:
```json
{
  "status": "success",
  "message": "Customer segmentation recalculated successfully",
  "timestamp": "2025-11-08T10:30:00Z",
  "summary": {
    "total_customers": 10000,
    "segment_count": 4,
    "segments": {
      "Price-Sensitive": 2580,
      "High-Value": 2151,
      "Loyal": 1100,
      "Occasional": 4169
    },
    "updated_files": [
      "models/customer_segments.csv",
      "models/segment_metadata.json"
    ]
  }
}
```

**Usage from UI**:
- Navigate to Segmentation page (`/segments`)
- Click the purple "Recalculate" button in the header
- Confirm the action in the dialog
- View results in the success notification
- Segments automatically refresh with new data

## Performance

### Backend
- **Segmentation Training**: ~10 seconds for 10K customers
- **API Response Time**: <100ms for segment queries
- **Memory Usage**: ~50MB for loaded models

### Frontend
- **Initial Load**: <2 seconds with mock data
- **Segment Details Load**: <500ms
- **Chart Render**: <100ms

## Support

For questions or issues:
1. Check this documentation
2. Review code comments in relevant files
3. Check console for error messages
4. Verify backend is running (if not using mock mode)

## Files Modified/Created

### Backend
- ✅ `churn_prediction/segment_customers.py` - NEW
- ✅ `churn_prediction/api_server.py` - UPDATED
- ✅ `churn_prediction/models/segmentation_model.pkl` - GENERATED
- ✅ `churn_prediction/models/segment_scaler.pkl` - GENERATED
- ✅ `churn_prediction/models/segment_mapping.json` - GENERATED
- ✅ `churn_prediction/models/segment_metadata.json` - GENERATED
- ✅ `churn_prediction/models/customer_segments.csv` - GENERATED

### Frontend
- ✅ `src/pages/SegmentationPage.jsx` - NEW
- ✅ `src/components/SegmentChart.jsx` - UPDATED (made clickable)
- ✅ `src/pages/Dashboard.jsx` - UPDATED (added Segments button)
- ✅ `src/services/api.js` - UPDATED (added segment methods)
- ✅ `src/services/mockData.js` - UPDATED (added segment mock data)
- ✅ `src/App.js` - UPDATED (added /segments routes)

---

**Built for Girls_Who_Git_It** - Sheba Retention AI Hackathon Project
