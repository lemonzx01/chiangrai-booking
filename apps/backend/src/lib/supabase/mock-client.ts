/**
 * ============================================================
 * Mock Supabase Client
 * ============================================================
 *
 * A thenable query builder that mimics enough of @supabase/supabase-js
 * so every API route in this repo can run end-to-end without a real
 * Supabase project. Supports:
 *   - .select/.insert/.update/.delete/.upsert
 *   - .eq/.neq/.gt/.gte/.lt/.lte/.in/.not/.ilike/.like/.or
 *   - .order/.limit/.range/.single/.maybeSingle
 *   - count: 'exact' + head: true
 *   - .rpc(name, params) for stored procedures
 *   - auth.* and storage.* no-op shims
 *
 * The builder itself is a thenable, so `await supabase.from('x').select('*').eq('a', 1)`
 * works even without calling .single/.limit/.range.
 * ============================================================
 */

import {
  MOCK_ADMINS,
  MOCK_BOOKINGS,
  MOCK_PAYMENTS,
  MOCK_USERS,
} from '../mock-data'
import { MOCK_HOTELS, MOCK_CARS } from '../constants'

// ============================================================
// In-memory data tables
// ============================================================

type Row = Record<string, any>

const tables: Record<string, Row[]> = {
  admins: [...MOCK_ADMINS],
  users: [...MOCK_USERS],
  hotels: [...MOCK_HOTELS],
  cars: [...MOCK_CARS],
  bookings: [...MOCK_BOOKINGS],
  payments: [...MOCK_PAYMENTS],
  room_types: [],
  partners: [],
  coupons: [],
  reviews: [],
  exchange_rates: [],
  car_packages: [],
  processed_webhooks: [],
  login_attempts: [],
  admin_notifications: [],
  availability_blocks: [],
  admin_audit_log: [],
  email_campaigns: [],
  email_unsubscribes: [],
  user_wishlist: [],
}

// Generate room_types on demand from hotels (keeps mock hotels simple)
function ensureRoomTypes() {
  if (tables.room_types.length > 0) return
  const uuid = (prefix: string) => {
    const clean = prefix.replace(/-/g, '').substring(0, 20)
    return [
      clean.padEnd(8, '0').substring(0, 8),
      '0000',
      '4000',
      '8000',
      clean.padEnd(12, '0').substring(0, 12),
    ].join('-')
  }
  tables.room_types = (tables.hotels as any[]).map((hotel) => ({
    id: uuid(hotel.id),
    hotel_id: hotel.id,
    name_th: hotel.room_type_th || 'ห้องมาตรฐาน',
    name_en: hotel.room_type_en || 'Standard Room',
    price_per_night: hotel.price_per_night,
    base_price_per_night: hotel.base_price_per_night || hotel.price_per_night,
    max_guests: hotel.max_guests,
    total_rooms: 5,
    is_active: true,
    created_at: hotel.created_at,
    updated_at: hotel.created_at,
  }))
}

function getTable(name: string): Row[] {
  if (name === 'room_types') ensureRoomTypes()
  if (!(name in tables)) tables[name] = []
  return tables[name]
}

// ============================================================
// Filter application
// ============================================================

type FilterOp =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'not'
  | 'ilike'
  | 'like'
  | 'or'
  | 'is'

interface Filter {
  op: FilterOp
  column: string
  value: any
  extra?: any
}

function getField(row: Row, column: string): any {
  if (column.includes('.')) {
    const parts = column.split('.')
    let current: any = row
    for (const p of parts) {
      if (current == null) return undefined
      current = current[p]
    }
    return current
  }
  return row[column]
}

function likeMatch(value: any, pattern: string, caseInsensitive: boolean): boolean {
  if (typeof value !== 'string') return false
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/%/g, '.*')
    .replace(/_/g, '.')
  const re = new RegExp('^' + escaped + '$', caseInsensitive ? 'i' : '')
  return re.test(value)
}

