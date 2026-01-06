/**
 * ============================================================
 * Hotels Client - หน้ารายการโรงแรม (Client Component)
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - แสดงรายการโรงแรมพร้อมระบบกรอง
 *   - รองรับการค้นหาตามชื่อและสถานที่
 *   - กรองตามช่วงราคา
 *   - รองรับการเปลี่ยนภาษา (Thai/English)
 *
 * Features:
 *   - Search Box ค้นหาตามชื่อ/สถานที่
 *   - Location Dropdown กรองตามทำเล
 *   - Price Range Dropdown กรองตามราคา
 *   - Hotel Cards แสดงผลแบบ Grid
 *   - ปุ่ม Clear Filters
 *
 * Components ภายใน:
 *   - CustomDropdown: Dropdown component ที่ใช้ซ้ำได้
 *
 * การใช้งาน:
 *   <HotelsClient hotels={hotelsArray} />
 *
 * ============================================================
 */

'use client'

// ============================================================
// การนำเข้า Dependencies
// ============================================================

/** React hooks สำหรับจัดการ state และ effects */
import { useState, useRef, useEffect } from 'react'

/** i18next hook สำหรับ localization */
import { useTranslation } from 'react-i18next'

/** Type definition สำหรับข้อมูลโรงแรม */
import { Hotel } from '@chiangrai/shared/types'

/** Hotel Card component สำหรับแสดงข้อมูลโรงแรมแต่ละแห่ง */
import HotelCard from '@/components/cards/HotelCard'

/** Lucide icons สำหรับ UI */
import { Search, MapPin, Banknote, ChevronDown, Check, LucideIcon } from 'lucide-react'

// ============================================================
// Type Definitions
// ============================================================

/**
 * Props interface สำหรับ HotelsClient
 *
 * @property {Hotel[]} hotels - รายการโรงแรมที่จะแสดง
 */
interface HotelsClientProps {
  hotels: Hotel[]
}

/**
 * Interface สำหรับตัวเลือกใน Dropdown
 *
 * @property {string} value - ค่าที่จะใช้ในการกรอง
 * @property {string} label - ข้อความที่แสดงให้ผู้ใช้เห็น
 */
interface DropdownOption {
  value: string
  label: string
}

// ============================================================
// Custom Dropdown Component
// ============================================================

/**
 * Custom Dropdown Component
 *
 * @description
 *   Dropdown component ที่สร้างขึ้นเองเพื่อความสวยงาม
 *   รองรับ icons, keyboard navigation, และ outside click
 *
 *   Features:
 *   - แสดง icon ด้านหน้า
 *   - Animation เมื่อเปิด/ปิด
 *   - Highlight ตัวเลือกที่เลือกอยู่
 *   - ปิดเมื่อ click นอก dropdown
 *
 * @param {Object} props - Component props
 * @param {DropdownOption[]} props.options - รายการตัวเลือก
 * @param {string} props.value - ค่าที่เลือกอยู่ปัจจุบัน
 * @param {Function} props.onChange - Callback เมื่อเปลี่ยนค่า
 * @param {string} props.placeholder - ข้อความเมื่อยังไม่ได้เลือก
 * @param {LucideIcon} props.icon - Icon ที่แสดงด้านหน้า
 *
 * @returns {JSX.Element} Dropdown UI
 */
