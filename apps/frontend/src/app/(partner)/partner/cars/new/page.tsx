'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

import { Currency } from '@chiangrai/shared/types'
import { CURRENCY_OPTIONS } from '@chiangrai/shared/currency'

import PartnerSidebar from '@/components/partner/Sidebar'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import SelectDropdown from '@/components/ui/SelectDropdown'

interface FormState {
  name_th: string
  name_en: string
  description_th: string
  description_en: string
  car_type_th: string
  car_type_en: string
  max_passengers: number
  base_price_per_day: string
  currency: Currency
  driver_name: string
  driver_surname: string
  includes_th_text: string
  includes_en_text: string
  images_text: string
  is_active: boolean
}

const initialFormState: FormState = {
  name_th: '',
  name_en: '',
  description_th: '',
  description_en: '',
  car_type_th: '',
  car_type_en: '',
  max_passengers: 4,
  base_price_per_day: '',
  currency: Currency.THB,
  driver_name: '',
  driver_surname: '',
  includes_th_text: '',
  includes_en_text: '',
  images_text: '',
  is_active: true,
}

function parseTextList(input: string): string[] {
  return input
    .split(/\r?\n|,/g)
    .map((item) => item.trim())
    .filter(Boolean)
}

export default function NewPartnerCarPage() {
  const [formData, setFormData] = useState<FormState>(initialFormState)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const basePrice = Number(formData.base_price_per_day)

      if (!Number.isFinite(basePrice) || basePrice <= 0) {
        throw new Error('Please enter a valid price per day.')
      }

      const payload = {
        name_th: formData.name_th,
        name_en: formData.name_en,
        description_th: formData.description_th,
        description_en: formData.description_en,
        car_type_th: formData.car_type_th,
        car_type_en: formData.car_type_en,
        max_passengers: Number(formData.max_passengers),
        base_price_per_day: basePrice,
        price_per_day: basePrice,
        currency: formData.currency,
        driver_name: formData.driver_name || null,
        driver_surname: formData.driver_surname || null,
        includes_th: parseTextList(formData.includes_th_text),
        includes_en: parseTextList(formData.includes_en_text),
        images: parseTextList(formData.images_text),
        is_active: formData.is_active,
      }

      const response = await fetch('/api/cars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = (await response.json()) as { error?: string }
      if (!response.ok) {
        throw new Error(json.error || 'Unable to create car.')
      }

      window.location.href = '/partner/cars'
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Unable to create car.'
      setError(message)
      setLoading(false)
    }
  }

  return (
    <div className="flex">
      <PartnerSidebar />

      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <Link
              href="/partner/cars"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-4"
            >
              <ArrowLeft size={18} />
              Back to cars
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Add New Car</h1>
            <p className="text-sm text-slate-500 mt-1">Create a new car listing for your inventory.</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Name (TH) *"
                  value={formData.name_th}
                  onChange={(event) => setFormData((prev) => ({ ...prev, name_th: event.target.value }))}
                  required
                />
                <Input
                  label="Name (EN) *"
                  value={formData.name_en}
                  onChange={(event) => setFormData((prev) => ({ ...prev, name_en: event.target.value }))}
                  required
                />
                <Input
                  label="Type (TH) *"
                  value={formData.car_type_th}
                  onChange={(event) => setFormData((prev) => ({ ...prev, car_type_th: event.target.value }))}
                  required
                />
                <Input
                  label="Type (EN) *"
                  value={formData.car_type_en}
                  onChange={(event) => setFormData((prev) => ({ ...prev, car_type_en: event.target.value }))}
                  required
                />
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Description</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                    Description (TH) *
                  </label>
                  <textarea
                    value={formData.description_th}
                    onChange={(event) => setFormData((prev) => ({ ...prev, description_th: event.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none min-h-[110px]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                    Description (EN) *
                  </label>
                  <textarea
                    value={formData.description_en}
                    onChange={(event) => setFormData((prev) => ({ ...prev, description_en: event.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none min-h-[110px]"
                    required
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Pricing and Capacity</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                    Currency *
                  </label>
                  <SelectDropdown
                    options={CURRENCY_OPTIONS.map((item) => ({ value: item.value, label: item.label }))}
                    value={formData.currency}
                    onChange={(value) => setFormData((prev) => ({ ...prev, currency: value as Currency }))}
                  />
                </div>
                <Input
                  type="number"
                  label="Price per day *"
                  value={formData.base_price_per_day}
                  onChange={(event) => setFormData((prev) => ({ ...prev, base_price_per_day: event.target.value }))}
                  min="0"
                  step="0.01"
                  required
                />
                <Input
                  type="number"
                  label="Max passengers *"
                  value={formData.max_passengers}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      max_passengers: Math.max(1, Number(event.target.value) || 1),
                    }))
                  }
                  min="1"
                  required
                />
                <div className="flex items-end">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(event) => setFormData((prev) => ({ ...prev, is_active: event.target.checked }))}
                      className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    Active listing
                  </label>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Driver</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Driver first name"
                  value={formData.driver_name}
                  onChange={(event) => setFormData((prev) => ({ ...prev, driver_name: event.target.value }))}
                />
                <Input
                  label="Driver last name"
                  value={formData.driver_surname}
                  onChange={(event) => setFormData((prev) => ({ ...prev, driver_surname: event.target.value }))}
                />
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Includes and Images</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                    Includes (TH)
                  </label>
                  <textarea
                    value={formData.includes_th_text}
                    onChange={(event) => setFormData((prev) => ({ ...prev, includes_th_text: event.target.value }))}
                    placeholder="One item per line, or comma separated"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none min-h-[100px]"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                    Includes (EN)
                  </label>
                  <textarea
                    value={formData.includes_en_text}
                    onChange={(event) => setFormData((prev) => ({ ...prev, includes_en_text: event.target.value }))}
                    placeholder="One item per line, or comma separated"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none min-h-[100px]"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2">
                    Image URLs
                  </label>
                  <textarea
                    value={formData.images_text}
                    onChange={(event) => setFormData((prev) => ({ ...prev, images_text: event.target.value }))}
                    placeholder="One URL per line, or comma separated"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none min-h-[110px]"
                  />
                </div>
              </div>
            </section>

            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-2">
              <Link
                href="/partner/cars"
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </Link>
              <Button type="submit" loading={loading} className="inline-flex items-center gap-2">
                <Save size={16} />
                Create car
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