function evalOrClause(row: Row, clause: string): boolean {
  // "col.op.value,col.op.value" — each top-level comma-separated piece is an OR branch
  const pieces = splitTopLevel(clause, ',')
  return pieces.some((piece) => evalOrAtom(row, piece.trim()))
}

function splitTopLevel(s: string, sep: string): string[] {
  const out: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (c === '(') depth++
    else if (c === ')') depth--
    else if (c === sep && depth === 0) {
      out.push(s.slice(start, i))
      start = i + 1
    }
  }
  out.push(s.slice(start))
  return out
}

function evalOrAtom(row: Row, atom: string): boolean {
  // "column.op.value" e.g. "name_th.ilike.%foo%"
  const firstDot = atom.indexOf('.')
  if (firstDot === -1) return false
  const col = atom.slice(0, firstDot)
  const rest = atom.slice(firstDot + 1)
  const secondDot = rest.indexOf('.')
  if (secondDot === -1) return false
  const op = rest.slice(0, secondDot)
  const rawVal = rest.slice(secondDot + 1)
  const field = getField(row, col)
  switch (op) {
    case 'eq':
      return String(field) === rawVal
    case 'neq':
      return String(field) !== rawVal
    case 'gt':
      return Number(field) > Number(rawVal)
    case 'gte':
      return Number(field) >= Number(rawVal)
    case 'lt':
      return Number(field) < Number(rawVal)
    case 'lte':
      return Number(field) <= Number(rawVal)
    case 'like':
      return likeMatch(field, rawVal, false)
    case 'ilike':
      return likeMatch(field, rawVal, true)
    case 'is':
      if (rawVal === 'null') return field == null
      return String(field) === rawVal
    default:
      return false
  }
}

function applyFilter(row: Row, f: Filter): boolean {
  const v = getField(row, f.column)
  switch (f.op) {
    case 'eq':
      return v === f.value
    case 'neq':
      return v !== f.value
    case 'gt':
      return Number(v) > Number(f.value)
    case 'gte':
      return Number(v) >= Number(f.value)
    case 'lt':
      return Number(v) < Number(f.value)
    case 'lte':
      return Number(v) <= Number(f.value)
    case 'in':
      return Array.isArray(f.value) && f.value.includes(v)
    case 'like':
      return likeMatch(v, String(f.value), false)
    case 'ilike':
      return likeMatch(v, String(f.value), true)
    case 'is':
      if (f.value === null) return v == null
      return v === f.value
    case 'not': {
      // "not(col, op, value)"
      const inner: Filter = {
        op: f.extra as FilterOp,
        column: f.column,
        value: f.value,
      }
      return !applyFilter(row, inner)
    }
    case 'or':
      return evalOrClause(row, String(f.value))
    default:
      return true
  }
}

// ============================================================
// Query builder
// ============================================================

interface BuilderState {
  table: string
  filters: Filter[]
  orderBy: { column: string; ascending: boolean } | null
  limitN: number | null
  rangeFrom: number | null
  rangeTo: number | null
  mode: 'select' | 'insert' | 'update' | 'delete' | 'upsert'
  payload: any
  selectQuery: string
  countMode: 'exact' | 'planned' | 'estimated' | null
  headOnly: boolean
}

