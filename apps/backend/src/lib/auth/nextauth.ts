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
import { logger } from '../logger'

import { createToken } from '../auth'

const googleClientId = process.env.GOOGLE_CLIENT_ID || ''
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || ''

if (!googleClientId || !googleClientSecret) {
  logger.warn('Google OAuth credentials are missing. Google login will not work.')
}

const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

const authOptions = {
  trustHost: true,

  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),

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
    async jwt({ token, user, account, profile }: any) {
      // เมื่อ login ครั้งแรก (Google OAuth)
      if (account?.provider === 'google' && profile) {
        const supabase = await createAdminClient()

        let dbUser = null

        if (isMockMode()) {
          dbUser = {
            id: `mock-user-${Date.now()}`,
            email: profile.email || '',
            name: profile.name || '',
            role: 'user',
            google_id: profile.sub,
          }
        } else {
          let existingUser = null

          const { data: userByGoogleId } = await supabase
            .from('users')
            .select('*')
            .eq('google_id', profile.sub)
            .single()

          if (userByGoogleId) {
            existingUser = userByGoogleId
          } else {
            const { data: userByEmail } = await supabase
              .from('users')
              .select('*')
              .eq('email', profile.email)
              .single()

            if (userByEmail) {
              const updateData: Record<string, any> = { google_id: profile.sub }
              // อัปเดตชื่อจาก Google ถ้า user ยังไม่มีชื่อจริง
              if (profile.name && (!userByEmail.name || userByEmail.name.length <= 3)) {
                updateData.name = profile.name
              }
              // ยืนยันอีเมลอัตโนมัติเมื่อ link กับ Google (Google ยืนยัน email แล้ว)
              if (!userByEmail.email_verified) {
                updateData.email_verified = true
              }
              const { data: updatedUser, error: updateError } = await supabase
                .from('users')
                .update(updateData)
                .eq('id', userByEmail.id)
                .select()
                .single()

              if (updateError) {
                logger.error('Failed to update google_id', { error: updateError })
              }
              existingUser = updatedUser || userByEmail
            }
          }

          if (existingUser) {
            dbUser = existingUser
          } else {
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
              logger.error('Error creating user', { error })
              token.email = profile.email
              token.name = profile.name
              token.role = 'user'
              return token
            }

            dbUser = newUser
          }
        }

        if (dbUser) {
          token.id = dbUser.id
          token.email = dbUser.email
          token.name = dbUser.name
          token.role = dbUser.role || 'user'

          const userToken = await createToken({
            sub: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role || 'user',
          }, '7d')
          token.userToken = userToken
        }
      }

      // เมื่อ login ด้วย credentials (ไม่ overwrite ถ้า Google OAuth ตั้งค่าแล้ว)
      if (user && account?.provider !== 'google') {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = (user as any).role || 'user'
      }

      return token
    },

    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = (token.role as string) || 'user'
      }
      return session
    },

    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      const setSessionUrl = `${baseUrl}/api/auth/set-session`

      if (url.includes('signout') || url.includes('logout')) {
        return frontendUrl
      }

      return setSessionUrl
    },
  },

  pages: {
    signIn: `${frontendUrl}/login`,
    error: `${frontendUrl}/login`,
  },

  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: (() => {
    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET
    if (!secret) {
      throw new Error('NEXTAUTH_SECRET or JWT_SECRET environment variable is required')
    }
    if (secret.length < 32) {
      logger.warn('Secret is too short (minimum 32 characters recommended)')
    }
    return secret
  })(),
}

export { authOptions }

let nextAuthResult: any
try {
  nextAuthResult = NextAuth(authOptions as any)

  if (!nextAuthResult?.handlers?.GET || !nextAuthResult?.handlers?.POST) {
    throw new Error('NextAuth handlers incomplete')
  }
} catch (error: any) {
  logger.error('Failed to create NextAuth handlers', { error: error?.message })
  throw error
}

if (!nextAuthResult?.handlers) {
  throw new Error('Cannot export handlers: nextAuthResult.handlers is undefined')
}

export const { handlers, signIn, signOut, auth } = nextAuthResult
