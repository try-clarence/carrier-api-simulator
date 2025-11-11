# Carrier API Simulator - Backend Implementation

**⚠️ Simple MVP Mock API** - Returns fake insurance data for testing purposes

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# or with yarn
yarn install
```

### Running the Application

```bash
# Development mode (with hot reload)
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API will be available at: `http://localhost:3001/api/v1`

## 📝 Testing the API

### Option 1: Use REST Client (VS Code)

1. Open `api.http` file
2. Install REST Client extension if not already installed
3. Click "Send Request" above any endpoint

### Option 2: Use curl

```bash
# Health check
curl http://localhost:3001/api/v1/carriers/reliable_insurance/health \
  -H "X-API-Key: test_clarence_key_123"

# Get a quote
curl -X POST http://localhost:3001/api/v1/carriers/reliable_insurance/quote \
  -H "X-API-Key: test_clarence_key_123" \
  -H "Content-Type: application/json" \
  -d '{
    "quote_request_id": "test_001",
    "insurance_type": "commercial",
    "business_info": {
      "legal_name": "Test Company LLC",
      "industry": "Technology",
      "industry_code": "541512",
      "address": {
        "city": "San Francisco",
        "state": "CA",
        "zip": "94102"
      },
      "financial_info": {
        "annual_revenue": 500000,
        "full_time_employees": 5
      }
    },
    "coverage_requests": [{
      "coverage_type": "general_liability",
      "requested_limits": {
        "per_occurrence": 1000000,
        "general_aggregate": 2000000
      },
      "requested_deductible": 500,
      "effective_date": "2025-12-01"
    }]
  }'
```

## 🏗️ Project Structure

```
src/
├── main.ts                   # Application entry point
├── app.module.ts            # Root module
└── carriers/                # Carriers module
    ├── carriers.controller.ts   # All 8 API endpoints
    ├── carriers.module.ts       # Module configuration
    ├── guards/
    │   └── api-key.guard.ts     # API key authentication
    ├── dto/                     # Data transfer objects
    │   ├── quote-request.dto.ts
    │   ├── bind-request.dto.ts
    │   ├── renew-request.dto.ts
    │   ├── endorse-request.dto.ts
    │   ├── cancel-request.dto.ts
    │   └── certificate-request.dto.ts
    └── services/                # Business logic
        ├── mock-data.service.ts    # Fake data generation
        ├── quote.service.ts        # Quote handling
        └── policy.service.ts       # Policy management
```

## 📋 Implemented Endpoints

All 8 endpoints are fully implemented:

1. **POST** `/carriers/:carrier_id/quote` - Generate fake insurance quotes
2. **POST** `/carriers/:carrier_id/bind` - Bind policy from quote
3. **GET** `/carriers/:carrier_id/policies/:policy_id` - Get policy details
4. **POST** `/carriers/:carrier_id/policies/:policy_id/renew` - Renew policy
5. **POST** `/carriers/:carrier_id/policies/:policy_id/endorse` - Add endorsement
6. **POST** `/carriers/:carrier_id/policies/:policy_id/cancel` - Cancel policy
7. **POST** `/carriers/:carrier_id/policies/:policy_id/certificate` - Generate COI
8. **GET** `/carriers/:carrier_id/health` - Check carrier health

## 🔑 Authentication

All endpoints require an API key header:

```
X-API-Key: test_clarence_key_123
```

You can change this in the `.env` file:

```bash
API_KEY=your_custom_key_here
```

## 🏢 Supported Carriers

- `reliable_insurance` - Reliable Insurance Co.
- `techshield_underwriters` - TechShield Underwriters
- `premier_underwriters` - Premier Underwriters
- `fastbind_insurance` - FastBind Insurance

## 📦 How It Works

### Data Storage

- **In-Memory** - All quotes and policies are stored in memory (Map objects)
- **No Database** - Simple MVP implementation, data resets on server restart
- **Stateful** - Can track the full workflow: quote → bind → policy

### Mock Data Generation

The `MockDataService` generates realistic fake data:
- Quote IDs, Policy IDs, Policy Numbers
- Premium calculations based on coverage type and limits
- Policy highlights and exclusions
- Underwriting notes

### Pricing Logic

Simple but realistic:
- Base premiums per coverage type
- Adjusted by requested limits
- Modified by carrier pricing multiplier
- Random variance (-10% to +10%)
- Business revenue factor for commercial insurance

## 🧪 Example Workflow

```bash
# 1. Get a quote
POST /api/v1/carriers/reliable_insurance/quote
# Response includes quote_id

# 2. Bind the policy
POST /api/v1/carriers/reliable_insurance/bind
# Request body includes quote_id from step 1
# Response includes policy_id

# 3. Retrieve policy
GET /api/v1/carriers/reliable_insurance/policies/{policy_id}

# 4. Generate certificate
POST /api/v1/carriers/reliable_insurance/policies/{policy_id}/certificate

# 5. Renew policy
POST /api/v1/carriers/reliable_insurance/policies/{policy_id}/renew
```

## ⚙️ Configuration

### Environment Variables

Edit `.env` file:

```bash
PORT=3001                           # Server port
NODE_ENV=development                # Environment
API_KEY=test_clarence_key_123       # API authentication key
```

## 🔧 Development

### Scripts

```bash
# Start development server
npm run start:dev

# Build for production
npm run build

# Format code
npm run format

# Lint code
npm run lint
```

### Adding New Features

1. **New DTO**: Add to `src/carriers/dto/`
2. **New Service**: Add to `src/carriers/services/`
3. **New Endpoint**: Add to `src/carriers/carriers.controller.ts`

## 🐛 Troubleshooting

### Port already in use

```bash
# Change port in .env
PORT=3002
```

### API Key not working

Make sure you're including the header:
```
X-API-Key: test_clarence_key_123
```

### Validation errors

Check your request body against the DTOs in `src/carriers/dto/`

## 📚 API Documentation

See the following files for complete API reference:
- `API_SCHEMA.md` - Complete API specification
- `API_QUICK_REFERENCE.md` - Quick lookup guide
- `INTEGRATION_GUIDE.md` - Integration examples
- `api.http` - REST Client test file

## 🚀 Production Deployment

For production, you would want to:

1. Add a real database (PostgreSQL/MongoDB)
2. Add Redis for caching (optional)
3. Add proper logging
4. Add monitoring
5. Add rate limiting (current implementation has no limits)
6. Add data persistence
7. Add unit tests

But for MVP testing, this in-memory implementation is perfect!

## 💡 Next Steps

1. Start the server: `npm run start:dev`
2. Test with `api.http` in VS Code
3. Integrate with your Clarence backend
4. Build your MVP!

---

**Version**: MVP  
**Purpose**: Simple mock API for testing and development  
**Not for production use**

