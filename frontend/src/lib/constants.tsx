import { Hotel, Car } from './types';

export const MOCK_HOTELS: Hotel[] = [
  {
    id: 'p1',
    name: {
      th: 'แพ็คเกจขับเลียบทะเลภูเก็ต',
      en: 'Phuket Ocean Drive Package',
    },
    description: {
      th: 'สัมผัสประสบการณ์การพักผ่อนระดับ Ultra-Luxury ด้วยแพ็คเกจเช่ารถเปิดประทุน Mustang Convertible ขับเลียบชายหาดภูเก็ต พร้อมเข้าพักที่ Pool Villa ส่วนตัวที่มองเห็นวิวทะเล 180 องศา ดีลนี้รวมบริการ Butler ส่วนตัวและดินเนอร์สุดหรูบนดาดฟ้าเรือใบ',
      en: 'Enjoy an ultra-luxury escape with a Mustang Convertible coastal drive in Phuket, paired with a private pool villa featuring a 180° sea view. This deal includes a personal butler and an exclusive rooftop yacht dinner.',
    },
    location: 'Phuket, Thailand',
    star_rating: 5,
    price_per_night: 12900,
    max_guests: 2,
    room_type: {
      th: 'รถหรู + พูลวิลล่า',
      en: 'Luxury Car + Pool Villa',
    },
    amenities: {
      th: ['รถเปิดประทุน', 'สระว่ายน้ำส่วนตัว', 'รับส่งสนามบิน VIP', 'ดินเนอร์ชมพระอาทิตย์ตก', 'Butler ส่วนตัว', 'Concierge 24/7'],
      en: ['Convertible Car', 'Private Pool', 'VIP Airport Transfer', 'Sunset Dinner', 'Personal Butler', '24/7 Concierge'],
    },
    images: [
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&q=80&w=800'
    ],
    is_active: true,
  },
  {
    id: 'p2',
    name: {
      th: 'ตะลุยหมอกเชียงใหม่',
      en: 'Chiang Mai Mist Explorer',
    },
    description: {
      th: 'เปลี่ยนบรรยากาศไปรับลมหนาวที่เชียงใหม่ ขับ SUV 4x4 ตะลุยดอยอินทนนท์และแม่กำปอง พักรีสอร์ทสไตล์โมเดิร์นล้านนากลางหุบเขา ดีลพิเศษนี้รวมชุดน้ำชา Afternoon Tea และบริการถ่ายรูปโดยช่างภาพมืออาชีพตลอดทริป',
      en: 'Switch to cool mountain vibes in Chiang Mai. Drive a 4x4 SUV through Doi Inthanon and Mae Kampong, and stay at a modern Lanna-style resort in the valley. Includes afternoon tea and a professional photographer throughout your trip.',
    },
    location: 'Chiang Mai, Thailand',
    star_rating: 4,
    price_per_night: 5500,
    max_guests: 4,
    room_type: {
      th: 'SUV + รีสอร์ทภูเขา',
      en: 'SUV + Mountain Resort',
    },
    amenities: {
      th: ['SUV 4x4', 'อาหารเช้าสไตล์ล้านนา', 'ไกด์ท้องถิ่น', 'รวมประกัน', 'ช่างภาพมืออาชีพ'],
      en: ['4x4 SUV', 'Lanna Breakfast', 'Local Guide', 'Insurance Included', 'Professional Photographer'],
    },
    images: [
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1527004013197-933c4bb611b3?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800'
    ],
    is_active: true,
  },
  {
    id: 'p3',
    name: {
      th: 'กรุงเทพยามค่ำ: ล่องเรือ & ขับชิล',
      en: 'Bangkok Night Cruise & Drive',
    },
    description: {
      th: 'เปิดมุมมองใหม่ของกรุงเทพฯ ยามค่ำคืนด้วยรถยุโรปพรีเมียมส่วนตัว พักห้องสวีทริมแม่น้ำเจ้าพระยา พร้อมดินเนอร์ล่องเรือสำราญชมวิววัดอรุณฯ และเข้าใช้บริการ Rooftop Bar ระดับโลกได้แบบ Fast Track',
      en: 'Discover Bangkok at night with a premium European car. Stay in a riverside suite on the Chao Phraya River, enjoy a dinner cruise with Wat Arun views, and get fast-track access to a world-class rooftop bar.',
    },
    location: 'Bangkok, Thailand',
    star_rating: 5,
    price_per_night: 8900,
    max_guests: 2,
    room_type: {
      th: 'ซีดาน + ห้องสวีทริมแม่น้ำ',
      en: 'Sedan + Riverside Suite',
    },
    amenities: {
      th: ['รถยุโรปพรีเมียม', 'ดินเนอร์ล่องเรือ', 'เข้า Rooftop Bar', 'แชมเปญต้อนรับ', 'อาหารเช้าริมน้ำ'],
      en: ['European Sedan', 'Dinner Cruise', 'Rooftop Bar Access', 'Champagne Welcome', 'Riverside Breakfast'],
    },
    images: [
      'https://images.unsplash.com/photo-1552432552-06c099fb3435?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1563911546344-647715ed5d76?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1598605272254-16f0c0eeec40?auto=format&fit=crop&q=80&w=800'
    ],
    is_active: true,
  }
];

