import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/adminAuth';
import bcrypt from 'bcryptjs';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await verifyAdmin(req);
    if (error) return error;

    try {
        const { id } = await params;

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                username: true,
                email: true,
                fullName: true,
                age: true,
                avatar: true,
                role: true,
                createdAt: true,
                conversations: {
                    include: {
                        conversation: {
                            select: { id: true, type: true, name: true, updatedAt: true }
                        }
                    }
                },
                _count: {
                    select: {
                        messages: true,
                        conversations: true,
                        sentRequests: true,
                        receivedRequests: true
                    }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (err) {
        console.error('Fetch User Detail Error:', err);
        return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
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
        const { email, username, fullName, age, role, avatar, password } = body;

        const updateData: any = {};
        if (email !== undefined) updateData.email = email.toLowerCase().trim();
        if (username !== undefined) updateData.username = username.trim();
        if (fullName !== undefined) updateData.fullName = fullName?.trim() || null;
        if (age !== undefined) updateData.age = age ? parseInt(age) : null;
        if (role !== undefined) updateData.role = role === 'ADMIN' ? 'ADMIN' : 'USER';
        if (avatar !== undefined) updateData.avatar = avatar || null;

        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updated = await prisma.user.update({
            where: { id },
            data: updateData,
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

        return NextResponse.json(updated);
    } catch (err) {
        console.error('Update User Error:', err);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error, user: adminUser } = await verifyAdmin(req);
    if (error) return error;

    try {
        const { id } = await params;

        // Prevent self-deletion of currently logged-in admin
        if (adminUser?.id === id) {
            return NextResponse.json({ error: 'You cannot delete your own admin account.' }, { status: 400 });
        }

        await prisma.user.delete({
            where: { id }
        });

        return NextResponse.json({ success: true, message: 'User deleted successfully' });
    } catch (err) {
        console.error('Delete User Error:', err);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}
