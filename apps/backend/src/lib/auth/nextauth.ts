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
export const authOptions = {
  providers: [
    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
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
            const { data: newUser, error } = await supabase
              .from('users')
              .insert({
                email: profile.email || '',
                name: profile.name || '',
                google_id: profile.sub,
                role: 'user',
              })
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

  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
}
