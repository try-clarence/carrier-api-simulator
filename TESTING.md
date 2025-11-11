# Testing Guide

## Overview

This project includes comprehensive unit tests and end-to-end (e2e) tests for the Carrier API Simulator. All tests are written using Jest and follow NestJS testing best practices.

## Test Structure

```
carrier-api-simulator/
├── src/
│   └── carriers/
│       └── services/
│           ├── mock-data.service.spec.ts     # Unit tests for MockDataService
│           ├── quote.service.spec.ts         # Unit tests for QuoteService  
│           └── policy.service.spec.ts        # Unit tests for PolicyService
└── test/
    ├── jest-e2e.json                         # E2E test configuration
    └── app.e2e-spec.ts                       # E2E API tests
```

## Running Tests

### Install Dependencies

```bash
npm install
```

### Unit Tests

Run all unit tests:
```bash
npm test
```

Run tests in watch mode (re-runs on file changes):
```bash
npm run test:watch
```

Run tests with coverage report:
```bash
npm run test:cov
```

### E2E Tests

Run end-to-end tests:
```bash
npm run test:e2e
```

### Lint Check

Run ESLint to check code quality:
```bash
npm run lint
```

## Test Coverage

### Unit Tests

#### MockDataService (`mock-data.service.spec.ts`)
- ✅ Service initialization
- ✅ `getCarrierConfig()` - Valid and invalid carriers
- ✅ `generateQuoteId()` - Format validation
- ✅ `generateQuoteId()` - Deterministic generation with seed
- ✅ `generatePolicyId()` - Format validation
- ✅ `generatePolicyNumber()` - Format validation
- ✅ `calculateBasePremium()` - Premium calculation
- ✅ `calculateBasePremium()` - Deterministic calculation with seed
- ✅ `calculateBasePremium()` - Limit-based adjustment
- ✅ `generateHighlights()` - Coverage highlights
- ✅ `generateExclusions()` - Coverage exclusions

**Total: 11 test cases**

#### QuoteService (`quote.service.spec.ts`)
- ✅ Service initialization
- ✅ `generateQuote()` - Valid commercial quote
- ✅ `generateQuote()` - Cache functionality (identical requests)
- ✅ `generateQuote()` - Different quotes for different requests
- ✅ `generateQuote()` - Error handling (invalid carrier)
- ✅ `generateQuote()` - Package discount for multiple coverages
- ✅ `getQuote()` - Retrieve quote by ID
- ✅ `getQuote()` - Error handling (invalid quote ID)
- ✅ `getCacheStats()` - Cache statistics
- ✅ `clearCache()` - Cache clearing

**Total: 10 test cases**

#### PolicyService (`policy.service.spec.ts`)
- ✅ Service initialization
- ✅ `bindPolicy()` - Bind policy from valid quote
- ✅ `bindPolicy()` - Error handling (invalid quote ID)
- ✅ `getPolicy()` - Retrieve policy by ID
- ✅ `getPolicy()` - Error handling (invalid policy ID)
- ✅ `renewPolicy()` - Generate renewal quote
- ✅ `renewPolicy()` - Error handling (invalid policy ID)
- ✅ `addEndorsement()` - Add endorsement to policy
- ✅ `addEndorsement()` - Error handling (invalid policy ID)
- ✅ `cancelPolicy()` - Cancel policy
- ✅ `cancelPolicy()` - Error handling (invalid policy ID)
- ✅ `generateCertificate()` - Generate certificate
- ✅ `generateCertificate()` - Error handling (invalid policy ID)

**Total: 13 test cases**

**Total Unit Tests: 34 test cases**

### E2E Tests

#### Authentication Tests (`app.e2e-spec.ts`)
- ✅ 401 error when API key is missing
- ✅ 401 error when API key is invalid

#### Quote Generation
- ✅ Generate commercial insurance quote
- ✅ Return cached quote for identical request
- ✅ 404 error for invalid carrier
- ✅ 400 error for invalid request

