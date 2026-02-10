-- ===========================================
-- Seed Data for Chiangrai Booking Database
-- ===========================================
-- Run this after schema.sql + all migrations
-- Contains test data for full end-to-end testing

-- Clear existing data (optional - use with caution!)
-- TRUNCATE TABLE payments CASCADE;
-- TRUNCATE TABLE bookings CASCADE;
-- TRUNCATE TABLE room_types CASCADE;
-- TRUNCATE TABLE cars CASCADE;
-- TRUNCATE TABLE hotels CASCADE;
-- TRUNCATE TABLE users CASCADE;
-- TRUNCATE TABLE admins CASCADE;

-- ===========================================
-- INSERT HOTELS (3 packages)
-- ===========================================
INSERT INTO hotels (
  name_th, name_en, description_th, description_en,
  location, star_rating, price_per_night, base_price_per_night, currency,
  max_guests, room_type_th, room_type_en,
  amenities_th, amenities_en, images, is_active
) VALUES
(
  'แพ็คเกจภูเก็ต โอเชี่ยน ไดรฟ์',
  'Phuket Ocean Drive Package',
  'สัมผัสประสบการณ์การพักผ่อนระดับ Ultra-Luxury ด้วยแพ็คเกจเช่ารถเปิดประทุน Mustang Convertible ขับเลียบชายหาดภูเก็ต พร้อมเข้าพักที่ Pool Villa ส่วนตัวที่มองเห็นวิวทะเล 180 องศา',
  'Experience Ultra-Luxury with our Mustang Convertible package, driving along Phuket beaches and staying at a private Pool Villa with 180-degree sea view.',
  'ภูเก็ต, ประเทศไทย',
  5, 12900, 12900, 'THB',
  2, 'รถหรู + วิลล่าสระน้ำส่วนตัว', 'Luxury Car + Private Pool Villa',
  ARRAY['รถเปิดประทุน', 'สระว่ายน้ำส่วนตัว', 'รับส่งสนามบิน VIP', 'อาหารเย็นชมพระอาทิตย์ตก'],
  ARRAY['Convertible Car', 'Private Pool', 'VIP Airport Transfer', 'Sunset Dinner'],
  ARRAY[
    'https://images.unsplash.com/photo-1519046904884-53103b34b206',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e'
  ],
  true
),
(
  'เชียงใหม่ มิสท์ เอ็กซ์พลอเรอร์',
  'Chiang Mai Mist Explorer',
  'เปลี่ยนบรรยากาศไปรับลมหนาวที่เชียงใหม่ ขับ SUV 4x4 ตะลุยดอยอินทนนท์และแม่กำปอง พักรีสอร์ทสไตล์โมเดิร์นล้านนากลางหุบเขา',
  'Change the atmosphere to enjoy the cool weather in Chiang Mai. Drive a 4x4 SUV to explore Doi Inthanon and Mae Kampong, stay at a modern Lanna-style resort in the valley.',
  'เชียงใหม่, ประเทศไทย',
  4, 5500, 5500, 'THB',
  4, 'SUV + รีสอร์ทภูเขา', 'SUV + Mountain Resort',
  ARRAY['4x4 SUV', 'อาหารเช้าล้านนา', 'ไกด์ท้องถิ่น', 'ประกันภัยรวม'],
  ARRAY['4x4 SUV', 'Lanna Breakfast', 'Local Guide', 'Insurance Included'],
  ARRAY[
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470',
    'https://images.unsplash.com/photo-1544644181-1484b3fdfc62',
    'https://images.unsplash.com/photo-1527004013197-933c4bb611b3'
  ],
  true
),
(
  'กรุงเทพ ไนท์ ครูซ แอนด์ ไดรฟ์',
  'Bangkok Night Cruise & Drive',
  'เปิดมุมมองใหม่ของกรุงเทพฯ ยามค่ำคืนด้วยรถยุโรปพรีเมียมส่วนตัว พักห้องสวีทริมแม่น้ำเจ้าพระยา พร้อมดินเนอร์ล่องเรือสำราญชมวิววัดอรุณฯ',
  'Discover a new perspective of Bangkok at night with a premium European car. Stay in a riverside suite with a dinner cruise viewing Wat Arun.',
  'กรุงเทพฯ, ประเทศไทย',
  5, 8900, 8900, 'THB',
  2, 'Sedan + Riverside Suite', 'Sedan + Riverside Suite',
  ARRAY['รถยุโรป Sedan', 'ดินเนอร์ล่องเรือ', 'เข้า Rooftop Bar', 'แชมเปญต้อนรับ'],
  ARRAY['European Sedan', 'Dinner Cruise', 'Rooftop Bar Access', 'Champagne Welcome'],
  ARRAY[
    'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd',
    'https://images.unsplash.com/photo-1563911546344-647715ed5d76'
  ],
  true
)
ON CONFLICT DO NOTHING;

