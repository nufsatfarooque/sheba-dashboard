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

# Global variables for segmentation
segmentation_model = None
segment_scaler = None
segment_mapping = {}
segment_metadata = {}
customer_segments_df = None

@app.on_event("startup")
async def load_models():
    """Load model, SHAP explainer, and column names on startup"""
    global model, explainer, feature_columns
    global segmentation_model, segment_scaler, segment_mapping, segment_metadata, customer_segments_df

    print("Loading model and artifacts...")

    # Load the churn prediction model (optional)
    try:
        with open('models/churn_model.pkl', 'rb') as f:
            model = pickle.load(f)
        print("[OK] Churn model loaded")

        # Load SHAP explainer
        with open('models/shap_explainer.pkl', 'rb') as f:
            explainer = pickle.load(f)
        print("[OK] SHAP explainer loaded")

        # Load column names
        with open('models/columns.json', 'r') as f:
            columns_data = json.load(f)
            feature_columns = columns_data['data_columns']
        print(f"[OK] Loaded {len(feature_columns)} churn features")
    except FileNotFoundError as e:
        print(f"Warning: Churn prediction model not found ({e}). Churn endpoints will be unavailable.")
        print("Segmentation endpoints will still work.")

    # Load segmentation model and artifacts
    try:
        import pandas as pd

        with open('models/segmentation_model.pkl', 'rb') as f:
            segmentation_model = pickle.load(f)
        print("[OK] Segmentation model loaded")

        with open('models/segment_scaler.pkl', 'rb') as f:
            segment_scaler = pickle.load(f)
        print("[OK] Segment scaler loaded")

        with open('models/segment_mapping.json', 'r') as f:
            segment_mapping = json.load(f)
            # Convert string keys to integers
            segment_mapping = {int(k): v for k, v in segment_mapping.items()}
        print("[OK] Segment mapping loaded")

        with open('models/segment_metadata.json', 'r') as f:
            segment_metadata = json.load(f)
        print(f"[OK] Segment metadata loaded ({len(segment_metadata)} segments)")

        # Load customer segments
        customer_segments_df = pd.read_csv('models/customer_segments.csv')
        print(f"[OK] Customer segments loaded ({len(customer_segments_df)} customers)")

    except FileNotFoundError as e:
        print(f"\n[INFO] Segmentation models not found. Generating initial segmentation...")
        print("This is a one-time setup. Future segmentations can be triggered from the frontend.")

        # Auto-generate initial segmentation
        try:
            import subprocess
            result = subprocess.run(['python', 'segment_customers.py'],
                                  capture_output=True, text=True, timeout=60)

            if result.returncode == 0:
                print("[OK] Initial segmentation completed!")

                # Now load the generated models
                import pandas as pd

                with open('models/segmentation_model.pkl', 'rb') as f:
                    segmentation_model = pickle.load(f)
                with open('models/segment_scaler.pkl', 'rb') as f:
                    segment_scaler = pickle.load(f)
                with open('models/segment_mapping.json', 'r') as f:
                    segment_mapping = json.load(f)
                    segment_mapping = {int(k): v for k, v in segment_mapping.items()}
                with open('models/segment_metadata.json', 'r') as f:
                    segment_metadata = json.load(f)
                customer_segments_df = pd.read_csv('models/customer_segments.csv')

                print(f"[OK] Loaded {len(customer_segments_df)} customer segments")
            else:
                print(f"[ERROR] Segmentation generation failed: {result.stderr}")
                print("Segmentation endpoints will be unavailable until models are generated.")
        except Exception as gen_error:
            print(f"[ERROR] Could not auto-generate segmentation: {gen_error}")
            print("You can manually run 'python segment_customers.py' or use the recalculate endpoint.")

    print("\nServer ready!")


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
        "feature_count": len(feature_columns),
        "segmentation_loaded": segmentation_model is not None
    }


# ==================== SEGMENTATION ENDPOINTS ====================

@app.get("/api/segments")
async def get_segments():
    """
    Get all customer segments with distribution

    Returns segment names, counts, percentages, and characteristics
    """
    if not segment_metadata:
        raise HTTPException(status_code=503, detail="Segmentation model not loaded")

    # Calculate total customers
    total_customers = sum(meta['count'] for meta in segment_metadata.values())

    # Build segment distribution
    segment_distribution = {
        name: meta['count']
        for name, meta in segment_metadata.items()
    }

    return {
        "total_customers": total_customers,
        "segment_count": len(segment_metadata),
        "segments": segment_distribution,
        "metadata": segment_metadata
    }


