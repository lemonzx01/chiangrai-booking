-- ===========================================
-- Seed Data for Chiangrai Booking Database
-- ===========================================
-- Run this after schema.sql
-- This file contains sample data matching the Mock Data structure

-- Clear existing data (optional - use with caution!)
-- TRUNCATE TABLE payments CASCADE;
-- TRUNCATE TABLE bookings CASCADE;
-- TRUNCATE TABLE cars CASCADE;
-- TRUNCATE TABLE hotels CASCADE;
-- TRUNCATE TABLE admins CASCADE;

-- ===========================================
-- INSERT HOTELS (matching MOCK_HOTELS)
-- ===========================================
INSERT INTO hotels (name_th, name_en, description_th, description_en, location, star_rating, price_per_night, max_guests, room_type_th, room_type_en, amenities_th, amenities_en, images, is_active) VALUES
(
  'แพ็คเกจภูเก็ต โอเชี่ยน ไดรฟ์',
  'Phuket Ocean Drive Package',
  'สัมผัสประสบการณ์การพักผ่อนระดับ Ultra-Luxury ด้วยแพ็คเกจเช่ารถเปิดประทุน Mustang Convertible ขับเลียบชายหาดภูเก็ต พร้อมเข้าพักที่ Pool Villa ส่วนตัวที่มองเห็นวิวทะเล 180 องศา',
  'Experience Ultra-Luxury with our Mustang Convertible package, driving along Phuket beaches and staying at a private Pool Villa with 180-degree sea view.',
  'ภูเก็ต, ประเทศไทย',
  5,
  12900,
  2,
  'รถหรู + วิลล่าสระน้ำส่วนตัว',
  'Luxury Car + Private Pool Villa',
  ARRAY['รถเปิดประทุน', 'สระว่ายน้ำส่วนตัว', 'รับส่งสนามบิน VIP', 'อาหารเย็นชมพระอาทิตย์ตก'],
  ARRAY['Convertible Car', 'Private Pool', 'VIP Airport Transfer', 'Sunset Dinner'],
  ARRAY[
    'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'
  ],
  true
),
(
  'เชียงใหม่ มิสท์ เอ็กซ์พลอเรอร์',
  'Chiang Mai Mist Explorer',
  'เปลี่ยนบรรยากาศไปรับลมหนาวที่เชียงใหม่ ขับ SUV 4x4 ตะลุยดอยอินทนนท์และแม่กำปอง พักรีสอร์ทสไตล์โมเดิร์นล้านนากลางหุบเขา',
  'Change the atmosphere to enjoy the cool weather in Chiang Mai. Drive a 4x4 SUV to explore Doi Inthanon and Mae Kampong, stay at a modern Lanna-style resort in the valley.',
  'เชียงใหม่, ประเทศไทย',
  4,
  5500,
  4,
  'SUV + รีสอร์ทภูเขา',
  'SUV + Mountain Resort',
  ARRAY['4x4 SUV', 'อาหารเช้าล้านนา', 'ไกด์ท้องถิ่น', 'ประกันภัยรวม'],
  ARRAY['4x4 SUV', 'Lanna Breakfast', 'Local Guide', 'Insurance Included'],
  ARRAY[
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200',
    'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800',
    'https://images.unsplash.com/photo-1527004013197-933c4bb611b3?w=800'
  ],
  true
),
(
  'กรุงเทพ ไนท์ ครูซ แอนด์ ไดรฟ์',
  'Bangkok Night Cruise & Drive',
  'เปิดมุมมองใหม่ของกรุงเทพฯ ยามค่ำคืนด้วยรถยุโรปพรีเมียมส่วนตัว พักห้องสวีทริมแม่น้ำเจ้าพระยา พร้อมดินเนอร์ล่องเรือสำราญชมวิววัดอรุณฯ',
  'Discover a new perspective of Bangkok at night with a premium European car. Stay in a riverside suite with a dinner cruise viewing Wat Arun.',
  'กรุงเทพฯ, ประเทศไทย',
  5,
  8900,
  2,
  'Sedan + Riverside Suite',
  'Sedan + Riverside Suite',
  ARRAY['รถยุโรป Sedan', 'ดินเนอร์ล่องเรือ', 'เข้า Rooftop Bar', 'แชมเปญต้อนรับ'],
  ARRAY['European Sedan', 'Dinner Cruise', 'Rooftop Bar Access', 'Champagne Welcome'],
  ARRAY[
    'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
    'https://images.unsplash.com/photo-1563911546344-647715ed5d76?w=800'
  ],
  true
)
ON CONFLICT DO NOTHING;

