/**
 * Email preferences client — single toggle.
 *
 * Three render states based on initial server response:
 *   1. Token missing or invalid → friendly error + link home.
 *   2. Already unsubscribed → green confirmation + "subscribe
 *      again" toggle.
 *   3. Currently subscribed → form with reason field +
 *      "ยืนยันยกเลิก" button.
 *
 * Unlike most forms in the app, success here is "you got
 * what you asked for" — not "we did something to you". The
 * confirmation copy reflects that.
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  AlertCircle,
  Mail,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { apiFetch } from '@/lib/api'

interface Props {
  token: string
  initialEmail: string
  initialUnsubscribed: boolean
  tokenInvalid: boolean
}

export default function EmailPreferencesClient({
  token,
  initialEmail,
  initialUnsubscribed,
  tokenInvalid,
}: Props) {
  const [unsubscribed, setUnsubscribed] = useState(initialUnsubscribed)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const updatePreference = async (newState: boolean) => {
    setBusy(true)
    setError(null)
    try {
      const res = await apiFetch('/api/email-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          unsubscribed: newState,
          reason: newState ? reason.trim() || undefined : undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as { error?: string }).error || 'บันทึกไม่สำเร็จ')
        return
      }
      setUnsubscribed(newState)
      setShowConfirm(true)
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setBusy(false)
    }
  }

  // ---- State 1: Invalid token ----------------------------------
  if (tokenInvalid || !token || !initialEmail) {
    return (
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="text-amber-600" size={20} />
          </div>
          <h1 className="text-lg font-bold text-slate-900 mb-2">
            ลิงก์ไม่ถูกต้อง
          </h1>
          <p className="text-sm text-slate-600 mb-5">
            ลิงก์อาจถูกแก้ไขหรือหมดอายุ — หากต้องการยกเลิกรับอีเมล
            กรุณาตอบกลับอีเมลฉบับล่าสุดของเรา หรือติดต่อทีมงาน
          </p>
          <div className="flex justify-center gap-2">
            <Link
              href="/contact"
              className="text-sm font-semibold text-slate-900 hover:underline"
            >
              ติดต่อทีมงาน
            </Link>
            <Link href="/" className="text-sm font-semibold text-slate-500 hover:underline">
              กลับหน้าแรก
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ---- State 2: success confirmation (just changed) ------------
  if (showConfirm) {
    return (
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="text-emerald-600" size={24} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            {unsubscribed ? 'ยกเลิกการรับอีเมลเรียบร้อย' : 'ยืนยันการรับอีเมลแล้ว'}
          </h1>
          <p className="text-sm text-slate-600 mb-2">
            <strong>{initialEmail}</strong>
          </p>
          <p className="text-sm text-slate-500 mb-6">
            {unsubscribed
              ? 'คุณจะไม่ได้รับอีเมลโปรโมชันจากเราอีกต่อไป — อีเมลยืนยันการจองและแจ้งเตือนสำคัญยังจะส่งถึงตามปกติ'
              : 'คุณจะได้รับอีเมลข่าวสารและโปรโมชันจากเราเมื่อมีรายการใหม่'}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900 hover:underline"
          >
            กลับหน้าแรก
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    )
  }

  // ---- State 3: form -------------------------------------------
  return (
    <div className="max-w-md mx-auto px-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-2">
          <Mail size={18} className="text-slate-900" />
          <h1 className="text-lg font-bold text-slate-900">การรับอีเมล</h1>
        </div>
        <p className="text-sm text-slate-500 mb-5">
          อีเมล: <strong className="text-slate-900">{initialEmail}</strong>
        </p>

        {/* Currently subscribed → offer unsubscribe */}
        {!unsubscribed && (
          <>
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 mb-4 text-sm text-emerald-800">
              ขณะนี้คุณรับอีเมลโปรโมชันจากเราอยู่
            </div>
            <p className="text-sm text-slate-600 mb-4">
              หากไม่ต้องการรับอีเมลข่าวสารและโปรโมชันต่อไป กดยืนยันด้านล่าง
            </p>
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                เหตุผล (ไม่บังคับ — ช่วยให้เราพัฒนาได้ดีขึ้น)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="เช่น ได้รับอีเมลบ่อยเกินไป, เนื้อหาไม่ตรงความสนใจ..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-500 resize-none"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 mb-4"
              >
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={() => updatePreference(true)}
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 disabled:opacity-60"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : null}
              ยืนยันยกเลิกรับอีเมล
            </button>
            <p className="text-[11px] text-slate-400 text-center mt-3">
              อีเมลยืนยันการจอง / รหัสผ่าน / แจ้งเตือนสำคัญ ยังคงส่งถึงคุณตามปกติ
            </p>
          </>
        )}

        {/* Currently unsubscribed → offer re-subscribe */}
        {unsubscribed && (
          <>
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 mb-4 text-sm text-slate-600">
              ขณะนี้คุณไม่ได้รับอีเมลโปรโมชันจากเรา
            </div>
            <p className="text-sm text-slate-600 mb-4">
              หากเปลี่ยนใจอยากกลับมารับข่าวสารและโปรโมชัน กดยืนยันด้านล่าง
            </p>

            {error && (
              <div
                role="alert"
                className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 mb-4"
              >
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={() => updatePreference(false)}
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 disabled:opacity-60"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : null}
              กลับมารับอีเมลอีกครั้ง
            </button>
          </>
        )}
      </div>
    </div>
  )
}
