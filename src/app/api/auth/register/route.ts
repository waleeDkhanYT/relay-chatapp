import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const { email, password, username } = await req.json();
        if (!email || !password || !username) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await prisma.user.create({
            data: {
                email,
                username,
                password: hashedPassword,
            },
        })

        const token = signToken({ id: user.id, email: user.email })

        const response = NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                fullName: user.fullName || null,
                age: user.age || null,
                avatar: user.avatar,
                createdAt: user.createdAt.toISOString(),
            },
            token,
        })

        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        })

        return response
    } catch (error) {
        console.error('Register Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}