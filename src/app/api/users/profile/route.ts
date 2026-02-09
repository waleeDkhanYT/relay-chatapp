import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import cloudinary from '@/lib/cloudinary';
import bcrypt from 'bcryptjs';

export async function GET(req: Request) {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    try {
        const user = await (prisma.user as any).findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                username: true,
                fullName: true,
                age: true,
                avatar: true,
                createdAt: true
            }
        });

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        return NextResponse.json(user);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    try {
        const body = await req.json();
        const { fullName, age, avatar, password } = body;

        const updateData: any = {};
        if (fullName !== undefined) updateData.fullName = fullName;
        if (age !== undefined) updateData.age = parseInt(age) || null;

        // Handle Cloudinary Upload (assuming avatar is a base64 string from frontend)
        if (avatar && avatar.startsWith('data:image')) {
            const uploadResponse = await cloudinary.uploader.upload(avatar, {
                folder: 'relay-avatars',
            });
            updateData.avatar = uploadResponse.secure_url;
        }

        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await (prisma.user as any).update({
            where: { id: decoded.id },
            data: updateData,
            select: {
                id: true,
                email: true,
                username: true,
                fullName: true,
                age: true,
                avatar: true
            }
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Update Profile Error:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}