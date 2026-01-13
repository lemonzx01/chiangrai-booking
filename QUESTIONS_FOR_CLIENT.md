# คำถามสำหรับลูกค้า - ระบบชำระเงิน

## 📋 สรุปสิ่งที่ทำไปแล้ว

✅ เพิ่ม PayPal ผ่าน Stripe Checkout  
✅ สร้างหน้า Checkout ในเว็บไซต์  
✅ รองรับหลายสกุลเงิน (THB, USD, EUR, JPY, CNY, GBP)  
✅ อัพเดท Booking Flow  

---

## ❓ คำถามที่ควรถามลูกค้า

### 1. การตั้งค่า Stripe Account

**คำถาม:**
- [ ] คุณมี Stripe Account แล้วหรือยัง? (ถ้ายัง ต้องสร้างใหม่)
- [ ] Stripe Account อยู่ในโหมด Test หรือ Live?
- [ ] คุณต้องการให้ enable PayPal ใน Stripe Dashboard หรือให้เราทำให้?
- [ ] คุณมี Stripe API Keys (Secret Key, Publishable Key) แล้วหรือยัง?

**สิ่งที่ต้องทำ:**
- Enable PayPal ใน Stripe Dashboard: Settings > Payment methods > PayPal
- ตั้งค่า Webhook endpoint: `/api/webhook/stripe`
- ตั้งค่า Environment Variables:
  ```
  STRIPE_SECRET_KEY=sk_test_... หรือ sk_live_...
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... หรือ pk_live_...
  STRIPE_WEBHOOK_SECRET=whsec_...
  ```

---

### 2. อัตราแลกเปลี่ยน (Exchange Rate)

**คำถาม:**
- [ ] คุณต้องการใช้ API อัตราแลกเปลี่ยนจริงหรือใช้ค่า hardcoded?
- [ ] ถ้าใช้ API คุณมี API Key สำหรับ exchangerate-api.com หรือ fixer.io หรือไม่?
- [ ] คุณต้องการให้อัพเดทอัตราแลกเปลี่ยนบ่อยแค่ไหน? (ตอนนี้ตั้งไว้ทุก 1 ชั่วโมง)

**สิ่งที่ต้องทำ:**
- ถ้าใช้ API จริง: ตั้งค่า `EXCHANGE_RATE_API_KEY` ใน environment variables
- ถ้าไม่ใช้ API: ใช้ค่า hardcoded ที่มีอยู่ (อาจจะไม่แม่นยำ)

---

### 3. สกุลเงินที่รองรับ

**คำถาม:**
- [ ] คุณต้องการให้รองรับสกุลเงินอะไรบ้าง? (ตอนนี้มี: THB, USD, EUR, JPY, CNY, GBP)
- [ ] คุณต้องการให้แสดงราคาในสกุลเงินอะไรเป็นค่าเริ่มต้น?
- [ ] คุณต้องการให้ลูกค้าเลือกสกุลเงินได้หรือแสดงตามประเทศของลูกค้า?

**สิ่งที่ต้องทำ:**
- เพิ่ม/ลบสกุลเงินตามที่ต้องการ
- ตั้งค่า default currency

---

### 4. Payment Methods

**คำถาม:**
- [ ] คุณต้องการให้แสดง payment methods อะไรบ้าง? (ตอนนี้มี: Credit Card, PayPal, PromptPay)
- [ ] คุณต้องการเพิ่ม payment methods อื่นๆ เช่น:
  - [ ] TrueMoney Wallet
  - [ ] Rabbit LINE Pay
  - [ ] Alipay (สำหรับลูกค้าจีน)
  - [ ] WeChat Pay (สำหรับลูกค้าจีน)
  - [ ] Apple Pay / Google Pay
- [ ] คุณต้องการให้แสดง payment methods ทั้งหมดหรือเลือกตามประเทศ?

**สิ่งที่ต้องทำ:**
- เพิ่ม payment methods ใน Stripe Dashboard
- อัพเดท `payment_method_types` ใน checkout route

---

### 5. Error Handling & Edge Cases

**คำถาม:**
- [ ] ถ้าชำระเงินไม่สำเร็จ คุณต้องการให้ทำอะไร?
  - [ ] แสดง error message และให้ลองใหม่?
  - [ ] ส่งอีเมลแจ้งเตือน?
  - [ ] แจ้งเตือนผ่าน LINE?
- [ ] ถ้า Stripe API ล้มเหลว คุณต้องการให้ทำอะไร?
- [ ] ถ้าอัตราแลกเปลี่ยน API ล้มเหลว คุณต้องการให้ทำอะไร? (ใช้ค่า fallback หรือแสดง error?)

**สิ่งที่ต้องทำ:**
- เพิ่ม error handling ที่ครอบคลุม
- เพิ่ม retry mechanism
- เพิ่ม fallback options

---

### 6. Testing & Quality Assurance

