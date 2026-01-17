/**
 * ============================================================
 * Google OAuth Sign-in Redirect Handler
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - Handle GET /api/auth/signin/google?callbackUrl=...
 *   - Properly initiate Google OAuth flow in NextAuth v5 beta
 *   - NextAuth v5 throws UnknownAction for GET /signin/{provider}
 *   - This route provides compatibility with NextAuth v4 style URLs
 *
 * ============================================================
 */

import { NextRequest, NextResponse } from 'next/server'
import { signIn } from '../../../../../lib/auth/nextauth'

/**
 * GET /api/auth/signin/google
 * 
 * Initiates Google OAuth flow using NextAuth's signIn function
 * This provides a GET-based entry point for OAuth that works cross-origin
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const callbackUrl = url.searchParams.get('callbackUrl') || '/'
  
  console.log('[DEBUG] Google signin GET route:', { callbackUrl, origin: url.origin })
  
  try {
    // Use NextAuth's signIn server action to initiate the OAuth flow
    // The signIn function will handle CSRF, state, PKCE, etc.
    // Setting redirect: false to get the redirect URL instead of redirecting
    const result = await signIn('google', {
      redirectTo: callbackUrl,
      redirect: false,
    })
    
    console.log('[DEBUG] NextAuth signIn result:', { result, type: typeof result })
    
    // If result is a string URL, redirect to it
    if (typeof result === 'string') {
      return NextResponse.redirect(result)
    }
    
    // If result has a redirect property, use that
    if (result && typeof result === 'object' && 'redirect' in result) {
      return NextResponse.redirect((result as any).redirect)
    }
    
    // Fallback: redirect to the signin page
    const signinPageUrl = new URL('/api/auth/signin', url.origin)
    signinPageUrl.searchParams.set('callbackUrl', callbackUrl)
    return NextResponse.redirect(signinPageUrl.toString())
  } catch (error: any) {
    console.error('[ERROR] Failed to initiate Google OAuth:', error)
    
    // Check if the error is a redirect (NextAuth throws NEXT_REDIRECT)
    if (error?.digest?.startsWith?.('NEXT_REDIRECT')) {
      // Extract the redirect URL from the error
      // The error digest format is: NEXT_REDIRECT;{type};{url}
      const parts = error.digest.split(';')
      if (parts.length >= 3) {
        const redirectUrl = parts[2]
        console.log('[DEBUG] Extracted redirect URL from error:', redirectUrl)
        return NextResponse.redirect(redirectUrl)
      }
    }
    
    // Fallback: redirect to NextAuth's signin page
    const signinPageUrl = new URL('/api/auth/signin', url.origin)
    signinPageUrl.searchParams.set('callbackUrl', callbackUrl)
    signinPageUrl.searchParams.set('error', 'OAuthSignin')
    
    return NextResponse.redirect(signinPageUrl.toString())
  }
}

/**
 * POST /api/auth/signin/google
 * 
 * Forward POST requests to NextAuth signIn
 */
export async function POST(request: NextRequest) {
  const url = new URL(request.url)
  
  console.log('[DEBUG] Google signin POST route')
  
  try {
    // Parse the form data
    const formData = await request.formData().catch(() => null)
    const body = formData ? Object.fromEntries(formData.entries()) : {}
    const callbackUrl = (body.callbackUrl as string) || '/'
    
    // Use NextAuth's signIn function
    const result = await signIn('google', {
      redirectTo: callbackUrl,
      redirect: false,
    })
    
    console.log('[DEBUG] NextAuth signIn POST result:', { result })
    
    if (typeof result === 'string') {
      return NextResponse.redirect(result)
    }
    
    // Return JSON response for AJAX requests
    return NextResponse.json({ url: result })
  } catch (error: any) {
    console.error('[ERROR] NextAuth POST handler error:', error)
    
    // Check if the error is a redirect
    if (error?.digest?.startsWith?.('NEXT_REDIRECT')) {
      const parts = error.digest.split(';')
      if (parts.length >= 3) {
        const redirectUrl = parts[2]
        return NextResponse.redirect(redirectUrl)
      }
    }
    
    return NextResponse.redirect(
      new URL(`/login?error=OAuthSignin&message=${encodeURIComponent(error?.message || 'Unknown error')}`, url.origin)
    )
  }
}