export const MOCK_CARS: Car[] = [
  {
    id: 'c1',
    name: {
      th: 'Mustang Convertible 2024',
      en: 'Mustang Convertible 2024',
    },
    description: {
      th: 'ไอคอนิกของความเท่ รถเปิดประทุนยอดนิยมสำหรับการเที่ยวทะเล ถ่ายรูปสวย ขับสนุก เครื่องยนต์แรงสะใจ พร้อมระบบเสียงพรีเมียม',
      en: 'An iconic convertible perfect for coastal trips—photogenic, fun to drive, powerful engine, and a premium sound system.',
    },
    car_type: {
      th: 'สปอร์ตเปิดประทุน',
      en: 'Sport Convertible',
    },
    max_passengers: 4,
    price_per_day: 9500,
    includes: {
      th: ['ประกันชั้นหนึ่ง', 'ทำความสะอาดและฆ่าเชื้อ', 'น้ำมันเต็มถัง', 'Apple CarPlay'],
      en: ['First Class Insurance', 'Cleaned & Disinfected', 'Full Tank', 'Apple CarPlay'],
    },
    images: ['https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&q=80&w=1200'],
    is_active: true,
  },
  {
    id: 'c2',
    name: {
      th: 'Toyota Alphard VIP',
      en: 'Toyota Alphard VIP',
    },
    description: {
      th: 'ที่สุดของความสะดวกสบาย เหมาะสำหรับการเที่ยวแบบครอบครัวหรือผู้ใหญ่ เบาะนวดไฟฟ้าทั้งคัน มีตู้เย็นขนาดเล็ก และระบบความบันเทิงครบวงจร',
      en: 'Ultimate comfort for families or executive travel—full-seat massage, a mini fridge, and complete entertainment features.',
    },
    car_type: {
      th: 'รถตู้ VIP',
      en: 'VIP Van',
    },
    max_passengers: 7,
    price_per_day: 5500,
    includes: {
      th: ['มีคนขับให้เลือก', 'WIFI', 'น้ำดื่มและของว่าง', 'บริการช่องทางพิเศษ'],
      en: ['Driver Available', 'WIFI', 'Water & Refreshment', 'VIP Lane Service'],
    },
    images: ['https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&q=80&w=1200'],
    is_active: true,
  }
];

export const NAVIGATION = [
  { key: 'home', name: 'หน้าหลัก', path: '/' },
  { key: 'packages', name: 'แพ็คเกจเที่ยว', path: '/hotels' },
  { key: 'cars', name: 'รถเช่ารายวัน', path: '/cars' },
  { key: 'contact', name: 'ติดต่อเรา', path: '/contact' },
];
