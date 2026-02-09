import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value
    const { pathname } = request.nextUrl

    // Define public paths
    const publicPaths = ['/', '/login', '/register', '/api/auth/login', '/api/auth/register']

    // Check if the current path is public
    const isPublicPath = publicPaths.includes(pathname) || publicPaths.some(path => path !== '/' && pathname.startsWith(path))

    // 1. If user is NOT logged in and tries to access a protected route -> Redirect to Login
    if (!token && !isPublicPath && !pathname.startsWith('/_next') && !pathname.startsWith('/static') && !pathname.includes('.')) {
        if (pathname.startsWith('/api')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // 2. If user IS logged in and tries to access Login/Register -> Redirect to Chat
    if (token && (pathname === '/login' || pathname === '/register')) {
        return NextResponse.redirect(new URL('/chat', request.url))
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
