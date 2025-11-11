# Carrier API Simulator - Quick Reference (MVP)

**⚠️ Fake/Mock API for testing purposes only**

## Base URL

```
http://localhost:3001/api/v1
```

## Authentication

```http
X-API-Key: test_clarence_key_123
Content-Type: application/json
```

---

## Quick Start

### Use REST Client (VS Code)

Open `api.http` and click "Send Request" - it's that easy!

### Or use curl

#### Personal Insurance (Homeowners)

```bash
curl -X POST http://localhost:3001/api/v1/carriers/reliable_insurance/quote \
  -H "X-API-Key: test_clarence_key_123" \
  -H "Content-Type: application/json" \
  -d '{
    "quote_request_id": "qr_test_001",
    "insurance_type": "personal",
    "personal_info": {
      "first_name": "John",
      "last_name": "Doe",
      "date_of_birth": "1985-06-15",
      "occupation": "Software Engineer",
      "credit_score_tier": "good",
      "address": {
        "city": "San Francisco",
        "state": "CA",
        "zip": "94102"
      }
    },
    "coverage_requests": [{
      "coverage_type": "homeowners",
      "property_info": {
        "dwelling_value": 750000,
        "year_built": 2015,
        "construction_type": "frame"
      },
      "requested_deductible": 1000,
      "effective_date": "2025-12-01"
    }]
  }'
```

### Commercial Insurance (Cyber)

```bash
curl -X POST http://localhost:3001/api/v1/carriers/techshield_underwriters/quote \
  -H "X-API-Key: test_clarence_key_123" \
  -H "Content-Type: application/json" \
  -d '{
    "quote_request_id": "qr_test_002",
    "insurance_type": "commercial",
    "business_info": {
      "legal_name": "Acme Tech LLC",
      "industry": "Technology Consulting",
      "industry_code": "541512",
      "financial_info": {
        "annual_revenue": 500000,
        "full_time_employees": 5
      },
      "address": {
        "city": "San Francisco",
        "state": "CA",
        "zip": "94102"
      }
    },
    "coverage_requests": [{
      "coverage_type": "cyber_liability",
      "requested_limits": {
        "per_incident": 1000000,
        "aggregate": 2000000
      },
      "requested_deductible": 10000,
      "effective_date": "2025-12-01"
    }]
  }'
```

---

## 8 Core Endpoints

| # | Method | Endpoint | Purpose |
|---|--------|----------|---------|
| 1 | POST | `/carriers/{carrier_id}/quote` | Get insurance quotes |
| 2 | POST | `/carriers/{carrier_id}/bind` | Purchase policy |
| 3 | GET | `/carriers/{carrier_id}/policies/{policy_id}` | Get policy details |
| 4 | POST | `/carriers/{carrier_id}/policies/{policy_id}/renew` | Renew policy |
| 5 | POST | `/carriers/{carrier_id}/policies/{policy_id}/endorse` | Modify policy |
| 6 | POST | `/carriers/{carrier_id}/policies/{policy_id}/cancel` | Cancel policy |
| 7 | POST | `/carriers/{carrier_id}/policies/{policy_id}/certificate` | Generate COI |
| 8 | GET | `/carriers/{carrier_id}/health` | Check carrier status |

---

## 4 Carriers

| Carrier ID | Name | Best For | Response Time |
|------------|------|----------|---------------|
| `reliable_insurance` | Reliable Insurance | Balanced pricing, families & small biz | 2-3s |
| `techshield_underwriters` | TechShield | Tech companies, cyber/E&O | 3-5s |
| `premier_underwriters` | Premier | Premium, high net worth & large biz | 5-7s |
| `fastbind_insurance` | FastBind | Fast, competitive, simple risks | 1-2s |

---

## Coverage Types

### Personal Insurance
- `homeowners` - Homeowners (HO-3, HO-5)
- `auto` - Auto insurance
- `renters` - Renters insurance (HO-4)
- `life` - Life insurance
- `personal_umbrella` - Personal umbrella

