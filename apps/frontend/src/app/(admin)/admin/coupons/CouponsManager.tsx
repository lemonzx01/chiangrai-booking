'use client'

/**
 * ============================================================
 * Coupons Manager — list, create, edit, delete
 * ============================================================
 */

import { useState } from 'react'
import { Plus, Edit, Trash2, X, Check, CircleOff } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/components/shared/Toast'
import { useConfirm } from '@/components/shared/ConfirmDialog'
import type { Coupon } from './page'

interface FormState {
  code: string
  description: string
  discount_type: 'PERCENT' | 'FIXED'
  discount_value: string
  min_spend: string
  max_discount: string
  applies_to: 'ALL' | 'HOTEL' | 'CAR'
  starts_at: string
  expires_at: string
  is_active: boolean
}

const EMPTY_FORM: FormState = {
  code: '',
  description: '',
  discount_type: 'PERCENT',
  discount_value: '',
  min_spend: '0',
  max_discount: '',
  applies_to: 'ALL',
  starts_at: '',
  expires_at: '',
  is_active: true,
}

function couponToForm(c: Coupon): FormState {
  const iso = (s: string | null) => (s ? s.slice(0, 16) : '')
  return {
    code: c.code,
    description: c.description || '',
    discount_type: c.discount_type,
    discount_value: String(c.discount_value),
    min_spend: String(c.min_spend),
    max_discount: c.max_discount == null ? '' : String(c.max_discount),
    applies_to: c.applies_to,
    starts_at: iso(c.starts_at),
    expires_at: iso(c.expires_at),
    is_active: c.is_active,
  }
}

function formToPayload(f: FormState) {
  const toNumber = (s: string) => (s === '' ? undefined : Number(s))
  return {
    code: f.code.trim(),
    description: f.description.trim() || null,
    discount_type: f.discount_type,
    discount_value: Number(f.discount_value),
    min_spend: Number(f.min_spend || 0),
    max_discount: toNumber(f.max_discount) ?? null,
    applies_to: f.applies_to,
    starts_at: f.starts_at ? new Date(f.starts_at).toISOString() : null,
    expires_at: f.expires_at ? new Date(f.expires_at).toISOString() : null,
    is_active: f.is_active,
  }
}

