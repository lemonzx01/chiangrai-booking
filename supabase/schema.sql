-- ===========================================
-- Chiangrai Booking Database Schema
-- ===========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- HOTELS TABLE
-- ===========================================
CREATE TABLE hotels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_th TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_th TEXT NOT NULL,
  description_en TEXT NOT NULL,
  location TEXT NOT NULL,
  star_rating INTEGER NOT NULL CHECK (star_rating >= 1 AND star_rating <= 5),
  price_per_night DECIMAL(10, 2) NOT NULL,
  max_guests INTEGER NOT NULL DEFAULT 2,
  room_type_th TEXT NOT NULL,
  room_type_en TEXT NOT NULL,
  amenities_th TEXT[] DEFAULT '{}',
  amenities_en TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- CARS TABLE
-- ===========================================
CREATE TABLE cars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_th TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_th TEXT NOT NULL,
  description_en TEXT NOT NULL,
  car_type_th TEXT NOT NULL,
  car_type_en TEXT NOT NULL,
  max_passengers INTEGER NOT NULL DEFAULT 4,
  price_per_day DECIMAL(10, 2) NOT NULL,
  includes_th TEXT[] DEFAULT '{}',
  includes_en TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- BOOKINGS TABLE
-- ===========================================
CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'PAID', 'CANCELLED', 'COMPLETED');
CREATE TYPE booking_type AS ENUM ('HOTEL', 'CAR', 'COMBO');

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_code VARCHAR(20) UNIQUE NOT NULL,
  booking_type booking_type NOT NULL,
  hotel_id UUID REFERENCES hotels(id) ON DELETE SET NULL,
  car_id UUID REFERENCES cars(id) ON DELETE SET NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  number_of_guests INTEGER NOT NULL DEFAULT 1,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_line TEXT,
  special_requests TEXT,
  total_price DECIMAL(10, 2) NOT NULL,
  status booking_status DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- PAYMENTS TABLE
-- ===========================================
CREATE TYPE payment_status AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED');

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'THB',
  status payment_status DEFAULT 'PENDING',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- ADMINS TABLE
-- ===========================================
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role VARCHAR(20) DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- INDEXES
-- ===========================================
CREATE INDEX idx_hotels_is_active ON hotels(is_active);
CREATE INDEX idx_hotels_location ON hotels(location);
CREATE INDEX idx_cars_is_active ON cars(is_active);
CREATE INDEX idx_bookings_code ON bookings(booking_code);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_customer_email ON bookings(customer_email);
CREATE INDEX idx_bookings_dates ON bookings(check_in_date, check_out_date);
CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_stripe_session ON payments(stripe_checkout_session_id);
CREATE INDEX idx_admins_email ON admins(email);

-- ===========================================
-- ROW LEVEL SECURITY (RLS)
-- ===========================================
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Public read access for active hotels and cars
CREATE POLICY "Hotels are viewable by everyone" ON hotels
  FOR SELECT USING (is_active = true);

CREATE POLICY "Cars are viewable by everyone" ON cars
  FOR SELECT USING (is_active = true);

-- Bookings: anyone can view and create bookings
CREATE POLICY "Anyone can view bookings" ON bookings
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create bookings" ON bookings
  FOR INSERT WITH CHECK (true);

-- Payments: anyone can view payments
CREATE POLICY "Anyone can view payments" ON payments
  FOR SELECT USING (true);

-- ===========================================
-- FUNCTIONS & TRIGGERS
-- ===========================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_hotels_updated_at
  BEFORE UPDATE ON hotels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cars_updated_at
  BEFORE UPDATE ON cars
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admins_updated_at
  BEFORE UPDATE ON admins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Generate booking code function
CREATE OR REPLACE FUNCTION generate_booking_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    code := 'TE' || TO_CHAR(NOW(), 'YYMMDD') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
    SELECT EXISTS(SELECT 1 FROM bookings WHERE booking_code = code) INTO exists_check;
    EXIT WHEN NOT exists_check;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate booking code
CREATE OR REPLACE FUNCTION set_booking_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_code IS NULL OR NEW.booking_code = '' THEN
    NEW.booking_code := generate_booking_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_booking_code
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_booking_code();

-- ===========================================
-- SEED DATA
-- ===========================================

