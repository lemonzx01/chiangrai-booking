import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

// GET /api/admin/auth - Verify admin session
export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)

    return NextResponse.json({
      user: {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        role: payload.role,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

// DELETE /api/admin/auth - Logout
export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete('admin_token')
  return NextResponse.json({ success: true })
}