function resolveSelected(state: BuilderState): Row[] {
  const data = getTable(state.table)
  let rows = [...data]

  // Simple relation expansion for bookings/payments (best-effort)
  if (state.table === 'bookings' && /hotel|car|room_type/i.test(state.selectQuery)) {
    rows = rows.map((b) => ({
      ...b,
      hotel: b.hotel_id ? tables.hotels.find((h) => h.id === b.hotel_id) : undefined,
      car: b.car_id ? tables.cars.find((c) => c.id === b.car_id) : undefined,
      room_type: b.room_type_id
        ? tables.room_types.find((r) => r.id === b.room_type_id)
        : undefined,
    }))
  } else if (state.table === 'payments' && /booking/i.test(state.selectQuery)) {
    rows = rows.map((p) => ({
      ...p,
      booking: tables.bookings.find((b) => b.id === p.booking_id),
    }))
  } else if (state.table === 'reviews' && /(hotel|car)/i.test(state.selectQuery)) {
    rows = rows.map((r) => ({
      ...r,
      hotel: r.hotel_id ? tables.hotels.find((h) => h.id === r.hotel_id) : undefined,
      car: r.car_id ? tables.cars.find((c) => c.id === r.car_id) : undefined,
    }))
  }

  for (const f of state.filters) {
    rows = rows.filter((row) => applyFilter(row, f))
  }

  if (state.orderBy) {
    const { column, ascending } = state.orderBy
    rows.sort((a, b) => {
      const av = getField(a, column)
      const bv = getField(b, column)
      if (av == null && bv == null) return 0
      if (av == null) return ascending ? -1 : 1
      if (bv == null) return ascending ? 1 : -1
      if (av < bv) return ascending ? -1 : 1
      if (av > bv) return ascending ? 1 : -1
      return 0
    })
  }

  if (state.rangeFrom !== null && state.rangeTo !== null) {
    rows = rows.slice(state.rangeFrom, state.rangeTo + 1)
  }
  if (state.limitN !== null) {
    rows = rows.slice(0, state.limitN)
  }

  return rows
}

interface MockResult<T = any> {
  data: T | null
  error: any
  count?: number | null
}

function createBuilder(initial: BuilderState) {
  const state: BuilderState = initial

  const self: any = {
    // ----- filter ops -----
    eq: (column: string, value: any) => {
      state.filters.push({ op: 'eq', column, value })
      return self
    },
    neq: (column: string, value: any) => {
      state.filters.push({ op: 'neq', column, value })
      return self
    },
    gt: (column: string, value: any) => {
      state.filters.push({ op: 'gt', column, value })
      return self
    },
    gte: (column: string, value: any) => {
      state.filters.push({ op: 'gte', column, value })
      return self
    },
    lt: (column: string, value: any) => {
      state.filters.push({ op: 'lt', column, value })
      return self
    },
    lte: (column: string, value: any) => {
      state.filters.push({ op: 'lte', column, value })
      return self
    },
    in: (column: string, values: any[]) => {
      state.filters.push({ op: 'in', column, value: values })
      return self
    },
    like: (column: string, pattern: string) => {
      state.filters.push({ op: 'like', column, value: pattern })
      return self
    },
    ilike: (column: string, pattern: string) => {
      state.filters.push({ op: 'ilike', column, value: pattern })
      return self
    },
    is: (column: string, value: any) => {
      state.filters.push({ op: 'is', column, value })
      return self
    },
    not: (column: string, op: string, value: any) => {
      state.filters.push({ op: 'not', column, value, extra: op })
      return self
    },
    or: (clause: string) => {
      state.filters.push({ op: 'or', column: '', value: clause })
      return self
    },
    filter: (column: string, op: string, value: any) => {
      state.filters.push({ op: op as FilterOp, column, value })
      return self
    },

    // ----- ordering / pagination -----
    order: (column: string, opts?: { ascending?: boolean }) => {
      state.orderBy = { column, ascending: opts?.ascending ?? false }
      return self
    },
    limit: (n: number) => {
      state.limitN = n
      return self
    },
    range: (from: number, to: number) => {
      state.rangeFrom = from
      state.rangeTo = to
      return self
    },

    // ----- terminators -----
    single: async (): Promise<MockResult> => {
      const result = await self
      const rows = (result.data as Row[]) || []
      if (rows.length === 0) {
        return { data: null, error: { message: 'Not found', code: 'PGRST116' } }
      }
      return { data: rows[0], error: null }
    },
    maybeSingle: async (): Promise<MockResult> => {
      const result = await self
      const rows = (result.data as Row[]) || []
      return { data: rows[0] || null, error: null }
    },

    // ----- mutations chain continuation (select after insert/update/upsert) -----
    select: (query?: string, options?: { count?: any; head?: boolean }) => {
      state.selectQuery = typeof query === 'string' ? query : '*'
      state.countMode = options?.count || null
      state.headOnly = !!options?.head
      if (state.mode !== 'select' && state.mode !== 'insert' && state.mode !== 'update' && state.mode !== 'upsert') {
        // shouldn't happen, but be defensive
      }
      return self
    },

    // ----- thenable (await the builder directly) -----
    then: (onFulfilled: (v: MockResult) => any, onRejected?: (e: any) => any) => {
      try {
        let result: MockResult
        if (state.mode === 'select') {
          const rows = resolveSelected(state)
          const count = state.countMode ? rows.length : undefined
          if (state.headOnly) {
            result = { data: null, error: null, count }
          } else {
            result = { data: rows, error: null, count }
          }
        } else if (state.mode === 'insert') {
          const inserted = performInsert(state)
          result = { data: inserted, error: null }
        } else if (state.mode === 'update') {
          const updated = performUpdate(state)
          result = { data: updated, error: null }
        } else if (state.mode === 'delete') {
          const deleted = performDelete(state)
          result = { data: deleted, error: null }
        } else if (state.mode === 'upsert') {
          const upserted = performUpsert(state)
          result = { data: upserted, error: null }
        } else {
          result = { data: null, error: { message: 'Unknown mode' } }
        }
        return Promise.resolve(result).then(onFulfilled, onRejected)
      } catch (err: any) {
        // Mimic PG unique violation for idempotency table
        if (err?.__pg_code) {
          return Promise.resolve({ data: null, error: { code: err.__pg_code, message: err.message } }).then(onFulfilled, onRejected)
        }
        if (onRejected) return Promise.resolve(onRejected(err))
        return Promise.reject(err)
      }
    },
  }

  return self
}

