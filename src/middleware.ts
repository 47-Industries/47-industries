import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const url = request.nextUrl.clone()

  // Never rewrite API routes - they must stay at /api/*
  if (url.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Handle admin subdomain - rewrite page routes to /admin path
  if (hostname.startsWith('admin.')) {
    // Only rewrite if not already on an /admin path
    if (!url.pathname.startsWith('/admin')) {
      url.pathname = '/admin' + url.pathname

      // Check authentication for admin routes (except login page)
      if (!url.pathname.startsWith('/admin/login')) {
        const token = await getToken({
          req: request,
          secret: process.env.NEXTAUTH_SECRET
        })

        if (!token || token.role !== 'ADMIN') {
          // Redirect to login on the subdomain
          const loginUrl = new URL('/login', request.url)
          loginUrl.searchParams.set('callbackUrl', request.url)
          return NextResponse.redirect(loginUrl)
        }
      }

      const response = NextResponse.rewrite(url)
      response.headers.set('x-pathname', url.pathname)
      return response
    }
  }

  // Block direct access to /admin routes on main domain - redirect to admin subdomain
  // This ensures admin is ONLY accessible via admin.47industries.com
  if (url.pathname.startsWith('/admin') && !hostname.startsWith('admin.') && !hostname.startsWith('localhost')) {
    // Redirect to admin subdomain
    const adminUrl = new URL(request.url)
    // Replace main domain with admin subdomain
    const adminHost = hostname.replace(/^(www\.)?/, 'admin.')
    adminUrl.host = adminHost
    // Remove /admin prefix since subdomain will add it via rewrite
    adminUrl.pathname = url.pathname.replace(/^\/admin/, '') || '/'
    return NextResponse.redirect(adminUrl)
  }

  // Check authentication for admin routes (except login page) - only for localhost dev
  if (url.pathname.startsWith('/admin') && !url.pathname.startsWith('/admin/login') && hostname.startsWith('localhost')) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    })

    if (!token || token.role !== 'ADMIN') {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('callbackUrl', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Add pathname header for all requests
  const response = NextResponse.next()
  response.headers.set('x-pathname', url.pathname)
  return response
}

// Configure which paths the middleware runs on
// This is critical - it excludes static files, images, etc. from middleware processing
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}
