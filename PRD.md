# Product Requirements Document: Insurance Carrier API Simulator

## Executive Summary

The Insurance Carrier API Simulator is a backend service that mimics real insurance carrier APIs, enabling the Clarence platform to develop, test, and demonstrate its insurance quote, policy issuance, and renewal workflows without requiring direct access to actual carrier systems. This simulator will model 4 distinct carriers with LLM-powered quote generation, realistic API behavior, response times, and edge cases for **both personal and commercial insurance**.

---

## Problem Statement

Clarence requires integration with insurance carrier APIs to:
1. Request and receive insurance quotes (personal & commercial)
2. Bind policies and receive policy documents
3. Process policy renewals
4. Handle policy modifications/endorsements

However, during the development and early launch phases:
- Real carrier API access is not yet available
- Testing against live carrier systems would be expensive and risky
- Development teams need a controlled environment to build integrations
- Product demos require realistic carrier responses

**Solution:** Build a sophisticated simulator that uses LLMs to generate realistic insurance quotes and behaves like real carrier APIs, allowing development to proceed without carrier dependencies.

---

## Goals & Objectives

### Primary Goals
1. **Enable Development**: Unblock Clarence backend development by providing functional carrier endpoints
2. **LLM-Powered Quotes**: Use AI (OpenAI/Anthropic) to generate realistic, varied insurance quotes
3. **Support Both Insurance Types**: Handle personal insurance (home, auto, life, umbrella) AND commercial insurance (GL, E&O, cyber, etc.)
4. **Intelligent Caching**: Store generated quotes to avoid regenerating identical requests
5. **Realistic Simulation**: Generate responses that closely mimic real carrier behavior
6. **Easy Transition**: Design APIs to match real carrier patterns for seamless migration later

### Success Metrics
- 100% API availability during development
- Response times within 2-10 seconds (realistic carrier timing + LLM latency)
- Support for at least 4 distinct carrier personalities
- Coverage for both personal (4+ types) and commercial insurance (13 types)
- 90%+ cache hit rate for duplicate requests
- LLM-generated quotes with realistic pricing and coverage details

---

## LLM-Powered Quote Generation

### Why LLM?

**Benefits:**
- **Realistic Variation**: Each quote can have unique coverage details, exclusions, and recommendations
- **Natural Language**: Can generate human-readable policy highlights, underwriting notes, and recommendations
- **Adaptability**: Easily adjust to new coverage types or industries without hardcoding rules
- **Contextual Intelligence**: Can consider business type, location, risk factors in generating appropriate quotes
- **Reduced Maintenance**: No need to maintain complex pricing tables for every scenario

### LLM Provider Configuration

The simulator will support both OpenAI and Anthropic, configured via environment variables:

```bash
# Environment Configuration
LLM_PROVIDER=openai  # or 'anthropic'
OPENAI_API_KEY=sk-...  # Required if provider is openai
ANTHROPIC_API_KEY=sk-ant-...  # Required if provider is anthropic
LLM_MODEL=gpt-4o  # or 'claude-3-5-sonnet-20241022'
LLM_TEMPERATURE=0.7  # Creativity level for quote generation
LLM_MAX_TOKENS=2000
```

**Software Deployer Responsibility:**
- Provide valid API key for chosen LLM provider
- Choose model based on cost/quality tradeoff
- Monitor LLM usage and costs

### Quote Generation Workflow

```
1. Receive Quote Request
   ↓
2. Generate Quote Hash (business_info + coverage_requests + carrier)
   ↓
3. Check Database Cache
   ├─ Cache Hit? → Return cached quote (instant response)
   ↓
4. Cache Miss? → Generate Quote via LLM
   ↓
5. LLM Prompt Construction:
   - Carrier personality/guidelines
   - Business/personal information
   - Coverage type and requested limits
   - Market context and pricing benchmarks
   ↓
6. LLM Response → Parse structured quote data
   ↓
7. Store in Database (for future cache hits)
   ↓
8. Return quote to Clarence
```

### Quote Caching Strategy

**Cache Key Generation:**
```javascript
const cacheKey = hash({
  carrier_id: "reliable_insurance",
  insurance_type: "commercial", // or "personal"
  business_info: {
    industry_code: "541512",
    revenue: 500000,
    employees: 7,
    state: "CA"
  },
  coverage_type: "general_liability",
  requested_limits: { per_occurrence: 1000000 }
});
```

**Cache Behavior:**
- **Exact Match**: Same business info + coverage → return cached quote
- **Similar Match**: Detect similar requests, return cached with note
- **Expiration**: Cached quotes expire after 30 days (market conditions change)
- **Manual Invalidation**: Admin can clear cache for testing

