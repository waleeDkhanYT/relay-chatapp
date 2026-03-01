import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')
    const currentUserId = searchParams.get('userId') // In real app, get from session/token

    if (!query) {
        return NextResponse.json([])
    }

    try {
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { username: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } },
                ],
                NOT: {
                    id: currentUserId || undefined,
                },
            },
            select: {
                id: true,
                username: true,
                fullName: true,
                age: true,
                email: true,
                avatar: true,
                createdAt: true,
            },
        })

        return NextResponse.json(users)
    } catch (error) {
        return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }
}
