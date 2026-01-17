/**
 * ============================================================
 * NextAuth Configuration - Google OAuth + Credentials
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - ตั้งค่า NextAuth.js สำหรับ Google OAuth และ Email/Password login
 *   - รองรับ role-based access control (admin, partner, user)
 *   - เก็บ role และ id ใน session
 *
 * ============================================================
 */

import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { createAdminClient } from '../supabase/server'
import bcrypt from 'bcryptjs'
import { isMockMode } from '../auth'
import { findMockUser, findMockAdmin } from '../mock-data'

/**
 * NextAuth Configuration
 */
// #region agent log
fetch('http://127.0.0.1:7242/ingest/ba1e1129-bb25-4b0f-bb1d-cc362a0f368a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/nextauth.ts:25',message:'NextAuth config init',data:{hasGoogleClientId:!!process.env.GOOGLE_CLIENT_ID,hasGoogleClientSecret:!!process.env.GOOGLE_CLIENT_SECRET,hasNextAuthSecret:!!process.env.NEXTAUTH_SECRET,hasJwtSecret:!!process.env.JWT_SECRET,googleClientIdLength:process.env.GOOGLE_CLIENT_ID?.length || 0,googleClientSecretLength:process.env.GOOGLE_CLIENT_SECRET?.length || 0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
// #endregion

const googleClientId = process.env.GOOGLE_CLIENT_ID || ''
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || ''

// Log immediately when module loads
console.log('[DEBUG] NextAuth Module Load:', {
  hasGoogleClientId: !!googleClientId,
  hasGoogleClientSecret: !!googleClientSecret,
  clientIdLength: googleClientId.length,
  clientSecretLength: googleClientSecret.length,
  hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
  hasJwtSecret: !!process.env.JWT_SECRET,
  nodeEnv: process.env.NODE_ENV,
})

// #region agent log
if (typeof process !== 'undefined') {
  try {
    const fs = require('fs')
    const path = require('path')
    // Use absolute path from workspace root
    const logPath = path.join(process.cwd(), '..', '..', '.cursor', 'debug.log')
    const logDir = path.dirname(logPath)
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }
    const logEntry = JSON.stringify({
      id: `log_${Date.now()}_google`,
      timestamp: Date.now(),
      location: 'auth/nextauth.ts:GoogleProvider',
      message: 'Google Provider config',
      data: {
        hasClientId: !!googleClientId,
        hasClientSecret: !!googleClientSecret,
        clientIdLength: googleClientId.length,
        clientSecretLength: googleClientSecret.length,
        clientIdPrefix: googleClientId.substring(0, 20),
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasJwtSecret: !!process.env.JWT_SECRET,
        cwd: process.cwd(),
      },
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'B'
    }) + '\n'
    fs.appendFileSync(logPath, logEntry)
    console.log('[DEBUG] Google Provider config:', {
      hasClientId: !!googleClientId,
      hasClientSecret: !!googleClientSecret,
      clientIdLength: googleClientId.length,
    })
  } catch (logError: any) {
    console.error('[DEBUG] Log error:', logError.message)
  }
}
// #endregion

// Validate Google OAuth credentials before creating provider
if (!googleClientId || !googleClientSecret) {
  console.error('[ERROR] Google OAuth credentials missing!', {
    hasClientId: !!googleClientId,
    hasClientSecret: !!googleClientSecret,
    clientIdLength: googleClientId.length,
    clientSecretLength: googleClientSecret.length,
  })
}

const authOptions = {
  providers: [
    // Google OAuth Provider
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
    
    // Credentials Provider (for email/password - backward compatibility)
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials: any) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Mock Mode
        if (isMockMode()) {
          // Check admin first
          const mockAdmin = findMockAdmin(credentials.email as string)
          if (mockAdmin) {
            const isValidPassword = credentials.password === 'admin123' ||
              (mockAdmin.password_hash ? await bcrypt.compare(credentials.password as string, mockAdmin.password_hash).catch(() => false) : false)
            if (isValidPassword) {
              return {
                id: mockAdmin.id,
                email: mockAdmin.email,
                name: mockAdmin.name,
                role: 'admin',
              }
            }
          }

          // Check user
          const mockUser = findMockUser(credentials.email as string)
          if (mockUser) {
            const isValidPassword = credentials.password === 'user123' ||
              (mockUser.password_hash ? await bcrypt.compare(credentials.password as string, mockUser.password_hash).catch(() => false) : false)
            if (isValidPassword) {
              return {
                id: mockUser.id,
                email: mockUser.email,
                name: mockUser.name,
                role: mockUser.role || 'user',
              }
            }
          }

          return null
        }

        // Production Mode - Check Supabase
        const supabase = await createAdminClient()

        // Check admin first
        const { data: admin } = await supabase
          .from('admins')
          .select('*')
          .eq('email', credentials.email)
          .eq('is_active', true)
          .single()

        if (admin) {
          const isValidPassword = await bcrypt.compare(credentials.password as string, admin.password_hash)
          if (isValidPassword) {
            return {
              id: admin.id,
              email: admin.email,
              name: admin.name,
              role: 'admin',
            }
          }
        }

        // Check user
        const { data: user } = await supabase
          .from('users')
          .select('*')
          .eq('email', credentials.email)
          .eq('is_active', true)
          .single()

        if (user && user.password_hash) {
          const isValidPassword = await bcrypt.compare(credentials.password as string, user.password_hash)
          if (isValidPassword) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role || 'user',
            }
          }
        }

        return null
      },
    }),
  ],

  callbacks: {
    /**
     * JWT Callback - เรียกเมื่อสร้างหรืออัพเดท JWT token
     */
    async jwt({ token, user, account, profile }: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/ba1e1129-bb25-4b0f-bb1d-cc362a0f368a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/nextauth.ts:jwt',message:'JWT callback',data:{hasAccount:!!account,provider:account?.provider,hasProfile:!!profile,hasUser:!!user},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      // เมื่อ login ครั้งแรก (Google OAuth)
      if (account?.provider === 'google' && profile) {
        const supabase = await createAdminClient()
        
        // หา user จาก google_id หรือ email
        let dbUser = null
        
        if (isMockMode()) {
          // Mock mode - สร้าง user ใหม่หรือหา user ที่มีอยู่
          // ใน mock mode เราจะสร้าง user ใหม่ทุกครั้ง
          dbUser = {
            id: `mock-user-${Date.now()}`,
            email: profile.email || '',
            name: profile.name || '',
            role: 'user',
            google_id: profile.sub,
          }
        } else {
          // Production mode - หา user จาก database
          const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .or(`google_id.eq.${profile.sub},email.eq.${profile.email}`)
            .single()

          if (existingUser) {
            dbUser = existingUser
          } else {
            // สร้าง user ใหม่ถ้ายังไม่มี
            // Note: password_hash is required in Insert type but nullable in database
            const { data: newUser, error } = await supabase
              .from('users')
              .insert({
                email: profile.email || '',
                name: profile.name || '',
                google_id: profile.sub,
                role: 'user',
                password_hash: '', // Empty string for Google OAuth users (nullable in DB)
              } as any)
              .select()
              .single()

            if (error) {
              console.error('Error creating user:', error)
              return token
            }

            dbUser = newUser
          }
        }

        // เพิ่มข้อมูล user ใน token
        token.id = dbUser.id
        token.email = dbUser.email
        token.name = dbUser.name
        token.role = dbUser.role || 'user'
      }

      // เมื่อ login ด้วย credentials
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = (user as any).role || 'user'
      }

      return token
    },

    /**
     * Session Callback - เรียกเมื่อสร้าง session
     */
    async session({ session, token }: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/ba1e1129-bb25-4b0f-bb1d-cc362a0f368a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/nextauth.ts:session',message:'Session callback',data:{hasSession:!!session,hasUser:!!session?.user,hasToken:!!token,tokenId:token?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = (token.role as string) || 'user'
      }
      return session
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: (() => {
    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET
    console.log('[DEBUG] Secret validation:', {
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasSecret: !!secret,
      secretLength: secret?.length || 0,
    })
    if (!secret) {
      console.error('[ERROR] NEXTAUTH_SECRET or JWT_SECRET is not set!')
      // Don't throw in module load - let NextAuth handle it
      return 'fallback-secret-for-development-only-change-in-production-min-32-chars'
    }
    if (secret.length < 32) {
      console.warn('[WARNING] Secret is too short (minimum 32 characters)')
    }
    return secret
  })(),
}