**Database Storage:**
```sql
CREATE TABLE quote_cache (
  cache_key VARCHAR(64) PRIMARY KEY,
  carrier_id VARCHAR(50),
  insurance_type VARCHAR(20), -- 'personal' or 'commercial'
  quote_data JSONB,
  created_at TIMESTAMP,
  last_accessed TIMESTAMP,
  access_count INTEGER DEFAULT 1,
  expires_at TIMESTAMP
);

CREATE INDEX idx_cache_carrier ON quote_cache(carrier_id);
CREATE INDEX idx_cache_expires ON quote_cache(expires_at);
```

### LLM Prompt Template (Example)

```
You are an underwriter for {CARRIER_NAME}, a {CARRIER_PERSONALITY} insurance carrier with an {AM_BEST_RATING} rating.

TASK: Generate an insurance quote for the following request:

INSURANCE TYPE: {personal or commercial}

{If commercial:}
BUSINESS INFORMATION:
- Legal Name: {business_name}
- Industry: {industry} (NAICS: {industry_code})
- Revenue: ${revenue}
- Employees: {employee_count}
- Location: {city}, {state}
- Years in Business: {years}

{If personal:}
INSURED INFORMATION:
- Name: {first_name} {last_name}
- Age: {age}
- Occupation: {occupation}
- Location: {address}
- Credit Score Tier: {credit_tier}
- Property Value: ${property_value} (if applicable)

COVERAGE REQUESTED:
- Type: {coverage_type}
- Limits: {requested_limits}
- Deductible: ${deductible}
- Effective Date: {effective_date}

CARRIER GUIDELINES:
- Pricing Strategy: {competitive/premium/moderate}
- Risk Appetite: {conservative/moderate/aggressive}
- Specialization: {specialties}
- Typical approval rate: {approval_rate}%

INSTRUCTIONS:
Generate a realistic insurance quote with the following structure:

1. DECISION: "approved" or "declined"
   - If declined, provide clear reason

2. IF APPROVED, provide:
   - Annual Premium (USD, realistic for industry and location)
   - Monthly Premium (annual / 12, slight finance charge)
   - Quarterly Premium
   - Coverage Limits (confirm or adjust requested limits)
   - Deductible
   - Policy Form (e.g., "ISO CGL", "HO-3", etc.)
   - Highlights (3-5 key coverage features)
   - Exclusions (3-5 standard exclusions)
   - Optional Coverages (2-3 add-ons with pricing)
   - Underwriting Notes (brief explanation of pricing)

3. PACKAGE DISCOUNT:
   - If multiple coverages, suggest 3-7% discount

IMPORTANT:
- Use realistic pricing based on market rates for {state}
- Consider risk factors (industry, location, size, claims history)
- Be consistent with {CARRIER_NAME}'s personality
- All amounts in USD
- Format as valid JSON

RESPONSE FORMAT:
{
  "decision": "approved",
  "quote_id": "{carrier_prefix}-Q-{year}-{random}",
  "coverage_limits": { ... },
  "premium": {
    "annual": 1250.00,
    "monthly": 110.00,
    "quarterly": 325.00
  },
  ...
}
```

---

## Why Redis? Detailed Explanation

Redis serves **three critical purposes** in the carrier simulator:

### 1. **High-Speed Caching for Quote Lookups**

**Problem**: While PostgreSQL stores all quote cache data, checking the database for every quote request adds latency (10-50ms per query).

**Redis Solution**:
- Store cache keys in Redis with TTL (Time To Live)
- Check Redis first: If cache key exists → retrieve quote ID → fetch from PostgreSQL
- If not in Redis → check PostgreSQL → generate via LLM if needed
- **Speed**: Redis lookups are <1ms vs PostgreSQL 10-50ms

```javascript
// Fast cache check flow
const cacheKey = generateQuoteHash(request);

// Step 1: Check Redis (< 1ms)
const cachedQuoteId = await redis.get(`quote:${cacheKey}`);

if (cachedQuoteId) {
  // Step 2: Fast PostgreSQL fetch by ID (already indexed)
  return await db.findQuoteById(cachedQuoteId);
}

// Step 3: Cache miss - generate new quote via LLM
const newQuote = await generateQuoteViaLLM(request);
await db.saveQuote(newQuote);
await redis.set(`quote:${cacheKey}`, newQuote.id, 'EX', 86400); // 24h TTL
```

### 2. **Rate Limiting**

**Problem**: Need to simulate realistic carrier rate limits (e.g., 100 requests/minute per API key) and protect against abuse.