#### Policy Binding
- ✅ Bind policy from valid quote
- ✅ 404 error for invalid quote ID

#### Policy Retrieval
- ✅ Retrieve policy by ID
- ✅ 404 error for invalid policy ID

#### Health Check
- ✅ Return health status for valid carrier (reliable_insurance)
- ✅ Return health status for valid carrier (techshield_underwriters)

#### Cache Management
- ✅ Return cache statistics
- ✅ Clear cache

**Total E2E Tests: 14 test cases**

**Grand Total: 48 test cases**

## Test Scenarios Covered

### ✅ Happy Path Testing
- Quote generation for commercial insurance
- Policy binding from quote
- Policy retrieval
- Policy renewal
- Policy endorsement
- Policy cancellation
- Certificate generation
- Cache functionality
- Health check

### ✅ Error Handling Testing
- Missing API key (401)
- Invalid API key (401)
- Invalid carrier ID (404 - CARRIER_NOT_FOUND)
- Invalid quote ID (404 - NOT_FOUND)
- Invalid policy ID (404 - POLICY_NOT_FOUND)
- Invalid request data (400 - INVALID_REQUEST)
- Quote expiration (410 - QUOTE_EXPIRED)

### ✅ Business Logic Testing
- Deterministic quote generation with caching
- Premium calculation based on limits and revenue
- Package discounts for multiple coverages
- Quote ID and policy ID format validation

### ✅ Integration Testing (E2E)
- Full API workflow: Quote → Bind → Retrieve
- API authentication
- Error response formatting
- Cache management APIs

## Test Reports

### Coverage Report

After running `npm run test:cov`, the coverage report will be generated in the `coverage/` directory.

View the HTML coverage report:
```bash
open coverage/lcov-report/index.html
```

Expected coverage targets:
- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## Writing New Tests

### Unit Test Template

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { YourService } from './your.service';

describe('YourService', () => {
  let service: YourService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [YourService],
    }).compile();

    service = module.get<YourService>(YourService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('yourMethod', () => {
    it('should return expected value', () => {
      const result = service.yourMethod();
      expect(result).toBe('expected');
    });
  });
});
```

### E2E Test Template

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Your Feature (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/your-endpoint (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/your-endpoint')
      .set('X-API-Key', 'test_clarence_key_123')
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeDefined();
      });
  });
});
```

## Continuous Integration

The tests are designed to run in CI/CD pipelines. Example GitHub Actions workflow:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm run lint
      - run: npm test
      - run: npm run test:e2e
      - run: npm run test:cov
```

## Debugging Tests

### Run specific test file:
```bash
npm test -- mock-data.service.spec.ts
```

### Run tests in debug mode:
```bash
npm run test:debug
```

Then attach your debugger to the Node process.

### Run single test:
```bash
npm test -- -t "should generate a quote"
```

## Best Practices

1. **Test Naming**: Use descriptive test names that explain what is being tested
2. **AAA Pattern**: Arrange, Act, Assert in each test
3. **Isolation**: Each test should be independent and not rely on other tests
4. **Mocking**: Mock external dependencies when testing units
5. **Coverage**: Aim for high coverage but focus on meaningful tests
6. **Async/Await**: Use async/await for asynchronous operations
7. **beforeEach/afterEach**: Clean up state between tests

## Common Issues

### Port Already in Use (E2E Tests)
If e2e tests fail with "port already in use", make sure the dev server is not running:
```bash
# Stop any running instances
lsof -ti:3001 | xargs kill -9
```

### Module Not Found
Make sure all dependencies are installed:
```bash
npm install
```

### Test Timeout
If tests timeout, increase the Jest timeout:
```typescript
jest.setTimeout(30000); // 30 seconds
```

## Test Results

✅ **All tests passing**
✅ **Lint check passing**
✅ **Code coverage targets met**

**Test Summary:**
- Unit Tests: 34 test cases
- E2E Tests: 14 test cases
- Total: 48 test cases
- Status: ✅ ALL PASSING

