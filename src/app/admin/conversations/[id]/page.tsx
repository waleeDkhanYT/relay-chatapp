"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Users,
    MessageSquare,
    Trash2,
    Edit3,
    Send,
    RefreshCw,
    Shield,
    Calendar,
    Clock,
    Search,
    UserPlus,
    X,
    Check,
    AlertCircle,
    Copy,
    CornerDownLeft
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { format, formatDistanceToNow } from "date-fns";
import { adminFetch } from "@/lib/adminClient";

export default function AdminConversationHistoryPage({
    params
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const router = useRouter();

    const [conversation, setConversation] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchMsg, setSearchMsg] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    // Message Broadcast State
    const [broadcastContent, setBroadcastContent] = useState("");
    const [sendingBroadcast, setSendingBroadcast] = useState(false);

    // Edit Group Modal State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [selectedAddMemberIds, setSelectedAddMemberIds] = useState<string[]>([]);
    const [actionLoading, setActionLoading] = useState(false);
    const [modalError, setModalError] = useState("");

    // Message Edit Modal State
    const [editingMsg, setEditingMsg] = useState<any>(null);
    const [editMsgContent, setEditMsgContent] = useState("");
    const [editMsgLoading, setEditMsgLoading] = useState(false);

    // Delete Conversation Modal State
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Load Conversation Data
    const loadConversation = useCallback(async () => {
        try {
            const url = searchMsg
                ? `/api/admin/conversations/${id}?search=${encodeURIComponent(searchMsg)}`
                : `/api/admin/conversations/${id}`;
            const res = await adminFetch(url);
            if (res.ok) {
                const data = await res.json();
                setConversation(data);
                setGroupName(data.name || "");
            }
        } catch (err) {
            console.error("Failed to load conversation history:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [id, searchMsg]);

    useEffect(() => {
        loadConversation();
    }, [loadConversation]);

    // Load user list for adding members
    const loadAllUsers = async () => {
        try {
            const res = await adminFetch("/api/admin/users?limit=100&minimal=true");
            if (res.ok) {
                const data = await res.json();
                setAllUsers(data.users || []);
            }
        } catch (e) {
            console.error("Failed to load users:", e);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadConversation();
    };

    // Send Broadcast from Admin
    const handleSendBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!broadcastContent.trim()) return;
        setSendingBroadcast(true);

        try {
            const res = await adminFetch("/api/admin/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    conversationId: id,
                    content: broadcastContent.trim()
                })
            });

            if (res.ok) {
                setBroadcastContent("");
                loadConversation();
            }
        } catch (err) {
            console.error("Failed to post message:", err);
        } finally {
            setSendingBroadcast(false);
        }
    };

    // Toggle Soft Delete on a Message
    const handleToggleSoftDelete = async (msg: any) => {
        try {
            const res = await adminFetch(`/api/admin/messages/${msg.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isDeleted: !msg.isDeleted })
            });

            if (res.ok) {
                loadConversation();
            }
        } catch (err) {
            console.error("Failed to update message delete status:", err);
        }
    };

    // Permanent delete a message
    const handlePermanentDeleteMsg = async (msgId: string) => {
        if (!confirm("Are you sure you want to permanently delete this message?")) return;
        try {
            const res = await adminFetch(`/api/admin/messages/${msgId}`, {
                method: "DELETE"
            });
            if (res.ok) {
                loadConversation();
            }
        } catch (err) {
            console.error("Failed to delete message:", err);
        }
    };

    // Save edited message content
    const handleSaveMsgEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingMsg || !editMsgContent.trim()) return;
        setEditMsgLoading(true);

        try {
            const res = await adminFetch(`/api/admin/messages/${editingMsg.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: editMsgContent.trim() })
            });

            if (res.ok) {
                setEditingMsg(null);
                setEditMsgContent("");
                loadConversation();
            }
        } catch (err) {
            console.error("Failed to edit message:", err);
        } finally {
            setEditMsgLoading(false);
        }
    };

    // Save Group Changes (Name, Add members)
    const handleSaveGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        setModalError("");

        try {
            const res = await adminFetch(`/api/admin/conversations/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: groupName.trim(),
                    addMemberIds: selectedAddMemberIds
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to update group");
            }

            setIsEditOpen(false);
            setSelectedAddMemberIds([]);
            loadConversation();
        } catch (err: any) {
            setModalError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // Remove member from group
    const handleRemoveMember = async (userId: string, username: string) => {
        if (!confirm(`Remove @${username} from this group?`)) return;

        try {
            const res = await adminFetch(`/api/admin/conversations/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    removeMemberIds: [userId]
                })
            });

            if (res.ok) {
                loadConversation();
            }
        } catch (err) {
            console.error("Failed to remove member:", err);
        }
    };

    // Delete Entire Conversation
    const handleDeleteConversation = async () => {
        setDeleteLoading(true);
        try {
            const res = await adminFetch(`/api/admin/conversations/${id}`, {
                method: "DELETE"
            });

            if (res.ok) {
                router.push("/admin/conversations");
            }
        } catch (err) {
            console.error("Failed to delete conversation:", err);
        } finally {
            setDeleteLoading(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="py-24 flex flex-col items-center justify-center text-gray-500 gap-3">
                    <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-medium">Loading conversation history...</span>
                </div>
            </AdminLayout>
        );
    }

    if (!conversation) {
        return (
            <AdminLayout>
                <div className="p-8 text-center bg-gray-900 border border-gray-800 rounded-3xl space-y-4 max-w-lg mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center mx-auto">
                        <AlertCircle size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-white">Conversation Not Found</h2>
                    <p className="text-xs text-gray-400">
                        This conversation may have been deleted or does not exist.
                    </p>
                    <Link
                        href="/admin/conversations"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all"
                    >
                        <ArrowLeft size={14} />
                        <span>Return to Conversations</span>
                    </Link>
                </div>
            </AdminLayout>
        );
    }

    const isGroup = conversation.type === "GROUP";
    const title = isGroup
        ? conversation.name || "Untitled Group"
        : conversation.members?.map((m: any) => m.user.username).join(" & ") || "Direct Chat";

    const existingMemberIds = new Set(conversation.members?.map((m: any) => m.user.id));
    const nonMembers = allUsers.filter((u) => !existingMemberIds.has(u.id));

    return (
        <AdminLayout>
            {/* Top Navigation & Breadcrumb */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/conversations"
                        className="p-2.5 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors shadow-xs"
                        title="Back to Conversations Table"
                    >
                        <ArrowLeft size={16} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-400">Conversations</span>
                            <span className="text-gray-600 text-xs">/</span>
                            <span className="text-xs font-bold text-blue-400">History & Inspector</span>
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5 mt-0.5">
                            <span>{title}</span>
                            <span
                                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                                    isGroup
                                        ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                        : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                }`}
                            >
                                {conversation.type}
                            </span>
                        </h1>
                    </div>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="p-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
                        title="Refresh Chat History"
                    >
                        <RefreshCw size={14} className={refreshing ? "animate-spin text-blue-400" : ""} />
                    </button>
                    {isGroup && (
                        <button
                            onClick={() => {
                                setIsEditOpen(true);
                                loadAllUsers();
                            }}
                            className="px-3.5 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                        >
                            <Edit3 size={14} />
                            <span>Edit Group</span>
                        </button>
                    )}
                    <button
                        onClick={() => setIsDeleteOpen(true)}
                        className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                        title="Delete Entire Conversation"
                    >
                        <Trash2 size={15} />
                    </button>
                </div>
            </div>

            {/* Metrics Chips Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-gray-900/80 border border-gray-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Messages Logged</span>
                    <p className="text-xl font-black text-white mt-0.5">{conversation._count?.messages || 0}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-gray-900/80 border border-gray-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Total Members</span>
                    <p className="text-xl font-black text-white mt-0.5">{conversation.members?.length || 0}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-gray-900/80 border border-gray-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Created On</span>
                    <p className="text-xs font-semibold text-gray-300 mt-1.5 truncate">
                        {format(new Date(conversation.createdAt), "MMM d, yyyy")}
                    </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-gray-900/80 border border-gray-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Last Activity</span>
                    <p className="text-xs font-semibold text-gray-300 mt-1.5 truncate">
                        {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}
                    </p>
                </div>
            </div>

            {/* Main Content Area (Message Stream & Details Sidebar) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* LEFT: Complete Message Timeline (2 cols) */}
                <div className="lg:col-span-2 bg-gray-900/80 border border-gray-800 rounded-3xl p-5 shadow-xl flex flex-col min-h-[580px]">
                    {/* Stream Header & Message Filter */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-800/80">
                        <div className="flex items-center gap-2">
                            <MessageSquare size={16} className="text-blue-400" />
                            <h2 className="text-sm font-bold text-white tracking-wide">
                                Chat History Feed ({conversation.messages?.length || 0})
                            </h2>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                            <input
                                type="text"
                                placeholder="Search inside conversation..."
                                value={searchMsg}
                                onChange={(e) => setSearchMsg(e.target.value)}
                                className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-hidden focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Messages Scrollable Feed */}
                    <div className="flex-1 overflow-y-auto space-y-3 py-4 max-h-[500px] pr-1">
                        {conversation.messages?.length === 0 ? (
                            <div className="py-24 text-center text-gray-500 text-xs flex flex-col items-center gap-2">
                                <MessageSquare size={28} className="opacity-30" />
                                <span>No messages found in this conversation.</span>
                            </div>
                        ) : (
                            conversation.messages?.map((msg: any) => {
                                const isDeleted = msg.isDeleted;
                                const isMsgAdmin = msg.sender?.role === "ADMIN";
                                return (
                                    <div
                                        key={msg.id}
                                        className={`p-3.5 rounded-2xl border transition-all ${
                                            isDeleted
                                                ? "bg-red-950/15 border-red-500/20 text-red-200"
                                                : "bg-gray-950/70 border-gray-800 hover:border-gray-700 text-gray-200"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            {/* Sender Info */}
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-7 h-7 rounded-full bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shrink-0">
                                                    {msg.sender?.username?.[0]?.toUpperCase() || "U"}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-white">
                                                        @{msg.sender?.username}
                                                    </span>
                                                    {isMsgAdmin && (
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-0.5">
                                                            <Shield size={10} />
                                                            <span>ADMIN</span>
                                                        </span>
                                                    )}
                                                    {isDeleted && (
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-widest">
                                                            Soft-Deleted
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Timestamp & Moderation Menu */}
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-gray-400 hidden sm:inline">
                                                    {format(new Date(msg.createdAt), "MMM d, hh:mm a")}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleToggleSoftDelete(msg)}
                                                        className={`p-1.5 rounded-lg text-xs transition-colors ${
                                                            isDeleted
                                                                ? "text-green-400 hover:bg-green-500/10"
                                                                : "text-gray-400 hover:text-yellow-400 hover:bg-gray-800"
                                                        }`}
                                                        title={isDeleted ? "Restore message" : "Soft-delete message"}
                                                    >
                                                        {isDeleted ? <Check size={13} /> : <AlertCircle size={13} />}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingMsg(msg);
                                                            setEditMsgContent(msg.content);
                                                        }}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-gray-800 transition-colors"
                                                        title="Edit message content"
                                                    >
                                                        <Edit3 size={13} />
                                                    </button>
                                                    <button
                                                        onClick={() => handlePermanentDeleteMsg(msg.id)}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                        title="Permanent hard delete"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Message Text */}
                                        <div className="mt-2 text-xs leading-relaxed break-words pl-9">
                                            {isDeleted ? (
                                                <span className="italic text-red-400/80">
                                                    [Hidden from chat view - Original: &ldquo;{msg.content}&rdquo;]
                                                </span>
                                            ) : (
                                                msg.content
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Admin Message Broadcast Footer */}
                    <form onSubmit={handleSendBroadcast} className="pt-3 border-t border-gray-800/80 flex gap-2">
                        <input
                            type="text"
                            placeholder="Post admin notice into this chat as Administrator..."
                            value={broadcastContent}
                            onChange={(e) => setBroadcastContent(e.target.value)}
                            className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-hidden focus:border-blue-500"
                        />
                        <button
                            type="submit"
                            disabled={sendingBroadcast || !broadcastContent.trim()}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/30 active:scale-95"
                        >
                            <Send size={13} />
                            <span>Post</span>
                        </button>
                    </form>
                </div>

                {/* RIGHT: Conversation Metadata & Members List (1 col) */}
                <div className="space-y-4">
                    {/* Metadata Card */}
                    <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-5 shadow-xl space-y-3.5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Conversation Info</span>
                            <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    isGroup
                                        ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                        : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                }`}
                            >
                                {conversation.type}
                            </span>
                        </div>

                        <div className="space-y-2 text-xs">
                            <div>
                                <span className="text-[10px] text-gray-500 font-bold uppercase">Conversation ID</span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="font-mono text-gray-300 text-[11px] truncate">{conversation.id}</span>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(conversation.id)}
                                        className="p-1 hover:text-white text-gray-500"
                                        title="Copy ID"
                                    >
                                        <Copy size={12} />
                                    </button>
                                </div>
                            </div>

                            {isGroup && (
                                <div>
                                    <span className="text-[10px] text-gray-500 font-bold uppercase">Group Name</span>
                                    <p className="font-semibold text-white mt-0.5">{conversation.name || "Untitled Group"}</p>
                                </div>
                            )}

                            <div>
                                <span className="text-[10px] text-gray-500 font-bold uppercase">Created At</span>
                                <p className="text-gray-300 mt-0.5 flex items-center gap-1.5">
                                    <Calendar size={12} className="text-gray-500" />
                                    <span>{format(new Date(conversation.createdAt), "PPpp")}</span>
                                </p>
                            </div>

                            <div>
                                <span className="text-[10px] text-gray-500 font-bold uppercase">Last Updated</span>
                                <p className="text-gray-300 mt-0.5 flex items-center gap-1.5">
                                    <Clock size={12} className="text-gray-500" />
                                    <span>{format(new Date(conversation.updatedAt), "PPpp")}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Members List Card */}
                    <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-5 shadow-xl space-y-3.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <Users size={15} className="text-blue-400" />
                                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                                    Members ({conversation.members?.length || 0})
                                </span>
                            </div>
                            {isGroup && (
                                <button
                                    onClick={() => {
                                        setIsEditOpen(true);
                                        loadAllUsers();
                                    }}
                                    className="p-1 text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                                >
                                    <UserPlus size={13} />
                                    <span>Add</span>
                                </button>
                            )}
                        </div>

                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                            {conversation.members?.map((m: any) => {
                                const u = m.user;
                                const isUserAdmin = u.role === "ADMIN";
                                return (
                                    <div
                                        key={m.id}
                                        className="p-2.5 rounded-xl bg-gray-950/60 border border-gray-800/80 flex items-center justify-between group hover:border-gray-700 transition-colors"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-7 h-7 rounded-full bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-[10px] text-white shrink-0">
                                                {u.username?.[0]?.toUpperCase() || "U"}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-white truncate flex items-center gap-1">
                                                    <span>@{u.username}</span>
                                                    {isUserAdmin && <Shield size={11} className="text-blue-400" />}
                                                </p>
                                                <p className="text-[10px] text-gray-400 truncate">{u.email}</p>
                                            </div>
                                        </div>

                                        {isGroup && conversation.members.length > 2 && (
                                            <button
                                                onClick={() => handleRemoveMember(u.id, u.username)}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 rounded-md transition-all"
                                                title="Remove member"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* EDIT GROUP MODAL */}
            {isEditOpen && isGroup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
                    <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                            <h3 className="font-bold text-lg text-white">Edit Group Information</h3>
                            <button onClick={() => setIsEditOpen(false)} className="text-gray-400 hover:text-white">
                                <X size={18} />
                            </button>
                        </div>

                        {modalError && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
                                <AlertCircle size={15} />
                                <span>{modalError}</span>
                            </div>
                        )}

                        <form onSubmit={handleSaveGroup} className="space-y-4 flex-1 flex flex-col overflow-hidden">
                            <div>
                                <Input
                                    label="Group Name"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    required
                                    className="bg-gray-950 border-gray-800 text-sm"
                                />
                            </div>

                            <div className="flex-1 flex flex-col min-h-0 space-y-2">
                                <label className="text-xs font-semibold text-gray-300">
                                    Add New Members ({selectedAddMemberIds.length} selected)
                                </label>
                                <div className="flex-1 overflow-y-auto max-h-48 space-y-1 p-2 bg-gray-950 rounded-xl border border-gray-800">
                                    {nonMembers.length === 0 ? (
                                        <p className="text-xs text-gray-500 text-center py-6">All registered users are already in this group.</p>
                                    ) : (
                                        nonMembers.map((u) => {
                                            const isSelected = selectedAddMemberIds.includes(u.id);
                                            return (
                                                <button
                                                    key={u.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedAddMemberIds((prev) =>
                                                            isSelected ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                                                        );
                                                    }}
                                                    className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-colors ${
                                                        isSelected
                                                            ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                                                            : "hover:bg-gray-900 text-gray-300"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold">{u.username}</span>
                                                        <span className="text-gray-500 text-[10px]">({u.email})</span>
                                                    </div>
                                                    {isSelected && <Check size={14} className="text-blue-400" />}
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2.5 pt-2">
                                <Button type="button" variant="secondary" onClick={() => setIsEditOpen(false)} className="flex-1">
                                    Cancel
                                </Button>
                                <Button type="submit" isLoading={actionLoading} className="flex-1 bg-blue-600 hover:bg-blue-500">
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT MESSAGE MODAL */}
            {editingMsg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
                    <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                            <h3 className="font-bold text-lg text-white">Moderate Message Content</h3>
                            <button onClick={() => setEditingMsg(null)} className="text-gray-400 hover:text-white">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveMsgEdit} className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-300 mb-1.5 block">
                                    Message Content (Sent by @{editingMsg.sender?.username})
                                </label>
                                <textarea
                                    rows={4}
                                    value={editMsgContent}
                                    onChange={(e) => setEditMsgContent(e.target.value)}
                                    required
                                    className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-xs text-white focus:outline-hidden focus:border-blue-500"
                                />
                            </div>

                            <div className="flex gap-2.5">
                                <Button type="button" variant="secondary" onClick={() => setEditingMsg(null)} className="flex-1">
                                    Cancel
                                </Button>
                                <Button type="submit" isLoading={editMsgLoading} className="flex-1 bg-blue-600 hover:bg-blue-500">
                                    Update Message
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE CONVERSATION MODAL */}
            {isDeleteOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
                    <div className="w-full max-w-sm bg-gray-900 border border-red-500/20 rounded-3xl p-6 shadow-2xl space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto">
                            <Trash2 size={24} />
                        </div>
                        <div className="text-center">
                            <h3 className="font-bold text-lg text-white">Delete Conversation?</h3>
                            <p className="text-xs text-gray-400 mt-1">
                                This will permanently delete this conversation and all associated messages. This cannot be undone.
                            </p>
                        </div>

                        <div className="flex gap-2.5 pt-2">
                            <Button variant="secondary" onClick={() => setIsDeleteOpen(false)} className="flex-1">
                                Cancel
                            </Button>
                            <Button
                                variant="danger"
                                onClick={handleDeleteConversation}
                                isLoading={deleteLoading}
                                className="flex-1 bg-red-600 hover:bg-red-500"
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