**Redis Solution**:
- Implement sliding window rate limiting using Redis sorted sets
- Track request counts per API key per time window
- Return HTTP 429 (Too Many Requests) when limit exceeded

```javascript
// Rate limiting with Redis
const apiKey = request.headers['x-api-key'];
const rateLimitKey = `ratelimit:${apiKey}`;
const now = Date.now();
const windowMs = 60000; // 1 minute

// Add current request
await redis.zadd(rateLimitKey, now, `${now}-${uuid()}`);

// Remove old requests outside window
await redis.zremrangebyscore(rateLimitKey, 0, now - windowMs);

// Count requests in current window
const requestCount = await redis.zcard(rateLimitKey);

if (requestCount > 100) {
  throw new RateLimitError('Too many requests');
}

// Set expiry on key
await redis.expire(rateLimitKey, 60);
```

### 3. **Session Management & Request Tracking**

**Problem**: Track in-flight quote generation requests to prevent duplicate LLM calls for identical concurrent requests.

**Redis Solution**:
- Use Redis locks to ensure only one LLM call happens for identical requests
- Store temporary "generating" state for requests in progress
- Other requests for same quote wait or are notified when generation completes

```javascript
// Prevent duplicate concurrent LLM calls
const lockKey = `lock:quote:${cacheKey}`;
const lock = await redis.set(lockKey, 'locked', 'NX', 'EX', 30);

if (!lock) {
  // Another request is generating this quote
  // Wait and check if it's done
  await sleep(2000);
  const result = await checkCacheAgain(cacheKey);
  if (result) return result;
}

try {
  // We have the lock - generate the quote
  const quote = await generateQuoteViaLLM(request);
  await saveToDatabase(quote);
  return quote;
} finally {
  // Release lock
  await redis.del(lockKey);
}
```

### 4. **Carrier System Status (Bonus Use Case)**

**Problem**: Simulate carrier system outages and degraded performance states.

**Redis Solution**:
- Store carrier health status in Redis
- Admin can toggle carrier availability dynamically
- No database queries needed for health checks

```javascript
// Fast carrier health check
const healthStatus = await redis.get(`carrier:${carrierId}:status`);
if (healthStatus === 'down') {
  throw new CarrierUnavailableError();
}
```

### Redis vs PostgreSQL Comparison

| Use Case | PostgreSQL | Redis | Winner |
|----------|-----------|-------|--------|
| Cache key lookup | 10-50ms | <1ms | **Redis** |
| Rate limiting | Slow, complex queries | Built-in sorted sets | **Redis** |
| Distributed locks | Requires extensions | Native support | **Redis** |
| Persistent storage | ✅ Perfect | ❌ Not designed for this | **PostgreSQL** |
| Complex queries | ✅ Perfect | ❌ Limited | **PostgreSQL** |
| TTL/Expiration | Manual cleanup | Automatic | **Redis** |

**Conclusion**: Use **PostgreSQL** for durable quote storage and **Redis** for speed-critical operations (caching, rate limiting, locks).

---

## Simulated Carriers

We will simulate 4 insurance carriers, each supporting **both personal and commercial insurance**:

### Carrier 1: "Reliable Insurance Co."
**Personality:** Conservative, traditional carrier

**Commercial Insurance:**
- **Focus**: Small to medium businesses, low-risk industries
- **Strengths**: Competitive GL and property pricing
- **Pricing**: Mid-range, consistent
- **Approval Rate**: 75% (selective for high-risk)

**Personal Insurance:**
- **Focus**: Homeowners, auto, life, umbrella
- **Strengths**: Multi-policy discounts, bundling
- **Pricing**: Mid-range, family-friendly
- **Approval Rate**: 80%

**Common Attributes:**
- **Rating**: A+ (AM Best)
- **Response Time**: 2-3 seconds
- **Special Features**: Claims-free discounts, loyalty programs

---

### Carrier 2: "TechShield Underwriters"
**Personality:** Modern, tech-focused carrier

**Commercial Insurance:**
- **Focus**: Tech companies, SaaS, consulting firms
- **Strengths**: Cyber liability, E&O, D&O
- **Pricing**: Competitive for tech, higher for non-tech
- **Approval Rate**: 85% for tech, 60% for others

**Personal Insurance:**
- **Focus**: Young professionals, remote workers
- **Strengths**: Renter's insurance, portable electronics coverage
- **Pricing**: Usage-based pricing (telematics for auto)
- **Approval Rate**: 80%

**Common Attributes:**
- **Rating**: A (AM Best)
- **Response Time**: 3-5 seconds
- **Special Features**: API-first, digital-native, instant quotes

---

### Carrier 3: "Premier Underwriters"
**Personality:** High-end, premium carrier

