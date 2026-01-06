import {
  MOCK_ADMINS,
  MOCK_BOOKINGS,
  MOCK_PAYMENTS,
  getMockBookings,
  findMockBookingByCode,
} from '../mock-data'
import { MOCK_HOTELS, MOCK_CARS } from '../constants'
import type { Admin, Booking, Hotel, Car, Payment } from '@chiangrai/shared/types'
import { BookingStatus, BookingType } from '@chiangrai/shared/types'

// Helper to build query chain for mock data
type QueryBuilder<T> = {
  eq: (column: string, value: any) => QueryBuilder<T>
  neq: (column: string, value: any) => QueryBuilder<T>
  order: (column: string, options?: { ascending?: boolean }) => QueryBuilder<T>
  limit: (count: number) => Promise<{ data: T[] | null; error: any }>
  single: () => Promise<{ data: T | null; error: any }>
  range: (from: number, to: number) => Promise<{ data: T[] | null; error: any }>
}

function createQueryBuilder<T>(
  data: T[],
  filters: Array<{ column: string; value: any; operator: 'eq' | 'neq' }> = []
): QueryBuilder<T> {
  // Ensure data is always an array
  if (!Array.isArray(data)) {
    data = []
  }
  let filteredData = [...data]
  let orderColumn: string | null = null
  let orderAscending = false
  let limitCount: number | null = null
  let rangeFrom: number | null = null
  let rangeTo: number | null = null

  // Apply filters
  filters.forEach(filter => {
    if (filter.operator === 'eq') {
      filteredData = filteredData.filter(
        (item: any) => item[filter.column] === filter.value
      )
    } else if (filter.operator === 'neq') {
      filteredData = filteredData.filter(
        (item: any) => item[filter.column] !== filter.value
      )
    }
  })

  const builder: QueryBuilder<T> = {
    eq: (column: string, value: any) => {
      return createQueryBuilder<T>(filteredData, [
        ...filters,
        { column, value, operator: 'eq' },
      ])
    },
    neq: (column: string, value: any) => {
      return createQueryBuilder<T>(filteredData, [
        ...filters,
        { column, value, operator: 'neq' },
      ])
    },
    order: (column: string, options?: { ascending?: boolean }) => {
      orderColumn = column
      orderAscending = options?.ascending ?? false
      return builder
    },
    limit: (count: number) => {
      limitCount = count
      return Promise.resolve({ data: filteredData.slice(0, count) as T[], error: null })
    },
    single: () => {
      const result = filteredData[0] || null
      return Promise.resolve({ data: result as T | null, error: result ? null : { message: 'Not found' } })
    },
    range: (from: number, to: number) => {
      rangeFrom = from
      rangeTo = to
      const result = filteredData.slice(from, to + 1)
      return Promise.resolve({ data: result as T[], error: null })
    },
  }

  // Apply ordering if set
  if (orderColumn) {
    filteredData.sort((a: any, b: any) => {
      const aVal = a[orderColumn!]
      const bVal = b[orderColumn!]
      if (aVal < bVal) return orderAscending ? -1 : 1
      if (aVal > bVal) return orderAscending ? 1 : -1
      return 0
    })
  }

  // Apply range if set
  if (rangeFrom !== null && rangeTo !== null) {
    filteredData = filteredData.slice(rangeFrom, rangeTo + 1)
  }

  // Apply limit if set
  if (limitCount !== null) {
    filteredData = filteredData.slice(0, limitCount)
  }

  return builder
}

// Create mock query builder that returns data immediately
function createMockQuery<T>(data: T[] | any): QueryBuilder<T> {
  // Ensure data is always an array
  const safeData = Array.isArray(data) ? data : []
  return createQueryBuilder<T>(safeData)
}

// Mock Supabase client
export function createMockSupabaseClient() {
  return {
    from: (table: string) => {
      // Get data based on table name
      let tableData: any[] = []
      switch (table) {
        case 'admins':
          tableData = MOCK_ADMINS
          break
        case 'hotels':
          tableData = MOCK_HOTELS
          break
        case 'cars':
          tableData = MOCK_CARS
          break
        case 'bookings':
          tableData = MOCK_BOOKINGS
          break
        case 'payments':
          tableData = MOCK_PAYMENTS
          break
        default:
          tableData = []
      }

      return {
        select: (query?: string | any, options?: any) => {
          // Handle Supabase select API: .select('*', { count: 'exact', head: true })
          // If options has 'head: true', return count only
          if (options?.head) {
            return {
              eq: () => ({
                order: () => ({
                  limit: () => Promise.resolve({ data: null, count: tableData.length, error: null }),
                  single: () => Promise.resolve({ data: null, count: tableData.length, error: null }),
                }),
                single: () => Promise.resolve({ data: null, count: tableData.length, error: null }),
                limit: () => Promise.resolve({ data: null, count: tableData.length, error: null }),
              }),
              order: () => ({
                limit: () => Promise.resolve({ data: null, count: tableData.length, error: null }),
              }),
              single: () => Promise.resolve({ data: null, count: tableData.length, error: null }),
              limit: () => Promise.resolve({ data: null, count: tableData.length, error: null }),
            }
          }

          // Ensure tableData is an array
          if (!Array.isArray(tableData)) {
            tableData = []
          }

          // If query is '*', return all fields, otherwise filter
          let selectedData: any[] = tableData

          // Convert query to string if it's an object
          const queryStr = typeof query === 'string' ? query : query ? String(query) : '*'

          // Handle special queries for bookings with relations
          if (table === 'bookings' && queryStr.includes('hotel') && queryStr.includes('car')) {
            selectedData = MOCK_BOOKINGS.map(booking => ({
              ...booking,
              hotel: booking.hotel_id
                ? MOCK_HOTELS.find(h => h.id === booking.hotel_id)
                : undefined,
              car: booking.car_id
                ? MOCK_CARS.find(c => c.id === booking.car_id)
                : undefined,
            }))
          } else if (table === 'bookings' && queryStr.includes('hotel')) {
            selectedData = MOCK_BOOKINGS.map(booking => ({
              ...booking,
              hotel: booking.hotel_id
                ? MOCK_HOTELS.find(h => h.id === booking.hotel_id)
                : undefined,
            }))
          } else if (table === 'bookings' && queryStr.includes('car')) {
            selectedData = MOCK_BOOKINGS.map(booking => ({
              ...booking,
              car: booking.car_id
                ? MOCK_CARS.find(c => c.id === booking.car_id)
                : undefined,
            }))
          }

          // Ensure selectedData is always an array
          if (!Array.isArray(selectedData)) {
            selectedData = []
          }

          return createMockQuery(selectedData)
        },
        insert: (data: any) => {
          return {
            select: (query?: string) => {
              // In mock mode, just return the inserted data
              const newId = `mock-${table}-${Date.now()}`
              const inserted = {
                id: newId,
                ...data,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
              return {
                single: () => Promise.resolve({ data: inserted, error: null }),
              }
            },
          }
        },
        update: (data: any) => {
          return {
            eq: (column: string, value: any) => {
              // In mock mode, just return success
              return Promise.resolve({
                data: { ...data, updated_at: new Date().toISOString() },
                error: null,
              })
            },
          }
        },
        delete: () => {
          return {
            eq: (column: string, value: any) => {
              // In mock mode, just return success
              return Promise.resolve({ data: null, error: null })
            },
          }
        },
      }
    },
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: () =>
        Promise.resolve({
          data: null,
          error: { message: 'Mock mode - use admin login API' },
        }),
      signOut: () => Promise.resolve({ error: null }),
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
  }
}

