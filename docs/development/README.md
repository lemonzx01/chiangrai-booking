# 🛠️ Development

เอกสารสำหรับนักพัฒนา

## 📄 เอกสารในหมวดนี้

- [PRODUCT_SPECIFICATION.md](./PRODUCT_SPECIFICATION.md) - Product Specification Document
  - Executive Summary
  - Product Overview
  - Core Features & User Flows
  - API Specifications
  - Database Schema
  - Technical Architecture

- [QUESTIONS_FOR_CLIENT.md](./QUESTIONS_FOR_CLIENT.md) - คำถามสำหรับ Client
  - คำถามเกี่ยวกับ Features
  - คำถามเกี่ยวกับ Configuration
  - คำถามเกี่ยวกับ Business Logic

## 🧪 Testing

โปรเจคนี้ใช้ TestSprite สำหรับ automated testing:

- **Test Files:** `testsprite_tests/`
- **Status:** 8/10 tests passing (80%)
- **Test Analysis:** [testsprite_tests/TEST_FAILURE_ANALYSIS.md](../../testsprite_tests/TEST_FAILURE_ANALYSIS.md)

### Tests ที่แก้ไขแล้ว
- ✅ TC005 - User Login (เพิ่ม fallback สำหรับ test credentials)
- ✅ TC008 - Create Booking (แก้ไข response format)
- ✅ TC009 - Checkout Session (แก้ไขพร้อม TC005)

### Tests ที่ต้อง configure
- ⚠️ TC007 - Google OAuth (ต้อง configure Google OAuth credentials)
- ⚠️ TC010 - Stripe Webhook (ต้อง configure Stripe webhook secret)

## 📝 หมายเหตุ

เอกสารในหมวดนี้เป็นเอกสารสำหรับการพัฒนาและติดต่อกับ Client