**Commercial Insurance:**
- **Focus**: Large businesses, complex risks
- **Strengths**: Comprehensive coverage, high limits
- **Pricing**: Premium (20-30% above market)
- **Approval Rate**: 60% (very selective)

**Personal Insurance:**
- **Focus**: High net worth individuals
- **Strengths**: Luxury home, high-value auto, art/jewelry
- **Pricing**: Premium, concierge service included
- **Approval Rate**: 65%

**Common Attributes:**
- **Rating**: A+ (AM Best)
- **Response Time**: 5-7 seconds
- **Special Features**: 24/7 white-glove service, risk consulting, annual reviews

---

### Carrier 4: "FastBind Insurance"
**Personality:** Aggressive, fast-moving carrier

**Commercial Insurance:**
- **Focus**: Small businesses, straightforward risks
- **Strengths**: Instant binding, no paperwork
- **Pricing**: Most competitive (10-15% below market)
- **Approval Rate**: 90%

**Personal Insurance:**
- **Focus**: Young drivers, first-time homeowners
- **Strengths**: Online-only, instant approval
- **Pricing**: Most competitive, basic coverage
- **Approval Rate**: 90%

**Common Attributes:**
- **Rating**: A- (AM Best)
- **Response Time**: 1-2 seconds
- **Special Features**: Month-to-month options, no long-term commitment

---

## Coverage Types Supported

### Personal Insurance (4+ Types)

1. **Homeowners (HO-3, HO-5)**
   - Dwelling coverage: $200k - $2M+
   - Personal property: 50-70% of dwelling
   - Liability: $100k - $500k
   - Additional living expenses

2. **Auto Insurance**
   - Liability: State minimums to $500k
   - Collision & Comprehensive
   - Uninsured/Underinsured motorist
   - Medical payments

3. **Renters Insurance (HO-4)**
   - Personal property: $15k - $100k
   - Liability: $100k - $500k
   - Loss of use coverage

4. **Life Insurance**
   - Term life: $100k - $5M
   - Whole life options
   - Guaranteed issue up to certain limits

5. **Umbrella / Excess Liability (Personal)**
   - $1M - $5M additional liability
   - Covers above home/auto limits

### Commercial Insurance (13 Types)

1. **General Liability (GL)**
2. **Professional Liability / E&O**
3. **Cyber Liability**
4. **Workers Compensation**
5. **Commercial Property**
6. **Business Auto**
7. **Umbrella / Excess Liability (Commercial)**
8. **Directors & Officers (D&O)**
9. **Employment Practices Liability (EPL)**
10. **Crime / Fidelity**
11. **Media Liability**
12. **Fiduciary Liability**
13. **Employee Benefits Liability**

*(See Appendix for detailed coverage specifications)*

---

## Core API Endpoints

### 1. POST /api/v1/carriers/{carrier_id}/quote

**Purpose:** Request insurance quote(s) from a carrier

**Request Body:**
```json
{
  "quote_request_id": "qr_1234567890",
  "insurance_type": "commercial",  // or "personal"
  
  // FOR COMMERCIAL:
  "business_info": {
    "legal_name": "Acme Tech Solutions LLC",
    "industry": "Technology Consulting",
    "industry_code": "541512",
    "revenue": 500000,
    "employees": { "full_time": 5, "part_time": 2 },
    "address": { "street": "123 Main St", "city": "San Francisco", "state": "CA", "zip": "94102" }
  },
  
  // FOR PERSONAL:
  "personal_info": {
    "first_name": "John",
    "last_name": "Doe",
    "date_of_birth": "1985-06-15",
    "occupation": "Software Engineer",
    "marital_status": "married",
    "address": { "street": "123 Main St", "city": "San Francisco", "state": "CA", "zip": "94102" },
    "credit_score_tier": "good"
  },
  
  "coverage_requests": [
    {
      "coverage_type": "general_liability",  // or "homeowners", "auto", etc.
      "requested_limits": { "per_occurrence": 1000000 },
      "requested_deductible": 500,
      "effective_date": "2025-12-01",
      
      // Additional fields for specific coverage types
      "property_info": {  // For homeowners
        "dwelling_value": 500000,
        "year_built": 2010,
        "construction_type": "frame",
        "roof_age": 5
      },
      "vehicle_info": {  // For auto
        "year": 2022,
        "make": "Toyota",
        "model": "Camry",
        "vin": "1HGBH41JXMN109186",
        "usage": "commute"
      }
    }
  ]
}
```

