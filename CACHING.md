# Quote Caching System

## Overview

The Carrier API Simulator implements intelligent caching to ensure **consistent quote results** for identical requests. This prevents the issue of generating different premiums/quotes when the same parameters are submitted multiple times.

## How It Works

### 1. **Cache Key Generation**

When a quote request is received, the system generates a **deterministic cache key** using SHA-256 hashing of the normalized request parameters:

```typescript
{
  carrier_id: "reliable_insurance",
  insurance_type: "commercial",
  coverage_requests: [...],
  business_info: { /* relevant fields */ },
  personal_info: { /* relevant fields */ }
}
```

### 2. **Cache Lookup**

Before generating a new quote:
- ✅ **Cache HIT**: Returns the previously generated quote (with `cached: true` flag)
- ❌ **Cache MISS**: Generates a new quote and stores it in cache

### 3. **Deterministic Generation**

Even the "random" variations in quotes are deterministic:
- The cache key is used as a **seed** for pseudo-random number generation
- Same input → Same cache key → Same "random" seed → Same quote values
- This ensures consistency across quote IDs, premiums, and all generated data

## Response Format

### Fresh Quote (Cache Miss)
```json
{
  "success": true,
  "carrier_id": "reliable_insurance",
  "cached": false,
  "quotes": [
    {
      "quote_id": "REL-Q-2025-123456-GL",
      "annual_premium": 1450
    }
  ]
}
```

### Cached Quote (Cache Hit)
```json
{
  "success": true,
  "carrier_id": "reliable_insurance",
  "cached": true,
  "cache_key": "a3b2c1d4e5f6...",
  "quotes": [
    {
      "quote_id": "REL-Q-2025-123456-GL",
      "annual_premium": 1450
    }
  ]
}
```

## Cache Management API

### Get Cache Statistics

**Endpoint:** `GET /carriers/cache/stats`

**Response:**
```json
{
  "success": true,
  "stats": {
    "total_cached_quotes": 12,
    "total_quotes_by_id": 36,
    "cache_keys": [
      "a3b2c1d4e5f6901a...",
      "b7c8d9e0f1a2b3c4...",
      "..."
    ]
  },
  "timestamp": "2025-11-11T10:30:00.000Z"
}
```

### Clear Cache

**Endpoint:** `POST /carriers/cache/clear`

Useful for testing scenarios where you want fresh quote generation.

**Response:**
```json
{
  "success": true,
  "message": "Cache cleared successfully",
  "timestamp": "2025-11-11T10:31:00.000Z"
}
```

## Testing Cache Behavior

### Using api.http (REST Client)

```http
### 1. First request - should be cache miss
POST {{baseUrl}}/carriers/reliable_insurance/quote
X-API-Key: {{apiKey}}
Content-Type: application/json

{
  "quote_request_id": "test_cache_001",
  "insurance_type": "commercial",
  "coverage_requests": [
    {
      "coverage_type": "general_liability",
      "requested_limits": { "occurrence": 1000000 },
      "requested_deductible": 5000,
      "effective_date": "2025-01-01"
    }
  ],
  "business_info": {
    "legal_name": "Test Company LLC",
    "industry": "technology",
    "industry_code": "541511",
    "financial_info": {
      "annual_revenue": 5000000,
      "full_time_employees": 25
    }
  }
}

### 2. Identical request - should be cache hit (same quote!)
POST {{baseUrl}}/carriers/reliable_insurance/quote
X-API-Key: {{apiKey}}
Content-Type: application/json

{
  "quote_request_id": "test_cache_001",
  "insurance_type": "commercial",
  "coverage_requests": [
    {
      "coverage_type": "general_liability",
      "requested_limits": { "occurrence": 1000000 },
      "requested_deductible": 5000,
      "effective_date": "2025-01-01"
    }
  ],
  "business_info": {
    "legal_name": "Test Company LLC",
    "industry": "technology",
    "industry_code": "541511",
    "financial_info": {
      "annual_revenue": 5000000,
      "full_time_employees": 25
    }
  }
}

### 3. Check cache stats
GET {{baseUrl}}/carriers/cache/stats
X-API-Key: {{apiKey}}

### 4. Clear cache
POST {{baseUrl}}/carriers/cache/clear
X-API-Key: {{apiKey}}
```

## What Affects the Cache Key?

The following fields are included in cache key generation:

### Personal Insurance
- `insurance_type`
- `personal_info.occupation`
- `personal_info.credit_score_tier`
- `personal_info.address.state`
- `personal_info.address.zip`
- Coverage details (limits, deductibles, effective dates)
- Property/vehicle specifics

### Commercial Insurance
- `insurance_type`
- `business_info.industry`
- `business_info.industry_code`
- `business_info.financial_info.annual_revenue`
- `business_info.financial_info.full_time_employees`
- `business_info.address.state`
- `business_info.address.zip`
- Coverage details (limits, deductibles, effective dates)
- Cyber/property specifics

### Fields NOT Affecting Cache Key
- `quote_request_id` - This is just a tracking ID
- Contact information (names, emails, phones)
- Timestamps
- External reference IDs

## Console Logging

When the server is running, you'll see helpful cache logs:

```
✅ Cache HIT for key: a3b2c1d4e5f6901a...
❌ Cache MISS for key: b7c8d9e0f1a2b3c4... - Generating new quote
💾 Stored in cache with key: b7c8d9e0f1a2b3c4...
🗑️  Quote cache cleared
```

## Benefits

1. **Consistency**: Same request always returns same quote
2. **Performance**: Cached responses are instant (no computation needed)
3. **Testing**: Reliable and repeatable test scenarios
4. **Debugging**: Easy to track with cache keys and logs

## Implementation Notes

- **In-Memory Storage**: Cache is stored in memory (lost on server restart)
- **No Expiration**: Quotes remain cached until server restart or manual clear
- **Thread-Safe**: Uses JavaScript Map which is safe for async operations
- **Unlimited Size**: No limit on cache size (for MVP simplicity)

## Future Enhancements (Not in MVP)

- TTL (Time To Live) for quote expiration
- Redis for distributed caching
- Cache size limits with LRU eviction
- Cache warming strategies
- Metrics and monitoring

