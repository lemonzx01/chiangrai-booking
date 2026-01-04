import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { getJwtSecret } from '@/lib/auth'

// GET /api/admin/auth - Verify admin session
export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_token')?.value

    if (!token) {
      // Return 200 with null user instead of 401 (not an error, just not logged in)
      return NextResponse.json({ user: null })
    }

    try {
      const { payload } = await jwtVerify(token, getJwtSecret())

      return NextResponse.json({
        user: {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          role: payload.role,
        },
      })
    } catch {
      // Invalid token, return null user
      return NextResponse.json({ user: null })
    }
  } catch {
    // Any other error, return null user
    return NextResponse.json({ user: null })
  }
}

// DELETE /api/admin/auth - Logout
export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete('admin_token')
  return NextResponse.json({ success: true })
}
