import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export interface AdminUser {
    id: string;
    email: string;
    username: string;
    fullName: string | null;
    role: string;
}

// In-memory cache for verified admin users to eliminate redundant DB lookups on every request
interface CachedAdmin {
    user: AdminUser;
    expiresAt: number;
}

const adminCache = new Map<string, CachedAdmin>();
const ADMIN_CACHE_TTL_MS = 60 * 1000; // 60 seconds

export async function verifyAdmin(req: Request): Promise<{
    error: NextResponse | null;
    user: AdminUser | null;
}> {
    const authHeader = req.headers.get('authorization');
    let token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token || token === 'null' || token === 'undefined' || !token.trim()) {
        token = null;
    }

    if (!token) {
        // Fallback: check cookie from cookie header
        const cookieHeader = req.headers.get('cookie') || '';
        const match = cookieHeader.match(/token=([^;]+)/);
        if (match && match[1]) {
            const raw = match[1].trim();
            if (raw && raw !== 'null' && raw !== 'undefined') {
                token = decodeURIComponent(raw.replace(/^["']|["']$/g, ''));
            }
        }
    }

    if (!token) {
        return {
            error: NextResponse.json({ error: 'Unauthorized: No admin token provided' }, { status: 401 }),
            user: null
        };
    }

    const decoded = verifyToken(token) as { id: string; email: string; role?: string } | null;
    if (!decoded || !decoded.id) {
        return {
            error: NextResponse.json({ error: 'Unauthorized: Invalid or expired admin token' }, { status: 401 }),
            user: null
        };
    }

    // Check fast in-memory cache first
    const now = Date.now();
    const cached = adminCache.get(decoded.id);
    if (cached && cached.expiresAt > now) {
        return { error: null, user: cached.user };
    }

    const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, username: true, fullName: true, role: true }
    });

    if (!user) {
        return {
            error: NextResponse.json({ error: 'Admin user not found' }, { status: 404 }),
            user: null
        };
    }

    const isAdmin = user.role === 'ADMIN' || user.email === 'admin@relayapp.com';
    if (!isAdmin) {
        return {
            error: NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 }),
            user: null
        };
    }

    const adminUser: AdminUser = {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        role: user.role
    };

    // Store in cache
    adminCache.set(user.id, {
        user: adminUser,
        expiresAt: now + ADMIN_CACHE_TTL_MS
    });

    return { error: null, user: adminUser };
}
