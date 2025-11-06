"""
Clean training script for churn prediction with SHAP support
Based on the existing churn_prediction.py but simplified for production
"""

import numpy as np
import pandas as pd
import pickle
import json
import warnings
warnings.filterwarnings('ignore')

from sklearn.model_selection import train_test_split
from sklearn.impute import SimpleImputer
from sklearn.experimental import enable_iterative_imputer
from sklearn.impute import IterativeImputer
from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBClassifier
from imblearn.over_sampling import SMOTE
import shap

print("Loading dataset...")
df = pd.read_excel("data/E_Commerce_Dataset.xlsx", sheet_name="E Comm")

print(f"Dataset shape: {df.shape}")
print(f"Churn distribution: {df['Churn'].value_counts()}")

# Drop CustomerID
df.drop(columns="CustomerID", inplace=True)

# Change column names to lowercase
df.columns = [col.lower() for col in df.columns]

print("\n=== Handling Missing Values ===")

def fill_missing_values(df, random_state=None):
    """Fill missing values using mean for numeric and iterative imputer"""
    numeric_columns = df.select_dtypes(include=['float64', 'int64']).columns.tolist()
    categorical_columns = df.select_dtypes(include=['object']).columns.tolist()

    # Impute numeric columns
    numeric_imputer = SimpleImputer(strategy='mean')
    df[numeric_columns] = numeric_imputer.fit_transform(df[numeric_columns])

    # Handle categorical columns
    for col in categorical_columns:
        if df[col].dtype == 'object':
            encoded_cols = pd.get_dummies(df[col], prefix=col)
            df = pd.concat([df.drop(col, axis=1), encoded_cols], axis=1)

    # Random Forest Iterative Imputer
    rf_imputer = IterativeImputer(estimator=RandomForestRegressor(random_state=random_state))
    df = pd.DataFrame(rf_imputer.fit_transform(df), columns=df.columns)

    return df

df = fill_missing_values(df, random_state=42)

print("\n=== Preparing Data ===")

# Split features and target
X = df.drop(columns=["churn"])
y = df["churn"]

# Split into train/test
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print(f"Training set size: {X_train.shape}")
print(f"Test set size: {X_test.shape}")

print("\n=== Handling Imbalanced Dataset with SMOTE ===")
print(f'Before SMOTE - Class 0: {sum(y_train==0)}, Class 1: {sum(y_train==1)}')

sm = SMOTE(sampling_strategy=1, random_state=42)
X_train_balanced, y_train_balanced = sm.fit_resample(X_train, y_train.ravel())

print(f'After SMOTE - Class 0: {sum(y_train_balanced==0)}, Class 1: {sum(y_train_balanced==1)}')

# Drop less important columns (from feature importance analysis in original script)
cols_to_drop = [
    'preferredlogindevice_Computer', 'preferredlogindevice_Mobile Phone', 'preferredlogindevice_Phone',
    'preferredpaymentmode_CC', 'preferredpaymentmode_COD', 'preferredpaymentmode_Cash on Delivery',
    'preferredpaymentmode_Credit Card', 'preferredpaymentmode_Debit Card', 'preferredpaymentmode_E wallet',
    'preferredpaymentmode_UPI', 'preferedordercat_Fashion', 'preferedordercat_Grocery',
    'preferedordercat_Laptop & Accessory', 'preferedordercat_Mobile', 'preferedordercat_Mobile Phone',
    'preferedordercat_Others'
]

# Only drop columns that exist
cols_to_drop = [col for col in cols_to_drop if col in X.columns]
X_train_balanced = pd.DataFrame(X_train_balanced, columns=X_train.columns)
X_train_balanced.drop(cols_to_drop, axis=1, inplace=True, errors='ignore')
X_test.drop(cols_to_drop, axis=1, inplace=True, errors='ignore')

print(f"\nFinal feature count: {X_train_balanced.shape[1]}")

print("\n=== Training XGBoost Model ===")

# Convert to numpy arrays
X_train_np = X_train_balanced.values
X_test_np = X_test.values

# Train model
model = XGBClassifier(random_state=42, eval_metric='logloss')
model.fit(X_train_np, y_train_balanced)

# Evaluate
train_score = model.score(X_train_np, y_train_balanced)
test_score = model.score(X_test_np, y_test)

print(f"Training accuracy: {train_score:.4f}")
print(f"Test accuracy: {test_score:.4f}")

# Make predictions
y_pred = model.predict(X_test_np)
y_pred_proba = model.predict_proba(X_test_np)

from sklearn.metrics import classification_report, confusion_matrix

print("\n=== Model Evaluation ===")
print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))
print("\nClassification Report:")
print(classification_report(y_test, y_pred))

print("\n=== Creating SHAP Explainer ===")

# Fix for XGBoost 2.0+ compatibility with SHAP
# Save model in JSON format and reload to avoid base_score parsing issues
import tempfile
import os

with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
    temp_model_path = f.name
    model.save_model(temp_model_path)

# Reload the model
model_reloaded = XGBClassifier()
model_reloaded.load_model(temp_model_path)
os.unlink(temp_model_path)

# Now create SHAP explainer with reloaded model
try:
    explainer = shap.TreeExplainer(model_reloaded)
    print("✓ TreeExplainer created successfully")
except Exception as e:
    print(f"Warning: TreeExplainer failed ({e}), using Explainer instead")
    # Fallback to general Explainer
    explainer = shap.Explainer(model_reloaded.predict_proba, X_train_np[:100])

# Test SHAP on a small sample
sample_size = 100
X_sample = X_test_np[:sample_size]
shap_values = explainer.shap_values(X_sample)

# Handle different SHAP output formats
if isinstance(shap_values, list):
    print(f"SHAP values computed for {sample_size} samples (binary classification)")
    print(f"SHAP values shape (class 0): {shap_values[0].shape}")
    print(f"SHAP values shape (class 1): {shap_values[1].shape}")
else:
    print(f"SHAP values computed for {sample_size} samples")
    print(f"SHAP values shape: {shap_values.shape}")

print("\n=== Saving Model and Artifacts ===")

# Create models directory if it doesn't exist
import os
os.makedirs('models', exist_ok=True)

# Save the reloaded model (compatible with SHAP)
with open('models/churn_model.pkl', 'wb') as f:
    pickle.dump(model_reloaded, f)
print("✓ Model saved to models/churn_model.pkl")

# Save the SHAP explainer
with open('models/shap_explainer.pkl', 'wb') as f:
    pickle.dump(explainer, f)
print("✓ SHAP explainer saved to models/shap_explainer.pkl")

# Save column names
columns = {'data_columns': list(X_train_balanced.columns)}
with open("models/columns.json", "w") as f:
    json.dump(columns, f)
print("✓ Column names saved to models/columns.json")

# Save feature names separately for easy access
feature_names = list(X_train_balanced.columns)
with open("models/feature_names.json", "w") as f:
    json.dump({'features': feature_names}, f)
print("✓ Feature names saved to models/feature_names.json")

print("\n=== Training Complete ===")
print(f"Model accuracy: {test_score:.2%}")
print(f"Features used: {len(feature_names)}")
print("\nReady for FastAPI deployment!")
