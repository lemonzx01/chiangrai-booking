/**
 * ============================================================
 * ImageUpload Component - อัพโหลดรูปภาพ
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - อัพโหลดรูปภาพไปยัง server
 *   - แสดง preview ก่อนอัพโหลด
 *   - ตรวจสอบประเภทและขนาดไฟล์
 *
 * คุณสมบัติ:
 *   - รองรับไฟล์: JPEG, PNG, WEBP, GIF
 *   - จำกัดขนาดไฟล์ได้ (ค่าเริ่มต้น 5MB)
 *   - แสดง loading state ขณะอัพโหลด
 *   - แสดง error message เมื่อเกิดปัญหา
 *
 * ============================================================
 */

'use client'

// ============================================================
// Imports
// ============================================================

import { useState, useRef } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import Button from './Button'

// ============================================================
// Types (ประกาศ Types)
// ============================================================

/**
 * Props สำหรับ ImageUpload component
 */
interface ImageUploadProps {
  /** Callback เมื่ออัพโหลดสำเร็จ (ส่ง URL กลับ) */
  onUpload: (url: string) => void
  /** ขนาดไฟล์สูงสุด (MB) */
  maxSize?: number
  /** MIME types ที่ยอมรับ */
  accept?: string
  /** CSS class เพิ่มเติม */
  className?: string
}

// ============================================================
// Component Definition
// ============================================================

/**
 * ImageUpload component
 *
 * @description Component สำหรับอัพโหลดรูปภาพ
 *              ตรวจสอบประเภทและขนาดไฟล์อัตโนมัติ
 *              แสดง preview และ loading state
 *
 * @param props - ImageUploadProps
 * @returns ImageUpload component
 *
 * @example
 * <ImageUpload
 *   onUpload={(url) => setImageUrl(url)}
 *   maxSize={5}
 * />
 */
export default function ImageUpload({
  onUpload,
  maxSize = 5,
  accept = 'image/jpeg,image/jpg,image/png,image/webp,image/gif',
  className = '',
}: ImageUploadProps) {
  // ----------------------------------------------------------
  // State
  // ----------------------------------------------------------

  /** สถานะกำลังอัพโหลด */
  const [uploading, setUploading] = useState(false)

  /** ข้อความ error (ถ้ามี) */
  const [error, setError] = useState('')

  /** URL ของ preview image */
  const [preview, setPreview] = useState<string | null>(null)

  // ----------------------------------------------------------
  // Refs
  // ----------------------------------------------------------

  /** Ref สำหรับ hidden file input */
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ----------------------------------------------------------
  // Handlers (ฟังก์ชันจัดการ Events)
  // ----------------------------------------------------------

  /**
   * จัดการเมื่อเลือกไฟล์
   *
   * ขั้นตอน:
   * 1. ตรวจสอบประเภทไฟล์
   * 2. ตรวจสอบขนาดไฟล์
   * 3. แสดง preview
   * 4. อัพโหลดไปยัง server
   * 5. เรียก onUpload callback
   */
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    setUploading(true)

    // ตรวจสอบประเภทไฟล์
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      setError('ประเภทไฟล์ไม่ถูกต้อง อนุญาตเฉพาะ JPEG, PNG, WEBP, GIF')
      setUploading(false)
      return
    }

    // ตรวจสอบขนาดไฟล์
    const maxSizeBytes = maxSize * 1024 * 1024
    if (file.size > maxSizeBytes) {
      setError(`ขนาดไฟล์ใหญ่เกินไป ขนาดสูงสุด ${maxSize}MB`)
      setUploading(false)
      return
    }

    // แสดง preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    try {
      // อัพโหลดไฟล์ไปยัง server
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'ไม่สามารถอัพโหลดรูปภาพได้')
      }

      // เรียก callback พร้อม URL
      onUpload(data.url)
      setPreview(null)
      setError('')

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการอัพโหลด')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  /**
   * เปิด file picker
   */
  const handleClick = () => {
    fileInputRef.current?.click()
  }

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------

  return (
    <div className={className}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      <div className="flex flex-col items-center justify-center w-full">
        {/* Preview รูปภาพ */}
        {preview && (
          <div className="relative mb-4 w-full max-w-xs">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-xl border-2 border-indigo-200"
            />
            {/* Loading overlay */}
            {uploading && (
              <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </div>
        )}

        {/* ปุ่มเลือกไฟล์ */}
        <Button
          type="button"
          onClick={handleClick}
          disabled={uploading}
          variant="outline"
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              กำลังอัพโหลด...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              เลือกรูปภาพ (สูงสุด {maxSize}MB)
            </>
          )}
        </Button>

        {/* ข้อความ Error */}
        {error && (
          <p className="mt-2 text-sm text-red-600 text-center">{error}</p>
        )}

        {/* ข้อความแนะนำ */}
        <p className="mt-2 text-xs text-slate-500 text-center">
          รองรับไฟล์: JPEG, PNG, WEBP, GIF
        </p>
      </div>
    </div>
  )
}










