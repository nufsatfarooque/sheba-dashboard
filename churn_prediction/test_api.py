"""
Test script for the Churn Prediction API
"""

import requests
import json

# API endpoint
API_URL = "http://localhost:8000"

def test_health_check():
    """Test the health check endpoint"""
    print("=== Testing Health Check ===")
    response = requests.get(f"{API_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()


def test_churn_prediction():
    """Test churn prediction with HIGH RISK e-commerce customer"""
    print("=== Test 1: HIGH RISK E-Commerce Customer ===")
    print("Profile: New customer, inactive for long time, low engagement, complained")

    # E-commerce high risk: Very inactive, new, dissatisfied
    high_risk_customer = {
        "tenure": 1,  # Very new customer (1 month)
        "citytier": 3,  # Tier 3 city
        "warehousetohome": 35,  # Far from warehouse
        "hourspendonapp": 0.5,  # Barely uses app
        "numberofdeviceregistered": 1,  # Only 1 device
        "satisfactionscore": 1,  # Very dissatisfied
        "maritalstatus": "Single",
        "numberofaddress": 1,
        "orderamounthikefromlastyear": -5,  # NEGATIVE growth (spending less)
        "couponused": 0,  # Not using coupons
        "ordercount": 1,  # Only 1 order last month
        "daysincelastorder": 25,  # Nearly a month inactive
        "cashbackamount": 50,  # Low cashback
        "gender": "Male",
        "complain": 1  # Has complained
    }

    print("Input customer data:")
    print(json.dumps(high_risk_customer, indent=2))
    print()

    response = requests.post(
        f"{API_URL}/predict/churn",
        json=high_risk_customer
    )

    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print("\n=== Prediction Results ===")
        print(f"Churn Probability: {result['churn_probability']:.2%}")
        print(f"Risk Category: {result['risk_category']}")
        print(f"Prediction: {'WILL CHURN' if result['prediction'] == 1 else 'WILL RETAIN'}")
        print("\nTop Contributing Factors:")
        for i, factor in enumerate(result['top_factors'], 1):
            impact_direction = "increases" if factor['impact'] > 0 else "decreases"
            print(f"{i}. {factor['readable_name']}: {factor['value']:.2f}")
            print(f"   Impact: {factor['impact']:.4f} ({impact_direction} churn risk)")
    else:
        print(f"Error: {response.text}")
    print()


def test_low_risk_customer():
    """Test with a LOYAL e-commerce customer"""
    print("=== Test 2: LOW RISK Loyal E-Commerce Customer ===")
    print("Profile: Long-time customer, active, high satisfaction, frequent buyer")

    # E-commerce low risk: Long tenure, active, satisfied, growing
    low_risk_customer = {
        "tenure": 36,  # 3 years tenure (very loyal)
        "citytier": 1,  # Tier 1 city (metro)
        "warehousetohome": 8,  # Close to warehouse
        "hourspendonapp": 4,  # Engaged user
        "numberofdeviceregistered": 3,  # Multiple devices
        "satisfactionscore": 5,  # Very satisfied
        "maritalstatus": "Married",
        "numberofaddress": 4,  # Multiple addresses (work/home/etc)
        "orderamounthikefromlastyear": 30,  # 30% increase in spending
        "couponused": 5,  # Uses coupons regularly
        "ordercount": 8,  # 8 orders last month
        "daysincelastorder": 2,  # Ordered 2 days ago
        "cashbackamount": 450,  # High cashback (spends more)
        "gender": "Female",
        "complain": 0  # Never complained
    }

    print("Input customer data:")
    print(json.dumps(low_risk_customer, indent=2))
    print()

    response = requests.post(
        f"{API_URL}/predict/churn",
        json=low_risk_customer
    )

    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print("\n=== Prediction Results ===")
        print(f"Churn Probability: {result['churn_probability']:.2%}")
        print(f"Risk Category: {result['risk_category']}")
        print(f"Prediction: {'WILL CHURN' if result['prediction'] == 1 else 'WILL RETAIN'}")
        print("\nTop Contributing Factors:")
        for i, factor in enumerate(result['top_factors'], 1):
            impact_direction = "increases" if factor['impact'] > 0 else "decreases"
            print(f"{i}. {factor['readable_name']}: {factor['value']:.2f}")
            print(f"   Impact: {factor['impact']:.4f} ({impact_direction} churn risk)")
    else:
        print(f"Error: {response.text}")
    print()


def test_medium_risk_customer():
    """Test with a MEDIUM RISK customer"""
    print("=== Test 3: MEDIUM RISK Price-Sensitive Customer ===")
    print("Profile: Moderate tenure, price-focused, irregular buyer, average satisfaction")

    medium_risk_customer = {
        "tenure": 10,  # 10 months (moderate)
        "citytier": 2,  # Tier 2 city
        "warehousetohome": 18,  # Moderate distance
        "hourspendonapp": 2,  # Moderate engagement
        "numberofdeviceregistered": 2,
        "satisfactionscore": 3,  # Neutral satisfaction
        "maritalstatus": "Single",
        "numberofaddress": 2,
        "orderamounthikefromlastyear": 8,  # Slight growth
        "couponused": 8,  # Heavy coupon user (price sensitive)
        "ordercount": 3,  # Moderate orders
        "daysincelastorder": 12,  # 12 days inactive
        "cashbackamount": 180,  # Moderate cashback
        "gender": "Male",
        "complain": 0
    }

    print("Input customer data:")
    print(json.dumps(medium_risk_customer, indent=2))
    print()

    response = requests.post(
        f"{API_URL}/predict/churn",
        json=medium_risk_customer
    )

    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print("\n=== Prediction Results ===")
        print(f"Churn Probability: {result['churn_probability']:.2%}")
        print(f"Risk Category: {result['risk_category']}")
        print(f"Prediction: {'WILL CHURN' if result['prediction'] == 1 else 'WILL RETAIN'}")
        print("\nTop Contributing Factors:")
        for i, factor in enumerate(result['top_factors'], 1):
            impact_direction = "increases" if factor['impact'] > 0 else "decreases"
            print(f"{i}. {factor['readable_name']}: {factor['value']:.2f}")
            print(f"   Impact: {factor['impact']:.4f} ({impact_direction} churn risk)")
    else:
        print(f"Error: {response.text}")
    print()


def test_critical_risk_customer():
    """Test with a CRITICAL RISK customer"""
    print("=== Test 4: CRITICAL RISK About-to-Churn Customer ===")
    print("Profile: Dormant customer, very dissatisfied, no recent activity, complained multiple times")

    critical_risk_customer = {
        "tenure": 2,  # Short tenure
        "citytier": 3,  # Tier 3 city
        "warehousetohome": 40,  # Very far
        "hourspendonapp": 0,  # Not using app at all
        "numberofdeviceregistered": 1,
        "satisfactionscore": 1,  # Very dissatisfied
        "maritalstatus": "Divorced",
        "numberofaddress": 1,
        "orderamounthikefromlastyear": -15,  # Spending decreased 15%
        "couponused": 0,  # Not even using coupons
        "ordercount": 0,  # NO orders last month
        "daysincelastorder": 30,  # 1 month inactive
        "cashbackamount": 20,  # Very low
        "gender": "Male",
        "complain": 1  # Has complained
    }

    print("Input customer data:")
    print(json.dumps(critical_risk_customer, indent=2))
    print()

    response = requests.post(
        f"{API_URL}/predict/churn",
        json=critical_risk_customer
    )

    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print("\n=== Prediction Results ===")
        print(f"Churn Probability: {result['churn_probability']:.2%}")
        print(f"Risk Category: {result['risk_category']}")
        print(f"Prediction: {'WILL CHURN' if result['prediction'] == 1 else 'WILL RETAIN'}")
        print("\nTop Contributing Factors:")
        for i, factor in enumerate(result['top_factors'], 1):
            impact_direction = "increases" if factor['impact'] > 0 else "decreases"
            print(f"{i}. {factor['readable_name']}: {factor['value']:.2f}")
            print(f"   Impact: {factor['impact']:.4f} ({impact_direction} churn risk)")
    else:
        print(f"Error: {response.text}")
    print()


if __name__ == "__main__":
    try:
        # Test all endpoints
        test_health_check()
        test_churn_prediction()  # High risk
        test_low_risk_customer()  # Low risk
        test_medium_risk_customer()  # Medium risk
        test_critical_risk_customer()  # Critical risk

        print("=== All Tests Complete ===")
        print("\n📊 Summary: Tested 4 customer profiles across all risk categories")

    except requests.exceptions.ConnectionError:
        print("ERROR: Could not connect to API server.")
        print("Make sure the server is running with: python api_server.py")
    except Exception as e:
        print(f"ERROR: {e}")
