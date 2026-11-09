import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
        });

        if (!user) {
            return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
        }

        const isAdmin = user.role === 'ADMIN' || user.email === 'admin@relayapp.com';
        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden: You do not have administrator permissions.' }, { status: 403 });
        }

        const token = signToken({ id: user.id, email: user.email, role: 'ADMIN' });

        const response = NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                fullName: user.fullName || 'Administrator',
                role: 'ADMIN',
                avatar: user.avatar,
                createdAt: user.createdAt.toISOString(),
            },
            token,
        });

        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        });

        return response;
    } catch (error) {
        console.error('Admin Login Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