// Export authOptions for backward compatibility
export { authOptions }

// NextAuth v5: Create and export handlers here
// This is the recommended pattern for Next.js 14/15
// #region agent log
console.log('[DEBUG] Creating NextAuth handlers from authOptions...')
// #endregion

// Create NextAuth instance
let nextAuthResult: any
try {
  nextAuthResult = NextAuth(authOptions as any)
  // #region agent log
  console.log('[DEBUG] NextAuth result:', {
    hasHandlers: !!nextAuthResult?.handlers,
    hasGet: !!nextAuthResult?.handlers?.GET,
    hasPost: !!nextAuthResult?.handlers?.POST,
    resultType: typeof nextAuthResult,
    resultKeys: nextAuthResult ? Object.keys(nextAuthResult) : [],
    handlersKeys: nextAuthResult?.handlers ? Object.keys(nextAuthResult.handlers) : [],
  })
  
  // Validate handlers
  if (!nextAuthResult) {
    throw new Error('NextAuth returned undefined')
  }
  if (!nextAuthResult.handlers) {
    throw new Error('NextAuth result does not have handlers property')
  }
  if (!nextAuthResult.handlers.GET || !nextAuthResult.handlers.POST) {
    throw new Error(`NextAuth handlers incomplete: GET=${!!nextAuthResult.handlers.GET}, POST=${!!nextAuthResult.handlers.POST}`)
  }
  console.log('[DEBUG] NextAuth handlers validated successfully')
  // #endregion
} catch (error: any) {
  console.error('[ERROR] Failed to create NextAuth handlers:', error?.message)
  console.error('[ERROR] Stack:', error?.stack)
  throw error
}

// Export handlers for use in route.ts
// Validate before export
if (!nextAuthResult?.handlers) {
  throw new Error('Cannot export handlers: nextAuthResult.handlers is undefined')
}

export const { handlers } = nextAuthResult

// #region agent log
// Log secret availability on module load
if (typeof process !== 'undefined') {
  const hasSecret = !!(process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET)
  const secretLength = (process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || '').length
  console.log('[DEBUG] NextAuth Secret Check:', {
    hasSecret,
    secretLength,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasJwtSecret: !!process.env.JWT_SECRET,
  })
  fetch('http://127.0.0.1:7242/ingest/ba1e1129-bb25-4b0f-bb1d-cc362a0f368a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth/nextauth.ts:module',message:'NextAuth secret check',data:{hasSecret,secretLength,hasNextAuthSecret:!!process.env.NEXTAUTH_SECRET,hasJwtSecret:!!process.env.JWT_SECRET},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
}
// #endregion
