import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const authHeader = request.headers.get('authorization')
    const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined
    const cookieToken = request.cookies.get('token')?.value
    const rawToken = cookieToken || headerToken
    const token = (rawToken && rawToken !== 'null' && rawToken !== 'undefined' && rawToken.trim() !== '') ? rawToken : undefined
    const { pathname } = request.nextUrl

    // Define public paths
    const publicPaths = [
        '/',
        '/login',
        '/register',
        '/api/auth/login',
        '/api/auth/register',
        '/admin/login',
        '/api/admin/login',
        '/api/admin/logout',
        '/api/auth/logout'
    ]

    // Check if the current path is public
    const isPublicPath = publicPaths.includes(pathname) || publicPaths.some(path => path !== '/' && pathname.startsWith(path))

    // 1. If user is NOT logged in and tries to access a protected route
    if (!token && !isPublicPath && !pathname.startsWith('/_next') && !pathname.startsWith('/static') && !pathname.includes('.')) {
        if (pathname.startsWith('/api')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        if (pathname.startsWith('/admin')) {
            return NextResponse.redirect(new URL('/admin/login', request.url))
        }
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // 2. If user IS logged in and tries to access Login/Register -> Redirect to Chat
    if (token) {
        if (pathname === '/login' || pathname === '/register') {
            return NextResponse.redirect(new URL('/chat', request.url))
        }
        // Keep /admin/login accessible even if a cookie is present so admins can re-authenticate
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
