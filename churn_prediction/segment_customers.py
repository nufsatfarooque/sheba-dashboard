"""
Customer Segmentation using K-Means Clustering
Creates 5 segments: Price-Sensitive, High-Value, Quality-Focused, Loyal, Occasional

Features used:
- avg_spent: Average spending per order
- num_bookings: Total number of bookings
- price_sensitivity_score: Coupon usage rate weighted by cashback
- complaints_count: Number of complaints filed
- satisfaction_score: Customer satisfaction level
- tenure: Customer tenure in months
"""

import numpy as np
import pandas as pd
import pickle
import json
import warnings
warnings.filterwarnings('ignore')

from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
import matplotlib.pyplot as plt
import seaborn as sns

print("="*60)
print("SHEBA RETENTION AI - CUSTOMER SEGMENTATION")
print("="*60)

print("\n[1/6] Generating synthetic customer data...")

# Generate synthetic customer data for demonstration
np.random.seed(42)
n_customers = 10000

# Create synthetic customer data based on Sheba business patterns
customer_ids = [f"CUST{str(i).zfill(5)}" for i in range(1, n_customers + 1)]

# Generate features that will create natural segments
df = pd.DataFrame({
    'customerid': customer_ids,
    'cashbackamount': np.random.gamma(2, 50, n_customers),  # Skewed distribution
    'ordercount': np.random.poisson(5, n_customers),  # Poisson for count data
    'couponused': np.random.poisson(2, n_customers),
    'complain': np.random.choice([0, 1, 2, 3], n_customers, p=[0.7, 0.2, 0.08, 0.02]),
    'satisfactionscore': np.random.choice([1, 2, 3, 4, 5], n_customers, p=[0.05, 0.1, 0.25, 0.4, 0.2]),
    'tenure': np.random.exponential(12, n_customers),  # Exponential for tenure
    'daysincelastorder': np.random.exponential(30, n_customers),
    'orderamounthikefromlastyear': np.random.normal(15, 30, n_customers)
})

# Ensure positive values
df['cashbackamount'] = df['cashbackamount'].clip(lower=0)
df['ordercount'] = df['ordercount'].clip(lower=0)
df['tenure'] = df['tenure'].clip(lower=0.1)
df['daysincelastorder'] = df['daysincelastorder'].clip(lower=0)

print(f"[OK] Synthetic data generated: {df.shape}")
print(f"  Total customers: {len(df)}")

# Keep CustomerID for reference
customer_ids = df['customerid'].copy()

print("\n[2/6] Engineering segmentation features...")

# Feature Engineering
segmentation_features = pd.DataFrame()

# 1. Average Spent per Order
segmentation_features['avg_spent'] = df['cashbackamount'] / (df['ordercount'] + 1)  # +1 to avoid division by zero

# 2. Number of Bookings
segmentation_features['num_bookings'] = df['ordercount']

# 3. Price Sensitivity Score
# Higher score = more price sensitive (uses more coupons, relies on cashback)
coupon_rate = df['couponused'] / (df['ordercount'] + 1)
cashback_weight = df['cashbackamount'] / (df['cashbackamount'].max() + 1)
segmentation_features['price_sensitivity_score'] = coupon_rate * (1 + cashback_weight)

# 4. Complaints Count
segmentation_features['complaints_count'] = df['complain']

# 5. Satisfaction Score
segmentation_features['satisfaction_score'] = df['satisfactionscore']

# 6. Tenure (months)
segmentation_features['tenure'] = df['tenure']

# 7. Days Since Last Order (recency)
segmentation_features['days_since_last_order'] = df['daysincelastorder']

# 8. Order Amount Hike (growth indicator)
segmentation_features['order_growth'] = df['orderamounthikefromlastyear']

print(f"[OK] Features engineered:")
for col in segmentation_features.columns:
    print(f"  - {col}: mean={segmentation_features[col].mean():.2f}, std={segmentation_features[col].std():.2f}")

# Handle missing values
segmentation_features = segmentation_features.fillna(segmentation_features.median())

print("\n[3/6] Scaling features...")

# Standardize features for K-Means
scaler = StandardScaler()
features_scaled = scaler.fit_transform(segmentation_features)

print(f"[OK] Features scaled: {features_scaled.shape}")

print("\n[4/6] Finding optimal number of clusters...")