-- ===========================================
-- INSERT CARS (2 vehicles)
-- ===========================================
INSERT INTO cars (
  name_th, name_en, description_th, description_en,
  car_type_th, car_type_en, max_passengers,
  price_per_day, base_price_per_day, currency,
  includes_th, includes_en, images, is_active
) VALUES
(
  'มัสแตง คอนเวอร์ทิเบิล 2024',
  'Mustang Convertible 2024',
  'ไอคอนิกของความเท่ รถเปิดประทุนยอดนิยมสำหรับการเที่ยวทะเล ถ่ายรูปสวย ขับสนุก เครื่องยนต์แรงสะใจ พร้อมระบบเสียงพรีเมียม',
  'Iconic and stylish, the popular convertible for beach trips, great for photos and fun driving with a powerful engine and premium sound system.',
  'รถสปอร์ตเปิดประทุน', 'Sport Convertible',
  4, 9500, 9500, 'THB',
  ARRAY['ประกันชั้นหนึ่ง', 'ทำความสะอาดและฆ่าเชื้อ', 'น้ำมันเต็มถัง', 'Apple CarPlay'],
  ARRAY['First Class Insurance', 'Cleaned & Disinfected', 'Full Tank', 'Apple CarPlay'],
  ARRAY['https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd'],
  true
),
(
  'โตโยต้า อัลพาร์ด VIP',
  'Toyota Alphard VIP',
  'ที่สุดของความสะดวกสบาย เหมาะสำหรับการเที่ยวแบบครอบครัวหรือผู้ใหญ่ เบาะนวดไฟฟ้าทั้งคัน มีตู้เย็นขนาดเล็ก และระบบความบันเทิงครบวงจร',
  'The ultimate comfort, perfect for family trips or VIP guests. Electric massage seats throughout, mini fridge, and complete entertainment system.',
  'VIP Van', 'VIP Van',
  7, 5500, 5500, 'THB',
  ARRAY['พร้อมคนขับ', 'WIFI', 'น้ำและเครื่องดื่ม', 'บริการ VIP Lane'],
  ARRAY['Driver Available', 'WIFI', 'Water & Refreshment', 'VIP Lane Service'],
  ARRAY['https://images.unsplash.com/photo-1621939514649-280e2ee25f60'],
  true
)
ON CONFLICT DO NOTHING;

-- ===========================================
-- INSERT ROOM TYPES (1 per hotel)
-- ===========================================
INSERT INTO room_types (hotel_id, name_th, name_en, price_per_night, max_guests, total_rooms, is_active)
SELECT id, 'รถหรู + วิลล่าสระน้ำส่วนตัว', 'Luxury Car + Private Pool Villa', 12900, 2, 5, true
FROM hotels WHERE name_en = 'Phuket Ocean Drive Package'
ON CONFLICT DO NOTHING;

INSERT INTO room_types (hotel_id, name_th, name_en, price_per_night, max_guests, total_rooms, is_active)
SELECT id, 'SUV + รีสอร์ทภูเขา', 'SUV + Mountain Resort', 5500, 4, 5, true
FROM hotels WHERE name_en = 'Chiang Mai Mist Explorer'
ON CONFLICT DO NOTHING;

INSERT INTO room_types (hotel_id, name_th, name_en, price_per_night, max_guests, total_rooms, is_active)
SELECT id, 'Sedan + Riverside Suite', 'Sedan + Riverside Suite', 8900, 2, 5, true
FROM hotels WHERE name_en = 'Bangkok Night Cruise & Drive'
ON CONFLICT DO NOTHING;