**Response (Success - 200 OK):**
```json
{
  "success": true,
  "carrier_id": "reliable_insurance",
  "carrier_name": "Reliable Insurance Co.",
  "quote_id": "RIC-Q-2025-001234",
  "timestamp": "2025-11-11T10:30:00Z",
  "valid_until": "2025-12-11T10:30:00Z",
  "generated_via_llm": true,
  "cached": false,
  "quotes": [
    {
      "coverage_type": "general_liability",
      "status": "quoted",
      "premium": {
        "annual": 1250.00,
        "monthly": 110.00,
        "quarterly": 325.00
      },
      "coverage_limits": { "per_occurrence": 1000000, "aggregate": 2000000 },
      "deductible": 500,
      "highlights": ["Coverage for bodily injury", "Legal defense included"],
      "exclusions": ["Professional services", "Pollution"],
      "optional_coverages": [
        { "name": "Hired Auto", "additional_premium": 125.00 }
      ]
    }
  ]
}
```

### 2. POST /api/v1/carriers/{carrier_id}/bind

Bind a policy from an accepted quote.

### 3. GET /api/v1/carriers/{carrier_id}/policies/{policy_id}

Retrieve policy details.

### 4. POST /api/v1/carriers/{carrier_id}/policies/{policy_id}/renew

Request renewal quote.

### 5. POST /api/v1/carriers/{carrier_id}/policies/{policy_id}/endorse

Add policy endorsement.

### 6. POST /api/v1/carriers/{carrier_id}/policies/{policy_id}/cancel

Cancel policy.

### 7. POST /api/v1/carriers/{carrier_id}/policies/{policy_id}/certificate

Generate COI.

### 8. GET /api/v1/carriers/{carrier_id}/health

Check carrier status.

*(Full API schemas in Appendix)*

---

## Technical Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Carrier API Simulator                      │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  API Gateway (NestJS)                            │  │
│  │  - Rate Limiting (Redis)                         │  │
│  │  - Authentication                                │  │
│  │  - Request Logging                               │  │
│  └─────────────────┬────────────────────────────────┘  │
│                    │                                    │
│  ┌─────────────────┴────────────────────────────────┐  │
│  │  Quote Service                                   │  │
│  │  1. Generate cache key                           │  │
│  │  2. Check Redis cache (< 1ms)                    │  │
│  │  3. Check PostgreSQL cache                       │  │
│  │  4. If miss → LLM Service                        │  │
│  │  5. Store result → Redis + PostgreSQL            │  │
│  └─────────────────┬────────────────────────────────┘  │
│                    │                                    │
│  ┌─────────────────┴────────────────────────────────┐  │
│  │  LLM Service (OpenAI/Anthropic)                  │  │
│  │  - Prompt engineering                            │  │
│  │  - Response parsing & validation                 │  │
│  │  - Error handling & retries                      │  │
│  │  - Cost tracking                                 │  │
│  └─────────────────┬────────────────────────────────┘  │
│                    │                                    │
│  ┌─────────────────┴────────────────────────────────┐  │
│  │  Carrier Services (4 carriers)                   │  │
│  │  - Reliable Insurance Service                    │  │
│  │  - TechShield Service                            │  │
│  │  - Premier Service                               │  │
│  │  - FastBind Service                              │  │
│  └─────────────────┬────────────────────────────────┘  │
│                    │                                    │
│  ┌─────────────────┴────────────────────────────────┐  │
│  │  Policy Management Service                       │  │
│  │  - Bind, Renew, Endorse, Cancel                  │  │
│  └─────────────────┬────────────────────────────────┘  │
│                    │                                    │
│  ┌─────────────────┴────────────────────────────────┐  │
│  │  Document Service                                │  │
│  │  - PDF generation (Puppeteer)                    │  │
│  │  - Template rendering                            │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Data Layer                                      │  │
│  │  ┌────────────┐  ┌──────────┐  ┌─────────────┐  │  │
│  │  │PostgreSQL  │  │  Redis   │  │ File Storage│  │  │
│  │  │(Quotes,    │  │(Cache,   │  │  (S3/Local) │  │  │
│  │  │ Policies)  │  │ Locks)   │  │   (PDFs)    │  │  │
│  │  └────────────┘  └──────────┘  └─────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

**Backend Framework:**
- **Node.js + NestJS** (TypeScript)
- Modular architecture
- Built-in dependency injection
- Matches Clarence stack

**Databases:**
- **PostgreSQL**: Persistent storage for quotes, policies, configurations
- **Redis**: High-speed caching, rate limiting, distributed locks

**LLM Integration:**
- **OpenAI SDK** (for GPT-4/GPT-4o)
- **Anthropic SDK** (for Claude)
- Configurable via environment variables

**Document Generation:**
- **Puppeteer**: HTML-to-PDF (realistic documents)
- **Handlebars**: Template engine
- Store in local filesystem or S3

