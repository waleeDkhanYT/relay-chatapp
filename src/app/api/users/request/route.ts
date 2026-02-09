import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
        return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    try {
        const requests = await prisma.friendRequest.findMany({
            where: {
                receiverId: userId,
                status: 'PENDING',
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                    },
                },
            },
        })

        return NextResponse.json(requests)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const { senderId, receiverId } = await req.json()

        if (!senderId || !receiverId) return NextResponse.json({ error: 'Missing IDs' }, { status: 400 })

        const existingRequest = await prisma.friendRequest.findUnique({
            where: {
                senderId_receiverId: {
                    senderId,
                    receiverId,
                },
            },
        })

        if (existingRequest) {
            return NextResponse.json({ error: 'Request already sent' }, { status: 400 })
        }

        const request = await prisma.friendRequest.create({
            data: {
                senderId,
                receiverId,
                status: 'PENDING',
            },
        })

        return NextResponse.json(request)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to send request' }, { status: 500 })
    }
}

export async function PUT(req: Request) {
    try {
        const { requestId, status } = await req.json() // status: ACCEPTED | REJECTED

        if (!['ACCEPTED', 'REJECTED'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }

        const request = await prisma.friendRequest.update({
            where: { id: requestId },
            data: { status },
            include: {
                sender: true,
                receiver: true
            }
        })

        if (status === 'ACCEPTED') {
            // Create a DIRECT conversation for both users
            await prisma.conversation.create({
                data: {
                    type: 'DIRECT',
                    members: {
                        create: [
                            { userId: request.senderId },
                            { userId: request.receiverId }
                        ]
                    }
                }
            })
        }

        return NextResponse.json(request)
    } catch (error) {
        console.error("PUT Request Error:", error)
        return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
    }
}
