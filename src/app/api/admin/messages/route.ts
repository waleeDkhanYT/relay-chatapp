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
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '15')));
        const search = searchParams.get('search')?.trim() || '';
        const conversationId = searchParams.get('conversationId') || '';
        const deleted = searchParams.get('deleted') || 'ALL'; // ALL, DELETED, ACTIVE
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';

        const where: any = {};

        if (search) {
            where.content = { contains: search, mode: 'insensitive' };
        }

        if (conversationId) {
            where.conversationId = conversationId;
        }

        if (deleted === 'DELETED') {
            where.isDeleted = true;
        } else if (deleted === 'ACTIVE') {
            where.isDeleted = false;
        }

        const [messages, total] = await Promise.all([
            prisma.message.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { [sortBy]: order },
                include: {
                    sender: {
                        select: { id: true, username: true, email: true, avatar: true }
                    },
                    conversation: {
                        select: { id: true, type: true, name: true }
                    }
                }
            }),
            prisma.message.count({ where })
        ]);

        return NextResponse.json({
            messages,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    } catch (err) {
        console.error('Fetch Messages Error:', err);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const { error, user: adminUser } = await verifyAdmin(req);
    if (error) return error;

    try {
        const body = await req.json();
        const { conversationId, content } = body;

        if (!conversationId || !content?.trim()) {
            return NextResponse.json({ error: 'Conversation ID and content are required' }, { status: 400 });
        }

        const conv = await prisma.conversation.findUnique({
            where: { id: conversationId }
        });

        if (!conv) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }

        // Ensure admin is a member so message relations stay valid
        await prisma.conversationMember.upsert({
            where: {
                conversationId_userId: {
                    conversationId,
                    userId: adminUser!.id
                }
            },
            create: {
                conversationId,
                userId: adminUser!.id
            },
            update: {}
        });

        const message = await prisma.message.create({
            data: {
                content: content.trim(),
                senderId: adminUser!.id,
                conversationId,
            },
            include: {
                sender: { select: { id: true, username: true, avatar: true } },
                conversation: { select: { id: true, type: true, name: true } }
            }
        });

        await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() }
        });

        return NextResponse.json(message, { status: 201 });
    } catch (err) {
        console.error('Create Admin Message Error:', err);
        return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
    }
}
