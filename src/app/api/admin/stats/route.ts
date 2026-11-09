import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { error } = await verifyAdmin(req);
    if (error) return error;

    try {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        // Pre-build 14-day timeline buckets
        const timelineMap: Record<string, { label: string; date: string; messages: number; users: number }> = {};
        for (let i = 13; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const key = d.toISOString().split('T')[0];
            const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            timelineMap[key] = { label, date: key, messages: 0, users: 0 };
        }

        // Fast consolidated query execution:
        // 1. Single consolidated query for all 12 KPI counts
        // 2. Direct DB-level date aggregation for 14-day timeline (avoids loading thousands of records)
        // 3. Recent 5 records for activity tables
        const [
            kpiRows,
            recentUsers,
            recentMessages,
            recentConversations,
            timelineMsgRows,
            timelineUserRows
        ] = await Promise.all([
            prisma.$queryRaw<any[]>`
                SELECT
                    (SELECT COUNT(*)::int FROM "User") as "totalUsers",
                    (SELECT COUNT(*)::int FROM "User" WHERE "createdAt" >= ${startOfToday}) as "newUsersToday",
                    (SELECT COUNT(*)::int FROM "User" WHERE "createdAt" >= ${sevenDaysAgo}) as "newUsersWeek",
                    (SELECT COUNT(*)::int FROM "Conversation") as "totalConversations",
                    (SELECT COUNT(*)::int FROM "Conversation" WHERE "type" = 'DIRECT') as "directConversations",
                    (SELECT COUNT(*)::int FROM "Conversation" WHERE "type" = 'GROUP') as "groupConversations",
                    (SELECT COUNT(*)::int FROM "Message") as "totalMessages",
                    (SELECT COUNT(*)::int FROM "Message" WHERE "createdAt" >= ${startOfToday}) as "messagesToday",
                    (SELECT COUNT(*)::int FROM "Message" WHERE "isDeleted" = true) as "deletedMessages",
                    (SELECT COUNT(*)::int FROM "FriendRequest") as "totalRequests",
                    (SELECT COUNT(*)::int FROM "FriendRequest" WHERE "status" = 'PENDING') as "pendingRequests",
                    (SELECT COUNT(*)::int FROM "FriendRequest" WHERE "status" = 'ACCEPTED') as "acceptedRequests"
            `,
            prisma.user.findMany({
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: { id: true, username: true, email: true, fullName: true, role: true, avatar: true, createdAt: true }
            }),
            prisma.message.findMany({
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: {
                    id: true,
                    content: true,
                    createdAt: true,
                    isDeleted: true,
                    sender: { select: { id: true, username: true, avatar: true } },
                    conversation: { select: { id: true, type: true, name: true } }
                }
            }),
            prisma.conversation.findMany({
                orderBy: { updatedAt: 'desc' },
                take: 5,
                select: {
                    id: true,
                    type: true,
                    name: true,
                    updatedAt: true,
                    members: {
                        select: {
                            user: { select: { id: true, username: true, avatar: true } }
                        }
                    },
                    _count: { select: { messages: true } }
                }
            }),
            prisma.$queryRaw<{ date: string; count: number }[]>`
                SELECT TO_CHAR("createdAt", 'YYYY-MM-DD') as date, COUNT(*)::int as count
                FROM "Message"
                WHERE "createdAt" >= ${fourteenDaysAgo}
                GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD')
            `,
            prisma.$queryRaw<{ date: string; count: number }[]>`
                SELECT TO_CHAR("createdAt", 'YYYY-MM-DD') as date, COUNT(*)::int as count
                FROM "User"
                WHERE "createdAt" >= ${fourteenDaysAgo}
                GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD')
            `
        ]);

        const kpis = kpiRows?.[0] || {
            totalUsers: 0,
            newUsersToday: 0,
            newUsersWeek: 0,
            totalConversations: 0,
            directConversations: 0,
            groupConversations: 0,
            totalMessages: 0,
            messagesToday: 0,
            deletedMessages: 0,
            totalRequests: 0,
            pendingRequests: 0,
            acceptedRequests: 0
        };

        // Populate aggregated timeline counts
        timelineMsgRows.forEach((r) => {
            if (timelineMap[r.date]) {
                timelineMap[r.date].messages = Number(r.count) || 0;
            }
        });

        timelineUserRows.forEach((r) => {
            if (timelineMap[r.date]) {
                timelineMap[r.date].users = Number(r.count) || 0;
            }
        });

        const timeline = Object.values(timelineMap);

        return NextResponse.json({
            kpis,
            timeline,
            recentActivity: {
                users: recentUsers,
                messages: recentMessages,
                conversations: recentConversations
            }
        });
    } catch (error) {
        console.error('Admin Stats Error:', error);
        return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 });
    }
}