@app.get("/api/segments/{segment_name}")
async def get_segment_details(segment_name: str):
    """
    Get detailed information about a specific segment

    Returns segment characteristics, average metrics, and description
    """
    if not segment_metadata:
        raise HTTPException(status_code=503, detail="Segmentation model not loaded")

    # URL decode (keep hyphens as they're part of segment names)
    segment_name_decoded = segment_name.replace("%20", " ")

    # Find matching segment (case-insensitive)
    matching_segment = None
    for name in segment_metadata.keys():
        if name.lower() == segment_name_decoded.lower():
            matching_segment = name
            break

    if not matching_segment:
        raise HTTPException(
            status_code=404,
            detail=f"Segment '{segment_name}' not found. Available segments: {list(segment_metadata.keys())}"
        )

    segment_info = segment_metadata[matching_segment]

    # Add segment name to response
    response = {
        "segment_name": matching_segment,
        **segment_info
    }

    return response


@app.get("/api/segments/{segment_name}/customers")
async def get_segment_customers(segment_name: str, limit: int = 50, offset: int = 0):
    """
    Get list of customers in a specific segment

    Parameters:
    - segment_name: Name of the segment
    - limit: Maximum number of customers to return (default 50)
    - offset: Pagination offset (default 0)

    Returns list of customers with their details
    """
    if customer_segments_df is None:
        raise HTTPException(status_code=503, detail="Customer segments not loaded")

    # URL decode (keep hyphens as they're part of segment names)
    segment_name_decoded = segment_name.replace("%20", " ")

    # Filter customers by segment (case-insensitive)
    segment_customers = customer_segments_df[
        customer_segments_df['segment'].str.lower() == segment_name_decoded.lower()
    ]

    if len(segment_customers) == 0:
        raise HTTPException(
            status_code=404,
            detail=f"No customers found for segment '{segment_name}'"
        )

    # Apply pagination
    total_count = len(segment_customers)
    paginated_customers = segment_customers.iloc[offset:offset+limit]

    # Convert to list of dicts
    customers_list = paginated_customers.to_dict('records')

    # Format response
    return {
        "segment_name": segment_customers.iloc[0]['segment'],
        "total_count": total_count,
        "offset": offset,
        "limit": limit,
        "customers": customers_list
    }


