/**
 * ============================================================
 * Supabase Database Types - Auto-generated style types
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - กำหนด TypeScript types สำหรับ Supabase database
 *   - ใช้กับ Supabase client เพื่อ type safety
 *
 * การอัพเดท:
 *   - ใช้ supabase gen types typescript เพื่อ regenerate
 *   - หรืออัพเดทด้วยมือตาม schema
 *
 * ============================================================
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ============================================================
// Enums
// ============================================================

export type BookingStatusEnum = 'PENDING' | 'CONFIRMED' | 'PAID' | 'CANCELLED' | 'COMPLETED'
export type BookingTypeEnum = 'HOTEL' | 'CAR' | 'COMBO'
export type PaymentStatusEnum = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED'
export type CurrencyEnum = 'THB' | 'USD' | 'EUR'
export type PartnerTypeEnum = 'HOTEL' | 'DRIVER'

// ============================================================
// Database Interface
// ============================================================

export interface Database {
  public: {
    Tables: {
      // ------------------------------------------------------------
      // Partners
      // ------------------------------------------------------------
      partners: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          type: PartnerTypeEnum
          stripe_account_id: string | null
          stripe_onboarding_complete: boolean | null
          commission_rate: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          type: PartnerTypeEnum
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
          commission_rate?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          type?: PartnerTypeEnum
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean | null
          commission_rate?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // ------------------------------------------------------------
      // Hotels
      // ------------------------------------------------------------
      hotels: {
        Row: {
          id: string
          name_th: string
          name_en: string
          description_th: string
          description_en: string
          location: string | null
          location_th: string | null
          location_en: string | null
          star_rating: number
          price_per_night: number
          base_price_per_night: number
          max_guests: number
          room_type_th: string
          room_type_en: string
          amenities_th: string[]
          amenities_en: string[]
          images: string[]
          partner_id: string | null
          owner_id: string | null
          currency: CurrencyEnum
          is_active: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          name_th: string
          name_en: string
          description_th: string
          description_en: string
          location?: string | null
          location_th?: string | null
          location_en?: string | null
          star_rating: number
          price_per_night: number
          base_price_per_night: number
          max_guests?: number
          room_type_th?: string
          room_type_en?: string
          amenities_th?: string[]
          amenities_en?: string[]
          images?: string[]
          partner_id?: string | null
          owner_id?: string | null
          currency?: CurrencyEnum
          is_active?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name_th?: string
          name_en?: string
          description_th?: string
          description_en?: string
          location?: string | null
          location_th?: string | null
          location_en?: string | null
          star_rating?: number
          price_per_night?: number
          base_price_per_night?: number
          max_guests?: number
          room_type_th?: string
          room_type_en?: string
          amenities_th?: string[]
          amenities_en?: string[]
          images?: string[]
          partner_id?: string | null
          owner_id?: string | null
          currency?: CurrencyEnum
          is_active?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'hotels_partner_id_fkey'
            columns: ['partner_id']
            referencedRelation: 'partners'
            referencedColumns: ['id']
          }
        ]
      }

      // ------------------------------------------------------------
      // Room Types
      // ------------------------------------------------------------
      room_types: {
        Row: {
          id: string
          hotel_id: string
          name_th: string
          name_en: string
          price_per_night: number
          max_guests: number
          total_rooms: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          hotel_id: string
          name_th: string
          name_en: string
          price_per_night: number
          max_guests?: number
          total_rooms?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          hotel_id?: string
          name_th?: string
          name_en?: string
          price_per_night?: number
          max_guests?: number
          total_rooms?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'room_types_hotel_id_fkey'
            columns: ['hotel_id']
            referencedRelation: 'hotels'
            referencedColumns: ['id']
          }
        ]
      }

      // ------------------------------------------------------------
      // Cars
      // ------------------------------------------------------------
      cars: {
        Row: {
          id: string
          name_th: string
          name_en: string
          description_th: string
          description_en: string
          car_type_th: string
          car_type_en: string
          max_passengers: number
          price_per_day: number
          base_price_per_day: number
          includes_th: string[]
          includes_en: string[]
          images: string[]
          partner_id: string | null
          owner_id: string | null
          driver_name: string | null
          driver_surname: string | null
          currency: CurrencyEnum
          is_active: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          name_th: string
          name_en: string
          description_th: string
          description_en: string
          car_type_th: string
          car_type_en: string
          max_passengers?: number
          price_per_day: number
          base_price_per_day: number
          includes_th?: string[]
          includes_en?: string[]
          images?: string[]
          partner_id?: string | null
          owner_id?: string | null
          driver_name?: string | null
          driver_surname?: string | null
          currency?: CurrencyEnum
          is_active?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name_th?: string
          name_en?: string
          description_th?: string
          description_en?: string
          car_type_th?: string
          car_type_en?: string
          max_passengers?: number
          price_per_day?: number
          base_price_per_day?: number
          includes_th?: string[]
          includes_en?: string[]
          images?: string[]
          partner_id?: string | null
          owner_id?: string | null
          driver_name?: string | null
          driver_surname?: string | null
          currency?: CurrencyEnum
          is_active?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'cars_partner_id_fkey'
            columns: ['partner_id']
            referencedRelation: 'partners'
            referencedColumns: ['id']
          }
        ]
      }

      // ------------------------------------------------------------
      // Car Packages
      // ------------------------------------------------------------
      car_packages: {
        Row: {
          id: string
          name_th: string
          name_en: string
          description_th: string | null
          description_en: string | null
          duration_hours: number
          duration_days: number
          max_passengers: number
          price_thb: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name_th: string
          name_en: string
          description_th?: string | null
          description_en?: string | null
          duration_hours?: number
          duration_days?: number
          max_passengers?: number
          price_thb: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name_th?: string
          name_en?: string
          description_th?: string | null
          description_en?: string | null
          duration_hours?: number
          duration_days?: number
          max_passengers?: number
          price_thb?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // ------------------------------------------------------------
      // Users
      // ------------------------------------------------------------
      users: {
        Row: {
          id: string
          email: string
          password_hash: string
          name: string
          role: 'admin' | 'partner' | 'user'
          google_id: string | null
          phone: string | null
          is_active: boolean
          email_verified: boolean
          email_verified_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          password_hash?: string | null
          name: string
          role?: 'admin' | 'partner' | 'user'
          google_id?: string | null
          phone?: string | null
          is_active?: boolean
          email_verified?: boolean
          email_verified_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string
          name?: string
          role?: 'admin' | 'partner' | 'user'
          google_id?: string | null
          phone?: string | null
          is_active?: boolean
          email_verified?: boolean
          email_verified_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // ------------------------------------------------------------
      // Admins
      // ------------------------------------------------------------
      admins: {
        Row: {
          id: string
          email: string
          password_hash: string
          name: string
          role: string
          is_active: boolean
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          password_hash: string
          name: string
          role?: string
          is_active?: boolean
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string
          name?: string
          role?: string
          is_active?: boolean
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // ------------------------------------------------------------
      // Bookings
      // ------------------------------------------------------------
      bookings: {
        Row: {
          id: string
          booking_code: string
          booking_type: BookingTypeEnum
          hotel_id: string | null
          car_id: string | null
          room_type_id: string | null
          check_in_date: string
          check_out_date: string
          number_of_guests: number
          customer_name: string
          customer_email: string
          customer_phone: string
          customer_line: string | null
          special_requests: string | null
          total_price: number
          currency: CurrencyEnum
          status: BookingStatusEnum
          cancelled_at: string | null
          cancelled_by: string | null
          cancellation_reason: string | null
          refund_amount: number
          refund_percentage: number
          refund_status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_code?: string
          booking_type: BookingTypeEnum
          hotel_id?: string | null
          car_id?: string | null
          room_type_id?: string | null
          check_in_date: string
          check_out_date: string
          number_of_guests?: number
          customer_name: string
          customer_email: string
          customer_phone: string
          customer_line?: string | null
          special_requests?: string | null
          total_price: number
          currency?: CurrencyEnum
          status?: BookingStatusEnum
          cancelled_at?: string | null
          cancelled_by?: string | null
          cancellation_reason?: string | null
          refund_amount?: number
          refund_percentage?: number
          refund_status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_code?: string
          booking_type?: BookingTypeEnum
          hotel_id?: string | null
          car_id?: string | null
          room_type_id?: string | null
          check_in_date?: string
          check_out_date?: string
          number_of_guests?: number
          customer_name?: string
          customer_email?: string
          customer_phone?: string
          customer_line?: string | null
          special_requests?: string | null
          total_price?: number
          currency?: CurrencyEnum
          status?: BookingStatusEnum
          cancelled_at?: string | null
          cancelled_by?: string | null
          cancellation_reason?: string | null
          refund_amount?: number
          refund_percentage?: number
          refund_status?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'bookings_hotel_id_fkey'
            columns: ['hotel_id']
            referencedRelation: 'hotels'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'bookings_car_id_fkey'
            columns: ['car_id']
            referencedRelation: 'cars'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'bookings_room_type_id_fkey'
            columns: ['room_type_id']
            referencedRelation: 'room_types'
            referencedColumns: ['id']
          }
        ]
      }

      // ------------------------------------------------------------
      // Exchange Rates
      // ------------------------------------------------------------
      exchange_rates: {
        Row: {
          id: string
          base_currency: string
          target_currency: string
          rate: number
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          base_currency: string
          target_currency: string
          rate: number
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          base_currency?: string
          target_currency?: string
          rate?: number
          updated_at?: string
          created_at?: string
        }
        Relationships: []
      }

      // ------------------------------------------------------------
      // Payments
      // ------------------------------------------------------------
      payments: {
        Row: {
          id: string
          booking_id: string
          stripe_payment_intent_id: string | null
          stripe_checkout_session_id: string | null
          amount: number
          currency: CurrencyEnum
          status: PaymentStatusEnum
          paid_at: string | null
          stripe_refund_id: string | null
          refund_amount: number
          refunded_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          stripe_payment_intent_id?: string | null
          stripe_checkout_session_id?: string | null
          amount: number
          currency?: CurrencyEnum
          status?: PaymentStatusEnum
          paid_at?: string | null
          stripe_refund_id?: string | null
          refund_amount?: number
          refunded_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          stripe_payment_intent_id?: string | null
          stripe_checkout_session_id?: string | null
          amount?: number
          currency?: CurrencyEnum
          status?: PaymentStatusEnum
          paid_at?: string | null
          stripe_refund_id?: string | null
          refund_amount?: number
          refunded_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'payments_booking_id_fkey'
            columns: ['booking_id']
            referencedRelation: 'bookings'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_booking_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      booking_status: BookingStatusEnum
      booking_type: BookingTypeEnum
      payment_status: PaymentStatusEnum
      currency: CurrencyEnum
      partner_type: PartnerTypeEnum
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ============================================================
// Helper Types
// ============================================================

/** Type alias สำหรับ Table Row */
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']

/** Type alias สำหรับ Table Insert */
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']

/** Type alias สำหรับ Table Update */
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

/** Type alias สำหรับ Enums */
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
