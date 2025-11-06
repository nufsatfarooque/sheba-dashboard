# Sheba Retention AI - Complete Setup & Run Guide

## 📋 Prerequisites

- Python 3.8 or higher
- Dataset file: `data/E_Commerce_Dataset.xlsx`

---

## 🚀 Quick Start (3 Steps)

### Step 1: Install Dependencies

```bash
pip install -r requirements.txt
```

This installs:
- `xgboost` - Machine learning model
- `shap` - Explainability library
- `fastapi` - API framework
- `scikit-learn` - ML utilities
- `pandas`, `numpy` - Data processing
- `imbalanced-learn` - Handle imbalanced data
- `openpyxl` - Read Excel files
- `uvicorn` - API server

---

### Step 2: Train the Model

```bash
python train_model.py
```

**What this does:**
1. Loads `data/E_Commerce_Dataset.xlsx`
2. Cleans and preprocesses the data
3. Trains an XGBoost classifier
4. Creates SHAP explainer for interpretability
5. Saves to `models/` folder:
   - `churn_model.pkl` - Trained model
   - `shap_explainer.pkl` - SHAP explainer
   - `columns.json` - Feature names
   - `feature_names.json` - Feature metadata

**Expected output:**
```
Loading dataset...
Dataset shape: (5630, 20)
Churn distribution: 0    3684
                    1    1946
...
Training accuracy: 0.9856
Test accuracy: 0.9681
✓ Model saved to models/churn_model.pkl
✓ SHAP explainer saved to models/shap_explainer.pkl
```

---

### Step 3: Start the API Server

```bash
python api_server.py
```

**Expected output:**
```
Loading model and artifacts...
✓ Model loaded
✓ SHAP explainer loaded
✓ Loaded 29 features
Server ready!
INFO:     Uvicorn running on http://0.0.0.0:8000
```

The API is now running at: **http://localhost:8000**

---

## 🧪 Testing the API

### Option 1: Run the Test Script

Open a **new terminal** (keep the API server running) and run:

```bash
python test_api.py
```

This will test with 2 sample customers (high-risk and low-risk).

---

### Option 2: Use the Interactive Docs

Visit: **http://localhost:8000/docs**

You'll see an interactive Swagger UI where you can:
1. Click on `POST /predict/churn`
2. Click "Try it out"
3. Enter customer data
4. Click "Execute"

---

### Option 3: Use cURL

```bash
curl -X POST "http://localhost:8000/predict/churn" \
  -H "Content-Type: application/json" \
  -d '{
    "tenure": 5,
    "citytier": 1,
    "warehousetohome": 15,
    "hourspendonapp": 3,
    "numberofdeviceregistered": 3,
    "satisfactionscore": 4,
    "maritalstatus": "Married",
    "numberofaddress": 2,
    "orderamounthikefromlastyear": 15,
    "couponused": 2,
    "ordercount": 8,
    "daysincelastorder": 10,
    "cashbackamount": 250,
    "gender": "Female",
    "complain": 0
  }'
```

---

## 📊 Input Field Specifications

### Required Fields

| Field Name | Type | Valid Values | Description | Example |
|------------|------|--------------|-------------|---------|
| **tenure** | float | 0-50 | Months as customer | `12.0` |
| **citytier** | int | 1, 2, or 3 | City classification (1=metro, 3=small) | `1` |
| **warehousetohome** | float | 0-100+ | Distance in km | `15.5` |
| **hourspendonapp** | float | 0-10 | Hours spent on app | `3.2` |
| **numberofdeviceregistered** | int | 1-6 | Number of devices | `3` |
| **satisfactionscore** | int | 1-5 | Satisfaction rating (1=worst, 5=best) | `4` |
| **maritalstatus** | string | "Single", "Married", "Divorced" | Marital status | `"Married"` |
| **numberofaddress** | int | 1-10+ | Number of saved addresses | `2` |
| **orderamounthikefromlastyear** | float | -100 to 100+ | % change in order value | `15.0` |
| **couponused** | int | 0-20+ | Coupons used last month | `3` |
| **ordercount** | int | 0-50+ | Orders last month | `8` |
| **daysincelastorder** | float | 0-365+ | Days since last order | `10.0` |
| **cashbackamount** | float | 0-1000+ | Average cashback (Tk) | `250.0` |
| **gender** | string | "Male", "Female" | Customer gender | `"Female"` |
| **complain** | int | 0 or 1 | Has complained? (0=no, 1=yes) | `0` |

