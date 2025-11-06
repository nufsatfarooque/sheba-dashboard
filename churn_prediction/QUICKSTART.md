# Sheba Retention AI - Quick Start Guide

## 🚀 How to Run

### Step 1: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 2: Train the Model

```bash
python train_model.py
```

This will:
- Load the dataset from `data/E_Commerce_Dataset.xlsx`
- Train an XGBoost model
- Create a SHAP explainer
- Save everything to `models/` folder:
  - `churn_model.pkl` - The trained model
  - `shap_explainer.pkl` - SHAP explainer for interpretability
  - `columns.json` - Feature column names
  - `feature_names.json` - Feature metadata

### Step 3: Start the API Server

```bash
python api_server.py
```

The API will be available at: `http://localhost:8000`

### Step 4: Test the API

In a new terminal:

```bash
python test_api.py
```

Or visit the interactive docs: `http://localhost:8000/docs`

---

## 📡 API Endpoints

### 1. **POST /predict/churn** - Get churn prediction

**Request:**
```json
{
  "tenure": 2,
  "citytier": 3,
  "warehousetohome": 25,
  "hourspendonapp": 1,
  "numberofdeviceregistered": 2,
  "satisfactionscore": 2,
  "maritalstatus": "Single",
  "numberofaddress": 1,
  "orderamounthikefromlastyear": 5,
  "couponused": 0,
  "ordercount": 2,
  "daysincelastorder": 55,
  "cashbackamount": 100,
  "gender": "Male",
  "complain": 1
}
```

**Response:**
```json
{
  "churn_probability": 0.78,
  "risk_category": "High",
  "prediction": 1,
  "top_factors": [
    {
      "feature": "daysincelastorder",
      "value": 55,
      "impact": 0.234,
      "readable_name": "Days Since Last Order"
    },
    {
      "feature": "tenure",
      "value": 2,
      "impact": 0.187,
      "readable_name": "Customer Tenure"
    },
    ...
  ]
}
```

### 2. **GET /health** - Health check

### 3. **GET /features** - List all model features

---

## 🧠 Understanding SHAP Explanations

**SHAP (SHapley Additive exPlanations)** tells you **WHY** the model made a prediction.

### Example:

```
Customer has 78% churn probability because:

1. Days Since Last Order: 55 days
   Impact: +0.234 (increases churn risk)

2. Low Tenure: 2 months
   Impact: +0.187 (increases churn risk)

3. Low Satisfaction: Score 2/5
   Impact: +0.156 (increases churn risk)
```

**How to read SHAP values:**
- **Positive impact** (+) = Feature INCREASES churn risk
- **Negative impact** (-) = Feature DECREASES churn risk
- **Higher absolute value** = Stronger influence on prediction

---

## 📊 Input Features (from your dataset)

Based on `data/E_Commerce_Dataset.xlsx`:

| Feature | Type | Description |
|---------|------|-------------|
| `tenure` | float | Tenure of customer in organization |
| `citytier` | int | City tier (1, 2, or 3) |
| `warehousetohome` | float | Distance from warehouse |
| `hourspendonapp` | float | Hours spent on app |
| `numberofdeviceregistered` | int | Number of devices registered |
| `satisfactionscore` | int | Satisfaction score (1-5) |
| `maritalstatus` | str | "Single", "Married", "Divorced" |
| `numberofaddress` | int | Number of addresses |
| `orderamounthikefromlastyear` | float | % increase in orders |
| `couponused` | int | Number of coupons used |
| `ordercount` | int | Total order count |
| `daysincelastorder` | float | Days since last order |
| `cashbackamount` | float | Average cashback amount |
| `gender` | str | "Male" or "Female" |
| `complain` | int | 1 if complained, 0 otherwise |

---

## 🧪 Testing with cURL

```bash
curl -X POST "http://localhost:8000/predict/churn" \
  -H "Content-Type: application/json" \
  -d '{
    "tenure": 2,
    "citytier": 3,
    "warehousetohome": 25,
    "hourspendonapp": 1,
    "numberofdeviceregistered": 2,
    "satisfactionscore": 2,
    "maritalstatus": "Single",
    "numberofaddress": 1,
    "orderamounthikefromlastyear": 5,
    "couponused": 0,
    "ordercount": 2,
    "daysincelastorder": 55,
    "cashbackamount": 100,
    "gender": "Male",
    "complain": 1
  }'
```

---

## 📁 Project Structure

```
Sheba-Retention-AI/
├── data/
│   └── E_Commerce_Dataset.xlsx    # Your dataset
├── models/                         # Generated after training
│   ├── churn_model.pkl
│   ├── shap_explainer.pkl
│   ├── columns.json
│   └── feature_names.json
├── train_model.py                  # Train the model
├── api_server.py                   # FastAPI server
├── test_api.py                     # Test script
├── requirements.txt                # Dependencies
└── QUICKSTART.md                   # This file
```

---

## 🎯 Next Steps

1. ✅ Train model with your data
2. ✅ Start API server
3. ✅ Test predictions with SHAP
4. 🔄 Build frontend dashboard (React)
5. 🔄 Deploy to production (Railway/Heroku)

---

## ❓ Troubleshooting

**Error: Model file not found**
- Run `python train_model.py` first

**Error: Cannot connect to API**
- Make sure `python api_server.py` is running

**Error: Missing dependencies**
- Run `pip install -r requirements.txt`

---

## 📚 Resources

- FastAPI Docs: https://fastapi.tiangolo.com
- SHAP Documentation: https://shap.readthedocs.io
- XGBoost Guide: https://xgboost.readthedocs.io
