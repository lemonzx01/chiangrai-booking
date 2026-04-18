/**
 * ============================================================
 * Structured Logger - ระบบ logging ที่เป็นมาตรฐาน
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - แทนที่ console.log/error/warn ทั่วทั้งระบบ
 *   - PII redaction อัตโนมัติ (ซ่อนข้อมูลที่ sensitive)
 *   - Pretty output ใน dev, JSON single-line ใน production
 *   - รองรับ child logger พร้อม context
 *   - เปลี่ยนไปใช้ Sentry/Pino ได้โดยแก้ไฟล์เดียว
 *
 * ============================================================
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  fatal: 50,
}

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[90m', // gray
  info: '\x1b[36m',  // cyan
  warn: '\x1b[33m',  // yellow
  error: '\x1b[31m', // red
  fatal: '\x1b[35m', // magenta
}
const COLOR_RESET = '\x1b[0m'

// ============================================================
// PII Redaction
// ============================================================

/**
 * Keys ที่จะถูกซ่อน (มองเป็น sensitive)
 * เพิ่มคีย์ใหม่ที่ต้องการซ่อนได้ตามต้องการ
 */
const SENSITIVE_KEYS = new Set([
  'password',
  'password_hash',
  'passwordhash',
  'token',
  'access_token',
  'refresh_token',
  'auth_token',
  'secret',
  'api_key',
  'apikey',
  'stripe_secret',
  'stripe_secret_key',
  'jwt',
  'jwt_secret',
  'cookie',
  'authorization',
  'session',
])

/**
 * Keys ที่จะถูก partially masked (เก็บบางส่วน, ซ่อนส่วนที่เหลือ)
 */
const PARTIAL_MASK_KEYS = new Set([
  'email',
  'customer_email',
  'user_email',
  'phone',
  'customer_phone',
])

function maskEmail(email: string): string {
  if (typeof email !== 'string' || !email.includes('@')) return '[REDACTED]'
  const [local, domain] = email.split('@')
  const masked = local.length <= 2 ? '*' : local[0] + '***'
  return `${masked}@${domain}`
}

function maskPhone(phone: string): string {
  if (typeof phone !== 'string') return '[REDACTED]'
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 4) return '***'
  return '***' + digits.slice(-4)
}

/**
 * ทำความสะอาด object ก่อน log (redact PII แบบ recursive)
 */
export function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 6) return '[MAX_DEPTH]'
  if (value === null || value === undefined) return value
  if (typeof value !== 'object') return value
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : value.stack,
    }
  }
  if (Array.isArray(value)) {
    return value.map((v) => sanitize(v, depth + 1))
  }
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const lower = k.toLowerCase()
    if (SENSITIVE_KEYS.has(lower)) {
      out[k] = '[REDACTED]'
    } else if (PARTIAL_MASK_KEYS.has(lower) && typeof v === 'string') {
      out[k] = lower.includes('phone') ? maskPhone(v) : maskEmail(v)
    } else {
      out[k] = sanitize(v, depth + 1)
    }
  }
  return out
}

// ============================================================
// Logger
// ============================================================

function currentLevel(): LogLevel {
  const raw = (process.env.LOG_LEVEL || '').toLowerCase() as LogLevel
  if (raw in LEVEL_RANK) return raw
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug'
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_RANK[level] >= LEVEL_RANK[currentLevel()]
}

function format(level: LogLevel, msg: string, context: Record<string, unknown>): string {
  const ts = new Date().toISOString()
  const sanitized = sanitize(context) as Record<string, unknown>

  if (process.env.NODE_ENV === 'production') {
    return JSON.stringify({ level, msg, ts, ...sanitized })
  }

  const color = LEVEL_COLORS[level]
  const tag = `${color}${level.toUpperCase().padEnd(5)}${COLOR_RESET}`
  const ctxString = Object.keys(sanitized).length
    ? ' ' + JSON.stringify(sanitized)
    : ''
  return `[${ts}] ${tag} ${msg}${ctxString}`
}

function write(level: LogLevel, msg: string, context: Record<string, unknown>) {
  if (!shouldLog(level)) return
  const line = format(level, msg, context)

  // Browser path: no process.stdout — use console.
  if (typeof window !== 'undefined' || typeof process === 'undefined' || !process.stdout) {
    if (level === 'error' || level === 'fatal') {
      // eslint-disable-next-line no-console
      console.error(line)
    } else if (level === 'warn') {
      // eslint-disable-next-line no-console
      console.warn(line)
    } else {
      // eslint-disable-next-line no-console
      console.log(line)
    }
    return
  }

  if (level === 'error' || level === 'fatal') {
    process.stderr.write(line + '\n')
  } else {
    process.stdout.write(line + '\n')
  }
}

export interface Logger {
  debug(msg: string, context?: Record<string, unknown>): void
  info(msg: string, context?: Record<string, unknown>): void
  warn(msg: string, context?: Record<string, unknown>): void
  error(msg: string, context?: Record<string, unknown>): void
  fatal(msg: string, context?: Record<string, unknown>): void
  child(context: Record<string, unknown>): Logger
}

function createLogger(baseContext: Record<string, unknown> = {}): Logger {
  const merge = (ctx?: Record<string, unknown>) => ({ ...baseContext, ...(ctx || {}) })
  return {
    debug: (msg, ctx) => write('debug', msg, merge(ctx)),
    info: (msg, ctx) => write('info', msg, merge(ctx)),
    warn: (msg, ctx) => write('warn', msg, merge(ctx)),
    error: (msg, ctx) => write('error', msg, merge(ctx)),
    fatal: (msg, ctx) => write('fatal', msg, merge(ctx)),
    child: (ctx) => createLogger({ ...baseContext, ...ctx }),
  }
}

export const logger: Logger = createLogger()

/**
 * สร้าง child logger จาก Request (binds requestId/method/path)
 */
export function requestLogger(req: Request): Logger {
  const url = new URL(req.url)
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID()
  return logger.child({
    requestId,
    method: req.method,
    path: url.pathname,
  })
}