# Elbow method
inertias = []
silhouette_scores = []
K_range = range(3, 8)

for k in K_range:
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    kmeans.fit(features_scaled)
    inertias.append(kmeans.inertia_)
    score = silhouette_score(features_scaled, kmeans.labels_)
    silhouette_scores.append(score)
    print(f"  k={k}: inertia={kmeans.inertia_:.2f}, silhouette={score:.3f}")

# Use 5 clusters as specified
optimal_k = 5
print(f"\n[OK] Using k={optimal_k} clusters (as specified)")

print("\n[5/6] Training K-Means model...")

# Train final model
kmeans = KMeans(n_clusters=optimal_k, random_state=42, n_init=10)
cluster_labels = kmeans.fit_predict(features_scaled)

# Add cluster labels to original dataframe
segmentation_features['cluster'] = cluster_labels
segmentation_features['customer_id'] = customer_ids

print(f"[OK] K-Means trained")
print(f"  Silhouette Score: {silhouette_score(features_scaled, cluster_labels):.3f}")

# Analyze cluster characteristics
print("\n[6/6] Mapping clusters to business segments...")

cluster_stats = segmentation_features.groupby('cluster').agg({
    'avg_spent': 'mean',
    'num_bookings': 'mean',
    'price_sensitivity_score': 'mean',
    'complaints_count': 'mean',
    'satisfaction_score': 'mean',
    'tenure': 'mean',
    'days_since_last_order': 'mean',
    'order_growth': 'mean'
}).round(2)

print("\nCluster Statistics:")
print(cluster_stats)

# Business logic to map clusters to segment names
# This mapping is based on the cluster centroids characteristics

def map_cluster_to_segment(cluster_stats):
    """
    Map clusters to business segment names based on characteristics
    """
    mappings = {}

    for cluster in cluster_stats.index:
        stats = cluster_stats.loc[cluster]

        # High-Value: High spending, high bookings, low price sensitivity
        if stats['avg_spent'] > cluster_stats['avg_spent'].median() and \
           stats['num_bookings'] > cluster_stats['num_bookings'].median() and \
           stats['price_sensitivity_score'] < cluster_stats['price_sensitivity_score'].median():
            mappings[cluster] = 'High-Value'

        # Price-Sensitive: High price sensitivity, high coupon usage
        elif stats['price_sensitivity_score'] > cluster_stats['price_sensitivity_score'].median():
            mappings[cluster] = 'Price-Sensitive'

        # Quality-Focused: Low satisfaction or high complaints
        elif stats['complaints_count'] > cluster_stats['complaints_count'].median() or \
             stats['satisfaction_score'] < cluster_stats['satisfaction_score'].median():
            mappings[cluster] = 'Quality-Focused'

        # Loyal: High tenure, consistent bookings, low days since last order
        elif stats['tenure'] > cluster_stats['tenure'].median() and \
             stats['days_since_last_order'] < cluster_stats['days_since_last_order'].median():
            mappings[cluster] = 'Loyal'

        # Occasional: Low bookings, high days since last order
        else:
            mappings[cluster] = 'Occasional'

    # Ensure all 5 segments are represented (handle duplicates)
    required_segments = ['Price-Sensitive', 'High-Value', 'Quality-Focused', 'Loyal', 'Occasional']
    used_segments = set(mappings.values())
    missing_segments = set(required_segments) - used_segments

    # If duplicates exist, reassign based on second-best fit
    if len(used_segments) < len(required_segments):
        for cluster in mappings:
            if len(missing_segments) > 0:
                # Simple reassignment strategy
                for seg in missing_segments:
                    if seg not in mappings.values():
                        mappings[cluster] = seg
                        missing_segments.remove(seg)
                        break

    return mappings

cluster_to_segment = map_cluster_to_segment(cluster_stats)

# Manual adjustment if needed (based on cluster analysis)
# You can manually adjust this mapping based on your business knowledge
# Example: cluster_to_segment = {0: 'Loyal', 1: 'High-Value', 2: 'Price-Sensitive', 3: 'Quality-Focused', 4: 'Occasional'}

print("\n[OK] Cluster to Segment Mapping:")
for cluster, segment in sorted(cluster_to_segment.items()):
    count = sum(cluster_labels == cluster)
    percentage = (count / len(cluster_labels)) * 100
    print(f"  Cluster {cluster} -> {segment}: {count} customers ({percentage:.1f}%)")

