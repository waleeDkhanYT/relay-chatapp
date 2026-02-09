import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

    try {
        // Friends are people who have an ACCEPTED friend request with the user
        const friends = await prisma.user.findMany({
            where: {
                OR: [
                    {
                        sentRequests: {
                            some: {
                                receiverId: userId,
                                status: 'ACCEPTED'
                            }
                        }
                    },
                    {
                        receivedRequests: {
                            some: {
                                senderId: userId,
                                status: 'ACCEPTED'
                            }
                        }
                    }
                ],
                NOT: { id: userId }
            },
            select: {
                id: true,
                username: true,
                email: true,
                avatar: true,
            }
        })

        return NextResponse.json(friends)
    } catch (error) {
        console.error("Fetch Friends Error:", error)
        return NextResponse.json({ error: 'Failed to fetch friends' }, { status: 500 })
    }
}
