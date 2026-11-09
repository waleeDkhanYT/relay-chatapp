import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/adminAuth';

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await verifyAdmin(req);
    if (error) return error;

    try {
        const { id } = await params;
        const body = await req.json();
        const { status } = body;

        if (!['PENDING', 'ACCEPTED', 'REJECTED'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const updated = await prisma.friendRequest.update({
            where: { id },
            data: { status },
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
                        { members: { some: { userId: updated.senderId } } },
                        { members: { some: { userId: updated.receiverId } } }
                    ]
                }
            });

            if (!existing) {
                await prisma.conversation.create({
                    data: {
                        type: 'DIRECT',
                        members: {
                            create: [
                                { userId: updated.senderId },
                                { userId: updated.receiverId }
                            ]
                        }
                    }
                });
            }
        }

        return NextResponse.json(updated);
    } catch (err) {
        console.error('Update Request Error:', err);
        return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
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

        await prisma.friendRequest.delete({
            where: { id }
        });

        return NextResponse.json({ success: true, message: 'Friend request deleted' });
    } catch (err) {
        console.error('Delete Request Error:', err);
        return NextResponse.json({ error: 'Failed to delete request' }, { status: 500 });
    }
}