// ============================================================
// Mutation helpers
// ============================================================

function newId(table: string): string {
  // Use UUID-shaped id so downstream code that validates UUIDs still works.
  const randHex = (n: number) =>
    Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('')
  return `${randHex(8)}-${randHex(4)}-4${randHex(3)}-8${randHex(3)}-${randHex(12)}`
}

function performInsert(state: BuilderState): Row[] {
  const arr = getTable(state.table)
  const toInsert = Array.isArray(state.payload) ? state.payload : [state.payload]
  const inserted: Row[] = []

  for (const record of toInsert) {
    // Unique-key enforcement for idempotency table
    if (state.table === 'processed_webhooks' && record.event_id) {
      if (arr.some((r) => r.event_id === record.event_id)) {
        const err: any = new Error('duplicate key value violates unique constraint')
        err.__pg_code = '23505'
        throw err
      }
    }
    const row = {
      id: record.id || newId(state.table),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...record,
    }
    // Generate booking_code on insert if missing
    if (state.table === 'bookings' && !row.booking_code) {
      const date = new Date()
      const yy = String(date.getFullYear()).slice(-2)
      const mm = String(date.getMonth() + 1).padStart(2, '0')
      const dd = String(date.getDate()).padStart(2, '0')
      const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
      row.booking_code = `TE${yy}${mm}${dd}-${rand}`
    }
    if (state.table === 'bookings' && !row.status) row.status = 'PENDING'
    arr.push(row)
    inserted.push(row)
  }
  return inserted
}

function performUpdate(state: BuilderState): Row[] {
  const arr = getTable(state.table)
  const updated: Row[] = []
  for (let i = 0; i < arr.length; i++) {
    if (state.filters.every((f) => applyFilter(arr[i], f))) {
      arr[i] = {
        ...arr[i],
        ...state.payload,
        updated_at: new Date().toISOString(),
      }
      updated.push(arr[i])
    }
  }
  return updated
}