export default function CouponsManager({
  initialCoupons,
}: {
  initialCoupons: Coupon[]
}) {
  const toast = useToast()
  const confirm = useConfirm()
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons)
  const [editing, setEditing] = useState<Coupon | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError(null)
    setShowForm(true)
  }

  function openEdit(c: Coupon) {
    setEditing(c)
    setForm(couponToForm(c))
    setError(null)
    setShowForm(true)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const payload = formToPayload(form)
      const url = editing
        ? `/api/admin/coupons/${editing.id}`
        : '/api/admin/coupons'
      const method = editing ? 'PATCH' : 'POST'

      const res = await apiFetch(url, { method, body: payload })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(
          data?.error?.message || data?.error || 'บันทึกไม่สำเร็จ'
        )
      }

      const saved: Coupon = data.coupon
      if (editing) {
        setCoupons((prev) => prev.map((c) => (c.id === saved.id ? saved : c)))
      } else {
        setCoupons((prev) => [saved, ...prev])
      }
      setShowForm(false)
      setEditing(null)
      setForm(EMPTY_FORM)
    } catch (err: any) {
      setError(err.message || 'บันทึกไม่สำเร็จ')
    } finally {
      setSubmitting(false)
    }
  }

  async function remove(c: Coupon) {
    const ok = await confirm({
      title: `ลบคูปอง "${c.code}"?`,
      body: 'ลูกค้าจะไม่สามารถใช้โค้ดนี้ได้อีก',
      confirmLabel: 'ลบคูปอง',
      variant: 'danger',
    })
    if (!ok) return
    try {
      const res = await apiFetch(`/api/admin/coupons/${c.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(
          data?.error?.message || data?.error || 'ลบคูปองไม่สำเร็จ'
        )
      }
      setCoupons((prev) => prev.filter((x) => x.id !== c.id))
      toast.success(`ลบคูปอง ${c.code} สำเร็จ`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'ลบคูปองไม่สำเร็จ')
    }
  }

  async function toggleActive(c: Coupon) {
    try {
      const res = await apiFetch(`/api/admin/coupons/${c.id}`, {
        method: 'PATCH',
        body: { is_active: !c.is_active },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error?.message || 'อัปเดตไม่สำเร็จ')
      setCoupons((prev) => prev.map((x) => (x.id === c.id ? data.coupon : x)))
      toast.success(c.is_active ? 'ปิดใช้งานคูปองแล้ว' : 'เปิดใช้งานคูปองแล้ว')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'อัปเดตไม่สำเร็จ')
    }
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
        >
          <Plus size={20} />
          เพิ่มคูปอง
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">โค้ด</th>
                <th className="px-4 py-3 font-semibold">ส่วนลด</th>
                <th className="px-4 py-3 font-semibold">ใช้กับ</th>
                <th className="px-4 py-3 font-semibold">ขั้นต่ำ</th>
                <th className="px-4 py-3 font-semibold">วันหมดอายุ</th>
                <th className="px-4 py-3 font-semibold">สถานะ</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    ยังไม่มีคูปอง
                  </td>
                </tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                      {c.code}
                      {c.description && (
                        <div className="text-xs text-slate-400 font-sans font-normal mt-1">
                          {c.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {c.discount_type === 'PERCENT'
                        ? `${c.discount_value}%`
                        : `฿${c.discount_value.toLocaleString()}`}
                      {c.max_discount && (
                        <div className="text-xs text-slate-400">
                          สูงสุด ฿{c.max_discount.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                        {c.applies_to}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      ฿{c.min_spend.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {c.expires_at
                        ? new Date(c.expires_at).toLocaleDateString('th-TH')
                        : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(c)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                          c.is_active
                            ? 'bg-green-50 text-green-700 hover:bg-green-100'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {c.is_active ? <Check size={14} /> : <CircleOff size={14} />}
                        {c.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <button
                          onClick={() => openEdit(c)}
                          className="p-2 rounded-md text-slate-500 hover:bg-slate-100"
                          title="แก้ไข"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => remove(c)}
                          className="p-2 rounded-md text-red-500 hover:bg-red-50"
                          title="ลบ"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">
                {editing ? 'แก้ไขคูปอง' : 'สร้างคูปองใหม่'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-1 rounded-md hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={submit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  โค้ดคูปอง <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value.toUpperCase() })
                  }
                  required
                  placeholder="SUMMER2026"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  คำอธิบาย
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="ส่วนลดต้อนรับฤดูร้อน"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    ประเภทส่วนลด
                  </label>
                  <select
                    value={form.discount_type}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        discount_type: e.target.value as 'PERCENT' | 'FIXED',
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                  >
                    <option value="PERCENT">เปอร์เซ็นต์ (%)</option>
                    <option value="FIXED">จำนวนเงิน (฿)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    มูลค่า <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.discount_value}
                    onChange={(e) =>
                      setForm({ ...form, discount_value: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    ยอดขั้นต่ำ (฿)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.min_spend}
                    onChange={(e) =>
                      setForm({ ...form, min_spend: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    ส่วนลดสูงสุด (฿)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.max_discount}
                    onChange={(e) =>
                      setForm({ ...form, max_discount: e.target.value })
                    }
                    placeholder="ไม่จำกัด"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  ใช้กับ
                </label>
                <select
                  value={form.applies_to}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      applies_to: e.target.value as 'ALL' | 'HOTEL' | 'CAR',
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                >
                  <option value="ALL">ทุกประเภท</option>
                  <option value="HOTEL">โรงแรมเท่านั้น</option>
                  <option value="CAR">รถเช่าเท่านั้น</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    วันเริ่มใช้งาน
                  </label>
                  <input
                    type="datetime-local"
                    value={form.starts_at}
                    onChange={(e) =>
                      setForm({ ...form, starts_at: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    วันหมดอายุ
                  </label>
                  <input
                    type="datetime-local"
                    value={form.expires_at}
                    onChange={(e) =>
                      setForm({ ...form, expires_at: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm({ ...form, is_active: e.target.checked })
                  }
                  className="h-4 w-4 text-slate-900 rounded border-slate-300 focus:ring-slate-400"
                />
                <span className="text-sm font-medium text-slate-700">
                  เปิดใช้งานคูปองนี้
                </span>
              </label>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 disabled:opacity-60"
                >
                  {submitting ? 'กำลังบันทึก...' : editing ? 'บันทึก' : 'สร้างคูปอง'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