### Optional Fields (can be omitted)

| Field Name | Type | Valid Values | Example |
|------------|------|--------------|---------|
| **preferredlogindevice** | string | "Mobile Phone", "Computer", "Phone" | `"Mobile Phone"` |
| **preferredpaymentmode** | string | "Debit Card", "Credit Card", "UPI", "E wallet", "COD", "Cash on Delivery", "CC" | `"Debit Card"` |
| **preferedordercat** | string | "Mobile", "Laptop & Accessory", "Fashion", "Grocery", "Others" | `"Fashion"` |

---

## 📤 Example API Response

**Request:**
```json
{
  "tenure": 2,
  "citytier": 3,
  "warehousetohome": 30,
  "hourspendonapp": 1,
  "numberofdeviceregistered": 2,
  "satisfactionscore": 2,
  "maritalstatus": "Single",
  "numberofaddress": 1,
  "orderamounthikefromlastyear": 5,
  "couponused": 0,
  "ordercount": 2,
  "daysincelastorder": 60,
  "cashbackamount": 100,
  "gender": "Male",
  "complain": 1
}
```

**Response:**
```json
{
  "churn_probability": 0.823,
  "risk_category": "Critical",
  "prediction": 1,
  "top_factors": [
    {
      "feature": "daysincelastorder",
      "value": 60.0,
      "impact": 0.247,
      "readable_name": "Days Since Last Order"
    },
    {
      "feature": "tenure",
      "value": 2.0,
      "impact": 0.198,
      "readable_name": "Customer Tenure"
    },
    {
      "feature": "satisfactionscore",
      "value": 2.0,
      "impact": 0.165,
      "readable_name": "Satisfaction Score"
    },
    {
      "feature": "complain",
      "value": 1.0,
      "impact": 0.142,
      "readable_name": "Complaints Filed"
    },
    {
      "feature": "ordercount",
      "value": 2.0,
      "impact": 0.118,
      "readable_name": "Order Count"
    }
  ]
}
```

**Interpretation:**
- **churn_probability: 0.823** → 82.3% chance customer will churn
- **risk_category: "Critical"** → Urgent action needed
- **prediction: 1** → Model predicts customer WILL CHURN
- **top_factors:** Shows WHY the model made this prediction
  - 60 days since last order is the biggest contributor (+0.247 impact)
  - Low tenure (2 months) also increases risk (+0.198)
  - Low satisfaction score (2/5) adds to risk (+0.165)

---

## 🎯 Understanding Risk Categories

| Churn Probability | Risk Category | Action Required |
|-------------------|---------------|-----------------|
| 0.0 - 0.3 | **Low** | Monitor regularly |
| 0.3 - 0.6 | **Medium** | Send engagement campaigns |
| 0.6 - 0.8 | **High** | Personalized retention offers |
| 0.8 - 1.0 | **Critical** | Urgent intervention needed |

---

## 🧠 Understanding SHAP Impact Values

**SHAP values explain EACH prediction individually.**

### How to Read Impact Values:

- **Positive impact (+)** → Feature INCREASES churn risk
- **Negative impact (-)** → Feature DECREASES churn risk
- **Larger absolute value** → Stronger influence

### Example:

```
Top Factors:
1. Days Since Last Order: 60 days
   Impact: +0.247 (increases churn by 24.7 percentage points)

2. Customer Tenure: 2 months
   Impact: +0.198 (increases churn by 19.8 percentage points)

3. Satisfaction Score: 2/5
   Impact: +0.165 (increases churn by 16.5 percentage points)
```

**Translation:** This customer has high churn risk because:
- They haven't ordered in 60 days (bad sign)
- They're new (only 2 months, not loyal yet)
- They're unhappy (satisfaction = 2/5)

