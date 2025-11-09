# How to Restart the API Server

## If you made changes to the code:

### Step 1: Stop the running server
In the terminal where `api_server.py` is running, press:
```
Ctrl + C
```

### Step 2: Start the server again
```bash
python api_server.py
```

Wait for:
```
Loading model and artifacts...
✓ Model loaded
✓ SHAP explainer loaded
✓ Loaded 18 features
Server ready!
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Step 3: Test the API
In a **new terminal** (keep the server running):
```bash
python test_api.py
```

---

## Quick Test Commands

### Test with cURL (High Risk Customer)
```bash
curl -X POST "http://localhost:8000/predict/churn" -H "Content-Type: application/json" -d "{\"tenure\": 2, \"citytier\": 3, \"warehousetohome\": 25, \"hourspendonapp\": 1, \"numberofdeviceregistered\": 2, \"satisfactionscore\": 2, \"maritalstatus\": \"Single\", \"numberofaddress\": 1, \"orderamounthikefromlastyear\": 5, \"couponused\": 0, \"ordercount\": 2, \"daysincelastorder\": 55, \"cashbackamount\": 100, \"gender\": \"Male\", \"complain\": 1}"
```

### Check Health
```bash
curl http://localhost:8000/health
```

### View Interactive Docs
Open in browser: http://localhost:8000/docs

---

## Troubleshooting

**Issue:** "Address already in use"
**Solution:** The server is still running. Find and kill it:
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID_NUMBER> /F

# Or just close the terminal and open a new one
```

**Issue:** Changes not reflected
**Solution:** Make sure you restarted the server (Ctrl+C then run again)
