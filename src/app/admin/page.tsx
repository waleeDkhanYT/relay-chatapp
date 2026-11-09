"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Users,
    MessagesSquare,
    MessageSquare,
    UserCheck,
    TrendingUp,
    Shield,
    ArrowUpRight,
    RefreshCw,
    Plus,
    Clock,
    UserPlus
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminCharts from "@/components/admin/AdminCharts";
import { formatDistanceToNow } from "date-fns";
import { adminFetch } from "@/lib/adminClient";

export default function AdminDashboardPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = async () => {
        try {
            const res = await adminFetch("/api/admin/stats");
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (e) {
            console.error("Failed to load admin stats", e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    return (
        <AdminLayout>
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        Platform Overview
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-400 mt-1">
                        Real-time operational metrics, user activity, and system health
                    </p>
                </div>
                <div className="flex items-center gap-2.5">
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="px-3 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                    >
                        <RefreshCw size={14} className={refreshing ? "animate-spin text-blue-400" : ""} />
                        <span>Refresh</span>
                    </button>
                    <Link
                        href="/admin/users"
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all active:scale-95"
                    >
                        <UserPlus size={14} />
                        <span>Add User</span>
                    </Link>
                </div>
            </div>

            {/* Loading Skeleton */}
            {loading ? (
                <div className="space-y-6 animate-pulse">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-32 bg-gray-900/60 rounded-3xl border border-gray-800" />
                        ))}
                    </div>
                    <div className="h-80 bg-gray-900/60 rounded-3xl border border-gray-800" />
                </div>
            ) : data ? (
                <>
                    {/* KPI Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* KPI 1: Users */}
                        <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-5 shadow-lg relative overflow-hidden group hover:border-gray-700 transition-all">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                    Total Users
                                </span>
                                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                                    <Users size={18} />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-white">{data.kpis.totalUsers}</span>
                                <span className="text-xs text-green-400 font-semibold flex items-center">
                                    +{data.kpis.newUsersToday} today
                                </span>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-2">
                                +{data.kpis.newUsersWeek} new signups this week
                            </p>
                        </div>

                        {/* KPI 2: Conversations */}
                        <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-5 shadow-lg relative overflow-hidden group hover:border-gray-700 transition-all">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                    Conversations
                                </span>
                                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                                    <MessagesSquare size={18} />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-white">{data.kpis.totalConversations}</span>
                                <span className="text-xs text-purple-400 font-semibold">
                                    {data.kpis.groupConversations} groups
                                </span>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-2">
                                {data.kpis.directConversations} direct 1-on-1 chats
                            </p>
                        </div>

                        {/* KPI 3: Messages */}
                        <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-5 shadow-lg relative overflow-hidden group hover:border-gray-700 transition-all">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                    Messages
                                </span>
                                <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
                                    <MessageSquare size={18} />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-white">{data.kpis.totalMessages}</span>
                                <span className="text-xs text-sky-400 font-semibold">
                                    +{data.kpis.messagesToday} today
                                </span>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-2">
                                {data.kpis.deletedMessages} marked as deleted
                            </p>
                        </div>

                        {/* KPI 4: Friend Network */}
                        <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-5 shadow-lg relative overflow-hidden group hover:border-gray-700 transition-all">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                    Friend Requests
                                </span>
                                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                                    <UserCheck size={18} />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-white">{data.kpis.totalRequests}</span>
                                <span className="text-xs text-emerald-400 font-semibold">
                                    {data.kpis.acceptedRequests} accepted
                                </span>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-2">
                                {data.kpis.pendingRequests} awaiting confirmation
                            </p>
                        </div>
                    </div>

                    {/* Interactive Charts Component */}
                    <AdminCharts
                        timeline={data.timeline}
                        directCount={data.kpis.directConversations}
                        groupCount={data.kpis.groupConversations}
                        totalMessages={data.kpis.totalMessages}
                        deletedMessages={data.kpis.deletedMessages}
                        pendingRequests={data.kpis.pendingRequests}
                        acceptedRequests={data.kpis.acceptedRequests}
                    />

                    {/* Recent Activity Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Recent Users Card */}
                        <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-5 sm:p-6 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-base text-white flex items-center gap-2">
                                    <Users size={16} className="text-blue-400" />
                                    <span>Newest Users</span>
                                </h3>
                                <Link
                                    href="/admin/users"
                                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                                >
                                    <span>View All</span>
                                    <ArrowUpRight size={13} />
                                </Link>
                            </div>

                            <div className="space-y-2.5">
                                {data.recentActivity.users.map((u: any) => (
                                    <div
                                        key={u.id}
                                        className="flex items-center justify-between p-2.5 rounded-2xl bg-gray-950/60 border border-gray-800/80"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                                                {u.avatar ? (
                                                    <img src={u.avatar} alt={u.username} className="w-full h-full object-cover" />
                                                ) : (
                                                    u.username[0]?.toUpperCase()
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-white truncate">
                                                    {u.fullName || u.username}
                                                </p>
                                                <p className="text-[11px] text-gray-500 truncate">{u.email}</p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                u.role === 'ADMIN'
                                                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                                    : 'bg-gray-800 text-gray-400'
                                            }`}>
                                                {u.role || 'USER'}
                                            </span>
                                            <span className="block text-[10px] text-gray-500 mt-1">
                                                {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Messages Card */}
                        <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-5 sm:p-6 shadow-xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-base text-white flex items-center gap-2">
                                    <MessageSquare size={16} className="text-purple-400" />
                                    <span>Latest Messages</span>
                                </h3>
                                <Link
                                    href="/admin/messages"
                                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                                >
                                    <span>View All</span>
                                    <ArrowUpRight size={13} />
                                </Link>
                            </div>

                            <div className="space-y-2.5">
                                {data.recentActivity.messages.map((m: any) => (
                                    <div
                                        key={m.id}
                                        className="p-3 rounded-2xl bg-gray-950/60 border border-gray-800/80 space-y-1.5"
                                    >
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-gray-300">
                                                @{m.sender.username}
                                            </span>
                                            <span className="text-[10px] text-gray-500">
                                                {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-400 line-clamp-1 italic">
                                            {m.isDeleted ? "[Deleted message]" : `"${m.content}"`}
                                        </p>
                                        <div className="flex items-center gap-2 pt-1 text-[10px] text-gray-500">
                                            <span className="px-1.5 py-0.5 rounded-md bg-gray-900 border border-gray-800">
                                                {m.conversation.type} {m.conversation.name ? `• ${m.conversation.name}` : ""}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="p-8 text-center bg-gray-900/60 rounded-3xl border border-gray-800 space-y-4 my-8">
                    <p className="text-gray-400 text-sm">Failed to load platform overview metrics.</p>
                    <button
                        onClick={handleRefresh}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/30 active:scale-95"
                    >
                        Retry Loading
                    </button>
                </div>
            )}
        </AdminLayout>
    );
}
