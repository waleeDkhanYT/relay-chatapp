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
        const type = searchParams.get('type') || 'ALL';
        const sortBy = searchParams.get('sortBy') || 'updatedAt';
        const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';

        const where: any = {};

        if (type !== 'ALL') {
            where.type = type;
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                {
                    members: {
                        some: {
                            user: {
                                OR: [
                                    { username: { contains: search, mode: 'insensitive' } },
                                    { email: { contains: search, mode: 'insensitive' } },
                                    { fullName: { contains: search, mode: 'insensitive' } }
                                ]
                            }
                        }
                    }
                }
            ];
        }

        const [conversations, total] = await Promise.all([
            prisma.conversation.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { [sortBy]: order },
                include: {
                    members: {
                        include: {
                            user: {
                                select: { id: true, username: true, email: true, fullName: true, avatar: true }
                            }
                        }
                    },
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        select: { id: true, content: true, senderId: true, createdAt: true, isDeleted: true }
                    },
                    _count: {
                        select: { messages: true, members: true }
                    }
                }
            }),
            prisma.conversation.count({ where })
        ]);

        return NextResponse.json({
            conversations: conversations.map((c) => ({
                ...c,
                lastMessage: c.messages[0] || null
            })),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    } catch (err) {
        console.error('Fetch Admin Conversations Error:', err);
        return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const { error, user: adminUser } = await verifyAdmin(req);
    if (error) return error;

    try {
        const body = await req.json();
        const { type = 'GROUP', name, memberIds = [] } = body;

        if (type === 'GROUP' && !name?.trim()) {
            return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
        }

        if (!Array.isArray(memberIds) || memberIds.length === 0) {
            return NextResponse.json({ error: 'At least one member is required' }, { status: 400 });
        }

        // Include admin if not already in memberIds
        const allMemberIds = Array.from(new Set([...memberIds, adminUser!.id]));

        const conversation = await prisma.conversation.create({
            data: {
                type,
                name: type === 'GROUP' ? name.trim() : null,
                members: {
                    create: allMemberIds.map((userId: string) => ({ userId }))
                }
            },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, username: true, email: true, avatar: true } }
                    }
                },
                _count: { select: { messages: true, members: true } }
            }
        });

        return NextResponse.json(conversation, { status: 201 });
    } catch (err) {
        console.error('Create Admin Conversation Error:', err);
        return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    }
}
