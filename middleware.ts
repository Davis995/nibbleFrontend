import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /student/dashboard, /login)
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const publicPaths = [
    '/login',
    '/signup',
    '/forgot-password',
    '/invite',
    '/',
    '/ai-literacy',
    '/ai-policy',
    '/blog',
    '/certifications',
    '/compare',
    '/for-schools',
    '/for-students',
    '/for-teachers',
    '/integrations',
    '/pd',
    '/pioneers',
    '/pricing',
    '/privacy',
    '/quote-request',
    '/student-success',
    '/support',
    '/tools'
  ]

  // Check if the path is public or a static asset
  const isPublicPath = publicPaths.some(publicPath =>
    path === publicPath || path.startsWith(`${publicPath}/`)
  )

  // Allow common static files (images, icons, etc.)
  const isStaticAsset = /\.(png|jpg|jpeg|gif|svg|ico|webp|webmanifest|xml|txt)$/.test(path)

  // If it's a public path or a static asset, allow the request
  if (isPublicPath || isStaticAsset) {
    return NextResponse.next()
  }

  // For protected paths, check if there's an auth token cookie
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    // No token found, redirect to login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(loginUrl)
  }

  // Token exists, allow the request
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}