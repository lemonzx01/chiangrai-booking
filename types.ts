
export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  PAID = 'PAID'
}

export enum BookingType {
  HOTEL = 'HOTEL',
  CAR = 'CAR',
  COMBO = 'COMBO'
}

export interface Hotel {
  id: string;
  name: string;
  description: string;
  location: string;
  star_rating: number;
  price_per_night: number;
  max_guests: number;
  room_type: string;
  amenities: string[];
  images: string[];
  is_active: boolean;
}

export interface Car {
  id: string;
  name: string;
  description: string;
  car_type: string;
  max_passengers: number;
  price_per_day: number;
  includes: string[];
  images: string[];
  is_active: boolean;
}

export interface Booking {
  id: string;
  booking_code: string;
  booking_type: BookingType;
  hotel_id?: string;
  car_id?: string;
  check_in_date: string;
  check_out_date: string;
  number_of_guests: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_line: string;
  total_price: number;
  status: BookingStatus;
  created_at: string;
}

export interface AppState {
  hotels: Hotel[];
  cars: Car[];
  bookings: Booking[];
}
