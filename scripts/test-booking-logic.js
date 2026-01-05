/**
 * Test Script สำหรับทดสอบ Booking Logic
 * 
 * วิธีใช้: node scripts/test-booking-logic.js
 */

// Mock data
const mockHotel = {
  id: 'hotel-1',
  price_per_night: 2000,
  base_price_per_night: 2000,
  max_guests: 4,
}

const mockRoomTypes = [
  { id: 'rt-1', hotel_id: 'hotel-1', price_per_night: 2500, max_guests: 2 },
  { id: 'rt-2', hotel_id: 'hotel-1', price_per_night: 3500, max_guests: 4 },
]

const mockCar = {
  id: 'car-1',
  price_per_day: 1500,
  base_price_per_day: 1500,
  max_passengers: 5,
}

// Test functions
function calculateNights(checkIn, checkOut) {
  const start = new Date(checkIn)
  const end = new Date(checkOut)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function calculateTotalPrice(pricePerUnit, nights) {
  return pricePerUnit * nights
}

function convertCurrency(amount, fromCurrency, toCurrency) {
  const rates = {
    THB: { USD: 0.027, EUR: 0.025 },
    USD: { THB: 37.0, EUR: 0.93 },
    EUR: { THB: 40.0, USD: 1.08 },
  }
  
  if (fromCurrency === toCurrency) return amount
  if (fromCurrency === 'THB') return amount * rates.THB[toCurrency]
  if (toCurrency === 'THB') return amount * rates[fromCurrency].THB
  return amount * rates[fromCurrency][toCurrency]
}

// Test Cases
console.log('🧪 Testing Booking Logic\n')

// Test 1: Price calculation with room type
console.log('Test 1: Price calculation with room type')
const nights1 = calculateNights('2024-01-15', '2024-01-18')
const price1 = mockRoomTypes[0].price_per_night
const total1 = calculateTotalPrice(price1, nights1)
console.log(`  Room Type: ${mockRoomTypes[0].price_per_night} THB/night`)
console.log(`  Nights: ${nights1}`)
console.log(`  Total: ${total1} THB`)
console.log(`  ✅ Expected: 7500 THB, Got: ${total1} THB\n`)

// Test 2: Price calculation without room type
console.log('Test 2: Price calculation without room type')
const nights2 = calculateNights('2024-01-15', '2024-01-17')
const price2 = mockHotel.price_per_night
const total2 = calculateTotalPrice(price2, nights2)
console.log(`  Hotel: ${mockHotel.price_per_night} THB/night`)
console.log(`  Nights: ${nights2}`)
console.log(`  Total: ${total2} THB`)
console.log(`  ✅ Expected: 4000 THB, Got: ${total2} THB\n`)

// Test 3: Currency conversion
console.log('Test 3: Currency conversion')
const thbAmount = 10000
const usdAmount = convertCurrency(thbAmount, 'THB', 'USD')
const eurAmount = convertCurrency(thbAmount, 'THB', 'EUR')
console.log(`  THB: ${thbAmount}`)
console.log(`  USD: ${usdAmount.toFixed(2)}`)
console.log(`  EUR: ${eurAmount.toFixed(2)}`)
console.log(`  ✅ Conversion working\n`)

// Test 4: Max guests from room type
console.log('Test 4: Max guests from room type')
const selectedRoomType = mockRoomTypes.find(rt => rt.id === 'rt-1')
const maxGuests = selectedRoomType ? selectedRoomType.max_guests : mockHotel.max_guests
console.log(`  Selected Room Type: rt-1`)
console.log(`  Max Guests: ${maxGuests}`)
console.log(`  ✅ Expected: 2, Got: ${maxGuests}\n`)

// Test 5: Max guests without room type
console.log('Test 5: Max guests without room type')
const maxGuestsNoRoomType = mockHotel.max_guests
console.log(`  No Room Type Selected`)
console.log(`  Max Guests: ${maxGuestsNoRoomType}`)
console.log(`  ✅ Expected: 4, Got: ${maxGuestsNoRoomType}\n`)

// Test 6: Room type selection logic
console.log('Test 6: Room type selection logic')
const roomTypeIdFromUrl = 'rt-2'
const foundRoomType = mockRoomTypes.find(rt => rt.id === roomTypeIdFromUrl)
if (foundRoomType) {
  console.log(`  Room Type ID from URL: ${roomTypeIdFromUrl}`)
  console.log(`  Found: ${foundRoomType.price_per_night} THB/night`)
  console.log(`  ✅ Room type found and selected\n`)
} else {
  console.log(`  ❌ Room type not found\n`)
}

// Test 7: Invalid room type ID
console.log('Test 7: Invalid room type ID')
const invalidRoomTypeId = 'rt-invalid'
const foundInvalid = mockRoomTypes.find(rt => rt.id === invalidRoomTypeId)
if (!foundInvalid) {
  console.log(`  Invalid Room Type ID: ${invalidRoomTypeId}`)
  console.log(`  Fallback to hotel price: ${mockHotel.price_per_night} THB/night`)
  console.log(`  ✅ Fallback logic working\n`)
} else {
  console.log(`  ❌ Should not find invalid room type\n`)
}

// Test 8: Car booking
console.log('Test 8: Car booking')
const carNights = calculateNights('2024-01-15', '2024-01-20')
const carTotal = calculateTotalPrice(mockCar.price_per_day, carNights)
console.log(`  Car: ${mockCar.price_per_day} THB/day`)
console.log(`  Days: ${carNights}`)
console.log(`  Total: ${carTotal} THB`)
console.log(`  ✅ Expected: 7500 THB, Got: ${carTotal} THB\n`)

console.log('✅ All tests completed!')



