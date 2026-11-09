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

        const message = await prisma.message.findUnique({
            where: { id },
            include: {
                sender: { select: { id: true, username: true, email: true, avatar: true } },
                conversation: {
                    select: {
                        id: true,
                        type: true,
                        name: true,
                        members: {
                            include: { user: { select: { id: true, username: true } } }
                        }
                    }
                }
            }
        });

        if (!message) {
            return NextResponse.json({ error: 'Message not found' }, { status: 404 });
        }

        return NextResponse.json(message);
    } catch (err) {
        console.error('Fetch Message Detail Error:', err);
        return NextResponse.json({ error: 'Failed to fetch message' }, { status: 500 });
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
        const { content, isDeleted } = body;

        const updateData: any = {};
        if (content !== undefined) updateData.content = content.trim();
        if (isDeleted !== undefined) updateData.isDeleted = Boolean(isDeleted);

        const updated = await prisma.message.update({
            where: { id },
            data: updateData,
            include: {
                sender: { select: { id: true, username: true, avatar: true } },
                conversation: { select: { id: true, type: true, name: true } }
            }
        });

        return NextResponse.json(updated);
    } catch (err) {
        console.error('Update Message Error:', err);
        return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
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

        await prisma.message.delete({
            where: { id }
        });

        return NextResponse.json({ success: true, message: 'Message permanently deleted' });
    } catch (err) {
        console.error('Delete Message Error:', err);
        return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
    }
}