-- ===========================================
-- INSERT ADMIN USER
-- ===========================================
-- Password: admin123
INSERT INTO admins (email, password_hash, name, role, is_active) VALUES
(
  'admin@gotjourneythailand.com',
  '$2b$10$lPt1AdU6oNLOjRAUACyK1OAdyxixtcOR3ZrsrbRC/MfuIYaXoZt6K',
  'Admin GotJourney',
  'admin',
  true
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;

-- ===========================================
-- INSERT TEST USER
-- ===========================================
-- Password: admin123
INSERT INTO users (email, password_hash, name, role, is_active, email_verified) VALUES
(
  'test@example.com',
  '$2b$10$lPt1AdU6oNLOjRAUACyK1OAdyxixtcOR3ZrsrbRC/MfuIYaXoZt6K',
  'Test User',
  'user',
  true,
  true
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active,
  email_verified = EXCLUDED.email_verified;

-- ===========================================
-- INSERT SAMPLE BOOKINGS (5 statuses)
-- ===========================================

-- Booking 1: PENDING (hotel)
INSERT INTO bookings (
  booking_code, booking_type, hotel_id,
  check_in_date, check_out_date, number_of_guests,
  customer_name, customer_email, customer_phone,
  total_price, currency, status
) VALUES (
  'TE260207-PEND',
  'HOTEL',
  (SELECT id FROM hotels WHERE name_en = 'Phuket Ocean Drive Package' LIMIT 1),
  CURRENT_DATE + INTERVAL '7 days',
  CURRENT_DATE + INTERVAL '10 days',
  2,
  'สมชาย ใจดี',
  'test@example.com',
  '+66 81 234 5678',
  38700,
  'THB',
  'PENDING'
)
ON CONFLICT (booking_code) DO NOTHING;

-- Booking 2: CONFIRMED (hotel)
INSERT INTO bookings (
  booking_code, booking_type, hotel_id,
  check_in_date, check_out_date, number_of_guests,
  customer_name, customer_email, customer_phone,
  total_price, currency, status
) VALUES (
  'TE260207-CONF',
  'HOTEL',
  (SELECT id FROM hotels WHERE name_en = 'Chiang Mai Mist Explorer' LIMIT 1),
  CURRENT_DATE + INTERVAL '14 days',
  CURRENT_DATE + INTERVAL '17 days',
  3,
  'สมหญิง สวยงาม',
  'somying@example.com',
  '+66 89 876 5432',
  16500,
  'THB',
  'CONFIRMED'
)
ON CONFLICT (booking_code) DO NOTHING;

-- Booking 3: PAID (car)
INSERT INTO bookings (
  booking_code, booking_type, car_id,
  check_in_date, check_out_date, number_of_guests,
  customer_name, customer_email, customer_phone,
  total_price, currency, status
) VALUES (
  'TE260207-PAID',
  'CAR',
  (SELECT id FROM cars WHERE name_en = 'Mustang Convertible 2024' LIMIT 1),
  CURRENT_DATE + INTERVAL '3 days',
  CURRENT_DATE + INTERVAL '5 days',
  2,
  'John Smith',
  'john@example.com',
  '+66 92 111 2222',
  19000,
  'THB',
  'PAID'
)
ON CONFLICT (booking_code) DO NOTHING;

-- Booking 4: COMPLETED (hotel)
INSERT INTO bookings (
  booking_code, booking_type, hotel_id,
  check_in_date, check_out_date, number_of_guests,
  customer_name, customer_email, customer_phone,
  total_price, currency, status
) VALUES (
  'TE260207-DONE',
  'HOTEL',
  (SELECT id FROM hotels WHERE name_en = 'Bangkok Night Cruise & Drive' LIMIT 1),
  CURRENT_DATE - INTERVAL '5 days',
  CURRENT_DATE - INTERVAL '2 days',
  2,
  'วิภา รักเที่ยว',
  'wipa@example.com',
  '+66 86 333 4444',
  26700,
  'THB',
  'COMPLETED'
)
ON CONFLICT (booking_code) DO NOTHING;

-- Booking 5: CANCELLED (car)
INSERT INTO bookings (
  booking_code, booking_type, car_id,
  check_in_date, check_out_date, number_of_guests,
  customer_name, customer_email, customer_phone,
  total_price, currency, status,
  cancelled_at, cancellation_reason
) VALUES (
  'TE260207-CANC',
  'CAR',
  (SELECT id FROM cars WHERE name_en = 'Toyota Alphard VIP' LIMIT 1),
  CURRENT_DATE + INTERVAL '1 day',
  CURRENT_DATE + INTERVAL '3 days',
  4,
  'ประสิทธิ์ ดีมาก',
  'prasit@example.com',
  '+66 84 555 6666',
  11000,
  'THB',
  'CANCELLED',
  NOW(),
  'เปลี่ยนแผนการเดินทาง'
)
ON CONFLICT (booking_code) DO NOTHING;

-- ===========================================
-- INSERT SAMPLE PAYMENTS
-- ===========================================

-- Payment for PENDING booking
INSERT INTO payments (booking_id, amount, currency, status)
SELECT id, 38700, 'THB', 'PENDING'
FROM bookings WHERE booking_code = 'TE260207-PEND'
ON CONFLICT DO NOTHING;

-- Payment for PAID booking (succeeded)
INSERT INTO payments (booking_id, amount, currency, status, paid_at)
SELECT id, 19000, 'THB', 'SUCCEEDED', NOW()
FROM bookings WHERE booking_code = 'TE260207-PAID'
ON CONFLICT DO NOTHING;

-- Payment for COMPLETED booking (succeeded)
INSERT INTO payments (booking_id, amount, currency, status, paid_at)
SELECT id, 26700, 'THB', 'SUCCEEDED', NOW() - INTERVAL '3 days'
FROM bookings WHERE booking_code = 'TE260207-DONE'
ON CONFLICT DO NOTHING;
