import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get('conversationId')

    if (!conversationId) return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 })

    try {
        const messages = await prisma.message.findMany({
            where: { conversationId },
            include: {
                sender: {
                    select: { id: true, username: true, avatar: true }
                }
            },
            orderBy: { createdAt: 'asc' }
        })

        return NextResponse.json(messages)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }
}
