import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decodeJwt } from 'jose'

type AppRole = 'admin' | 'partner' | 'user' | null

function getUserRoleFromToken(token?: string): AppRole {
  if (!token) {
    return null
  }

  try {
    const payload = decodeJwt(token)
    const rawRole = (payload.role || payload.type) as string | undefined

    if (rawRole === 'admin' || rawRole === 'partner' || rawRole === 'user') {
      return rawRole
    }

    return 'user'
  } catch {
    return null
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const adminToken = request.cookies.get('admin_token')?.value
  const userToken = request.cookies.get('user_token')?.value
  const userRole = getUserRoleFromToken(userToken)

  // Admin routes (except /admin/login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // If already logged in as admin, skip admin login page
  if (pathname === '/admin/login' && adminToken) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  // Partner routes require partner/admin role
  if (pathname.startsWith('/partner')) {
    const isLoggedIn = Boolean(adminToken || userToken)

    if (!isLoggedIn) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', `${pathname}${request.nextUrl.search}`)
      return NextResponse.redirect(loginUrl)
    }

    const effectiveRole: AppRole = adminToken ? 'admin' : userRole
    if (effectiveRole !== 'admin' && effectiveRole !== 'partner') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // If partner already logged in, skip generic login page
  if (pathname === '/login' && !adminToken && userRole === 'partner') {
    return NextResponse.redirect(new URL('/partner/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/partner/:path*', '/login'],
}
