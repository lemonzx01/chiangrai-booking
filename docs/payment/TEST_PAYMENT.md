# 🧪 วิธีทดสอบระบบจ่ายเงินและ Login

> **⚠️ สำคัญ:** ก่อนทดสอบระบบ Multi-vendor ต้องรัน Database Migrations ก่อน!
> 
> ดูคู่มือ: [`DATABASE_MIGRATION.md`](./DATABASE_MIGRATION.md)

---

## 🔐 วิธีทดสอบ Login

### Mock Users สำหรับทดสอบ:

#### 1. Admin
- **Email:** `admin@gotjourneythailand.com`
- **Password:** `admin123`
- **Role:** Admin
- **URL:** `http://localhost:3000/login`
- **หลัง Login:** จะ redirect ไป `/admin/dashboard`

#### 2. Partner โรงแรม
- **Email:** `hotel@example.com`
- **Password:** `user123`
- **Role:** Partner (โรงแรม)
- **URL:** `http://localhost:3000/login`
- **หลัง Login:** จะ redirect ไป `/partner/dashboard`
- **ข้อมูล:** เป็นเจ้าของโรงแรมบางแห่ง (mock-hotel-1)

#### 3. Partner คนขับรถ
- **Email:** `driver@example.com`
- **Password:** `user123`
- **Role:** Partner (คนขับรถ)
- **URL:** `http://localhost:3000/login`
- **หลัง Login:** จะ redirect ไป `/partner/dashboard`
- **ข้อมูล:** เป็นเจ้าของรถบางคัน (mock-car-1)

#### 4. Partner ทั่วไป
- **Email:** `partner@example.com`
- **Password:** `user123`
- **Role:** Partner
- **URL:** `http://localhost:3000/login`
- **หลัง Login:** จะ redirect ไป `/partner/dashboard`

#### 5. User ธรรมดา
- **Email:** `user@example.com`
- **Password:** `user123`
- **Role:** User
- **URL:** `http://localhost:3000/login`
- **หลัง Login:** จะ redirect ไป `/profile`

### หมายเหตุ:
- ใช้ **NextAuth** สำหรับ login (Google OAuth หรือ Email/Password)
- ใน Mock Mode ไม่ต้องยืนยัน email
- Password สำหรับทุก user (ยกเว้น admin) คือ `user123`

---

## 💳 วิธีทดสอบระบบจ่ายเงิน

## วิธีที่ 1: ใช้ Mock Booking Code (ง่ายที่สุด)

### ขั้นตอน:
1. เปิดเบราว์เซอร์ไปที่:
   ```
   http://localhost:3000001/checkout?booking_code=BK-CHECKOUT-
   ```
   หรือ
   ```
   http://localhost:3000/checkout?booking_code=BK-CHECKOUT-002
   ```

2. Mock Booking Codes ที่มีอยู่:
   - `BK-CHECKOUT-001` - Hotel booking
   - `BK-CHECKOUT-002` - Car booking

## วิธีที่ 2: สร้าง Booking ใหม่

### ขั้นตอน:
1. ไปที่หน้า booking: `http://localhost:3000/booking`
2. เลือก Hotel หรือ Car
3. กรอกข้อมูลการจอง
4. กด "จองเลย"
5. ระบบจะ redirect ไปหน้า checkout อัตโนมัติ

## วิธีที่ 3: ใช้ Mock Booking อื่นๆ

Mock bookings ที่มีอยู่ (booking_code จะถูก generate อัตโนมัติ):
- Hotel booking #1
- Car booking #1
- Hotel booking #2
- Combo booking

**หมายเหตุ:** Mock booking codes จะถูก generate อัตโนมัติ ดังนั้นต้องดูจาก console หรือ API response

## 🔍 ตรวจสอบ Mock Bookings

### ผ่าน API:
```bash
# ดึงรายการ bookings ทั้งหมด
GET http://localhost:3001/api/bookings

# ดึง booking ตาม code (ไม่ต้อง email ใน mock mode)
GET http://localhost:3001/api/bookings/BK-CHECKOUT-001
```

## ⚠️ หมายเหตุ

- ใน **Mock Mode** ไม่ต้องยืนยัน email เพื่อให้ทดสอบได้ง่าย
- ใน **Production Mode** ต้องยืนยัน email หรือ login ก่อน
- ระบบจะใช้ Stripe Test Mode สำหรับการทดสอบ

## 🧪 Test Payment Flow

1. เปิดหน้า checkout ด้วย booking_code
2. ตรวจสอบว่าข้อมูลการจองแสดงถูกต้อง
3. กด "Pay Now"
4. จะ redirect ไป Stripe Checkout
5. ใช้ test card: `4242 4242 4242 4242`
6. ใช้ expiry date: วันที่ในอนาคต
7. ใช้ CVC: ตัวเลข 3 หลัก
8. หลังจากชำระเงินสำเร็จ จะ redirect กลับมาหน้า success
