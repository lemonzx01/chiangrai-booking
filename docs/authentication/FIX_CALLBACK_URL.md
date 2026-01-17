# ⚠️ แก้ไข Callback URL ใน Google Cloud Console

## ❌ ปัญหา
คุณตั้งค่า Callback URL เป็น:
```
http://localhost:3000/api/auth/callback/google
```

## ✅ ต้องแก้เป็น
```
http://localhost:3001/api/auth/callback/google
```

## 🔧 วิธีแก้ไข

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. เลือก Project ของคุณ
3. ไปที่ **APIs & Services** > **Credentials**
4. คลิกที่ OAuth 2.0 Client ID ของคุณ
5. ในส่วน **Authorized redirect URIs**:
   - **ลบ**: `http://localhost:3000/api/auth/callback/google` ❌
   - **เพิ่ม**: `http://localhost:3001/api/auth/callback/google` ✅
6. คลิก **Save**
7. รอสักครู่ (Google อาจใช้เวลาในการอัพเดท)

## 📝 เหตุผล

- **Frontend** รันที่ port **3000** (แสดง UI)
- **Backend** รันที่ port **3001** (มี NextAuth API)
- NextAuth callback route อยู่ที่ backend: `/api/auth/callback/google`
- ดังนั้น Callback URL ต้องชี้ไปที่ backend (port 3001) ไม่ใช่ frontend (port 3000)

## ✅ หลังจากแก้ไข

1. Restart backend server
2. ทดสอบ Google Login อีกครั้ง
3. ควรจะทำงานได้ปกติแล้ว