**API Documentation:**
- **Swagger/OpenAPI**: Auto-generated docs
- **Postman Collection**: Pre-built requests

### Environment Configuration

```bash
# Server
NODE_ENV=development
PORT=3001
API_BASE_URL=http://localhost:3001

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/carrier_simulator
REDIS_URL=redis://localhost:6379

# LLM Configuration
LLM_PROVIDER=openai  # or 'anthropic'
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
LLM_MODEL=gpt-4o  # or 'claude-3-5-sonnet-20241022'
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=2000
LLM_TIMEOUT_MS=30000

# Caching
QUOTE_CACHE_TTL_DAYS=30
REDIS_CACHE_TTL_SECONDS=86400  # 24 hours

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Documents
DOCUMENT_STORAGE_PATH=./storage/documents
DOCUMENT_WATERMARK=SIMULATED - FOR TESTING ONLY

# Simulation Settings
ERROR_INJECTION_RATE=0.05  # 5% of requests
SIMULATE_SLOW_RESPONSES=true
```

---

## Database Schema

### PostgreSQL Tables

```sql
-- Carriers
CREATE TABLE carriers (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  personality VARCHAR(50),
  rating VARCHAR(10),
  base_response_time_ms INTEGER,
  supports_personal BOOLEAN DEFAULT true,
  supports_commercial BOOLEAN DEFAULT true,
  status VARCHAR(20) DEFAULT 'operational',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Quote Cache (for LLM-generated quotes)
CREATE TABLE quote_cache (
  cache_key VARCHAR(64) PRIMARY KEY,
  carrier_id VARCHAR(50) REFERENCES carriers(id),
  quote_id VARCHAR(100) UNIQUE,
  insurance_type VARCHAR(20) NOT NULL, -- 'personal' or 'commercial'
  coverage_type VARCHAR(50),
  quote_data JSONB NOT NULL,
  request_hash VARCHAR(64),
  generated_via_llm BOOLEAN DEFAULT true,
  llm_provider VARCHAR(20), -- 'openai' or 'anthropic'
  llm_model VARCHAR(50),
  llm_cost_usd DECIMAL(10,4),
  created_at TIMESTAMP DEFAULT NOW(),
  last_accessed_at TIMESTAMP DEFAULT NOW(),
  access_count INTEGER DEFAULT 1,
  expires_at TIMESTAMP,
  UNIQUE(carrier_id, quote_id)
);

CREATE INDEX idx_quote_cache_carrier ON quote_cache(carrier_id);
CREATE INDEX idx_quote_cache_expires ON quote_cache(expires_at);
CREATE INDEX idx_quote_cache_insurance_type ON quote_cache(insurance_type);

-- Policies
CREATE TABLE policies (
  policy_id VARCHAR(100) PRIMARY KEY,
  carrier_id VARCHAR(50) REFERENCES carriers(id),
  policy_number VARCHAR(100) UNIQUE NOT NULL,
  quote_id VARCHAR(100),
  insurance_type VARCHAR(20) NOT NULL,
  status VARCHAR(20),
  coverage_type VARCHAR(50),
  effective_date TIMESTAMP,
  expiration_date TIMESTAMP,
  premium_annual DECIMAL(10,2),
  payment_plan VARCHAR(20),
  insured_name VARCHAR(200),
  insured_info JSONB,
  coverage_details JSONB,
  documents JSONB[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_policies_carrier ON policies(carrier_id);
CREATE INDEX idx_policies_expiration ON policies(expiration_date);
CREATE INDEX idx_policies_type ON policies(insurance_type);

-- LLM Usage Tracking
CREATE TABLE llm_usage_log (
  id SERIAL PRIMARY KEY,
  request_type VARCHAR(50), -- 'quote', 'renewal', etc.
  carrier_id VARCHAR(50),
  insurance_type VARCHAR(20),
  llm_provider VARCHAR(20),
  llm_model VARCHAR(50),
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  cost_usd DECIMAL(10,6),
  latency_ms INTEGER,
  success BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_llm_usage_created ON llm_usage_log(created_at);
```

---

## LLM Quote Generation Details

### Prompt Engineering Strategy

Each carrier has a unique system prompt that defines its personality:

**Reliable Insurance Co. Prompt:**
```
You are an experienced underwriter for Reliable Insurance Co., an A+ rated carrier known for conservative, consistent pricing and excellent customer service.

YOUR PERSONALITY:
- Conservative risk assessment
- Fair, transparent pricing
- Focus on long-term relationships
- Strong in general liability and property
- Prefer established businesses (2+ years) or stable individuals

YOUR PRICING PHILOSOPHY:
- Mid-market pricing (not cheapest, not most expensive)
- Value claims-free history
- Reward multi-policy customers
- Competitive rates for low-risk profiles

WHEN TO DECLINE:
- High-risk industries (nightclubs, cannabis, hazmat)
- Poor credit history (personal insurance)
- >3 claims in 3 years
- Insufficient information

Generate quotes that reflect Reliable's balanced, customer-first approach.
```

### Response Parsing & Validation

LLM responses are parsed and validated:

```typescript
interface LLMQuoteResponse {
  decision: 'approved' | 'declined';
  decline_reason?: string;
  quote_id: string;
  coverage_type: string;
  premium: {
    annual: number;
    monthly: number;
    quarterly: number;
  };
  coverage_limits: Record<string, number>;
  deductible: number;
  highlights: string[];
  exclusions: string[];
  optional_coverages: Array<{
    name: string;
    additional_premium: number;
  }>;
  underwriting_notes: string[];
}

// Validation rules
function validateLLMQuote(response: LLMQuoteResponse) {
  if (!response.decision) throw new Error('Missing decision');
  if (response.decision === 'approved') {
    if (!response.premium?.annual) throw new Error('Missing premium');
    if (response.premium.annual < 100) throw new Error('Premium too low');
    if (response.premium.annual > 100000) throw new Error('Premium too high');
    // ... more validations
  }
}
```

### Cost Tracking

Track LLM API costs:

```typescript
async function trackLLMUsage(usage: {
  provider: 'openai' | 'anthropic';
  model: string;
  promptTokens: number;
  completionTokens: number;
}) {
  const costPer1kTokens = getCostForModel(usage.model);
  const totalCost = 
    (usage.promptTokens / 1000 * costPer1kTokens.prompt) +
    (usage.completionTokens / 1000 * costPer1kTokens.completion);
  
  await db.llmUsageLog.create({
    llm_provider: usage.provider,
    llm_model: usage.model,
    prompt_tokens: usage.promptTokens,
    completion_tokens: usage.completionTokens,
    total_tokens: usage.promptTokens + usage.completionTokens,
    cost_usd: totalCost
  });
}
```

---

## Development Roadmap

### Phase 1: Core Infrastructure (Week 1-2)
- [ ] Project setup (NestJS, PostgreSQL, Redis)
- [ ] Database schema implementation
- [ ] Environment configuration system
- [ ] LLM service integration (OpenAI + Anthropic)
- [ ] Basic quote caching logic
- [ ] Rate limiting with Redis

### Phase 2: Quote Generation (Week 3-4)
- [ ] Carrier personality prompts
- [ ] LLM quote generation service
- [ ] Response parsing & validation
- [ ] Cache hit/miss logic
- [ ] Quote API endpoint
- [ ] Support for commercial insurance (all 13 types)
- [ ] Support for personal insurance (4+ types)

### Phase 3: Policy Management (Week 5-6)
- [ ] Policy binding API
- [ ] Policy retrieval API
- [ ] Document generation (PDFs)
- [ ] Renewal logic
- [ ] Endorsement handling
- [ ] Cancellation workflow

### Phase 4: Testing & Polish (Week 7-8)
- [ ] Comprehensive test suite
- [ ] Error injection simulation
- [ ] Load testing
- [ ] API documentation (Swagger)
- [ ] Admin dashboard
- [ ] Deployment setup (Docker)

**Total Timeline: 8 weeks**

---

## Testing Strategy

### Unit Tests
- LLM prompt generation
- Quote cache key generation
- Response parsing & validation
- Rate limiting logic

### Integration Tests
- Quote generation flow (cache miss → LLM → cache hit)
- Full quote-to-bind workflow
- Concurrent request handling
- LLM failover (OpenAI → Anthropic)

### Performance Tests
- Cache hit rate >90%
- Response time with cache hit <100ms
- Response time with LLM call <5s
- Concurrent requests: 50+ simultaneous

### Cost Analysis Tests
- LLM token usage per quote
- Cost per quote generation
- Cache savings calculation

---

## API Documentation

Interactive Swagger docs at: `http://localhost:3001/api/docs`

Example API calls in Appendix.

---

## Appendix A: Coverage Type Specifications

### Personal Insurance Details

**1. Homeowners Insurance (HO-3)**
- Dwelling coverage: Replacement cost
- Personal property: 50-70% of dwelling
- Liability: $100k-$500k
- Medical payments: $1k-$5k
- Loss of use: 20% of dwelling
- Deductibles: $500-$5,000

