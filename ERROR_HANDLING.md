# Error Handling Reference

This document describes all error codes and their implementation in the Carrier API Simulator.

## Error Response Format

All errors follow a consistent JSON structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "field": "field_name",       // Optional: which field caused error
    "details": "Additional info"  // Optional: more context
  }
}
```

## Implemented Error Codes

### ✅ 400 Bad Request

#### INVALID_REQUEST
**When it occurs:**
- Request validation fails (missing required fields, wrong data types, etc.)
- Invalid enum values
- Malformed JSON

**Implementation:**
- Handled by NestJS `ValidationPipe` + custom `HttpExceptionFilter`
- Automatically triggered when DTOs don't pass validation

**Example:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Request validation failed",
    "details": [
      {
        "field": "insurance_type",
        "message": "insurance_type must be one of the following values: personal, commercial",
        "constraints": ["isEnum"]
      }
    ]
  }
}
```

**Test it:**
```http
POST http://localhost:3001/api/v1/carriers/reliable_insurance/quote
X-API-Key: test_clarence_key_123
Content-Type: application/json

{
  "quote_request_id": "test_001",
  "insurance_type": "invalid_type"
}
```

#### MISSING_REQUIRED_FIELD
**When it occurs:**
- Required field is not provided in the request

**Implementation:**
- Handled by class-validator decorators (`@IsString()`, `@IsNotEmpty()`, etc.)
- Transformed to `INVALID_REQUEST` by `ValidationPipe`

**Example:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Request validation failed",
    "details": [
      {
        "field": "business_info",
        "message": "business_info should not be empty",
        "constraints": ["isNotEmpty"]
      }
    ]
  }
}
```

---

### ✅ 401 Unauthorized

#### UNAUTHORIZED
**When it occurs:**
- Missing `X-API-Key` header
- Invalid API key value

**Implementation:**
- `src/carriers/guards/api-key.guard.ts`
- Applied globally to all carrier endpoints via `@UseGuards(ApiKeyGuard)`

**Example:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing API key"
  }
}
```

**Test it:**
```http
POST http://localhost:3001/api/v1/carriers/reliable_insurance/quote
Content-Type: application/json

{
  "quote_request_id": "test_001",
  "insurance_type": "commercial"
}
```

---

### ✅ 404 Not Found

#### NOT_FOUND
**When it occurs:**
- Generic resource not found (quote, policy, etc.)

**Implementation:**
- `src/carriers/services/quote.service.ts` - when quote ID not found
- Thrown using `NotFoundException` from `@nestjs/common`

**Example:**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Quote 'INVALID-QUOTE-ID' not found"
  }
}
```

**Test it:**
```http
POST http://localhost:3001/api/v1/carriers/reliable_insurance/bind
X-API-Key: test_clarence_key_123
Content-Type: application/json

{
  "quote_id": "INVALID-QUOTE-ID",
  "effective_date": "2025-12-01",
  "payment_plan": "annual"
}
```

#### CARRIER_NOT_FOUND
**When it occurs:**
- Invalid carrier ID in the URL

**Implementation:**
- `src/carriers/services/quote.service.ts` - `generateQuote()` method
- `src/carriers/services/mock-data.service.ts` - carrier config lookup

**Example:**
```json
{
  "success": false,
  "error": {
    "code": "CARRIER_NOT_FOUND",
    "message": "Carrier 'invalid_carrier' not found"
  }
}
```

**Test it:**
```http
POST http://localhost:3001/api/v1/carriers/invalid_carrier/quote
X-API-Key: test_clarence_key_123
Content-Type: application/json

{
  "quote_request_id": "test_001",
  "insurance_type": "commercial"
}
```

#### POLICY_NOT_FOUND
**When it occurs:**
- Policy ID doesn't exist in the system

**Implementation:**
- `src/carriers/services/policy.service.ts` - all policy operations
- Used in: `getPolicy()`, `renewPolicy()`, `addEndorsement()`, `cancelPolicy()`, `generateCertificate()`

**Example:**
```json
{
  "success": false,
  "error": {
    "code": "POLICY_NOT_FOUND",
    "message": "Policy 'INVALID-POLICY-ID' not found"
  }
}
```

**Test it:**
```http
GET http://localhost:3001/api/v1/carriers/reliable_insurance/policies/INVALID-POLICY-ID
X-API-Key: test_clarence_key_123
```

---

### ✅ 410 Gone

#### QUOTE_EXPIRED
**When it occurs:**
- Attempting to bind a quote that has expired (older than 30 days)

**Implementation:**
- `src/carriers/services/policy.service.ts` - `bindPolicy()` method
- Checks `valid_until` date from the quote

**Example:**
```json
{
  "success": false,
  "error": {
    "code": "QUOTE_EXPIRED",
    "message": "Quote has expired and cannot be bound",
    "details": "Quote expired on 2025-11-01"
  }
}
```

**Test it:**
You'd need to modify a quote's expiration date or wait 30 days. For testing, we can add an expired quote to the in-memory storage.

---

### ✅ 500 Internal Server Error

#### INTERNAL_ERROR
**When it occurs:**
- Unhandled exceptions
- Unexpected server errors
- Database connection issues (if we had a database)

**Implementation:**
- `src/common/filters/http-exception.filter.ts`
- Catches all unhandled exceptions

**Example:**
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred",
    "details": "Stack trace (only in development)"
  }
}
```

