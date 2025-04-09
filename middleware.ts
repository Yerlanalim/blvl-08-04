import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Create a response object that we'll modify and return
  const response = NextResponse.next()
  
  // Create a Supabase client for the middleware
  const supabase = createMiddlewareClient({ req: request, res: response })
  
  try {
    // Get the user session
    const { data: { session } } = await supabase.auth.getSession()
    
    const url = new URL(request.url)
    const path = url.pathname
    
    // Paths that require authentication
    const authRequiredPaths = [
      '/dashboard',
      '/admin',
      '/profile',
    ]
    
    // Paths that redirect to dashboard if already authenticated
    const publicOnlyPaths = [
      '/login',
      '/register',
      '/forgot-password',
    ]
    
    // Check for a specific redirect parameter to handle post-authentication redirects
    const redirectTo = url.searchParams.get('redirectTo') || '/dashboard'
    
    // If the path requires authentication and user is not authenticated
    if (authRequiredPaths.some(p => path.startsWith(p)) && !session) {
      // Store the original URL to redirect back after login
      const returnToPath = encodeURIComponent(request.nextUrl.pathname)
      return NextResponse.redirect(new URL(`/login?redirectTo=${returnToPath}`, request.url))
    }
    
    // If the path is for non-authenticated users and user is authenticated
    if (publicOnlyPaths.some(p => path === p) && session) {
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }
    
    // Special handling for update-password page - must have a session
    if (path === '/update-password' && !session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    return response
  } catch (error) {
    console.error('Auth middleware error:', error)
    // In case of authentication error, redirect to login
    // but only for protected routes to avoid redirect loops
    if (request.nextUrl.pathname.startsWith('/dashboard') || 
        request.nextUrl.pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }
}

export const config = {
  matcher: [
    // Dashboard and admin routes
    '/dashboard/:path*',
    '/admin/:path*',
    '/profile/:path*',
    
    // Auth routes
    '/login',
    '/register',
    '/forgot-password',
    '/update-password',
  ],
} 