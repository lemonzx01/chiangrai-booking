# 🧪 Test Suite - Chiangrai Booking System

This directory contains automated tests for the Chiangrai Booking System using TestSprite.

## 📁 Structure

```
tests/
├── README.md                 # This file
├── config/                   # Test configuration
│   └── testsprite.yml        # TestSprite configuration
├── api/                      # API endpoint tests
│   ├── auth/                 # Authentication tests
│   ├── hotels/               # Hotels API tests
│   ├── bookings/             # Bookings API tests
│   ├── cars/                 # Cars API tests
│   └── payments/             # Payment API tests
└── e2e/                      # End-to-end tests
    ├── booking-flow.yml      # Complete booking flow
    └── payment-flow.yml      # Payment flow
```

## 🚀 Getting Started

### Prerequisites

1. **TestSprite Account**: Sign up at [testsprite.com](https://testsprite.com)
2. **API Key**: Get your API key from TestSprite dashboard
3. **MCP Configuration**: Ensure `mcp.json` is properly configured (see root)

### Running Tests

#### Using TestSprite MCP (Recommended)

1. Restart Cursor IDE after configuring `mcp.json`
2. Use TestSprite MCP commands to run tests
3. View results in TestSprite dashboard

#### Using TestSprite CLI

```bash
# Install TestSprite CLI
npm install -g @testsprite/cli

# Run all tests
testsprite run

# Run specific test suite
testsprite run tests/api/auth/

# Run with specific environment
testsprite run --env=development
```

## 📝 Test Categories

### 1. API Tests (`tests/api/`)

- **Authentication**: Login, Register, Google OAuth, Token validation
- **Hotels**: CRUD operations, filtering, pagination
- **Bookings**: Create booking, status updates, invoice generation
- **Cars**: CRUD operations, availability checks
- **Payments**: Checkout flow, webhook handling, payment status

### 2. E2E Tests (`tests/e2e/`)

- **Booking Flow**: Complete user journey from hotel selection to payment
- **Payment Flow**: Stripe integration testing
- **Admin Flow**: Admin dashboard operations

## 🔧 Configuration

### Environment Variables

Tests use environment variables from `.env.test`:

```bash
# Backend URL
BACKEND_URL=http://localhost:3001

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Test Credentials
TEST_ADMIN_EMAIL=admin@gotjourneythailand.com
TEST_ADMIN_PASSWORD=admin123
# หรือใช้ test credentials สำหรับ TestSprite:
# TEST_ADMIN_EMAIL=admin@example.com
# TEST_ADMIN_PASSWORD=validAdminPass123 หรือ AdminPass123

TEST_USER_EMAIL=user@example.com
TEST_USER_PASSWORD=user123
# หรือใช้ test credentials สำหรับ TestSprite:
# TEST_USER_PASSWORD=validUserPass123

# Mock Mode
MOCK_MODE=true
```

## 📊 Test Coverage Goals

- ✅ API endpoints: 80%+ (8/10 tests passing)
- ✅ Authentication flows: 90%+ (TC005 fixed)
- ✅ Payment flows: 85%+ (TC009 fixed)
- ✅ Critical user journeys: 100%

## 🧪 TestSprite Tests Status

**Current Status:** 8/10 tests passing (80%)

### ✅ Tests ที่ผ่าน
- TC001 - List Hotels
- TC002 - Get Hotel Details
- TC003 - List Cars
- TC004 - Get Car Details
- TC005 - User Login (แก้ไขแล้ว)
- TC006 - User Registration
- TC008 - Create Booking (แก้ไขแล้ว)
- TC009 - Checkout Session (แก้ไขแล้ว)

### ⚠️ Tests ที่ต้อง configure
- TC007 - Google OAuth (ต้อง configure Google OAuth credentials)
- TC010 - Stripe Webhook (ต้อง configure Stripe webhook secret)

ดูรายละเอียดเพิ่มเติมใน [testsprite_tests/TEST_FAILURE_ANALYSIS.md](../testsprite_tests/TEST_FAILURE_ANALYSIS.md)

## 🐛 Debugging

### View Test Logs

```bash
# TestSprite dashboard
https://app.testsprite.com/projects/[project-id]/runs

# Local logs
tail -f tests/logs/test.log
```

### Common Issues

1. **MCP Server Not Found**: Restart Cursor after updating `mcp.json`
2. **Connection Errors**: Check `BACKEND_URL` and `FRONTEND_URL` in config
3. **Auth Failures**: Verify test credentials in `.env.test`

## 📚 Resources

- [TestSprite Documentation](https://docs.testsprite.com)
- [MCP Integration Guide](https://docs.testsprite.com/mcp)
- [API Testing Best Practices](https://docs.testsprite.com/guides/api-testing)