### Commercial Insurance
- `general_liability` - General liability (GL)
- `professional_liability` - E&O
- `cyber_liability` - Cyber
- `workers_compensation` - Workers comp
- `commercial_property` - Property
- `business_auto` - Business auto
- `umbrella` - Commercial umbrella
- `directors_officers` - D&O
- `employment_practices` - EPL
- `crime` - Crime/fidelity
- `media` - Media liability
- `fiduciary` - Fiduciary
- `employee_benefits` - Employee benefits

---

## Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created (bind success) |
| 400 | Bad request (validation error) |
| 401 | Unauthorized (invalid API key) |
| 404 | Not found (carrier/policy doesn't exist) |
| 410 | Gone (quote expired) |
| 429 | Rate limit exceeded |
| 500 | Server error |
| 503 | Carrier unavailable |

---

## Important Notes

- This is a **fake/mock API** - returns simulated data
- All quotes and policies are for testing only
- No real insurance or financial transactions
- Rate limiting: 100 requests/minute per carrier (simulated)

---

## Common Workflows

### 1. Quote → Bind → Get Policy

```javascript
// Step 1: Get Quote
const quoteResponse = await fetch('/carriers/reliable_insurance/quote', {
  method: 'POST',
  headers: {
    'X-API-Key': 'test_clarence_key_123',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(quoteRequest)
});
const quote = await quoteResponse.json();
const quoteId = quote.quotes[0].quote_id;

// Step 2: Bind Policy
const bindResponse = await fetch('/carriers/reliable_insurance/bind', {
  method: 'POST',
  headers: { /* same */ },
  body: JSON.stringify({
    quote_id: quoteId,
    effective_date: '2025-12-01',
    payment_plan: 'monthly',
    // ... payment info, signature
  })
});
const policy = await bindResponse.json();
const policyId = policy.policy.policy_id;

// Step 3: Get Policy Details
const policyResponse = await fetch(
  `/carriers/reliable_insurance/policies/${policyId}`,
  { headers: { 'X-API-Key': 'test_clarence_key_123' } }
);
const policyDetails = await policyResponse.json();
```

### 2. Generate Certificate of Insurance

```javascript
const certResponse = await fetch(
  `/carriers/reliable_insurance/policies/${policyId}/certificate`,
  {
    method: 'POST',
    headers: {
      'X-API-Key': 'test_clarence_key_123',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      certificate_holder: {
        name: "Client Company LLC",
        address: { /* ... */ }
      },
      additional_insured: true,
      description_of_operations: "Services per contract"
    })
  }
);
const cert = await certResponse.json();
const certUrl = cert.document.url; // Download PDF
```

### 3. Renew Policy

```javascript
const renewalResponse = await fetch(
  `/carriers/reliable_insurance/policies/${policyId}/renew`,
  {
    method: 'POST',
    headers: { /* ... */ },
    body: JSON.stringify({
      renewal_type: 'review_and_update',
      business_changes: {
        revenue_changed: true,
        new_annual_revenue: 750000
      }
    })
  }
);
const renewalQuote = await renewalResponse.json();
```

---

## Error Handling

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "field": "field_name"
  }
}
```

**Common Error Codes:**
- `INVALID_REQUEST` - Validation failed
- `MISSING_REQUIRED_FIELD` - Required field missing
- `QUOTE_EXPIRED` - Quote no longer valid
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `CARRIER_UNAVAILABLE` - Carrier system down
- `LLM_SERVICE_ERROR` - AI service temporary issue

---

## Testing Tips

**Test API Key:** `test_clarence_key_123`

**Quick Health Check:**
```bash
curl http://localhost:3001/api/v1/carriers/reliable_insurance/health \
  -H "X-API-Key: test_clarence_key_123"
```

**Use the api.http file:**
1. Open in VS Code
2. Install REST Client extension
3. Click "Send Request" on any endpoint
4. Much easier than Postman!

---

## Integration Checklist

- [ ] Store API base URL in config
- [ ] Store API key securely
- [ ] Test all 8 endpoints with `api.http`
- [ ] Test both personal and commercial insurance
- [ ] Handle basic error responses (400, 404, 500)
- [ ] Test quote → bind → policy workflow

---

## Documentation

- **Full API Reference:** See `API_SCHEMA.md`
- **Integration Guide:** See `INTEGRATION_GUIDE.md`
- **REST Client Tests:** See `api.http`

---

**MVP Version** - Simplified for testing