function CustomDropdown({
  options,
  value,
  onChange,
  placeholder,
  icon: Icon
}: {
  options: DropdownOption[]
  value: string
  onChange: (value: string) => void
  placeholder: string
  icon: LucideIcon
}) {
  // ----------------------------------------------------------
  // State และ Refs
  // ----------------------------------------------------------
  /** State สำหรับเปิด/ปิด dropdown */
  const [isOpen, setIsOpen] = useState(false)

  /** Ref สำหรับตรวจจับ click นอก dropdown */
  const dropdownRef = useRef<HTMLDivElement>(null)

  /** หาตัวเลือกที่ตรงกับ value ปัจจุบัน */
  const selectedOption = options.find(opt => opt.value === value)

  // ----------------------------------------------------------
  // Effect: ปิด Dropdown เมื่อ click นอก
  // ----------------------------------------------------------
  useEffect(() => {
    /**
     * Handler สำหรับ click event
     * ปิด dropdown ถ้า click นอกพื้นที่
     */
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    // เพิ่ม event listener
    document.addEventListener('mousedown', handleClickOutside)

    // Cleanup เมื่อ unmount
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ----------------------------------------------------------
  // Render Dropdown
  // ----------------------------------------------------------
  return (
    <div ref={dropdownRef} className="relative w-full lg:min-w-[200px]">
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2.5 sm:py-3.5 rounded-xl transition-all duration-200 text-sm sm:text-base ${
          isOpen
            ? 'bg-white ring-2 ring-indigo-500 shadow-lg'
            : 'bg-slate-50 hover:bg-white hover:shadow-md'
        }`}
      >
        {/* Icon */}
        <Icon className={`flex-shrink-0 transition-colors ${isOpen ? 'text-indigo-600' : 'text-slate-400'}`} size={18} />

        {/* Label */}
        <span className={`flex-1 text-left font-medium ${selectedOption?.value ? 'text-slate-800' : 'text-slate-400'}`}>
          {selectedOption?.label || placeholder}
        </span>

        {/* Chevron Icon - หมุนเมื่อเปิด */}
        <ChevronDown className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} size={16} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border-2 border-indigo-500 z-50 overflow-visible">
          {options.map((option, index) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              className={`w-full flex items-center justify-between px-4 py-3 transition-all text-left group
                ${value === option.value
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-700 hover:bg-slate-50'
                }
                ${index === 0 ? 'rounded-t-lg' : ''}
                ${index === options.length - 1 ? 'rounded-b-lg' : ''}
              `}
            >
              {/* Option Label */}
              <span className={`${value === option.value ? 'font-semibold' : 'font-medium'}`}>
                {option.label}
              </span>

              {/* Check Icon สำหรับตัวเลือกที่เลือกอยู่ */}
              {value === option.value && (
                <Check size={16} className="text-white" strokeWidth={3} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// Main Component - HotelsClient
// ============================================================

/**
 * Client Component สำหรับแสดงรายการโรงแรม
 *
 * @description
 *   Component หลักที่แสดงรายการโรงแรมพร้อมระบบกรอง
 *   รับข้อมูลโรงแรมจาก Server Component และจัดการ filtering
 *
 *   โครงสร้าง UI:
 *   - Header พร้อม title และ subtitle
 *   - Filter Box (Search, Location, Price)
 *   - Results Count และ Clear Filters
 *   - Hotels Grid (3 columns on desktop)
 *   - Empty State เมื่อไม่พบผลลัพธ์
 *
 * @param {HotelsClientProps} props - Props ที่มีรายการโรงแรม
 * @returns {JSX.Element} Hotels listing UI
 *
 * @example
 *   <HotelsClient hotels={hotelsArray} />
 */
export default function HotelsClient({ hotels }: HotelsClientProps) {
  // ----------------------------------------------------------
  // Hooks
  // ----------------------------------------------------------
  /** Hook สำหรับ translation */
  const { t } = useTranslation()

  // ----------------------------------------------------------
  // Filter States
  // ----------------------------------------------------------
  /** State สำหรับคำค้นหา */
  const [searchTerm, setSearchTerm] = useState('')

  /** State สำหรับช่วงราคา */
  const [priceFilter, setPriceFilter] = useState('all')

  /** State สำหรับสถานที่ */
  const [selectedLocation, setSelectedLocation] = useState('')

  // ----------------------------------------------------------
  // Computed Values
  // ----------------------------------------------------------
  /**
   * ดึงรายการสถานที่ที่ไม่ซ้ำกัน
   * ใช้สำหรับสร้างตัวเลือกใน Location Dropdown
   */
  const locations = [...new Set(hotels.map((h) => h.location || h.location_th || h.location_en).filter(Boolean))] as string[]

  // ----------------------------------------------------------
  // Helper Functions
  // ----------------------------------------------------------
  /**
   * แปลง filter string เป็นช่วงราคา
   *
   * @param {string} filter - ค่า filter ('all', 'low', 'mid', 'high')
   * @returns {[number, number]} ช่วงราคา [min, max]
   */
  const getPriceRange = (filter: string): [number, number] => {
    switch (filter) {
      case 'low': return [0, 20000]       // ถูก: 0 - 20,000 บาท
      case 'mid': return [20000, 40000]    // ปานกลาง: 20,000 - 40,000 บาท
      case 'high': return [40000, 100000]  // แพง: 40,000 - 100,000 บาท
      default: return [0, 100000]          // ทั้งหมด
    }
  }

  /** ช่วงราคาปัจจุบันตาม filter */
  const priceRange = getPriceRange(priceFilter)

  // ----------------------------------------------------------
  // Filter Hotels
  // ----------------------------------------------------------
  /**
   * กรองโรงแรมตามเงื่อนไขทั้งหมด
   *
   * เงื่อนไข:
   * 1. ตรงกับคำค้นหา (ชื่อ/สถานที่)
   * 2. ราคาอยู่ในช่วงที่เลือก
   * 3. ตรงกับสถานที่ที่เลือก
   */
  const filteredHotels = hotels.filter((hotel) => {
    // ดึงสถานที่ของโรงแรม
    const hotelLocation = hotel.location || hotel.location_th || hotel.location_en || ''

    // ตรวจสอบคำค้นหา (ชื่อไทย, ชื่ออังกฤษ, สถานที่)
    const matchesSearch =
      hotel.name_th.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hotel.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hotelLocation.toLowerCase().includes(searchTerm.toLowerCase())

    // ตรวจสอบช่วงราคา
    const matchesPrice =
      hotel.price_per_night >= priceRange[0] && hotel.price_per_night <= priceRange[1]

    // ตรวจสอบสถานที่
    const matchesLocation = !selectedLocation || hotelLocation === selectedLocation

    // ต้องผ่านทุกเงื่อนไข
    return matchesSearch && matchesPrice && matchesLocation
  })

  // ----------------------------------------------------------
  // Dropdown Options
  // ----------------------------------------------------------
  /** ตัวเลือกสำหรับ Location Dropdown */
  const locationOptions: DropdownOption[] = [
    { value: '', label: t('common.allLocations') },
    ...locations.map(loc => ({ value: loc, label: loc }))
  ]

  /** ตัวเลือกสำหรับ Price Dropdown */
  const priceOptions: DropdownOption[] = [
    { value: 'all', label: t('common.allPrices') },
    { value: 'low', label: t('common.priceLow') },
    { value: 'mid', label: t('common.priceMid') },
    { value: 'high', label: t('common.priceHigh') },
  ]

  // ----------------------------------------------------------
  // Render Component
  // ----------------------------------------------------------
  return (
    <div className="min-h-screen pt-24 pb-12">
      {/* ============================================================
          Header Section - Gradient Background
          ============================================================ */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            {t('navbar.packages')}
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-white/80">
            {t('hotels.subtitle') || 'คัดสรรแพ็คเกจที่พักพรีเมียมในราคาที่ดีที่สุด'}
          </p>
        </div>
      </div>

      {/* ============================================================
          Main Content
          ============================================================ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8">
        {/* ============================================================
            Filter Box
            ============================================================ */}
        <div className="relative bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-6 sm:mb-8 overflow-visible z-20">
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 overflow-visible">
            {/* Search Input */}
            <div className="flex-1 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all border-2 border-transparent focus-within:border-indigo-500 focus-within:bg-white">
              <Search className="text-slate-400 flex-shrink-0" size={18} />
              <input
                type="text"
                placeholder={t('common.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent outline-none border-none text-sm sm:text-base text-slate-800 font-medium placeholder:text-slate-400"
              />
            </div>

            {/* Location Dropdown */}
            <CustomDropdown
              options={locationOptions}
              value={selectedLocation}
              onChange={setSelectedLocation}
              placeholder={t('common.allLocations')}
              icon={MapPin}
            />

            {/* Price Dropdown */}
            <CustomDropdown
              options={priceOptions}
              value={priceFilter}
              onChange={setPriceFilter}
              placeholder={t('common.allPrices')}
              icon={Banknote}
            />
          </div>
        </div>

        {/* ============================================================
            Results Count และ Clear Filters
            ============================================================ */}
        <div className="flex items-center justify-between mb-6">
          {/* จำนวนผลลัพธ์ */}
          <p className="text-slate-600 font-medium">
            {t('common.found')} <span className="text-indigo-600 font-semibold">{filteredHotels.length}</span> {t('common.packages')}
          </p>

          {/* ปุ่ม Clear Filters - แสดงเมื่อมี filter ถูกใช้ */}
          {(searchTerm || selectedLocation || priceFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedLocation('')
                setPriceFilter('all')
              }}
              className="text-sm text-slate-500 hover:text-indigo-600 font-medium transition-colors"
            >
              {t('common.clearFilters')} ✕
            </button>
          )}
        </div>

        {/* ============================================================
            Hotels Grid หรือ Empty State
            ============================================================ */}
        {filteredHotels.length > 0 ? (
          // Hotels Grid - 1 column mobile, 2 tablet, 3 desktop
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {filteredHotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </div>
        ) : (
          // Empty State - เมื่อไม่พบผลลัพธ์
          <div className="text-center py-16">
            <p className="text-slate-500 text-lg">{t('hotels.noResults') || 'ไม่พบแพ็คเกจที่ตรงกับเงื่อนไข'}</p>
          </div>
        )}
      </div>
    </div>
  )
}