-- ===========================================
-- INSERT CARS (matching MOCK_CARS)
-- ===========================================
INSERT INTO cars (name_th, name_en, description_th, description_en, car_type_th, car_type_en, max_passengers, price_per_day, includes_th, includes_en, images, is_active) VALUES
(
  'มัสแตง คอนเวอร์ทิเบิล 2024',
  'Mustang Convertible 2024',
  'ไอคอนิกของความเท่ รถเปิดประทุนยอดนิยมสำหรับการเที่ยวทะเล ถ่ายรูปสวย ขับสนุก เครื่องยนต์แรงสะใจ พร้อมระบบเสียงพรีเมียม',
  'Iconic and stylish, the popular convertible for beach trips, great for photos and fun driving with a powerful engine and premium sound system.',
  'รถสปอร์ตเปิดประทุน',
  'Sport Convertible',
  4,
  9500,
  ARRAY['ประกันชั้นหนึ่ง', 'ทำความสะอาดและฆ่าเชื้อ', 'น้ำมันเต็มถัง', 'Apple CarPlay'],
  ARRAY['First Class Insurance', 'Cleaned & Disinfected', 'Full Tank', 'Apple CarPlay'],
  ARRAY['https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?w=1200'],
  true
),
(
  'โตโยต้า อัลพาร์ด VIP',
  'Toyota Alphard VIP',
  'ที่สุดของความสะดวกสบาย เหมาะสำหรับการเที่ยวแบบครอบครัวหรือผู้ใหญ่ เบาะนวดไฟฟ้าทั้งคัน มีตู้เย็นขนาดเล็ก และระบบความบันเทิงครบวงจร',
  'The ultimate comfort, perfect for family trips or VIP guests. Electric massage seats throughout, mini fridge, and complete entertainment system.',
  'VIP Van',
  'VIP Van',
  7,
  5500,
  ARRAY['พร้อมคนขับ', 'WIFI', 'น้ำและเครื่องดื่ม', 'บริการ VIP Lane'],
  ARRAY['Driver Available', 'WIFI', 'Water & Refreshment', 'VIP Lane Service'],
  ARRAY['https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=1200'],
  true
)
ON CONFLICT DO NOTHING;

-- ===========================================
-- INSERT ADMIN USER
-- ===========================================
-- Password: admin123
-- Hash generated using: node scripts/create-admin.js
INSERT INTO admins (email, password_hash, name, role, is_active) VALUES
(
  'admin@gotjourneythailand.com',
  '$2b$10$lPt1AdU6oNLOjRAUACyK1OAdyxixtcOR3ZrsrbRC/MfuIYaXoZt6K',
  'Admin User',
  'admin',
  true
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;

-- ===========================================
-- SAMPLE BOOKINGS (Optional - for testing)
-- ===========================================
-- Note: These will reference hotel/car IDs from above
-- You may need to adjust the IDs based on actual UUIDs generated

-- Example booking (uncomment and adjust IDs as needed):
/*
INSERT INTO bookings (
  booking_code, booking_type, hotel_id, check_in_date, check_out_date,
  number_of_guests, customer_name, customer_email, customer_phone,
  total_price, status
) VALUES (
  'TE250101-ABCD',
  'HOTEL',
  (SELECT id FROM hotels WHERE name_en = 'Phuket Ocean Drive Package' LIMIT 1),
  CURRENT_DATE + INTERVAL '7 days',
  CURRENT_DATE + INTERVAL '10 days',
  2,
  'สมชาย ใจดี',
  'somchai@example.com',
  '+66 81 234 5678',
  38700,
  'CONFIRMED'
);
*/



