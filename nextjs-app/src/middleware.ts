import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const protectedAdminPaths = [
  '/admin/dashboard',
  '/admin/hotels',
  '/admin/cars',
  '/admin/bookings',
]

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Check if this is a protected admin route
  if (protectedAdminPaths.some((path) => pathname.startsWith(path))) {
    const token = request.cookies.get('admin_token')?.value

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET)
      await jwtVerify(token, secret)
    } catch {
      // Token is invalid or expired
      const response = NextResponse.redirect(new URL('/admin/login', request.url))
      response.cookies.delete('admin_token')
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
