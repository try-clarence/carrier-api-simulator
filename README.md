# Insurance Carrier API Simulator (MVP)

## Overview

A **simple mock API** that simulates 4 insurance carrier APIs for Clarence backend development and testing. Returns fake but realistic insurance quotes and policy data.

**⚠️ This is a fake simulator for MVP/testing purposes only. No real insurance data.**

## Quick Summary

### Purpose
- **Problem**: Clarence needs carrier APIs for development/testing but doesn't have real access yet
- **Solution**: Simple mock API that returns fake insurance quotes for both personal and commercial insurance

### How It Works
- Returns pre-configured or randomly generated fake quote data
- Simulates different carrier personalities and pricing
- No real LLM/AI needed - just realistic mock responses
- Stateful: Can track quotes → policies → renewals

### The 4 Simulated Carriers

| Carrier ID | Name | Personality | Best For |
|------------|------|-------------|----------|
| `reliable_insurance` | Reliable Insurance Co. | Conservative, balanced | Families, small businesses |
| `techshield_underwriters` | TechShield Underwriters | Tech-focused, modern | Tech companies, cyber coverage |
| `premier_underwriters` | Premier Underwriters | Premium, selective | High net worth, large businesses |
| `fastbind_insurance` | FastBind Insurance | Fast, competitive | Quick quotes, startups |

### Coverage Types Supported

**Personal Insurance:** Homeowners, Auto, Renters, Life, Umbrella

**Commercial Insurance:** GL, E&O, Cyber, Workers Comp, Property, Business Auto, D&O, EPL, Crime, Media, Fiduciary, Employee Benefits

### Core Features

#### 8 API Endpoints (per carrier)
1. **Quote Request** - Get fake insurance quotes
2. **Policy Binding** - Purchase a policy (mock)
3. **Policy Retrieval** - Get policy details
4. **Policy Renewal** - Renew expiring policies
5. **Policy Endorsement** - Add endorsements
6. **Policy Cancellation** - Cancel policies
7. **Certificate Generation** - Generate COIs (PDF)
8. **Health Check** - Check carrier availability

### Technology Stack (Suggested)

- **Backend**: Node.js/Python/any backend framework
- **Storage**: In-memory or simple JSON files (no database needed for MVP)
- **Mock Data**: Pre-configured fake quotes or simple random generation
- **Documents**: Optional PDF generation or just return URLs

### Quick Start

**Option 1: Use REST Client (VS Code)**
1. Install REST Client extension
2. Open `api.http` file
3. Click "Send Request" on any endpoint

**Option 2: Use curl**

```bash
# Get a personal insurance quote
curl -X POST http://localhost:3001/api/v1/carriers/reliable_insurance/quote \
  -H "X-API-Key: test_clarence_key_123" \
  -H "Content-Type: application/json" \
  -d '{
    "quote_request_id": "qr_test_001",
    "insurance_type": "personal",
    "personal_info": {
      "first_name": "John",
      "last_name": "Doe",
      "occupation": "Software Engineer",
      "credit_score_tier": "good",
      "address": {"city": "San Francisco", "state": "CA", "zip": "94102"}
    },
    "coverage_requests": [{
      "coverage_type": "homeowners",
      "property_info": {"dwelling_value": 750000},
      "requested_deductible": 1000,
      "effective_date": "2025-12-01"
    }]
  }'

# Response (fake data)
{
  "success": true,
  "carrier_id": "reliable_insurance",
  "quotes": [{
    "coverage_type": "homeowners",
    "status": "quoted",
    "premium": { "annual": 1850.00, "monthly": 162.00 },
    "coverage_limits": { "dwelling": 750000, "liability": 300000 },
    "highlights": ["Replacement cost coverage", "24/7 claims support"]
  }]
}
```

### What to Test

For MVP, focus on testing these workflows:
1. Get quotes (personal + commercial)
2. Bind policy from quote
3. Retrieve policy details
4. Generate certificate of insurance
5. Check carrier health

### Implementation Approach

This is a **mock/fake API**, so keep it simple:

**Simple Approach:**
- Return hardcoded JSON responses
- Generate random but realistic premium amounts
- Store minimal state in memory
- No database needed for MVP

**Slightly More Realistic:**
- Read from JSON config files per carrier
- Apply simple pricing logic (revenue × factor)
- Track quotes → policies in memory
- Optional: Save to SQLite for persistence

## 📁 Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | This file - project overview |
| `API_SCHEMA.md` | Complete API reference (all 8 endpoints) |
| `API_QUICK_REFERENCE.md` | Quick lookup cheat sheet |
| `INTEGRATION_GUIDE.md` | Integration guide with code examples |
| `api.http` | **REST Client file for VS Code** (replaces Postman) |

## Testing with REST Client

**Install Extension:**
1. Open VS Code
2. Install "REST Client" by Huachao Mao
3. Open `api.http`
4. Click "Send Request" above any endpoint

**Benefits:**
- No separate Postman app needed
- Version controlled (git)
- Easy to share with team
- Fast iteration

## Next Steps

1. **Read** `API_SCHEMA.md` for complete API details
2. **Test** with `api.http` in VS Code
3. **Integrate** using code examples in `INTEGRATION_GUIDE.md`
4. **Implement** the mock API (simple backend needed)

---

**MVP Version** - Simplified for fast prototyping and testing
