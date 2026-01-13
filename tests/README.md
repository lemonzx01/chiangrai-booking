# Testing Guide

## Overview

Test files สำหรับ payment system และ features อื่นๆ

## Setup Testing Framework

### Option 1: Jest (Recommended)

```bash
# Install Jest
npm install --save-dev jest @types/jest ts-jest

# Install testing utilities
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

### Option 2: Vitest

```bash
# Install Vitest
npm install --save-dev vitest @vitest/ui
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test payment-flow.test.ts
```

## Test Files

- `payment-flow.test.ts` - Payment flow integration tests

## Test Coverage

- Payment flow end-to-end
- Error handling
- Currency conversion
- Webhook handling
- Rate limiting
- Security measures

## Notes

- ใช้ Stripe Test Mode สำหรับทดสอบ
- Mock external dependencies (Stripe, Database)
- ใช้ test data ที่ไม่กระทบ production
