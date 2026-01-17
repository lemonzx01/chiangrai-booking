/**
 * Favicon route - Return 204 No Content to suppress 404 errors
 * Backend is API-only, so we don't need a favicon
 */
import { NextResponse } from 'next/server'

export async function GET() {
  return new NextResponse(null, { status: 204 })
}
