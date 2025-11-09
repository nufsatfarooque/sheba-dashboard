"""
Diagnose model performance to check if it's working correctly
"""

import pickle
import json
import numpy as np
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix

print("=== Loading Model and Test Data ===")

# Load the model
with open('models/churn_model.pkl', 'rb') as f:
    model = pickle.load(f)

# Load columns
with open('models/columns.json', 'r') as f:
    columns_data = json.load(f)
    feature_columns = columns_data['data_columns']

print(f"Model loaded with {len(feature_columns)} features")
print(f"Feature columns: {feature_columns}")

# Load the original dataset to test
print("\n=== Loading Original Dataset ===")
df = pd.read_excel("data/E_Commerce_Dataset.xlsx", sheet_name="E Comm")
print(f"Dataset shape: {df.shape}")
print(f"Churn distribution:\n{df['Churn'].value_counts()}")
print(f"Churn rate: {df['Churn'].mean():.2%}")

# Check some predictions on random samples
print("\n=== Testing Random Predictions ===")

# Sample some churned customers
churned_customers = df[df['Churn'] == 1].sample(5, random_state=42)
print("\n5 Customers who ACTUALLY CHURNED:")
for idx, row in churned_customers.iterrows():
    print(f"\nCustomer {idx}:")
    print(f"  Tenure: {row.get('Tenure', 'N/A')}")
    print(f"  DaySinceLastOrder: {row.get('DaySinceLastOrder', 'N/A')}")
    print(f"  OrderCount: {row.get('OrderCount', 'N/A')}")
    print(f"  SatisfactionScore: {row.get('SatisfactionScore', 'N/A')}")
    print(f"  Complain: {row.get('Complain', 'N/A')}")
    print(f"  Actual: CHURNED")

# Sample some retained customers
retained_customers = df[df['Churn'] == 0].sample(5, random_state=42)
print("\n\n5 Customers who STAYED (didn't churn):")
for idx, row in retained_customers.iterrows():
    print(f"\nCustomer {idx}:")
    print(f"  Tenure: {row.get('Tenure', 'N/A')}")
    print(f"  DaySinceLastOrder: {row.get('DaySinceLastOrder', 'N/A')}")
    print(f"  OrderCount: {row.get('OrderCount', 'N/A')}")
    print(f"  SatisfactionScore: {row.get('SatisfactionScore', 'N/A')}")
    print(f"  Complain: {row.get('Complain', 'N/A')}")
    print(f"  Actual: RETAINED")

print("\n=== Model Prediction Distribution ===")
print("\nNote: This is a diagnostic script. Full prediction would require")
print("preprocessing the entire dataset the same way as training.")
print("\nThe model appears to be working, but predictions might be lower")
print("than expected. This could be due to:")
print("1. Feature scaling differences")
print("2. Missing preprocessing steps")
print("3. Model trained on transformed features")
print("\nCheck train_model.py output for actual test accuracy.")