**คำถาม:**
- [ ] คุณต้องการให้ทดสอบ payment flow ด้วย Stripe Test Mode หรือไม่?
- [ ] คุณต้องการให้สร้าง test cases หรือไม่?
- [ ] คุณต้องการให้ทดสอบกับ payment methods ทั้งหมดหรือไม่?

**สิ่งที่ต้องทำ:**
- สร้าง test cases สำหรับ payment flow
- ทดสอบกับ Stripe Test Mode
- ทดสอบ edge cases

---

### 7. Admin Features

**คำถาม:**
- [ ] คุณต้องการให้ Admin ดู payment history ได้หรือไม่?
- [ ] คุณต้องการให้ Admin จัดการ refund ได้หรือไม่?
- [ ] คุณต้องการให้ Admin ดูรายงานการชำระเงิน (reports/analytics) ได้หรือไม่?
- [ ] คุณต้องการให้ Admin ดู payment methods ที่ใช้บ่อยได้หรือไม่?

**สิ่งที่ต้องทำ:**
- สร้างหน้า Admin สำหรับดู payment history
- สร้างระบบ refund (ถ้าต้องการ)
- สร้างหน้า reports/analytics

---

### 8. User Experience

**คำถาม:**
- [ ] คุณต้องการให้แสดง loading state ขณะกำลังสร้าง checkout session หรือไม่?
- [ ] คุณต้องการให้แสดงข้อความยืนยันก่อน redirect ไป Stripe หรือไม่?
- [ ] คุณต้องการให้แสดง payment methods เป็น icons หรือ text?
- [ ] คุณต้องการให้แสดงราคาในสกุลเงินที่เลือกในหน้า checkout หรือไม่?

**สิ่งที่ต้องทำ:**
- ปรับปรุง UI/UX ตามที่ต้องการ
- เพิ่ม loading states
- เพิ่ม confirmation dialogs

---

### 9. Security & Compliance

**คำถาม:**
- [ ] คุณต้องการให้เก็บ payment information ใน database หรือไม่? (ตอนนี้เก็บแค่ payment status)
- [ ] คุณต้องการให้ตรวจสอบ PCI DSS compliance หรือไม่?
- [ ] คุณต้องการให้ใช้ 3D Secure สำหรับบัตรเครดิตหรือไม่? (ตอนนี้ตั้งไว้เป็น automatic)

**สิ่งที่ต้องทำ:**
- ตรวจสอบ security best practices
- เพิ่ม security headers
- เพิ่ม rate limiting

---

### 10. Documentation

**คำถาม:**
- [ ] คุณต้องการให้สร้างเอกสารการใช้งานสำหรับ Admin หรือไม่?
- [ ] คุณต้องการให้สร้างเอกสาร API documentation หรือไม่?
- [ ] คุณต้องการให้สร้าง user guide สำหรับลูกค้าหรือไม่?

**สิ่งที่ต้องทำ:**
- สร้างเอกสารตามที่ต้องการ
- อัพเดท README.md
- สร้าง API documentation

---

### 11. Deployment & Environment

**คำถาม:**
- [ ] คุณต้องการ deploy ที่ไหน? (Vercel, AWS, etc.)
- [ ] คุณต้องการให้ตั้งค่า environment variables ให้หรือไม่?
- [ ] คุณต้องการให้ตั้งค่า Stripe Webhook endpoint ให้หรือไม่?

**สิ่งที่ต้องทำ:**
- ตั้งค่า deployment
- ตั้งค่า environment variables
- ตั้งค่า Stripe Webhook

---

### 12. Monitoring & Logging

**คำถาม:**
- [ ] คุณต้องการให้ log payment transactions หรือไม่?
- [ ] คุณต้องการให้ส่ง notification เมื่อมี payment สำเร็จ/ล้มเหลวหรือไม่?
- [ ] คุณต้องการให้ใช้ monitoring service (เช่น Sentry) หรือไม่?

**สิ่งที่ต้องทำ:**
- เพิ่ม logging
- เพิ่ม monitoring
- เพิ่ม alerting

---

## 🎯 สรุปสิ่งที่ควรถามเป็นอันดับแรก

1. **Stripe Account Setup** - มี account แล้วหรือยัง? มี API keys หรือยัง?
2. **Payment Methods** - ต้องการ payment methods อะไรบ้าง?
3. **Exchange Rate** - ต้องการใช้ API จริงหรือใช้ค่า hardcoded?
4. **Admin Features** - ต้องการให้ Admin จัดการ payment ได้หรือไม่?
5. **Testing** - ต้องการให้ทดสอบ payment flow หรือไม่?

---

## 📝 หมายเหตุ

- ตอนนี้ระบบทำงานได้แล้ว แต่ยังต้องตั้งค่า Stripe Account และ Environment Variables
- ควรทดสอบ payment flow ด้วย Stripe Test Mode ก่อน deploy production
- ควรเพิ่ม error handling และ edge cases ให้ครอบคลุมมากขึ้น
