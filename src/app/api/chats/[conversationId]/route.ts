import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
    req: Request,
    { params }: { params: { conversationId: string } }
) {
    try {
        const body = await req.json();
        const { memberIds } = body; // IDs to ADD

        if (!memberIds || !Array.isArray(memberIds)) {
            return NextResponse.json({ error: 'Invalid memberIds' }, { status: 400 });
        }

        // Use createMany with skipDuplicates to avoid unique constraint errors
        await prisma.conversationMember.createMany({
            data: memberIds.map((id: string) => ({
                userId: id,
                conversationId: params.conversationId
            })),
            skipDuplicates: true
        });

        // Fetch the updated conversation to return
        // We need to return the full conversation object with members and users for the frontend to update state
        const conversation = await prisma.conversation.findUnique({
            where: { id: params.conversationId },
            include: {
                members: {
                    include: {
                        user: {
                            select: { id: true, username: true, fullName: true, age: true, email: true, avatar: true, createdAt: true }
                        }
                    }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        if (!conversation) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }

        // Format to include lastMessage if needed (matching existing pattern)
        const formatted = {
            ...conversation,
            lastMessage: conversation.messages[0] || null
        };

        return NextResponse.json(formatted);
    } catch (error) {
        console.error('Failed to update conversation:', error);
        return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 });
    }
}