-- Insert sample hotels
INSERT INTO hotels (name_th, name_en, description_th, description_en, location, star_rating, price_per_night, max_guests, room_type_th, room_type_en, amenities_th, amenities_en, images, is_active) VALUES
(
  'ภูเก็ต พาราไดซ์ รีสอร์ท',
  'Phuket Paradise Resort',
  'สัมผัสประสบการณ์สุดพิเศษกับวิลล่าหรูริมชายหาดพร้อมสระว่ายน้ำส่วนตัว วิวทะเลอันดามัน และบริการระดับ 5 ดาว',
  'Experience luxury beachfront villa with private pool, Andaman sea view, and 5-star service',
  'Phuket',
  5,
  45000,
  4,
  'วิลล่าริมทะเล',
  'Beachfront Villa',
  ARRAY['สระว่ายน้ำส่วนตัว', 'วิวทะเล', 'อาหารเช้า', 'รถรับส่งสนามบิน', 'สปา'],
  ARRAY['Private Pool', 'Sea View', 'Breakfast', 'Airport Transfer', 'Spa'],
  ARRAY['https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800'],
  true
),
(
  'เชียงใหม่ เมาท์เทน ลอดจ์',
  'Chiang Mai Mountain Lodge',
  'พักผ่อนท่ามกลางธรรมชาติบนยอดดอย บรรยากาศเงียบสงบ พร้อมกิจกรรมผจญภัยมากมาย',
  'Relax amidst nature on the mountaintop with peaceful atmosphere and adventure activities',
  'Chiang Mai',
  4,
  28000,
  6,
  'ลอดจ์บนดอย',
  'Mountain Lodge',
  ARRAY['วิวภูเขา', 'อาหารเช้า', 'ทัวร์ธรรมชาติ', 'จักรยาน', 'ไฟแคมป์'],
  ARRAY['Mountain View', 'Breakfast', 'Nature Tour', 'Bicycles', 'Campfire'],
  ARRAY['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800', 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800'],
  true
),
(
  'กรุงเทพ สกายไลน์ สวีท',
  'Bangkok Skyline Suite',
  'ห้องสวีทหรูใจกลางกรุงเทพ วิวเมือง 360 องศา ใกล้แหล่งช้อปปิ้งและสถานที่ท่องเที่ยว',
  'Luxury suite in the heart of Bangkok with 360-degree city view, near shopping and attractions',
  'Bangkok',
  5,
  35000,
  2,
  'เพนท์เฮาส์สวีท',
  'Penthouse Suite',
  ARRAY['วิวเมือง 360°', 'อาหารเช้า', 'สระว่ายน้ำดาดฟ้า', 'ฟิตเนส', 'บริการรถลีมูซีน'],
  ARRAY['360° City View', 'Breakfast', 'Rooftop Pool', 'Fitness', 'Limousine Service'],
  ARRAY['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800'],
  true
);

-- Insert sample cars
INSERT INTO cars (name_th, name_en, description_th, description_en, car_type_th, car_type_en, max_passengers, price_per_day, includes_th, includes_en, images, is_active) VALUES
(
  'ฟอร์ด มัสแตง คอนเวอร์ติเบิล',
  'Ford Mustang Convertible',
  'สัมผัสอิสรภาพแห่งการขับขี่กับรถสปอร์ตเปิดประทุนสุดหรู เหมาะสำหรับการเดินทางท่องเที่ยวริมชายหาด',
  'Experience the freedom of driving with this luxury convertible sports car, perfect for beach road trips',
  'รถสปอร์ต',
  'Sports Car',
  2,
  8500,
  ARRAY['ประกันชั้น 1', 'GPS นำทาง', 'คนขับ (เสริม)', 'ส่งรถถึงที่'],
  ARRAY['Full Insurance', 'GPS Navigation', 'Driver (Optional)', 'Door-to-door Delivery'],
  ARRAY['https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800', 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800'],
  true
),
(
  'โตโยต้า อัลฟาร์ด VIP',
  'Toyota Alphard VIP',
  'รถตู้ VIP สำหรับครอบครัวหรือกรุ๊ปทัวร์ พร้อมสิ่งอำนวยความสะดวกครบครัน นั่งสบายตลอดการเดินทาง',
  'VIP van for families or tour groups with full amenities, comfortable throughout your journey',
  'รถตู้ VIP',
  'VIP Van',
  7,
  6500,
  ARRAY['ประกันชั้น 1', 'คนขับ', 'น้ำดื่ม-ขนม', 'WiFi', 'ที่ชาร์จ USB'],
  ARRAY['Full Insurance', 'Driver', 'Drinks & Snacks', 'WiFi', 'USB Charger'],
  ARRAY['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800', 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800'],
  true
),
(
  'เมอร์เซเดส-เบนซ์ S-Class',
  'Mercedes-Benz S-Class',
  'รถหรูระดับผู้นำ สง่างามทุกเส้นทาง เหมาะสำหรับการเดินทางธุรกิจหรือโอกาสพิเศษ',
  'Executive luxury sedan, elegant on every journey, perfect for business travel or special occasions',
  'รถซีดานหรู',
  'Luxury Sedan',
  4,
  12000,
  ARRAY['ประกันชั้น 1', 'คนขับมืออาชีพ', 'น้ำดื่มพรีเมียม', 'WiFi', 'นิตยสาร'],
  ARRAY['Full Insurance', 'Professional Driver', 'Premium Drinks', 'WiFi', 'Magazines'],
  ARRAY['https://images.unsplash.com/photo-1563720360172-67b8f3dce741?w=800', 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800'],
  true
);

-- Insert default admin (password: admin123 - CHANGE THIS IN PRODUCTION!)
-- Password hash for 'admin123' using bcrypt
INSERT INTO admins (email, password_hash, name, role, is_active) VALUES
('admin@travelease.com', '$2a$10$rQnM1jLvKxV5rQnM1jLvKeXvHvT5K5vQnM1jLvKxV5rQnM1jLvKeX', 'Admin', 'admin', true);
