/**
 * ============================================================
 * Upload API Route - อัพโหลดรูปภาพ
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - อัพโหลดไฟล์รูปภาพไปยัง Supabase Storage
 *   - ตรวจสอบประเภทและขนาดไฟล์
 *   - รองรับ Mock Mode สำหรับการทดสอบ
 *
 * Endpoint:
 *   - POST /api/upload - อัพโหลดรูปภาพ
 *
 * Request:
 *   - Content-Type: multipart/form-data
 *   - Body: { file: File }
 *
 * Response:
 *   - url: URL ของรูปภาพที่อัพโหลด
 *   - path: Path ของไฟล์ใน Storage
 *
 * Validations:
 *   - ประเภทไฟล์: JPEG, PNG, WEBP, GIF
 *   - ขนาดสูงสุด: 5MB
 *
 * ============================================================
 */

// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** Supabase Admin client สำหรับ Server-side */
import { createAdminClient } from '../../../lib/supabase/server'

/** Next.js Response utility */
import { NextResponse } from 'next/server'

// ============================================================
// Helper Functions
// ============================================================

/**
 * ตรวจสอบว่าอยู่ใน Mock Mode หรือไม่
 *
 * @description
 *   Mock Mode จะเปิดใช้งานเมื่อไม่ได้ตั้งค่า Supabase credentials
 *   หรือใช้ placeholder URL
 *
 * @returns {boolean} true ถ้าอยู่ใน Mock Mode
 */
const isMockMode = () => {
  return !(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'
  )
}

// ============================================================
// POST Handler - อัพโหลดรูปภาพ
// ============================================================

/**
 * อัพโหลดไฟล์รูปภาพ
 *
 * @description
 *   ขั้นตอนการทำงาน:
 *   1. ดึงไฟล์จาก FormData
 *   2. ตรวจสอบประเภทไฟล์ (JPEG, PNG, WEBP, GIF)
 *   3. ตรวจสอบขนาดไฟล์ (สูงสุด 5MB)
 *   4. Mock Mode: แปลงเป็น Base64 Data URL
 *   5. Production Mode: อัพโหลดไปยัง Supabase Storage
 *   6. ส่งกลับ URL ของรูปภาพ
 *
 * @param {Request} request - HTTP Request object (multipart/form-data)
 * @returns {Promise<NextResponse>} URL และ path ของรูปภาพ
 *
 * @example
 *   POST /api/upload
 *   Content-Type: multipart/form-data
 *   Body: FormData with "file" field
 *
 *   Response: {
 *     "url": "https://xxx.supabase.co/storage/v1/object/public/images/uploads/xxx.jpg",
 *     "path": "uploads/xxx.jpg"
 *   }
 */
export async function POST(request: Request) {
  try {
    // ดึง FormData จาก request
    const formData = await request.formData()
    const file = formData.get('file') as File

    // ----------------------------------------------------------
    // ตรวจสอบว่ามีไฟล์หรือไม่
    // ----------------------------------------------------------
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // ----------------------------------------------------------
    // ตรวจสอบประเภทไฟล์
    // ----------------------------------------------------------
    /** ประเภทไฟล์ที่อนุญาต */
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed.' },
        { status: 400 }
      )
    }

    // ----------------------------------------------------------
    // ตรวจสอบขนาดไฟล์
    // ----------------------------------------------------------
    /** ขนาดสูงสุด 5MB */
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    // ----------------------------------------------------------
    // Mock Mode: แปลงเป็น Base64 Data URL
    // ----------------------------------------------------------
    if (isMockMode()) {
      // แปลงไฟล์เป็น ArrayBuffer แล้วเป็น Base64
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const base64 = buffer.toString('base64')
      const dataUrl = `data:${file.type};base64,${base64}`

      return NextResponse.json({
        url: dataUrl,
        path: `mock/${Date.now()}-${file.name}`,
      })
    }

    // ----------------------------------------------------------
    // Production Mode: อัพโหลดไปยัง Supabase Storage
    // ----------------------------------------------------------
    const supabase = await createAdminClient()

    // สร้างชื่อไฟล์ที่ไม่ซ้ำ
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExt = file.name.split('.').pop()
    const fileName = `${timestamp}-${randomString}.${fileExt}`
    const filePath = `uploads/${fileName}`

    // แปลง File เป็น Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // อัพโหลดไปยัง Supabase Storage (bucket: images)
    const { error } = await supabase.storage
      .from('images')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false, // ไม่อนุญาตให้เขียนทับไฟล์เดิม
      })

    // ตรวจสอบ Error
    if (error) {
      console.error('Upload error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ----------------------------------------------------------
    // ดึง Public URL
    // ----------------------------------------------------------
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath)

    return NextResponse.json({
      url: urlData.publicUrl,
      path: filePath,
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload image' },
      { status: 500 }
    )
  }
}