---

## Error Code Coverage Summary

| Error Code | HTTP Status | Implemented | File |
|------------|-------------|-------------|------|
| `INVALID_REQUEST` | 400 | ✅ | `main.ts` (ValidationPipe) |
| `MISSING_REQUIRED_FIELD` | 400 | ✅ | DTOs + ValidationPipe |
| `UNAUTHORIZED` | 401 | ✅ | `api-key.guard.ts` |
| `NOT_FOUND` | 404 | ✅ | `quote.service.ts` |
| `CARRIER_NOT_FOUND` | 404 | ✅ | `quote.service.ts` |
| `POLICY_NOT_FOUND` | 404 | ✅ | `policy.service.ts` |
| `QUOTE_EXPIRED` | 410 | ✅ | `policy.service.ts` |
| `INTERNAL_ERROR` | 500 | ✅ | `http-exception.filter.ts` |

## Testing Error Scenarios

### Create a Test File: `api-errors.http`

```http
### 1. Test INVALID_REQUEST - Wrong insurance type
POST http://localhost:3001/api/v1/carriers/reliable_insurance/quote
X-API-Key: test_clarence_key_123
Content-Type: application/json

{
  "quote_request_id": "test_001",
  "insurance_type": "invalid_type"
}

### 2. Test MISSING_REQUIRED_FIELD - No insurance_type
POST http://localhost:3001/api/v1/carriers/reliable_insurance/quote
X-API-Key: test_clarence_key_123
Content-Type: application/json

{
  "quote_request_id": "test_001"
}

### 3. Test UNAUTHORIZED - Missing API Key
POST http://localhost:3001/api/v1/carriers/reliable_insurance/quote
Content-Type: application/json

{
  "quote_request_id": "test_001",
  "insurance_type": "commercial"
}

### 4. Test UNAUTHORIZED - Invalid API Key
POST http://localhost:3001/api/v1/carriers/reliable_insurance/quote
X-API-Key: wrong_key
Content-Type: application/json

{
  "quote_request_id": "test_001",
  "insurance_type": "commercial"
}

### 5. Test CARRIER_NOT_FOUND - Invalid carrier
POST http://localhost:3001/api/v1/carriers/invalid_carrier/quote
X-API-Key: test_clarence_key_123
Content-Type: application/json

{
  "quote_request_id": "test_001",
  "insurance_type": "commercial",
  "business_info": {
    "legal_name": "Test Inc",
    "industry": "Technology",
    "industry_code": "541512",
    "financial_info": {
      "annual_revenue": 500000,
      "full_time_employees": 5
    }
  },
  "coverage_requests": [{
    "coverage_type": "general_liability",
    "requested_limits": { "occurrence": 1000000 },
    "effective_date": "2025-12-01"
  }]
}

### 6. Test NOT_FOUND - Invalid quote ID
POST http://localhost:3001/api/v1/carriers/reliable_insurance/bind
X-API-Key: test_clarence_key_123
Content-Type: application/json

{
  "quote_id": "INVALID-QUOTE-ID",
  "effective_date": "2025-12-01",
  "payment_plan": "annual",
  "payment_info": {
    "method": "credit_card",
    "token": "tok_test"
  }
}

### 7. Test POLICY_NOT_FOUND - Invalid policy ID
GET http://localhost:3001/api/v1/carriers/reliable_insurance/policies/INVALID-POLICY-ID
X-API-Key: test_clarence_key_123
```

## Best Practices

1. **Always return `success: false`** in error responses
2. **Use appropriate HTTP status codes** (400, 401, 404, 410, 500)
3. **Include helpful error messages** for debugging
4. **Add field names** when validation fails
5. **Don't expose sensitive info** in production errors
6. **Log all INTERNAL_ERROR** to the console for debugging

## Adding New Error Codes

If you need to add a new error code:

1. **Document it** in `API_SCHEMA.md`
2. **Throw it** in your service:
```typescript
throw new NotFoundException({
  success: false,
  error: {
    code: 'YOUR_ERROR_CODE',
    message: 'Descriptive message',
  },
});
```
3. **Test it** with `api.http`
4. **Update this document**

