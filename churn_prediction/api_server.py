"""
FastAPI server for Sheba Churn Prediction with SHAP explanations
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pickle
import json
import numpy as np
import shap
from typing import List, Dict, Optional

app = FastAPI(title="Sheba Retention AI", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for model and explainer
model = None
explainer = None
feature_columns = []

@app.on_event("startup")
async def load_models():
    """Load model, SHAP explainer, and column names on startup"""
    global model, explainer, feature_columns

    print("Loading model and artifacts...")

    # Load the trained model
    with open('models/churn_model.pkl', 'rb') as f:
        model = pickle.load(f)
    print("✓ Model loaded")

    # Load SHAP explainer
    with open('models/shap_explainer.pkl', 'rb') as f:
        explainer = pickle.load(f)
    print("✓ SHAP explainer loaded")

    # Load column names
    with open('models/columns.json', 'r') as f:
        columns_data = json.load(f)
        feature_columns = columns_data['data_columns']
    print(f"✓ Loaded {len(feature_columns)} features")

    print("Server ready!")


# Pydantic models for request/response
class CustomerInput(BaseModel):
    """
    Input features for churn prediction
    Based on the E-commerce dataset columns (from README)
    """
    tenure: float
    citytier: int
    warehousetohome: float
    hourspendonapp: float
    numberofdeviceregistered: int
    satisfactionscore: int
    maritalstatus: str  # Will be one-hot encoded
    numberofaddress: int
    orderamounthikefromlastyear: float
    couponused: int
    ordercount: int
    daysincelastorder: float
    cashbackamount: float
    gender: str  # Will be one-hot encoded
    complain: int

    # Optional: categorical features (if needed)
    preferredlogindevice: Optional[str] = None
    preferredpaymentmode: Optional[str] = None
    preferedordercat: Optional[str] = None


class ChurnFactor(BaseModel):
    """Individual factor contributing to churn prediction"""
    feature: str
    value: float
    impact: float
    readable_name: str


class ChurnPrediction(BaseModel):
    """Churn prediction response with SHAP explanations"""
    churn_probability: float
    risk_category: str
    top_factors: List[ChurnFactor]
    prediction: int  # 0 or 1


def get_risk_category(probability: float) -> str:
    """Convert probability to risk category"""
    if probability >= 0.8:
        return "Critical"
    elif probability >= 0.6:
        return "High"
    elif probability >= 0.3:
        return "Medium"
    else:
        return "Low"


def feature_to_readable_name(feature: str) -> str:
    """Convert feature name to human-readable format"""
    readable_map = {
        'tenure': 'Customer Tenure',
        'daysincelastorder': 'Days Since Last Order',
        'satisfactionscore': 'Satisfaction Score',
        'complain': 'Complaints Filed',
        'ordercount': 'Order Count',
        'cashbackamount': 'Cashback Amount',
        'warehousetohome': 'Distance from Warehouse',
        'hourspendonapp': 'Hours on App',
        'couponused': 'Coupons Used',
        'orderamounthikefromlastyear': 'Order Amount Growth',
        'numberofaddress': 'Number of Addresses',
        'numberofdeviceregistered': 'Devices Registered',
        'citytier': 'City Tier',
    }
    return readable_map.get(feature.lower(), feature.replace('_', ' ').title())


def prepare_input_vector(customer_data: CustomerInput) -> np.ndarray:
    """
    Convert customer input to model input vector
    Handles one-hot encoding and feature alignment
    """
    # Create a dictionary with all features initialized to 0
    feature_dict = {col: 0.0 for col in feature_columns}

    # Fill in numeric features
    numeric_features = {
        'tenure': customer_data.tenure,
        'citytier': customer_data.citytier,
        'warehousetohome': customer_data.warehousetohome,
        'hourspendonapp': customer_data.hourspendonapp,
        'numberofdeviceregistered': customer_data.numberofdeviceregistered,
        'satisfactionscore': customer_data.satisfactionscore,
        'numberofaddress': customer_data.numberofaddress,
        'orderamounthikefromlastyear': customer_data.orderamounthikefromlastyear,
        'couponused': customer_data.couponused,
        'ordercount': customer_data.ordercount,
        'daysincelastorder': customer_data.daysincelastorder,
        'cashbackamount': customer_data.cashbackamount,
        'complain': customer_data.complain,
    }

    for feature, value in numeric_features.items():
        if feature in feature_dict:
            feature_dict[feature] = value

    # Handle one-hot encoded categorical features
    # Gender
    gender_col = f'gender_{customer_data.gender}'
    if gender_col in feature_dict:
        feature_dict[gender_col] = 1.0

    # Marital Status
    marital_col = f'maritalstatus_{customer_data.maritalstatus}'
    if marital_col in feature_dict:
        feature_dict[marital_col] = 1.0

    # Optional categoricals
    if customer_data.preferredlogindevice:
        login_col = f'preferredlogindevice_{customer_data.preferredlogindevice}'
        if login_col in feature_dict:
            feature_dict[login_col] = 1.0

    if customer_data.preferredpaymentmode:
        payment_col = f'preferredpaymentmode_{customer_data.preferredpaymentmode}'
        if payment_col in feature_dict:
            feature_dict[payment_col] = 1.0

    if customer_data.preferedordercat:
        category_col = f'preferedordercat_{customer_data.preferedordercat}'
        if category_col in feature_dict:
            feature_dict[category_col] = 1.0

    # Convert to numpy array in correct order
    input_vector = np.array([feature_dict[col] for col in feature_columns]).reshape(1, -1)

    return input_vector


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Sheba Retention AI API",
        "status": "running",
        "features_loaded": len(feature_columns)
    }


@app.post("/predict/churn", response_model=ChurnPrediction)
async def predict_churn(customer: CustomerInput):
    """
    Predict churn probability for a customer with SHAP explanations

    Returns:
    - churn_probability: Probability of churn (0-1)
    - risk_category: Low/Medium/High/Critical
    - top_factors: Top 5 features contributing to the prediction
    - prediction: Binary prediction (0=retain, 1=churn)
    """
    try:
        # Prepare input
        input_vector = prepare_input_vector(customer)

        # Get prediction
        prediction_proba = model.predict_proba(input_vector)[0]
        churn_prob = float(prediction_proba[1])  # Probability of class 1 (churn)
        prediction = int(model.predict(input_vector)[0])

        # Get SHAP values for explanation
        shap_values = explainer.shap_values(input_vector)

        # SHAP values for the positive class (churn)
        # Handle different SHAP output formats
        if isinstance(shap_values, list):
            # Binary classification - take the churn class (index 1)
            shap_values_churn = np.array(shap_values[1])
            if shap_values_churn.ndim > 1:
                shap_values_churn = shap_values_churn[0]
        else:
            shap_values_churn = np.array(shap_values)
            if shap_values_churn.ndim > 1:
                shap_values_churn = shap_values_churn[0]

        # Ensure it's a 1D array
        shap_values_churn = shap_values_churn.flatten()

        # Get top contributing features
        feature_impacts = []
        for i, (feature_name, shap_value) in enumerate(zip(feature_columns, shap_values_churn)):
            # Handle scalar conversion safely
            try:
                impact_value = float(shap_value)
                input_value = float(input_vector[0][i])
            except (TypeError, ValueError):
                # If conversion fails, extract from array
                impact_value = float(np.asarray(shap_value).item())
                input_value = float(np.asarray(input_vector[0][i]).item())

            feature_impacts.append({
                'feature': feature_name,
                'value': input_value,
                'impact': impact_value,
                'readable_name': feature_to_readable_name(feature_name)
            })

        # Sort by absolute impact and take top 5
        feature_impacts.sort(key=lambda x: abs(x['impact']), reverse=True)
        top_factors = [
            ChurnFactor(**factor) for factor in feature_impacts[:5]
        ]

        # Get risk category
        risk_category = get_risk_category(churn_prob)

        return ChurnPrediction(
            churn_probability=churn_prob,
            risk_category=risk_category,
            top_factors=top_factors,
            prediction=prediction
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@app.get("/features")
async def get_features():
    """Get list of all features used by the model"""
    return {
        "features": feature_columns,
        "count": len(feature_columns)
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "explainer_loaded": explainer is not None,
        "feature_count": len(feature_columns)
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
