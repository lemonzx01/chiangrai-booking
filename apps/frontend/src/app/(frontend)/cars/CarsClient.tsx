/**
 * ============================================================
 * Cars Client - หน้ารายการรถเช่า (Client Component)
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - แสดงรายการรถเช่าพร้อมระบบค้นหา
 *   - รองรับการค้นหาตามชื่อและประเภทรถ
 *   - รองรับการเปลี่ยนภาษา (Thai/English)
 *
 * Features:
 *   - Search Box ค้นหาตามชื่อ/ประเภท
 *   - Car Cards แสดงผลแบบ Grid
 *   - ปุ่ม Clear Search
 *   - Empty State เมื่อไม่พบผลลัพธ์
 *
 * การใช้งาน:
 *   <CarsClient cars={carsArray} />
 *
 * ============================================================
 */

'use client'

// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** React hooks สำหรับจัดการ state */
import { useState } from 'react'

/** i18next hook สำหรับ localization */
import { useTranslation } from 'react-i18next'

/** Type definition สำหรับข้อมูลรถ */
import { Car } from '@chiangrai/shared/types'

/** Car Card component สำหรับแสดงข้อมูลรถแต่ละคัน */
import CarCard from '@/components/cards/CarCard'

/** Lucide icons สำหรับ UI */
import { Search } from 'lucide-react'

// ============================================================
// Type Definitions
// ============================================================

/**
 * Props interface สำหรับ CarsClient
 *
 * @property {Car[]} cars - รายการรถที่จะแสดง
 */
interface CarsClientProps {
  cars: Car[]
}

// ============================================================
// Main Component
// ============================================================

/**
 * Client Component สำหรับแสดงรายการรถเช่า
 *
 * @description
 *   Component หลักที่แสดงรายการรถพร้อมระบบค้นหา
 *   รับข้อมูลรถจาก Server Component และจัดการ filtering
 *
 *   โครงสร้าง UI:
 *   - Header พร้อม title และ subtitle (Gradient)
 *   - Search Box
 *   - Results Count และ Clear Search
 *   - Cars Grid (3 columns on desktop)
 *   - Empty State เมื่อไม่พบผลลัพธ์
 *
 * @param {CarsClientProps} props - Props ที่มีรายการรถ
 * @returns {JSX.Element} Cars listing UI
 *
 * @example
 *   <CarsClient cars={carsArray} />
 */
export default function CarsClient({ cars }: CarsClientProps) {
  // ----------------------------------------------------------
  // Hooks
  // ----------------------------------------------------------
  /** Hook สำหรับ translation */
  const { t } = useTranslation()

  /** State สำหรับคำค้นหา */
  const [searchTerm, setSearchTerm] = useState('')

  // ----------------------------------------------------------
  // Filter Cars
  // ----------------------------------------------------------
  /**
   * กรองรถตามคำค้นหา
   *
   * ค้นหาใน:
   * - ชื่อรถ (ไทย/อังกฤษ)
   * - ประเภทรถ (ไทย/อังกฤษ)
   */
  const filteredCars = cars.filter((car) => {
    const matchesSearch =
      car.name_th.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.car_type_th.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.car_type_en.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  // ----------------------------------------------------------
  // Render Component
  // ----------------------------------------------------------
  return (
    <div className="min-h-screen pt-24 pb-12">
      {/* ============================================================
          Header Section - Gradient Background (สีเทาเข้ม)
          ============================================================ */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            {t('navbar.cars')}
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-white/80">
            {t('cars.subtitle') || 'รถเช่าพรีเมียมพร้อมบริการคนขับมืออาชีพ'}
          </p>
        </div>
      </div>

      {/* ============================================================
          Main Content
          ============================================================ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8">
        {/* ============================================================
            Search Box
            ============================================================ */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all border-2 border-transparent focus-within:border-indigo-500 focus-within:bg-white">
            {/* Search Icon */}
            <Search className="text-slate-400 flex-shrink-0" size={18} />

            {/* Search Input */}
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent outline-none border-none text-sm sm:text-base text-slate-800 font-medium placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* ============================================================
            Results Count และ Clear Search
            ============================================================ */}
        <div className="flex items-center justify-between mb-6">
          {/* จำนวนผลลัพธ์ */}
          <p className="text-slate-600 font-medium">
            {t('common.found')} <span className="text-indigo-600 font-semibold">{filteredCars.length}</span> {t('common.cars')}
          </p>

          {/* ปุ่ม Clear Search - แสดงเมื่อมีคำค้นหา */}
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-sm text-slate-500 hover:text-indigo-600 font-medium transition-colors"
            >
              {t('common.clearSearch')} ✕
            </button>
          )}
        </div>

        {/* ============================================================
            Cars Grid หรือ Empty State
            ============================================================ */}
        {filteredCars.length > 0 ? (
          // Cars Grid - 1 column mobile, 2 tablet, 3 desktop
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {filteredCars.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        ) : (
          // Empty State - เมื่อไม่พบผลลัพธ์
          <div className="text-center py-16">
            <p className="text-slate-500 text-lg">{t('cars.noResults') || 'ไม่พบรถที่ตรงกับเงื่อนไข'}</p>
          </div>
        )}
      </div>
    </div>
  )
}
