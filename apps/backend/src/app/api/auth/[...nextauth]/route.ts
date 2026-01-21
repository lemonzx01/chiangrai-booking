/**
 * ============================================================
 * NextAuth API Route Handler
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - Export NextAuth handler สำหรับ Google OAuth และ Credentials
 *   - จัดการ authentication routes: /api/auth/signin, /api/auth/callback, etc.
 *
 * ============================================================
 */

import { handlers } from '../../../../lib/auth/nextauth'

// NextAuth v5 beta with Next.js 14/15 App Router
// Import handlers from lib/auth/nextauth.ts and export GET/POST
// This is the recommended pattern to avoid Next.js route export errors

// Validate handlers before export
if (!handlers) {
  const error = new Error('NextAuth handlers not initialized')
  console.error('[ERROR] NextAuth route: handlers not initialized')
  throw error
}

if (!handlers.GET || !handlers.POST) {
  const error = new Error(`NextAuth handlers incomplete: GET=${!!handlers.GET}, POST=${!!handlers.POST}`)
  console.error('[ERROR] NextAuth route:', error.message)
  console.error('[ERROR] Handlers keys:', handlers ? Object.keys(handlers) : 'handlers is null/undefined')
  throw error
}

// Export GET and POST directly from handlers
// This is the correct pattern for Next.js 14/15
// Wrap in try-catch to provide better error messages
export async function GET(request: Request) {
  // #region agent log
  const url = new URL(request.url)
  const pathname = url.pathname
  const search = url.search
  const isSigninGoogle = pathname.includes('/signin/google')
  const isCallback = pathname.includes('/callback')
  console.log('[DEBUG] NextAuth GET request:', { pathname, search, isSigninGoogle, isCallback, origin: url.origin, host: url.host })
  fetch('http://127.0.0.1:7242/ingest/ba1e1129-bb25-4b0f-bb1d-cc362a0f368a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/auth/[...nextauth]/route.ts:GET',message:'NextAuth GET called',data:{pathname,search,isSigninGoogle,isCallback,hasHandlers:!!handlers,hasGet:!!handlers?.GET,origin:url.origin,host:url.host},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  // Handle Google OAuth signin when credentials are missing
  if (isSigninGoogle && (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET)) {
    console.error('[ERROR] Google OAuth signin attempted but credentials are missing')
    return new Response(
      JSON.stringify({ 
        error: 'Google OAuth is not configured',
        message: 'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in environment variables'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
  
  try {
    const response = await handlers.GET(request)
    // #region agent log
    const responseStatus = response?.status
    const responseStatusText = response?.statusText
    const responseHeaders: any = {}
    if (response?.headers) {
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })
    }
    fetch('http://127.0.0.1:7242/ingest/ba1e1129-bb25-4b0f-bb1d-cc362a0f368a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/auth/[...nextauth]/route.ts:GET',message:'NextAuth GET response',data:{status:responseStatus,statusText:responseStatusText,pathname,isSigninGoogle,isCallback,responseHeaders},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return response
  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ba1e1129-bb25-4b0f-bb1d-cc362a0f368a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/auth/[...nextauth]/route.ts:GET',message:'NextAuth GET error',data:{error:error?.message || String(error),pathname,isSigninGoogle,isCallback,stack:error?.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    console.error('[ERROR] NextAuth GET handler error:', error?.message)
    console.error('[ERROR] Stack:', error?.stack)
    return new Response(
      JSON.stringify({ 
        error: 'Authentication error',
        message: error?.message || 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

export async function POST(request: Request) {
  try {
    return await handlers.POST(request)
  } catch (error: any) {
    console.error('[ERROR] NextAuth POST handler error:', error?.message)
    console.error('[ERROR] Stack:', error?.stack)
    return new Response(
      JSON.stringify({ 
        error: 'Authentication error',
        message: error?.message || 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
