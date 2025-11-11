# Setup & Installation Guide

## ✅ What You Have

A complete **NestJS backend implementation** with:
- ✅ All 8 API endpoints implemented
- ✅ Full request/response validation
- ✅ API key authentication
- ✅ Mock data generation
- ✅ In-memory storage (no database needed!)
- ✅ Ready to test with `api.http` file

## 🚀 Quick Setup (3 Steps)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Setup Environment

The `.env` file is already created with defaults:

```bash
PORT=3001
NODE_ENV=development
API_KEY=test_clarence_key_123
```

No changes needed for testing!

### Step 3: Start the Server

```bash
npm run start:dev
```

You should see:

```
🚀 Carrier API Simulator running on: http://localhost:3001/api/v1
📝 Test with: api.http file in VS Code
🔑 API Key: test_clarence_key_123
```

## 🧪 Test It Works

### Option 1: Use REST Client (Recommended)

1. Install "REST Client" extension in VS Code
2. Open `api.http` file
3. Click "Send Request" on "Check Carrier Health - Reliable Insurance"
4. You should see a successful response!

### Option 2: Use curl

```bash
curl http://localhost:3001/api/v1/carriers/reliable_insurance/health \
  -H "X-API-Key: test_clarence_key_123"
```

Expected response:

```json
{
  "status": "operational",
  "carrier_id": "reliable_insurance",
  "carrier_name": "Reliable Insurance Co.",
  ...
}
```

## 📝 Try a Complete Workflow

### 1. Get a Quote

In `api.http`, find "Get Commercial Quote - General Liability" and click "Send Request"

The response will include a `quote_id` like:
```json
{
  "success": true,
  "quotes": [
    {
      "quote_id": "RIC-Q-2025-123456-GL",
      ...
    }
  ]
}
```

### 2. Update Variables

In `api.http`, update the variables section:

```
@quote_id = RIC-Q-2025-123456-GL  # Copy from response above
```

### 3. Bind the Policy

Find "Bind Policy" request and click "Send Request"

The response will include a `policy_id`:

```json
{
  "success": true,
  "policy": {
    "policy_id": "RIC-P-2025-789012",
    ...
  }
}
```

### 4. Update Policy Variable

```
@policy_id = RIC-P-2025-789012  # Copy from bind response
```

### 5. Get Policy Details

Find "Get Policy Details" and click "Send Request"

### 6. Generate Certificate

Find "Generate Certificate of Insurance" and click "Send Request"

## 🎉 You're Done!

You now have a fully working mock API that:
- ✅ Accepts quote requests
- ✅ Returns realistic fake quotes
- ✅ Binds policies
- ✅ Manages policy lifecycle
- ✅ Generates certificates

## 📂 Project Structure Overview

```
carrier-api-simulator/
├── src/                          # Source code
│   ├── main.ts                   # App entry point
│   ├── app.module.ts            # Root module
│   └── carriers/                 # Carriers module
│       ├── carriers.controller.ts   # 8 API endpoints
│       ├── carriers.module.ts
│       ├── guards/
│       │   └── api-key.guard.ts    # Auth
│       ├── dto/                    # Request validation
│       │   ├── quote-request.dto.ts
│       │   ├── bind-request.dto.ts
│       │   └── ...
│       └── services/
│           ├── mock-data.service.ts   # Fake data generator
│           ├── quote.service.ts       # Quote handling
│           └── policy.service.ts      # Policy management
├── api.http                      # REST Client test file
├── package.json
├── tsconfig.json
└── .env                          # Configuration
```

## 🔧 Available Commands

```bash
# Development (with auto-reload)
npm run start:dev

# Build for production
npm run build

# Run production
npm run start:prod

# Format code
npm run format

# Lint code
npm run lint
```

## 🌐 All Endpoints

Once server is running, these endpoints are available:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/carriers/:id/quote` | Get quotes |
| POST | `/carriers/:id/bind` | Bind policy |
| GET | `/carriers/:id/policies/:pid` | Get policy |
| POST | `/carriers/:id/policies/:pid/renew` | Renew |
| POST | `/carriers/:id/policies/:pid/endorse` | Endorse |
| POST | `/carriers/:id/policies/:pid/cancel` | Cancel |
| POST | `/carriers/:id/policies/:pid/certificate` | COI |
| GET | `/carriers/:id/health` | Health check |

All require header: `X-API-Key: test_clarence_key_123`

## 🚨 Troubleshooting

### Port 3001 already in use?

Edit `.env`:
```bash
PORT=3002
```

### Can't connect?

Make sure server is running:
```bash
npm run start:dev
```

Look for: "🚀 Carrier API Simulator running on..."

### 401 Unauthorized?

Check your API key header:
```
X-API-Key: test_clarence_key_123
```

### Validation error?

Check the request body format in `api.http` examples

## 📚 More Resources

- **BACKEND_README.md** - Detailed backend documentation
- **API_SCHEMA.md** - Complete API specification
- **API_QUICK_REFERENCE.md** - Quick reference
- **INTEGRATION_GUIDE.md** - Integration examples
- **api.http** - All test requests

## 💡 What's Next?

1. ✅ Server running? Great!
2. ✅ Test with `api.http`? Perfect!
3. 🔄 Integrate with your Clarence backend
4. 🚀 Build your MVP!

---

**Questions?** Check BACKEND_README.md for more details.

**Ready to integrate?** See INTEGRATION_GUIDE.md for code examples.

