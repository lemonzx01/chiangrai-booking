/**
 * ============================================================
 * Seed Test Data Script
 * ============================================================
 *
 * ใช้ Supabase REST API (PostgREST) seed ข้อมูลทดสอบ
 *
 * Usage:
 *   node scripts/seed-test-data.js
 *
 * ข้อมูลที่ seed:
 *   - Hotels (3), Cars (2), Room Types (3)
 *   - Admin (1), Test User (1)
 *   - Bookings (5), Payments (3)
 *
 * ============================================================
 */

const fs = require('fs')
const path = require('path')
const https = require('https')
const http = require('http')

// ============================================================
// Load .env.local
// ============================================================

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}
  const content = fs.readFileSync(filePath, 'utf-8')
  const env = {}
  content.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').replace(/^["']|["']$/g, '').trim()
      }
    }
  })
  return env
}

// Load from multiple locations
const envPaths = [
  path.join(__dirname, '../.env.local'),
  path.join(__dirname, '../apps/backend/.env.local'),
]

envPaths.forEach(p => {
  const env = loadEnvFile(p)
  Object.keys(env).forEach(key => {
    if (!process.env[key]) process.env[key] = env[key]
  })
})

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

// ============================================================
// HTTP Helper
// ============================================================

function request(method, tablePath, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${tablePath}`)
    const isHttps = url.protocol === 'https:'
    const client = isHttps ? https : http

    const headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=representation',
    }

    // For upserts
    if (method === 'UPSERT') {
      method = 'POST'
      headers['Prefer'] = 'return=representation,resolution=merge-duplicates'
    }

    const reqOptions = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers,
    }

    const req = client.request(reqOptions, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : null
          if (res.statusCode >= 400) {
            reject(new Error(`${res.statusCode}: ${JSON.stringify(json)}`))
          } else {
            resolve(json)
          }
        } catch {
          if (res.statusCode >= 400) {
            reject(new Error(`${res.statusCode}: ${data}`))
          } else {
            resolve(data)
          }
        }
      })
    })

    req.on('error', reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

async function insert(table, data) {
  return request('POST', table, Array.isArray(data) ? data : [data])
}

async function upsert(table, data) {
  return request('UPSERT', table, Array.isArray(data) ? data : [data])
}

// ============================================================
// Test Data
// ============================================================

const HOTELS = [
  {
    name_th: 'แพ็คเกจภูเก็ต โอเชี่ยน ไดรฟ์',
    name_en: 'Phuket Ocean Drive Package',
    description_th: 'สัมผัสประสบการณ์การพักผ่อนระดับ Ultra-Luxury ด้วยแพ็คเกจเช่ารถเปิดประทุน Mustang Convertible ขับเลียบชายหาดภูเก็ต พร้อมเข้าพักที่ Pool Villa ส่วนตัวที่มองเห็นวิวทะเล 180 องศา',
    description_en: 'Experience Ultra-Luxury with our Mustang Convertible package, driving along Phuket beaches and staying at a private Pool Villa with 180-degree sea view.',
    location: 'ภูเก็ต, ประเทศไทย',
    star_rating: 5,
    price_per_night: 12900,
    base_price_per_night: 12900,
    currency: 'THB',
    max_guests: 2,
    room_type_th: 'รถหรู + วิลล่าสระน้ำส่วนตัว',
    room_type_en: 'Luxury Car + Private Pool Villa',
    amenities_th: ['รถเปิดประทุน', 'สระว่ายน้ำส่วนตัว', 'รับส่งสนามบิน VIP', 'อาหารเย็นชมพระอาทิตย์ตก'],
    amenities_en: ['Convertible Car', 'Private Pool', 'VIP Airport Transfer', 'Sunset Dinner'],
    images: [
      'https://images.unsplash.com/photo-1519046904884-53103b34b206',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
    ],
    is_active: true,
  },
  {
    name_th: 'เชียงใหม่ มิสท์ เอ็กซ์พลอเรอร์',
    name_en: 'Chiang Mai Mist Explorer',
    description_th: 'เปลี่ยนบรรยากาศไปรับลมหนาวที่เชียงใหม่ ขับ SUV 4x4 ตะลุยดอยอินทนนท์และแม่กำปอง พักรีสอร์ทสไตล์โมเดิร์นล้านนากลางหุบเขา',
    description_en: 'Change the atmosphere to enjoy the cool weather in Chiang Mai. Drive a 4x4 SUV to explore Doi Inthanon and Mae Kampong, stay at a modern Lanna-style resort in the valley.',
    location: 'เชียงใหม่, ประเทศไทย',
    star_rating: 4,
    price_per_night: 5500,
    base_price_per_night: 5500,
    currency: 'THB',
    max_guests: 4,
    room_type_th: 'SUV + รีสอร์ทภูเขา',
    room_type_en: 'SUV + Mountain Resort',
    amenities_th: ['4x4 SUV', 'อาหารเช้าล้านนา', 'ไกด์ท้องถิ่น', 'ประกันภัยรวม'],
    amenities_en: ['4x4 SUV', 'Lanna Breakfast', 'Local Guide', 'Insurance Included'],
    images: [
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470',
      'https://images.unsplash.com/photo-1544644181-1484b3fdfc62',
      'https://images.unsplash.com/photo-1527004013197-933c4bb611b3',
    ],
    is_active: true,
  },
  {
    name_th: 'กรุงเทพ ไนท์ ครูซ แอนด์ ไดรฟ์',
    name_en: 'Bangkok Night Cruise & Drive',
    description_th: 'เปิดมุมมองใหม่ของกรุงเทพฯ ยามค่ำคืนด้วยรถยุโรปพรีเมียมส่วนตัว พักห้องสวีทริมแม่น้ำเจ้าพระยา พร้อมดินเนอร์ล่องเรือสำราญชมวิววัดอรุณฯ',
    description_en: 'Discover a new perspective of Bangkok at night with a premium European car. Stay in a riverside suite with a dinner cruise viewing Wat Arun.',
    location: 'กรุงเทพฯ, ประเทศไทย',
    star_rating: 5,
    price_per_night: 8900,
    base_price_per_night: 8900,
    currency: 'THB',
    max_guests: 2,
    room_type_th: 'Sedan + Riverside Suite',
    room_type_en: 'Sedan + Riverside Suite',
    amenities_th: ['รถยุโรป Sedan', 'ดินเนอร์ล่องเรือ', 'เข้า Rooftop Bar', 'แชมเปญต้อนรับ'],
    amenities_en: ['European Sedan', 'Dinner Cruise', 'Rooftop Bar Access', 'Champagne Welcome'],
    images: [
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd',
      'https://images.unsplash.com/photo-1563911546344-647715ed5d76',
    ],
    is_active: true,
  },
]

const CARS = [
  {
    name_th: 'มัสแตง คอนเวอร์ทิเบิล 2024',
    name_en: 'Mustang Convertible 2024',
    description_th: 'ไอคอนิกของความเท่ รถเปิดประทุนยอดนิยมสำหรับการเที่ยวทะเล ถ่ายรูปสวย ขับสนุก เครื่องยนต์แรงสะใจ พร้อมระบบเสียงพรีเมียม',
    description_en: 'Iconic and stylish, the popular convertible for beach trips, great for photos and fun driving with a powerful engine and premium sound system.',
    car_type_th: 'รถสปอร์ตเปิดประทุน',
    car_type_en: 'Sport Convertible',
    max_passengers: 4,
    price_per_day: 9500,
    base_price_per_day: 9500,
    currency: 'THB',
    includes_th: ['ประกันชั้นหนึ่ง', 'ทำความสะอาดและฆ่าเชื้อ', 'น้ำมันเต็มถัง', 'Apple CarPlay'],
    includes_en: ['First Class Insurance', 'Cleaned & Disinfected', 'Full Tank', 'Apple CarPlay'],
    images: ['https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd'],
    is_active: true,
  },
  {
    name_th: 'โตโยต้า อัลพาร์ด VIP',
    name_en: 'Toyota Alphard VIP',
    description_th: 'ที่สุดของความสะดวกสบาย เหมาะสำหรับการเที่ยวแบบครอบครัวหรือผู้ใหญ่ เบาะนวดไฟฟ้าทั้งคัน มีตู้เย็นขนาดเล็ก และระบบความบันเทิงครบวงจร',
    description_en: 'The ultimate comfort, perfect for family trips or VIP guests. Electric massage seats throughout, mini fridge, and complete entertainment system.',
    car_type_th: 'VIP Van',
    car_type_en: 'VIP Van',
    max_passengers: 7,
    price_per_day: 5500,
    base_price_per_day: 5500,
    currency: 'THB',
    includes_th: ['พร้อมคนขับ', 'WIFI', 'น้ำและเครื่องดื่ม', 'บริการ VIP Lane'],
    includes_en: ['Driver Available', 'WIFI', 'Water & Refreshment', 'VIP Lane Service'],
    images: ['https://images.unsplash.com/photo-1621939514649-280e2ee25f60'],
    is_active: true,
  },
]

// bcrypt hash for 'admin123'
const ADMIN_HASH = '$2b$10$lPt1AdU6oNLOjRAUACyK1OAdyxixtcOR3ZrsrbRC/MfuIYaXoZt6K'
// bcrypt hash for 'test123'
const USER_HASH = '$2b$10$lPt1AdU6oNLOjRAUACyK1OAdyxixtcOR3ZrsrbRC/MfuIYaXoZt6K'

// ============================================================
// Seed Functions
// ============================================================

function generateBookingCode() {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `TE${yy}${mm}${dd}-${rand}`
}

function futureDate(daysFromNow) {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString().split('T')[0]
}

function pastDate(daysAgo) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().split('T')[0]
}

async function seedAll() {
  console.log('🌱 Seeding test data...\n')

  // 1. Hotels
  console.log('📦 1/7 Seeding hotels...')
  let hotels
  try {
    hotels = await insert('hotels', HOTELS)
    console.log(`   ✅ ${hotels.length} hotels inserted`)
  } catch (err) {
    // Hotels might already exist - try to fetch them
    console.log(`   ⚠️  Hotels might exist already, fetching...`)
    hotels = await request('GET', 'hotels?is_active=eq.true&order=created_at.asc&limit=3')
    if (!hotels || hotels.length === 0) {
      console.error('   ❌ Failed to seed or fetch hotels:', err.message)
      process.exit(1)
    }
    console.log(`   ✅ Found ${hotels.length} existing hotels`)
  }

  // 2. Cars
  console.log('📦 2/7 Seeding cars...')
  let cars
  try {
    cars = await insert('cars', CARS)
    console.log(`   ✅ ${cars.length} cars inserted`)
  } catch (err) {
    console.log(`   ⚠️  Cars might exist already, fetching...`)
    cars = await request('GET', 'cars?is_active=eq.true&order=created_at.asc&limit=2')
    if (!cars || cars.length === 0) {
      console.error('   ❌ Failed to seed or fetch cars:', err.message)
      process.exit(1)
    }
    console.log(`   ✅ Found ${cars.length} existing cars`)
  }

  // 3. Room Types (requires migration: add_partners_and_currency)
  console.log('📦 3/7 Seeding room types...')
  const roomTypes = hotels.map(hotel => ({
    hotel_id: hotel.id,
    name_th: hotel.room_type_th || 'ห้องมาตรฐาน',
    name_en: hotel.room_type_en || 'Standard Room',
    price_per_night: hotel.price_per_night,
    max_guests: hotel.max_guests,
    total_rooms: 5,
    is_active: true,
  }))
  try {
    const inserted = await insert('room_types', roomTypes)
    console.log(`   ✅ ${inserted.length} room types inserted`)
  } catch (err) {
    if (err.message.includes('PGRST204')) {
      console.log('   ⏭️  Table room_types not found - run migration add_partners_and_currency first')
    } else {
      console.log(`   ⚠️  Room types: ${err.message.substring(0, 80)}`)
    }
  }

  // 4. Admin
  console.log('📦 4/7 Seeding admin...')
  try {
    // Check if admin exists first
    const existing = await request('GET', 'admins?email=eq.admin@gotjourneythailand.com&limit=1')
    if (existing && existing.length > 0) {
      console.log('   ✅ Admin already exists (admin@gotjourneythailand.com / admin123)')
    } else {
      await insert('admins', [{
        email: 'admin@gotjourneythailand.com',
        password_hash: ADMIN_HASH,
        name: 'Admin GotJourney',
        role: 'admin',
        is_active: true,
      }])
      console.log('   ✅ Admin seeded (admin@gotjourneythailand.com / admin123)')
    }
  } catch (err) {
    console.log(`   ⚠️  Admin: ${err.message.substring(0, 80)}`)
  }

  // 5. Test User (requires migration 0006)
  console.log('📦 5/7 Seeding test user...')
  let testUser
  try {
    // Check if user exists first
    const existing = await request('GET', 'users?email=eq.test@example.com&limit=1')
    if (existing && existing.length > 0) {
      testUser = existing[0]
      console.log('   ✅ Test user already exists (test@example.com / admin123)')
    } else {
      const users = await insert('users', [{
        email: 'test@example.com',
        password_hash: USER_HASH,
        name: 'Test User',
        role: 'user',
        is_active: true,
        email_verified: true,
      }])
      testUser = users[0]
      console.log('   ✅ Test user seeded (test@example.com / admin123)')
    }
  } catch (err) {
    if (err.message.includes('PGRST204')) {
      console.log('   ⏭️  Table users not found - run migration 0006_add_users_table first')
    } else {
      console.log(`   ⚠️  Test user: ${err.message.substring(0, 80)}`)
    }
  }

  // 6. Bookings (insert one by one to avoid PostgREST uniform-key requirement)
  console.log('📦 6/7 Seeding bookings...')
  const bookingDefs = [
    {
      booking_code: generateBookingCode(),
      booking_type: 'HOTEL',
      hotel_id: hotels[0]?.id,
      check_in_date: futureDate(7),
      check_out_date: futureDate(10),
      number_of_guests: 2,
      customer_name: 'สมชาย ใจดี',
      customer_email: 'test@example.com',
      customer_phone: '+66 81 234 5678',
      total_price: 38700,
      currency: 'THB',
      status: 'PENDING',
    },
    {
      booking_code: generateBookingCode(),
      booking_type: 'HOTEL',
      hotel_id: hotels[1]?.id,
      check_in_date: futureDate(14),
      check_out_date: futureDate(17),
      number_of_guests: 3,
      customer_name: 'สมหญิง สวยงาม',
      customer_email: 'somying@example.com',
      customer_phone: '+66 89 876 5432',
      total_price: 16500,
      currency: 'THB',
      status: 'CONFIRMED',
    },
    {
      booking_code: generateBookingCode(),
      booking_type: 'CAR',
      car_id: cars[0]?.id,
      check_in_date: futureDate(3),
      check_out_date: futureDate(5),
      number_of_guests: 2,
      customer_name: 'John Smith',
      customer_email: 'john@example.com',
      customer_phone: '+66 92 111 2222',
      total_price: 19000,
      currency: 'THB',
      status: 'PAID',
    },
    {
      booking_code: generateBookingCode(),
      booking_type: 'HOTEL',
      hotel_id: hotels[2]?.id,
      check_in_date: pastDate(5),
      check_out_date: pastDate(2),
      number_of_guests: 2,
      customer_name: 'วิภา รักเที่ยว',
      customer_email: 'wipa@example.com',
      customer_phone: '+66 86 333 4444',
      total_price: 26700,
      currency: 'THB',
      status: 'COMPLETED',
    },
    {
      booking_code: generateBookingCode(),
      booking_type: 'CAR',
      car_id: cars[1]?.id,
      check_in_date: futureDate(1),
      check_out_date: futureDate(3),
      number_of_guests: 4,
      customer_name: 'ประสิทธิ์ ดีมาก',
      customer_email: 'prasit@example.com',
      customer_phone: '+66 84 555 6666',
      total_price: 11000,
      currency: 'THB',
      status: 'CANCELLED',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: 'เปลี่ยนแผนการเดินทาง',
    },
  ]

  const insertedBookings = []
  for (const booking of bookingDefs) {
    try {
      const result = await insert('bookings', booking)
      insertedBookings.push(result[0])
    } catch (err) {
      // If cancelled_at/cancellation_reason columns don't exist, retry without them
      if (booking.cancelled_at || booking.cancellation_reason) {
        try {
          const { cancelled_at, cancellation_reason, ...basic } = booking
          void cancelled_at; void cancellation_reason
          const result = await insert('bookings', basic)
          insertedBookings.push(result[0])
        } catch (err2) {
          console.log(`   ⚠️  Booking ${booking.booking_code}: ${err2.message.substring(0, 80)}`)
        }
      } else {
        console.log(`   ⚠️  Booking ${booking.booking_code}: ${err.message.substring(0, 80)}`)
      }
    }
  }
  console.log(`   ✅ ${insertedBookings.length}/${bookingDefs.length} bookings inserted`)

  // 7. Payments (insert one by one)
  console.log('📦 7/7 Seeding payments...')
  if (insertedBookings.length >= 4) {
    const paymentDefs = [
      {
        booking_id: insertedBookings[0].id,
        amount: insertedBookings[0].total_price,
        currency: 'THB',
        status: 'PENDING',
      },
      {
        booking_id: insertedBookings[2].id,
        amount: insertedBookings[2].total_price,
        currency: 'THB',
        status: 'SUCCEEDED',
        paid_at: new Date().toISOString(),
      },
      {
        booking_id: insertedBookings[3].id,
        amount: insertedBookings[3].total_price,
        currency: 'THB',
        status: 'SUCCEEDED',
        paid_at: pastDate(3) + 'T10:00:00Z',
      },
    ]

    let paymentCount = 0
    for (const payment of paymentDefs) {
      try {
        await insert('payments', payment)
        paymentCount++
      } catch (err) {
        console.log(`   ⚠️  Payment: ${err.message.substring(0, 80)}`)
      }
    }
    console.log(`   ✅ ${paymentCount}/${paymentDefs.length} payments inserted`)
  } else {
    console.log('   ⚠️  Skipped (need at least 4 bookings first)')
  }

  // Done!
  console.log('\n' + '='.repeat(50))
  console.log('🎉 Seed completed!\n')
  console.log('📋 Test credentials:')
  console.log('   Admin: admin@gotjourneythailand.com / admin123')
  console.log('   User:  test@example.com / admin123')
  console.log('')
  console.log('🚀 Start the system:')
  console.log('   npm run dev --workspace=backend')
  console.log('   npm run dev --workspace=frontend')
  console.log('')
  console.log('🧪 Test flow:')
  console.log('   1. http://localhost:3000 → ดูโรงแรม/รถ → จอง')
  console.log('   2. ชำระเงิน: Stripe test card 4242 4242 4242 4242')
  console.log('   3. http://localhost:3000/admin/login → ดู dashboard')
  console.log('='.repeat(50))
}

// ============================================================
// Main
// ============================================================

seedAll().catch(err => {
  console.error('\n❌ Error:', err.message)
  process.exit(1)
})