function performDelete(state: BuilderState): Row[] {
  const arr = getTable(state.table)
  const deleted: Row[] = []
  for (let i = arr.length - 1; i >= 0; i--) {
    if (state.filters.every((f) => applyFilter(arr[i], f))) {
      deleted.push(arr[i])
      arr.splice(i, 1)
    }
  }
  return deleted
}

function performUpsert(state: BuilderState): Row[] {
  const arr = getTable(state.table)
  const toUpsert = Array.isArray(state.payload) ? state.payload : [state.payload]
  const upserted: Row[] = []
  const conflictCols = (state as any).onConflict
    ? String((state as any).onConflict).split(',').map((s) => s.trim())
    : ['id']
  for (const record of toUpsert) {
    const idx = arr.findIndex((r) =>
      conflictCols.every((c) => r[c] === record[c])
    )
    if (idx !== -1) {
      arr[idx] = {
        ...arr[idx],
        ...record,
        updated_at: new Date().toISOString(),
      }
      upserted.push(arr[idx])
    } else {
      const row = {
        id: record.id || newId(state.table),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...record,
      }
      arr.push(row)
      upserted.push(row)
    }
  }
  return upserted
}

// ============================================================
// Mock RPC registry
// ============================================================

/**
 * Normalize RPC params from either { p_payload: {...} } or
 * { p_room_type_id, p_check_in_date, ... } shape into a flat
 * payload object the handler can work with.
 */
function normalizeBookingParams(params: any): Record<string, any> {
  if (params?.p_payload) return params.p_payload
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(params || {})) {
    out[k.startsWith('p_') ? k.slice(2) : k] = v
  }
  return out
}

function hasBlockingOverlapMock(
  hotelId: string | null,
  roomTypeId: string | null,
  carId: string | null,
  checkIn: string,
  checkOut: string
): boolean {
  return tables.availability_blocks.some((b) => {
    if (b.start_date >= checkOut) return false
    if (b.end_date <= checkIn) return false
    if (carId && b.car_id === carId) return true
    if (roomTypeId && b.room_type_id === roomTypeId) return true
    if (hotelId && b.hotel_id === hotelId && !b.room_type_id) {
      // Hotel-wide block applies to any room in that hotel
      return true
    }
    return false
  })
}

