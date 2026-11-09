import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/adminAuth';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { error } = await verifyAdmin(req);
    if (error) return error;

    try {
        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')));
        const search = searchParams.get('search')?.trim() || '';
        const role = searchParams.get('role') || 'ALL';
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';

        const where: any = {};

        if (search) {
            where.OR = [
                { username: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { fullName: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (role !== 'ALL') {
            where.role = role;
        }

        const isMinimal = searchParams.get('minimal') === 'true' || limit > 50;

        const selectFields: any = {
            id: true,
            username: true,
            email: true,
            fullName: true,
            age: true,
            avatar: true,
            role: true,
            createdAt: true,
        };

        if (!isMinimal) {
            selectFields._count = {
                select: {
                    messages: true,
                    conversations: true,
                    sentRequests: true,
                    receivedRequests: true
                }
            };
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { [sortBy]: order },
                select: selectFields
            }),
            prisma.user.count({ where })
        ]);

        return NextResponse.json({
            users,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    } catch (err) {
        console.error('Fetch Users Error:', err);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const { error } = await verifyAdmin(req);
    if (error) return error;

    try {
        const body = await req.json();
        const { email, username, password, fullName, age, role, avatar } = body;

        if (!email || !username || !password) {
            return NextResponse.json({ error: 'Email, username, and password are required' }, { status: 400 });
        }

        const existing = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() }
        });

        if (existing) {
            return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                email: email.toLowerCase().trim(),
                username: username.trim(),
                password: hashedPassword,
                fullName: fullName?.trim() || null,
                age: age ? parseInt(age) : null,
                avatar: avatar || null,
                role: role === 'ADMIN' ? 'ADMIN' : 'USER',
            },
            select: {
                id: true,
                username: true,
                email: true,
                fullName: true,
                age: true,
                avatar: true,
                role: true,
                createdAt: true,
            }
        });

        return NextResponse.json(newUser, { status: 201 });
    } catch (err) {
        console.error('Create User Error:', err);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}