@app.post("/api/segments/recalculate")
async def recalculate_segments():
    """
    Trigger re-segmentation of all customers

    This endpoint:
    1. Loads/generates customer data
    2. Engineers segmentation features
    3. Applies the K-Means model
    4. Updates segment assignments
    5. Saves updated customer_segments.csv
    6. Recalculates segment metadata
    7. Reloads global segment variables

    Returns updated segment statistics
    """
    global segment_metadata, customer_segments_df

    if segmentation_model is None or segment_scaler is None:
        raise HTTPException(status_code=503, detail="Segmentation model not loaded. Run segment_customers.py first.")

    try:
        import pandas as pd
        import numpy as np
        from datetime import datetime

        print(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Starting re-segmentation...")

        # 1. Load customer data (synthetic for now - replace with real data source)
        print("  [1/7] Loading customer data...")
        np.random.seed(42)
        n_customers = 10000

        customer_ids = [f"CUST{str(i).zfill(5)}" for i in range(1, n_customers + 1)]

        df = pd.DataFrame({
            'customerid': customer_ids,
            'cashbackamount': np.random.gamma(2, 50, n_customers),
            'ordercount': np.random.poisson(5, n_customers),
            'couponused': np.random.poisson(2, n_customers),
            'complain': np.random.choice([0, 1, 2, 3], n_customers, p=[0.7, 0.2, 0.08, 0.02]),
            'satisfactionscore': np.random.choice([1, 2, 3, 4, 5], n_customers, p=[0.05, 0.1, 0.25, 0.4, 0.2]),
            'tenure': np.random.exponential(12, n_customers),
            'daysincelastorder': np.random.exponential(30, n_customers),
            'orderamounthikefromlastyear': np.random.normal(15, 30, n_customers)
        })

        # Ensure positive values
        df['cashbackamount'] = df['cashbackamount'].clip(lower=0)
        df['ordercount'] = df['ordercount'].clip(lower=0)
        df['tenure'] = df['tenure'].clip(lower=0.1)
        df['daysincelastorder'] = df['daysincelastorder'].clip(lower=0)

        print(f"    Loaded {len(df)} customers")

        # 2. Engineer segmentation features
        print("  [2/7] Engineering features...")
        segmentation_features = pd.DataFrame()

        segmentation_features['avg_spent'] = df['cashbackamount'] / (df['ordercount'] + 1)
        segmentation_features['num_bookings'] = df['ordercount']

        coupon_rate = df['couponused'] / (df['ordercount'] + 1)
        cashback_weight = df['cashbackamount'] / (df['cashbackamount'].max() + 1)
        segmentation_features['price_sensitivity_score'] = coupon_rate * (1 + cashback_weight)

        segmentation_features['complaints_count'] = df['complain']
        segmentation_features['satisfaction_score'] = df['satisfactionscore']
        segmentation_features['tenure'] = df['tenure']
        segmentation_features['days_since_last_order'] = df['daysincelastorder']
        segmentation_features['order_growth'] = df['orderamounthikefromlastyear']

        # Handle missing values
        segmentation_features = segmentation_features.fillna(segmentation_features.median())

        print(f"    Engineered {segmentation_features.shape[1]} features")

        # 3. Scale features and predict segments
        print("  [3/7] Scaling features...")
        features_scaled = segment_scaler.transform(segmentation_features)

        print("  [4/7] Applying K-Means model...")
        cluster_labels = segmentation_model.predict(features_scaled)

        # 4. Map clusters to segment names
        print("  [5/7] Mapping clusters to segments...")
        segment_labels = [segment_mapping.get(int(cluster), f"Cluster_{cluster}") for cluster in cluster_labels]

        # 5. Create updated customer segments dataframe
        customer_segments_df = pd.DataFrame({
            'customer_id': customer_ids,
            'segment': segment_labels,
            'cluster': cluster_labels
        })

        # Save to CSV
        customer_segments_df.to_csv('models/customer_segments.csv', index=False)
        print("    Saved customer_segments.csv")

        # 6. Recalculate segment metadata
        print("  [6/7] Recalculating segment metadata...")

        segmentation_features['segment'] = segment_labels
        segmentation_features['customer_id'] = customer_ids

        # Helper functions
        def get_segment_description(segment_name):
            descriptions = {
                'Price-Sensitive': 'Customers who are highly responsive to discounts, coupons, and cashback offers. Focus on value and pricing.',
                'High-Value': 'Premium customers with high spending and frequent bookings. Highest lifetime value and engagement.',
                'Quality-Focused': 'Customers who prioritize service quality and have specific standards. May have complaints or lower satisfaction.',
                'Loyal': 'Long-term customers with consistent booking patterns and high retention. Low churn risk.',
                'Occasional': 'Infrequent users with sporadic booking patterns. Potential for reactivation campaigns.'
            }
            return descriptions.get(segment_name, 'Customer segment based on behavioral patterns')

        def get_segment_color(segment_name):
            colors = {
                'Price-Sensitive': '#3B82F6',
                'High-Value': '#10B981',
                'Quality-Focused': '#F59E0B',
                'Loyal': '#8B5CF6',
                'Occasional': '#FCD34D'
            }
            return colors.get(segment_name, '#6B7280')

        # Build new metadata
        new_metadata = {}
        unique_segments = set(segment_labels)

        # Add cluster labels to segmentation_features for metadata calculation
        segmentation_features['cluster'] = cluster_labels

        for segment_name in unique_segments:
            segment_data = segmentation_features[segmentation_features['segment'] == segment_name]

            # Find cluster ID for this segment
            cluster_id = int(segment_data['cluster'].iloc[0]) if len(segment_data) > 0 else 0

            new_metadata[segment_name] = {
                'cluster_id': cluster_id,
                'count': len(segment_data),
                'percentage': round((len(segment_data) / len(segmentation_features)) * 100, 1),
                'characteristics': {
                    'avg_spent': round(float(segment_data['avg_spent'].mean()), 2),
                    'num_bookings': round(float(segment_data['num_bookings'].mean()), 2),
                    'price_sensitivity_score': round(float(segment_data['price_sensitivity_score'].mean()), 3),
                    'complaints_count': round(float(segment_data['complaints_count'].mean()), 2),
                    'satisfaction_score': round(float(segment_data['satisfaction_score'].mean()), 2),
                    'tenure': round(float(segment_data['tenure'].mean()), 2),
                    'days_since_last_order': round(float(segment_data['days_since_last_order'].mean()), 2),
                    'order_growth': round(float(segment_data['order_growth'].mean()), 2)
                },
                'description': get_segment_description(segment_name),
                'color': get_segment_color(segment_name)
            }

        # Save updated metadata
        with open('models/segment_metadata.json', 'w') as f:
            json.dump(new_metadata, f, indent=2)

        # 7. Update global variables
        print("  [7/7] Updating global variables...")
        segment_metadata = new_metadata

        # Calculate statistics
        total_customers = len(customer_segments_df)
        segment_distribution = customer_segments_df['segment'].value_counts().to_dict()

        print(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Re-segmentation complete!")
        print(f"  Total customers: {total_customers}")
        print(f"  Segments found: {len(unique_segments)}")
        for seg, count in segment_distribution.items():
            pct = (count / total_customers) * 100
            print(f"    - {seg}: {count} ({pct:.1f}%)")

        return {
            "status": "success",
            "message": "Customer segmentation recalculated successfully",
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "total_customers": total_customers,
                "segment_count": len(unique_segments),
                "segments": segment_distribution,
                "updated_files": [
                    "models/customer_segments.csv",
                    "models/segment_metadata.json"
                ]
            }
        }

    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"\n[ERROR] Re-segmentation failed:")
        print(error_details)
        raise HTTPException(
            status_code=500,
            detail=f"Re-segmentation failed: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