---

## 🔧 Sample Customer Profiles for Testing

### 1. High-Risk Customer (Will Churn)
```json
{
  "tenure": 2,
  "citytier": 3,
  "warehousetohome": 30,
  "hourspendonapp": 1,
  "numberofdeviceregistered": 2,
  "satisfactionscore": 2,
  "maritalstatus": "Single",
  "numberofaddress": 1,
  "orderamounthikefromlastyear": 5,
  "couponused": 0,
  "ordercount": 2,
  "daysincelastorder": 60,
  "cashbackamount": 100,
  "gender": "Male",
  "complain": 1
}
```

### 2. Low-Risk Customer (Will Retain)
```json
{
  "tenure": 24,
  "citytier": 1,
  "warehousetohome": 10,
  "hourspendonapp": 5,
  "numberofdeviceregistered": 4,
  "satisfactionscore": 5,
  "maritalstatus": "Married",
  "numberofaddress": 3,
  "orderamounthikefromlastyear": 25,
  "couponused": 5,
  "ordercount": 15,
  "daysincelastorder": 3,
  "cashbackamount": 500,
  "gender": "Female",
  "complain": 0
}
```

### 3. Medium-Risk Customer
```json
{
  "tenure": 10,
  "citytier": 2,
  "warehousetohome": 20,
  "hourspendonapp": 3,
  "numberofdeviceregistered": 3,
  "satisfactionscore": 3,
  "maritalstatus": "Married",
  "numberofaddress": 2,
  "orderamounthikefromlastyear": 12,
  "couponused": 3,
  "ordercount": 7,
  "daysincelastorder": 20,
  "cashbackamount": 300,
  "gender": "Female",
  "complain": 0
}
```

---

## 📁 Project Structure

```
Sheba-Retention-AI/
├── data/
│   └── E_Commerce_Dataset.xlsx    # Your dataset (required)
├── models/                         # Created after training
│   ├── churn_model.pkl            # Trained XGBoost model
│   ├── shap_explainer.pkl         # SHAP explainer
│   ├── columns.json               # Feature column names
│   └── feature_names.json         # Feature metadata
├── train_model.py                  # Step 2: Train the model
├── api_server.py                   # Step 3: Run API server
├── test_api.py                     # Test the API
├── requirements.txt                # Step 1: Dependencies
├── SETUP_AND_RUN.md               # This file
└── churn_prediction.py            # Original notebook code (reference)
```

---

## ❓ Troubleshooting

### Issue: "No module named 'xgboost'"
**Solution:** Run `pip install -r requirements.txt`

### Issue: "FileNotFoundError: models/churn_model.pkl"
**Solution:** Run `python train_model.py` first to create the model

### Issue: "Cannot connect to http://localhost:8000"
**Solution:** Make sure `python api_server.py` is running in another terminal

### Issue: "Error loading dataset"
**Solution:** Ensure `data/E_Commerce_Dataset.xlsx` exists

### Issue: Invalid field values
**Solution:** Check the "Input Field Specifications" table above for valid ranges

---

## 🎯 Next Steps After Testing

1. ✅ Model trained successfully
2. ✅ API working with predictions
3. ✅ SHAP explanations showing why predictions are made
4. 🔜 Build React dashboard (from MVP_PLAN_CONCISE.md)
5. 🔜 Deploy to Railway/Heroku
6. 🔜 Integrate with real Sheba data

---

## 📞 API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | GET | Health check |
| `/health` | GET | Detailed health status |
| `/predict/churn` | POST | Get churn prediction with SHAP |
| `/features` | GET | List all model features |
| `/docs` | GET | Interactive API documentation |

---

## 💡 Tips

1. **Always check the interactive docs** at http://localhost:8000/docs - it's the easiest way to test
2. **Start with the sample profiles** provided above to see different risk levels
3. **Pay attention to SHAP values** - they tell you exactly what to fix for each customer
4. **Keep the API server running** while testing - don't restart it for every test

---

**Ready to use! 🚀**