# Apply mapping
segmentation_features['segment'] = segmentation_features['cluster'].map(cluster_to_segment)

# Define helper functions first
def get_segment_description(segment_name):
    """Get business description for each segment"""
    descriptions = {
        'Price-Sensitive': 'Customers who are highly responsive to discounts, coupons, and cashback offers. Focus on value and pricing.',
        'High-Value': 'Premium customers with high spending and frequent bookings. Highest lifetime value and engagement.',
        'Quality-Focused': 'Customers who prioritize service quality and have specific standards. May have complaints or lower satisfaction.',
        'Loyal': 'Long-term customers with consistent booking patterns and high retention. Low churn risk.',
        'Occasional': 'Infrequent users with sporadic booking patterns. Potential for reactivation campaigns.'
    }
    return descriptions.get(segment_name, 'Customer segment based on behavioral patterns')

def get_segment_color(segment_name):
    """Get color code for each segment (matching frontend design)"""
    colors = {
        'Price-Sensitive': '#3B82F6',  # Blue
        'High-Value': '#10B981',       # Green
        'Quality-Focused': '#F59E0B',  # Orange
        'Loyal': '#8B5CF6',            # Purple
        'Occasional': '#FCD34D'        # Yellow
    }
    return colors.get(segment_name, '#6B7280')  # Gray as default

# Create segment metadata
segment_metadata = {}

for segment_name in cluster_to_segment.values():
    segment_data = segmentation_features[segmentation_features['segment'] == segment_name]
    cluster_num = [k for k, v in cluster_to_segment.items() if v == segment_name][0]

    segment_metadata[segment_name] = {
        'cluster_id': int(cluster_num),
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

print("\n" + "="*60)
print("SAVING MODELS AND ARTIFACTS")
print("="*60)

import os
os.makedirs('models', exist_ok=True)

# Save K-Means model
with open('models/segmentation_model.pkl', 'wb') as f:
    pickle.dump(kmeans, f)
print("[OK] K-Means model saved: models/segmentation_model.pkl")

# Save scaler
with open('models/segment_scaler.pkl', 'wb') as f:
    pickle.dump(scaler, f)
print("[OK] Scaler saved: models/segment_scaler.pkl")

# Save cluster to segment mapping
with open('models/segment_mapping.json', 'w') as f:
    json.dump(cluster_to_segment, f, indent=2)
print("[OK] Segment mapping saved: models/segment_mapping.json")

# Save segment metadata
with open('models/segment_metadata.json', 'w') as f:
    json.dump(segment_metadata, f, indent=2)
print("[OK] Segment metadata saved: models/segment_metadata.json")

# Save feature names
feature_names = list(segmentation_features.columns[:8])  # Exclude cluster and customer_id
with open('models/segmentation_features.json', 'w') as f:
    json.dump({'features': feature_names}, f, indent=2)
print("[OK] Feature names saved: models/segmentation_features.json")

# Save customer segment assignments (for API use)
customer_segments = segmentation_features[['customer_id', 'segment', 'cluster']].copy()
customer_segments.to_csv('models/customer_segments.csv', index=False)
print("[OK] Customer segments saved: models/customer_segments.csv")

print("\n" + "="*60)
print("SEGMENTATION SUMMARY")
print("="*60)

print("\nSegment Distribution:")
for segment_name, metadata in segment_metadata.items():
    print(f"\n{segment_name}:")
    print(f"  Count: {metadata['count']} ({metadata['percentage']}%)")
    print(f"  Avg Spent: Tk {metadata['characteristics']['avg_spent']}")
    print(f"  Avg Bookings: {metadata['characteristics']['num_bookings']}")
    print(f"  Satisfaction: {metadata['characteristics']['satisfaction_score']}/5")
    print(f"  Description: {metadata['description']}")

print("\n" + "="*60)
print("[OK] CUSTOMER SEGMENTATION COMPLETE!")
print("="*60)
print(f"\nTotal customers segmented: {len(segmentation_features)}")
print(f"Number of segments: {len(segment_metadata)}")
print(f"Model ready for deployment!")
print("\nNext steps:")
print("1. Review segment characteristics above")
print("2. Adjust cluster_to_segment mapping if needed")
print("3. Integrate with FastAPI backend")
print("4. Deploy segmentation endpoints")
