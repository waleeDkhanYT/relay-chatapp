import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { error } = await verifyAdmin(req);
    if (error) return error;

    try {
        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')));
        const search = searchParams.get('search')?.trim() || '';
        const status = searchParams.get('status') || 'ALL';
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';

        const where: any = {};

        if (status !== 'ALL') {
            where.status = status;
        }

        if (search) {
            where.OR = [
                {
                    sender: {
                        OR: [
                            { username: { contains: search, mode: 'insensitive' } },
                            { email: { contains: search, mode: 'insensitive' } }
                        ]
                    }
                },
                {
                    receiver: {
                        OR: [
                            { username: { contains: search, mode: 'insensitive' } },
                            { email: { contains: search, mode: 'insensitive' } }
                        ]
                    }
                }
            ];
        }

        const [requests, total] = await Promise.all([
            prisma.friendRequest.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { [sortBy]: order },
                include: {
                    sender: {
                        select: { id: true, username: true, email: true, avatar: true }
                    },
                    receiver: {
                        select: { id: true, username: true, email: true, avatar: true }
                    }
                }
            }),
            prisma.friendRequest.count({ where })
        ]);

        return NextResponse.json({
            requests,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    } catch (err) {
        console.error('Fetch Admin Requests Error:', err);
        return NextResponse.json({ error: 'Failed to fetch friend requests' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const { error } = await verifyAdmin(req);
    if (error) return error;

    try {
        const body = await req.json();
        const { senderId, receiverId, status = 'PENDING' } = body;

        if (!senderId || !receiverId || senderId === receiverId) {
            return NextResponse.json({ error: 'Valid distinct senderId and receiverId are required' }, { status: 400 });
        }

        const request = await prisma.friendRequest.upsert({
            where: {
                senderId_receiverId: { senderId, receiverId }
            },
            create: {
                senderId,
                receiverId,
                status
            },
            update: {
                status
            },
            include: {
                sender: { select: { id: true, username: true, email: true, avatar: true } },
                receiver: { select: { id: true, username: true, email: true, avatar: true } }
            }
        });

        if (status === 'ACCEPTED') {
            const existing = await prisma.conversation.findFirst({
                where: {
                    type: 'DIRECT',
                    AND: [
                        { members: { some: { userId: senderId } } },
                        { members: { some: { userId: receiverId } } }
                    ]
                }
            });

            if (!existing) {
                await prisma.conversation.create({
                    data: {
                        type: 'DIRECT',
                        members: {
                            create: [{ userId: senderId }, { userId: receiverId }]
                        }
                    }
                });
            }
        }

        return NextResponse.json(request, { status: 201 });
    } catch (err) {
        console.error('Create Admin Request Error:', err);
        return NextResponse.json({ error: 'Failed to create friend request' }, { status: 500 });
    }
}
