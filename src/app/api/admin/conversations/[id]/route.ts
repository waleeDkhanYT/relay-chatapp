import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/adminAuth';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await verifyAdmin(req);
    if (error) return error;

    try {
        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const limit = Math.min(500, Math.max(10, parseInt(searchParams.get('limit') || '250')));
        const search = searchParams.get('search')?.trim() || '';

        const msgWhere: any = {};
        if (search) {
            msgWhere.content = { contains: search, mode: 'insensitive' };
        }

        const conversation = await prisma.conversation.findUnique({
            where: { id },
            include: {
                members: {
                    include: {
                        user: {
                            select: { id: true, username: true, email: true, fullName: true, avatar: true, role: true }
                        }
                    }
                },
                messages: {
                    where: msgWhere,
                    orderBy: { createdAt: 'desc' },
                    take: limit,
                    include: {
                        sender: { select: { id: true, username: true, fullName: true, avatar: true, role: true } }
                    }
                },
                _count: {
                    select: { messages: true, members: true }
                }
            }
        });

        if (!conversation) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }

        // Return messages in chronological order for conversation timeline
        return NextResponse.json({
            ...conversation,
            messages: conversation.messages.reverse()
        });
    } catch (err) {
        console.error('Fetch Conversation Detail Error:', err);
        return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 });
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await verifyAdmin(req);
    if (error) return error;

    try {
        const { id } = await params;
        const body = await req.json();
        const { name, addMemberIds = [], removeMemberIds = [] } = body;

        // Update group name if provided
        if (name !== undefined) {
            await prisma.conversation.update({
                where: { id },
                data: { name: name?.trim() || null }
            });
        }

        // Remove members
        if (Array.isArray(removeMemberIds) && removeMemberIds.length > 0) {
            await prisma.conversationMember.deleteMany({
                where: {
                    conversationId: id,
                    userId: { in: removeMemberIds }
                }
            });
        }

        // Add members
        if (Array.isArray(addMemberIds) && addMemberIds.length > 0) {
            await prisma.conversationMember.createMany({
                data: addMemberIds.map((userId: string) => ({
                    conversationId: id,
                    userId
                })),
                skipDuplicates: true
            });
        }

        const updated = await prisma.conversation.findUnique({
            where: { id },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, username: true, email: true, fullName: true, avatar: true, role: true } }
                    }
                },
                _count: {
                    select: { messages: true, members: true }
                }
            }
        });

        return NextResponse.json(updated);
    } catch (err) {
        console.error('Update Conversation Error:', err);
        return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await verifyAdmin(req);
    if (error) return error;

    try {
        const { id } = await params;

        // Delete associated messages, members and the conversation
        await prisma.message.deleteMany({ where: { conversationId: id } });
        await prisma.conversationMember.deleteMany({ where: { conversationId: id } });
        await prisma.conversation.delete({ where: { id } });

        return NextResponse.json({ success: true, message: 'Conversation deleted successfully' });
    } catch (err) {
        console.error('Delete Conversation Error:', err);
        return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 });
    }
}
