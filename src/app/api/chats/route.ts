import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic';

// Get all conversations for a user
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

    try {
        const conversations = await prisma.conversation.findMany({
            where: {
                members: {
                    some: { userId }
                }
            },
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
            },
            orderBy: { updatedAt: 'desc' }
        })

        // Format to include lastMessage flattened
        const formatted = conversations.map((c: any) => ({
            ...c,
            lastMessage: c.messages[0] || null
        }))

        return NextResponse.json(formatted)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
    }
}

// Create a new direct conversation
export async function POST(req: Request) {
    try {
        const { type, memberIds, name } = await req.json() // memberIds includes current user + other user

        if (type === 'DIRECT') {
            // Check if exists
            const existing = await prisma.conversation.findFirst({
                where: {
                    type: 'DIRECT',
                    AND: memberIds.map((id: string) => ({
                        members: { some: { userId: id } }
                    }))
                }
            })

            if (existing) return NextResponse.json(existing)
        }

        const conversation = await prisma.conversation.create({
            data: {
                type,
                name,
                members: {
                    create: memberIds.map((id: string) => ({ userId: id }))
                }
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: { id: true, username: true, fullName: true, age: true, email: true, avatar: true, createdAt: true }
                        }
                    }
                }
            }
        })

        return NextResponse.json(conversation)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
    }
}
