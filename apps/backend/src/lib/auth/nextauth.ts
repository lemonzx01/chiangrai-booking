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

import { createToken } from '../auth'

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
  hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
  nextAuthUrl: process.env.NEXTAUTH_URL || 'not set (will auto-detect)',
  hasAuthUrl: !!process.env.AUTH_URL,
  authUrl: process.env.AUTH_URL || 'not set',
  nodeEnv: process.env.NODE_ENV,
  cwd: process.cwd(),
  // Log first few chars of client ID (safe to log)
  clientIdPrefix: googleClientId ? googleClientId.substring(0, 20) + '...' : 'empty',
})

// Validate Google OAuth credentials
if (!googleClientId || !googleClientSecret) {
  console.error('[ERROR] Google OAuth credentials are missing!', {
    hasClientId: !!googleClientId,
    hasClientSecret: !!googleClientSecret,
    envKeys: Object.keys(process.env).filter(k => k.includes('GOOGLE') || k.includes('NEXTAUTH') || k.includes('JWT')),
  })
} else {
  console.log('[DEBUG] Google OAuth credentials loaded successfully', {
    clientIdLength: googleClientId.length,
    clientSecretLength: googleClientSecret.length,
  })
}

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
  // Trust host for development (important for OAuth callbacks)
  trustHost: true,
  
  // Note: basePath is NOT needed if route structure matches default (/api/auth)
  // Our route is at app/api/auth/[...nextauth]/route.ts which matches default
  // Setting basePath can cause UnknownAction errors in NextAuth v5 beta
  
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
        console.log('[DEBUG] Google OAuth login - profile:', {
          email: profile.email,
          name: profile.name,
          sub: profile.sub,
        })
        
        const supabase = await createAdminClient()
        
        // หา user จาก google_id หรือ email
        let dbUser = null
        
        if (isMockMode()) {
          console.log('[DEBUG] Running in Mock Mode')
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
          console.log('[DEBUG] Running in Production Mode - checking database')
          
          // Production mode - หา user จาก database
          // ลองหาจาก google_id ก่อน
          let existingUser = null
          
          const { data: userByGoogleId, error: googleIdError } = await supabase
            .from('users')
            .select('*')
            .eq('google_id', profile.sub)
            .single()
          
          if (userByGoogleId) {
            console.log('[DEBUG] Found user by google_id:', userByGoogleId.id)
            existingUser = userByGoogleId
          } else {
            // ถ้าไม่พบจาก google_id ลองหาจาก email
            const { data: userByEmail, error: emailError } = await supabase
              .from('users')
              .select('*')
              .eq('email', profile.email)
              .single()
            
            if (userByEmail) {
              console.log('[DEBUG] Found user by email:', userByEmail.id)
              // อัพเดท google_id ให้ user ที่มีอยู่
              const { data: updatedUser, error: updateError } = await supabase
                .from('users')
                .update({ google_id: profile.sub })
                .eq('id', userByEmail.id)
                .select()
                .single()
              
              if (updateError) {
                console.error('[ERROR] Failed to update google_id:', updateError)
              }
              existingUser = updatedUser || userByEmail
            }
          }

          if (existingUser) {
            dbUser = existingUser
          } else {
            console.log('[DEBUG] Creating new user for:', profile.email)
            // สร้าง user ใหม่ถ้ายังไม่มี
            const { data: newUser, error } = await supabase
              .from('users')
              .insert({
                email: profile.email || '',
                name: profile.name || '',
                google_id: profile.sub,
                role: 'user',
                is_active: true,
              })
              .select()
              .single()

            if (error) {
              console.error('[ERROR] Error creating user:', error)
              // ถึงแม้ insert ล้มเหลว ให้ return token พร้อมข้อมูลจาก profile
              token.email = profile.email
              token.name = profile.name
              token.role = 'user'
              return token
            }

            console.log('[DEBUG] Created new user:', newUser?.id)
            dbUser = newUser
          }
        }

        // เพิ่มข้อมูล user ใน token
        if (dbUser) {
          token.id = dbUser.id
          token.email = dbUser.email
          token.name = dbUser.name
          token.role = dbUser.role || 'user'
          
          // สร้าง user_token JWT สำหรับ frontend
          const userToken = await createToken({
            sub: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role || 'user',
          }, '7d')
          token.userToken = userToken
          
          console.log('[DEBUG] Token updated with user info:', { id: dbUser.id, role: dbUser.role })
        }
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

    /**
     * Redirect Callback - redirect ไป set-session เพื่อสร้าง user_token cookie
     */
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // หลัง OAuth login สำเร็จ → ไปที่ set-session เพื่อสร้าง user_token cookie
      // set-session จะดึง session แล้ว redirect ไป frontend
      const setSessionUrl = `${baseUrl}/api/auth/set-session`
      
      // ถ้ากำลัง signout ให้ไป frontend home
      if (url.includes('signout') || url.includes('logout')) {
        return 'http://localhost:3000'
      }
      
      // ถ้าเป็น signin หรือ callback ให้ไป set-session
      return setSessionUrl
    },
  },

  pages: {
    // Redirect ไป frontend (port 3000) เพราะ backend เป็น API-only
    signIn: 'http://localhost:3000/login',
    error: 'http://localhost:3000/login',
  },

  // NextAuth base URL configuration
  // IMPORTANT: NextAuth v5 beta uses NEXTAUTH_URL or AUTH_URL environment variable
  // For development (port 3001), set NEXTAUTH_URL=http://localhost:3001
  // For production, set NEXTAUTH_URL=https://your-backend-domain.com
  // Note: Do NOT include /api/auth in NEXTAUTH_URL - NextAuth adds it automatically
  // The callback URL will be: {NEXTAUTH_URL}/api/auth/callback/google
  // This must match the "Authorized redirect URIs" in Google Cloud Console

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

export const { handlers, signIn, signOut, auth } = nextAuthResult

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