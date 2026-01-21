# 🚀 TestSprite Setup Guide

This guide will help you set up and run tests for the Chiangrai Booking System using TestSprite.

## 📋 Prerequisites

1. **TestSprite Account**
   - Sign up at [testsprite.com](https://testsprite.com)
   - Get your API key from the dashboard

2. **MCP Configuration**
   - The `mcp.json` file has been fixed and configured
   - **Important**: Restart Cursor IDE after configuration changes

3. **Environment Setup**
   - Backend running on `http://localhost:3001`
   - Frontend running on `http://localhost:3000`
   - Database migrations completed (if not using mock mode)

## 🔧 Setup Steps

### Step 1: Verify MCP Configuration

Check that `~/.cursor/mcp.json` (or `%USERPROFILE%\.cursor\mcp.json` on Windows) contains:

```json
{
  "mcpServers": {
    "TestSprite": {
      "command": "npx",
      "args": ["@testsprite/testsprite-mcp@latest"],
      "env": {
        "API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Step 2: Restart Cursor IDE

After updating `mcp.json`, restart Cursor IDE to load the TestSprite MCP server.

### Step 3: Verify TestSprite Connection

In Cursor, you should see TestSprite MCP resources available. If not:

1. Check that your API key is correct
2. Ensure Node.js (v22+) is installed: `node --version`
3. Test the MCP server manually:
   ```bash
   npx @testsprite/testsprite-mcp@latest
   ```

### Step 4: Configure Test Environment

Create `tests/.env.test` (copy from `.env.test.example` if needed):

```bash
BACKEND_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
TEST_USER_EMAIL=user@example.com
TEST_USER_PASSWORD=user123
# หรือใช้ test credentials สำหรับ TestSprite:
# TEST_USER_PASSWORD=validUserPass123

TEST_ADMIN_EMAIL=admin@gotjourneythailand.com
TEST_ADMIN_PASSWORD=admin123
# หรือใช้ test credentials สำหรับ TestSprite:
# TEST_ADMIN_EMAIL=admin@example.com
# TEST_ADMIN_PASSWORD=validAdminPass123 หรือ AdminPass123

MOCK_MODE=true
```

### Step 5: Start Your Application

```bash
# From project root
npm run dev
```

This starts both frontend (port 3000) and backend (port 3001).

## 🧪 Running Tests

### Using TestSprite MCP (In Cursor)

1. Open Cursor's MCP panel
2. Select TestSprite server
3. Use available test commands to run tests

### Using TestSprite CLI

```bash
# Install TestSprite CLI globally
npm install -g @testsprite/cli

# Run all tests
testsprite run tests/

# Run specific test suite
testsprite run tests/api/auth/

# Run with specific environment
testsprite run --env=development
```

### Using npm scripts (if configured)

```bash
npm run test
npm run test:api
npm run test:e2e
```

## 📊 Test Structure

```
tests/
├── config/
│   └── testsprite.yml          # TestSprite configuration
├── api/                        # API endpoint tests
│   ├── auth/                   # Authentication tests
│   │   └── login.test.yml
│   ├── hotels/                 # Hotels API tests
│   │   └── list.test.yml
│   └── bookings/               # Bookings API tests
│       └── create.test.yml
└── e2e/                        # End-to-end tests
    └── booking-flow.test.yml   # Complete booking flow
```

## 🎯 Test Coverage

### Current Test Suites

✅ **Authentication**
- User login (success, failure cases)
- Admin login
- Invalid credentials handling

✅ **Hotels API**
- List hotels
- Pagination
- Filtering by location

✅ **Bookings API**
- Create booking
- Validation errors
- Authentication requirements

✅ **E2E Flows**
- Complete booking journey
- Payment flow (when Stripe is configured)

### Planned Test Suites

- [ ] Google OAuth flow
- [ ] Car rental API
- [ ] Payment webhook handling
- [ ] Admin dashboard operations
- [ ] Partner dashboard operations

## 🐛 Troubleshooting

### Issue: MCP Server Not Found

**Solution:**
1. Verify `mcp.json` format is correct
2. Restart Cursor IDE completely
3. Check Node.js version: `node --version` (should be v22+)
4. Test manually: `npx @testsprite/testsprite-mcp@latest`

### Issue: Tests Fail with Connection Errors

**Solution:**
1. Ensure backend is running: `curl http://localhost:3001/api/hotels`
2. Check `BACKEND_URL` in test config
3. Verify firewall/network settings

### Issue: Authentication Tests Fail

**Solution:**
1. Check test credentials in `tests/config/testsprite.yml`
2. Verify mock mode is enabled if using mock data
3. Ensure database migrations are run (if not using mock mode)
4. **Note:** Test credentials (`validUserPass123`, `validAdminPass123`, `AdminPass123`) จะทำงานได้ทั้งใน Mock Mode และ Production Mode (ผ่าน fallback logic)

### Issue: TestSprite CLI Not Found

**Solution:**
```bash
# Install globally
npm install -g @testsprite/cli

# Or use npx
npx @testsprite/cli run tests/
```

## 📚 Additional Resources

- [TestSprite Documentation](https://docs.testsprite.com)
- [MCP Integration Guide](https://docs.testsprite.com/mcp)
- [YAML Test Format Reference](https://docs.testsprite.com/guides/test-format)

## 💡 Tips

1. **Start Small**: Run individual test files first before running the full suite
2. **Use Mock Mode**: Enable `MOCK_MODE=true` for faster testing without database
3. **Check Logs**: Review test execution logs in TestSprite dashboard
4. **Incremental Testing**: Add tests as you develop new features

## 🎉 Next Steps

1. ✅ MCP configuration fixed
2. ✅ Test structure created
3. ✅ Initial test files added
4. ⏭️ Restart Cursor and verify TestSprite connection
5. ⏭️ Run your first test suite
6. ⏭️ Add more tests as needed

Happy Testing! 🚀
