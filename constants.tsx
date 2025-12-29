
import { Hotel, Car } from './types';

export const MOCK_HOTELS: Hotel[] = [
  {
    id: 'p1',
    name: 'Phuket Ocean Drive Package',
    description: 'สัมผัสประสบการณ์การพักผ่อนระดับ Ultra-Luxury ด้วยแพ็คเกจเช่ารถเปิดประทุน Mustang Convertible ขับเลียบชายหาดภูเก็ต พร้อมเข้าพักที่ Pool Villa ส่วนตัวที่มองเห็นวิวทะเล 180 องศา ดิวนี้รวมบริการ Butler ส่วนตัวและดินเนอร์สุดหรูบนดาดฟ้าเรือใบ',
    location: 'Phuket, Thailand',
    star_rating: 5,
    price_per_night: 12900,
    max_guests: 2,
    room_type: 'Luxury Car + Pool Villa',
    amenities: ['Convertible Car', 'Private Pool', 'VIP Airport Transfer', 'Sunset Dinner', 'Private Butler', '24/7 Concierge'],
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
    name: 'Chiang Mai Mist Explorer',
    description: 'เปลี่ยนบรรยากาศไปรับลมหนาวที่เชียงใหม่ ขับ SUV 4x4 ตะลุยดอยอินทนนท์และแม่กำปอง พักรีสอร์ทสไตล์โมเดิร์นล้านนากลางหุบเขา ดิวพิเศษนี้รวมชุดน้ำชา Afternoon Tea และบริการถ่ายรูปโดยช่างภาพมืออาชีพตลอดทริป',
    location: 'Chiang Mai, Thailand',
    star_rating: 4,
    price_per_night: 5500,
    max_guests: 4,
    room_type: 'SUV + Mountain Resort',
    amenities: ['4x4 SUV', 'Lanna Breakfast', 'Local Guide', 'Insurance Included', 'Professional Photographer'],
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
    name: 'Bangkok Night Cruise & Drive',
    description: 'เปิดมุมมองใหม่ของกรุงเทพฯ ยามค่ำคืนด้วยรถยุโรปพรีเมียมส่วนตัว พักห้องสวีทริมแม่น้ำเจ้าพระยา พร้อมดินเนอร์ล่องเรือสำราญชมวิววัดอรุณฯ และเข้าใช้บริการ Rooftop Bar ระดับโลกได้แบบ Fast Track',
    location: 'Bangkok, Thailand',
    star_rating: 5,
    price_per_night: 8900,
    max_guests: 2,
    room_type: 'Sedan + Riverside Suite',
    amenities: ['European Sedan', 'Dinner Cruise', 'Rooftop Bar Access', 'Champagne Welcome', 'Riverside Breakfast'],
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
    name: 'Mustang Convertible 2024',
    description: 'ไอคอนิกของความเท่ รถเปิดประทุนยอดนิยมสำหรับการเที่ยวทะเล ถ่ายรูปสวย ขับสนุก เครื่องยนต์แรงสะใจ พร้อมระบบเสียงพรีเมียม',
    car_type: 'Sport Convertible',
    max_passengers: 4,
    price_per_day: 9500,
    includes: ['First Class Insurance', 'Cleaned & Disinfected', 'Full Tank', 'Apple CarPlay'],
    images: ['https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&q=80&w=1200'],
    is_active: true,
  },
  {
    id: 'c2',
    name: 'Toyota Alphard VIP',
    description: 'ที่สุดของความสะดวกสบาย เหมาะสำหรับการเที่ยวแบบครอบครัวหรือผู้ใหญ่ เบาะนวดไฟฟ้าทั้งคัน มีตู้เย็นขนาดเล็ก และระบบความบันเทิงครบวงจร',
    car_type: 'VIP Van',
    max_passengers: 7,
    price_per_day: 5500,
    includes: ['Driver Available', 'WIFI', 'Water & Refreshment', 'VIP Lane Service'],
    images: ['https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&q=80&w=1200'],
    is_active: true,
  }
];

export const NAVIGATION = [
  { name: 'หน้าหลัก', path: '/' },
  { name: 'แพ็คเกจเที่ยว', path: '/hotels' },
  { name: 'รถเช่ารายวัน', path: '/cars' },
  { name: 'ติดต่อเรา', path: '/contact' },
];