**2. Auto Insurance**
- Bodily injury liability: State minimum - $500k
- Property damage liability: $25k-$500k
- Collision deductible: $250-$2,000
- Comprehensive deductible: $0-$1,000
- Uninsured motorist coverage
- Medical payments: $1k-$10k

**3. Renters Insurance (HO-4)**
- Personal property: $15k-$100k
- Liability: $100k-$500k
- Medical payments: $1k-$5k
- Loss of use: Actual expenses
- Deductibles: $250-$1,000

**4. Life Insurance**
- Term life: $100k-$5M, 10-30 year terms
- Whole life: Cash value accumulation
- Simplified issue: Up to $500k
- Medical exam may be required

### Commercial Insurance Details

*(See original PRD sections for GL, E&O, Cyber, etc.)*

---

## Appendix B: Sample API Workflows

### Get Personal Insurance Quote

```bash
curl -X POST http://localhost:3001/api/v1/carriers/reliable_insurance/quote \
  -H "X-API-Key: test_key_123" \
  -H "Content-Type: application/json" \
  -d '{
    "quote_request_id": "qr_personal_001",
    "insurance_type": "personal",
    "personal_info": {
      "first_name": "John",
      "last_name": "Doe",
      "date_of_birth": "1985-06-15",
      "occupation": "Software Engineer",
      "marital_status": "married",
      "address": {
        "street": "123 Main St",
        "city": "San Francisco",
        "state": "CA",
        "zip": "94102"
      },
      "credit_score_tier": "good"
    },
    "coverage_requests": [
      {
        "coverage_type": "homeowners",
        "property_info": {
          "dwelling_value": 750000,
          "year_built": 2015,
          "square_feet": 2000,
          "construction_type": "frame",
          "roof_age": 3,
          "bedrooms": 3,
          "bathrooms": 2
        },
        "requested_limits": {
          "dwelling": 750000,
          "personal_property": 500000,
          "liability": 300000
        },
        "requested_deductible": 1000,
        "effective_date": "2025-12-01"
      }
    ]
  }'
```

### Get Commercial Insurance Quote

```bash
curl -X POST http://localhost:3001/api/v1/carriers/techshield_underwriters/quote \
  -H "X-API-Key: test_key_123" \
  -H "Content-Type: application/json" \
  -d '{
    "quote_request_id": "qr_commercial_001",
    "insurance_type": "commercial",
    "business_info": {
      "legal_name": "Acme Tech Solutions LLC",
      "industry": "Technology Consulting",
      "industry_code": "541512",
      "revenue": 500000,
      "employees": { "full_time": 5, "part_time": 2 },
      "address": {
        "street": "123 Main St",
        "city": "San Francisco",
        "state": "CA",
        "zip": "94102"
      }
    },
    "coverage_requests": [
      {
        "coverage_type": "cyber_liability",
        "requested_limits": {
          "per_incident": 1000000,
          "aggregate": 2000000
        },
        "requested_deductible": 5000,
        "effective_date": "2025-12-01"
      }
    ]
  }'
```

---

## Appendix C: Carrier Comparison Matrix

| Feature | Reliable | TechShield | Premier | FastBind |
|---------|----------|------------|---------|----------|
| **Personal Insurance** | ✅ | ✅ | ✅ | ✅ |
| **Commercial Insurance** | ✅ | ✅ | ✅ | ✅ |
| **Response Time** | 2-3s | 3-5s | 5-7s | 1-2s |
| **Pricing** | Mid | Competitive | Premium | Aggressive |
| **Personal Focus** | Families | Young pros | High net worth | First-timers |
| **Commercial Focus** | Small biz | Tech | Large/complex | Small/fast |
| **Rating** | A+ | A | A+ | A- |
| **LLM Prompts** | Balanced | Tech-savvy | Premium quality | Speed-focused |

---

## Document Control

**Version:** 2.0  
**Date:** November 11, 2025  
**Changes from v1.0:**
- Added LLM-powered quote generation (OpenAI/Anthropic)
- Added quote caching strategy to avoid duplicate LLM calls
- Detailed Redis usage explanation (caching, rate limiting, locks)
- All carriers now support both personal AND commercial insurance
- Added personal insurance coverage types (homeowners, auto, renters, life)
- Updated architecture diagrams
- Added LLM cost tracking

**Status:** Draft for Review  
**Next Review:** Upon stakeholder approval

---

## Approval Checklist

- [ ] LLM integration approach approved
- [ ] Quote caching strategy validated
- [ ] Redis usage justification accepted
- [ ] Personal + Commercial insurance for all carriers confirmed
- [ ] Timeline (8 weeks) acceptable
- [ ] Environment configuration requirements clear

---

**End of PRD v2.0**