const rpcHandlers: Record<string, (params: any) => any> = {
  has_blocking_overlap: (params: any) => {
    const p = params || {}
    return hasBlockingOverlapMock(
      p.p_hotel_id || null,
      p.p_room_type_id || null,
      p.p_car_id || null,
      p.p_start_date,
      p.p_end_date
    )
  },

  // Atomic booking creation for Phase 4.1 — race-safe even in mock
  // (JS is single-threaded so no real lock is needed).
  create_booking_atomic: (params: any) => {
    const p = normalizeBookingParams(params)
    const roomTypeId = p.room_type_id
    if (hasBlockingOverlapMock(p.hotel_id || null, roomTypeId || null, null, p.check_in_date, p.check_out_date)) {
      const err: any = new Error('DATES_BLOCKED')
      err.code = 'P0001'
      throw err
    }
    if (roomTypeId) {
      ensureRoomTypes()
      const rt = tables.room_types.find((r) => r.id === roomTypeId)
      const total = rt?.total_rooms ?? 1
      const overlapping = tables.bookings.filter(
        (b) =>
          b.room_type_id === roomTypeId &&
          b.check_in_date < p.check_out_date &&
          b.check_out_date > p.check_in_date &&
          b.status !== 'CANCELLED' &&
          b.status !== 'COMPLETED'
      ).length
      if (overlapping >= total) {
        const err: any = new Error('ROOM_FULL')
        err.code = 'P0001'
        throw err
      }
    }
    // Insert
    const row: Record<string, any> = {
      id: newId('bookings'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'PENDING',
      ...p,
    }
    if (!row.booking_code) {
      const date = new Date()
      const yy = String(date.getFullYear()).slice(-2)
      const mm = String(date.getMonth() + 1).padStart(2, '0')
      const dd = String(date.getDate()).padStart(2, '0')
      const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
      row.booking_code = `TE${yy}${mm}${dd}-${rand}`
    }
    tables.bookings.push(row)
    return row
  },

  create_car_booking_atomic: (params: any) => {
    const p = normalizeBookingParams(params)
    const carId = p.car_id
    if (hasBlockingOverlapMock(null, null, carId, p.check_in_date, p.check_out_date)) {
      const err: any = new Error('DATES_BLOCKED')
      err.code = 'P0001'
      throw err
    }
    const overlapping = tables.bookings.filter(
      (b) =>
        b.car_id === carId &&
        b.check_in_date < p.check_out_date &&
        b.check_out_date > p.check_in_date &&
        b.status !== 'CANCELLED' &&
        b.status !== 'COMPLETED'
    ).length
    if (overlapping > 0) {
      const err: any = new Error('CAR_FULL')
      err.code = 'P0001'
      throw err
    }
    const row: Record<string, any> = {
      id: newId('bookings'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'PENDING',
      ...p,
    }
    if (!row.booking_code) {
      const date = new Date()
      const yy = String(date.getFullYear()).slice(-2)
      const mm = String(date.getMonth() + 1).padStart(2, '0')
      const dd = String(date.getDate()).padStart(2, '0')
      const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
      row.booking_code = `TE${yy}${mm}${dd}-${rand}`
    }
    tables.bookings.push(row)
    return row
  },
}

// ============================================================
// Public factory: createMockSupabaseClient
// ============================================================

export function createMockSupabaseClient() {
  return {
    from: (table: string) => {
      const baseState = (mode: BuilderState['mode'], payload: any = null): BuilderState => ({
        table,
        filters: [],
        orderBy: null,
        limitN: null,
        rangeFrom: null,
        rangeTo: null,
        mode,
        payload,
        selectQuery: '*',
        countMode: null,
        headOnly: false,
      })

      return {
        select: (query?: string, options?: { count?: any; head?: boolean }) => {
          const state = baseState('select')
          state.selectQuery = typeof query === 'string' ? query : '*'
          state.countMode = options?.count || null
          state.headOnly = !!options?.head
          return createBuilder(state)
        },
        insert: (payload: any) => {
          return createBuilder(baseState('insert', payload))
        },
        update: (payload: any) => {
          return createBuilder(baseState('update', payload))
        },
        delete: () => {
          return createBuilder(baseState('delete'))
        },
        upsert: (payload: any, options?: { onConflict?: string }) => {
          const state = baseState('upsert', payload)
          if (options?.onConflict) (state as any).onConflict = options.onConflict
          return createBuilder(state)
        },
      }
    },

    rpc: (name: string, params?: any) => {
      const handler = rpcHandlers[name]
      const promise: any = Promise.resolve().then(() => {
        if (!handler) return { data: null, error: { message: `Unknown RPC ${name}` } }
        try {
          const data = handler(params)
          return { data, error: null }
        } catch (err: any) {
          return { data: null, error: { message: err.message || 'RPC error' } }
        }
      })
      promise.single = async () => {
        const r = await promise
        if (r.error) return r
        const v = Array.isArray(r.data) ? r.data[0] : r.data
        return { data: v, error: null }
      }
      return promise
    },

    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: () =>
        Promise.resolve({ data: null, error: { message: 'Mock mode - use API login' } }),
      signOut: () => Promise.resolve({ error: null }),
    },

    storage: {
      from: (_bucket: string) => ({
        upload: async (path: string, _file: any) =>
          ({ data: { path }, error: null }),
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `/mock-storage/${path}` },
        }),
        remove: async (_paths: string[]) => ({ data: null, error: null }),
        list: async () => ({ data: [], error: null }),
      }),
    },
  }
}
