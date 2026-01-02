'use client'

import { useState, useRef } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import Button from './Button'

interface ImageUploadProps {
  onUpload: (url: string) => void
  maxSize?: number // in MB
  accept?: string
  className?: string
}

export default function ImageUpload({
  onUpload,
  maxSize = 5,
  accept = 'image/jpeg,image/jpg,image/png,image/webp,image/gif',
  className = '',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    setUploading(true)

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      setError('ประเภทไฟล์ไม่ถูกต้อง อนุญาตเฉพาะ JPEG, PNG, WEBP, GIF')
      setUploading(false)
      return
    }

    // Validate file size
    const maxSizeBytes = maxSize * 1024 * 1024
    if (file.size > maxSizeBytes) {
      setError(`ขนาดไฟล์ใหญ่เกินไป ขนาดสูงสุด ${maxSize}MB`)
      setUploading(false)
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    try {
      // Upload file
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

      // Call onUpload callback with the URL
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

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />
      
      <div className="flex flex-col items-center justify-center w-full">
        {preview && (
          <div className="relative mb-4 w-full max-w-xs">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-xl border-2 border-indigo-200"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </div>
        )}

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

        {error && (
          <p className="mt-2 text-sm text-red-600 text-center">{error}</p>
        )}

        <p className="mt-2 text-xs text-slate-500 text-center">
          รองรับไฟล์: JPEG, PNG, WEBP, GIF
        </p>
      </div>
    </div>
  )
}

