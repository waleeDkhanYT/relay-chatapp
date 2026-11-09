"use client";

import { useState, useEffect, useCallback } from "react";
import {
    MessageSquare,
    Search,
    Filter,
    Trash2,
    RotateCcw,
    Send,
    Edit,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    X,
    Eye,
    Shield
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { format } from "date-fns";
import { adminFetch } from "@/lib/adminClient";

export default function AdminMessagesPage() {
    const [messages, setMessages] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit, setLimit] = useState(15);
    const [search, setSearch] = useState("");
    const [deletedFilter, setDeletedFilter] = useState("ALL");
    const [loading, setLoading] = useState(true);

    // Modals
    const [selectedMsg, setSelectedMsg] = useState<any>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
    const [editContent, setEditContent] = useState("");
    const [broadcastConvId, setBroadcastConvId] = useState("");
    const [broadcastContent, setBroadcastContent] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [modalError, setModalError] = useState("");

    const fetchMessages = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                search,
                deleted: deletedFilter,
                sortBy: "createdAt",
                order: "desc"
            });

            const res = await adminFetch(`/api/admin/messages?${params.toString()}`);

            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages || []);
                setTotal(data.total || 0);
                setTotalPages(data.totalPages || 1);
            }
        } catch (err) {
            console.error("Failed to load messages", err);
        } finally {
            setLoading(false);
        }
    }, [page, limit, search, deletedFilter]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    // Handle Toggle Soft Delete / Restore
    const handleToggleSoftDelete = async (msg: any) => {
        try {
            const res = await adminFetch(`/api/admin/messages/${msg.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ isDeleted: !msg.isDeleted })
            });

            if (res.ok) {
                fetchMessages();
            }
        } catch (err) {
            console.error("Failed to update message delete status", err);
        }
    };

    // Handle Edit Content
    const handleEditSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMsg) return;
        setActionLoading(true);
        setModalError("");

        try {
            const res = await adminFetch(`/api/admin/messages/${selectedMsg.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ content: editContent })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to edit message");

            setIsEditOpen(false);
            fetchMessages();
        } catch (err: any) {
            setModalError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // Handle Permanent Delete
    const handlePermanentDelete = async () => {
        if (!selectedMsg) return;
        setActionLoading(true);
        setModalError("");

        try {
            const res = await adminFetch(`/api/admin/messages/${selectedMsg.id}`, {
                method: "DELETE"
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to delete message");

            setIsDeleteOpen(false);
            fetchMessages();
        } catch (err: any) {
            setModalError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // Handle Admin Broadcast
    const handleBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        setModalError("");

        try {
            const res = await adminFetch("/api/admin/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    conversationId: broadcastConvId.trim(),
                    content: broadcastContent.trim()
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to send broadcast");

            setIsBroadcastOpen(false);
            setBroadcastConvId("");
            setBroadcastContent("");
            fetchMessages();
        } catch (err: any) {
            setModalError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <AdminLayout>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
                        <MessageSquare className="text-sky-500" />
                        <span>Message Moderation</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-400 mt-1">
                        Search all chat logs, manage soft/hard deletion, and broadcast administrative notices ({total} total)
                    </p>
                </div>
                <button
                    onClick={() => {
                        setBroadcastConvId("");
                        setBroadcastContent("");
                        setModalError("");
                        setIsBroadcastOpen(true);
                    }}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all active:scale-95 self-start sm:self-auto"
                >
                    <Send size={15} />
                    <span>Post Admin Notice</span>
                </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-4 shadow-xl flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search message text content..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-sky-500 transition-colors"
                    />
                </div>

                <div className="flex items-center gap-2.5 w-full md:w-auto">
                    <div className="flex items-center gap-1.5 bg-gray-950 border border-gray-800 rounded-xl px-3 py-1.5 text-xs">
                        <span className="text-gray-400 font-medium">Status:</span>
                        <select
                            value={deletedFilter}
                            onChange={(e) => {
                                setDeletedFilter(e.target.value);
                                setPage(1);
                            }}
                            className="bg-transparent text-white font-semibold outline-none cursor-pointer"
                        >
                            <option value="ALL" className="bg-gray-900">All Messages</option>
                            <option value="ACTIVE" className="bg-gray-900">Active Only</option>
                            <option value="DELETED" className="bg-gray-900">Deleted Only</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Messages Table */}
            <div className="bg-gray-900/80 border border-gray-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm text-gray-300">
                        <thead className="bg-gray-950/70 border-b border-gray-800 text-[11px] uppercase tracking-wider text-gray-400">
                            <tr>
                                <th className="py-3.5 px-4">Sender</th>
                                <th className="py-3.5 px-4">Content</th>
                                <th className="py-3.5 px-4 hidden md:table-cell">Conversation</th>
                                <th className="py-3.5 px-4">Status</th>
                                <th className="py-3.5 px-4 hidden lg:table-cell">Sent At</th>
                                <th className="py-3.5 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/60">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="p-4"><div className="h-4 w-24 bg-gray-800 rounded" /></td>
                                        <td className="p-4"><div className="h-4 w-52 bg-gray-800 rounded" /></td>
                                        <td className="p-4 hidden md:table-cell"><div className="h-4 w-20 bg-gray-800 rounded" /></td>
                                        <td className="p-4"><div className="h-4 w-16 bg-gray-800 rounded-full" /></td>
                                        <td className="p-4 hidden lg:table-cell"><div className="h-4 w-20 bg-gray-800 rounded" /></td>
                                        <td className="p-4 text-right"><div className="h-7 w-20 bg-gray-800 rounded ml-auto" /></td>
                                    </tr>
                                ))
                            ) : messages.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-gray-500 text-sm">
                                        No messages found matching search filters.
                                    </td>
                                </tr>
                            ) : (
                                messages.map((m) => (
                                    <tr key={m.id} className="hover:bg-gray-800/40 transition-colors group">
                                        {/* Sender */}
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-full bg-blue-900/40 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                                                    {m.sender?.avatar ? (
                                                        <img src={m.sender.avatar} alt={m.sender.username} className="w-full h-full object-cover" />
                                                    ) : (
                                                        m.sender?.username?.[0]?.toUpperCase() || "?"
                                                    )}
                                                </div>
                                                <span className="font-bold text-white text-xs truncate max-w-[120px]">
                                                    @{m.sender?.username || "unknown"}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Content */}
                                        <td className="py-3.5 px-4">
                                            <p className={`text-xs max-w-xs sm:max-w-md truncate ${
                                                m.isDeleted ? "text-red-400/80 italic" : "text-gray-200"
                                            }`}>
                                                {m.isDeleted ? "[Deleted] " : ""}{m.content}
                                            </p>
                                        </td>

                                        {/* Conversation */}
                                        <td className="py-3.5 px-4 hidden md:table-cell text-xs text-gray-400">
                                            <span className="px-2 py-0.5 rounded-md bg-gray-950 border border-gray-800 text-[10px] font-semibold">
                                                {m.conversation?.type} {m.conversation?.name ? `• ${m.conversation.name}` : ""}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td className="py-3.5 px-4">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                m.isDeleted
                                                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                                    : "bg-green-500/10 text-green-400 border border-green-500/20"
                                            }`}>
                                                {m.isDeleted ? "Deleted" : "Active"}
                                            </span>
                                        </td>

                                        {/* Timestamp */}
                                        <td className="py-3.5 px-4 hidden lg:table-cell text-xs text-gray-400">
                                            {format(new Date(m.createdAt), "MMM d, hh:mm a")}
                                        </td>

                                        {/* Actions */}
                                        <td className="py-3.5 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => handleToggleSoftDelete(m)}
                                                    className={`p-1.5 rounded-lg transition-colors ${
                                                        m.isDeleted
                                                            ? "text-green-400 hover:bg-green-500/10"
                                                            : "text-gray-400 hover:text-yellow-400 hover:bg-gray-800"
                                                    }`}
                                                    title={m.isDeleted ? "Restore Message" : "Soft Delete"}
                                                >
                                                    <RotateCcw size={15} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedMsg(m);
                                                        setEditContent(m.content);
                                                        setIsEditOpen(true);
                                                    }}
                                                    className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded-lg transition-colors"
                                                    title="Edit Content"
                                                >
                                                    <Edit size={15} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedMsg(m);
                                                        setIsDeleteOpen(true);
                                                    }}
                                                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="Permanently Delete"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 bg-gray-950/70 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
                    <div>
                        Showing <span className="font-bold text-white">{messages.length > 0 ? (page - 1) * limit + 1 : 0}</span> to{" "}
                        <span className="font-bold text-white">{Math.min(page * limit, total)}</span> of{" "}
                        <span className="font-bold text-white">{total}</span> messages
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="p-2 rounded-xl bg-gray-900 border border-gray-800 disabled:opacity-40 hover:bg-gray-800 transition-colors"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="px-3 font-semibold text-white">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="p-2 rounded-xl bg-gray-900 border border-gray-800 disabled:opacity-40 hover:bg-gray-800 transition-colors"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* EDIT MESSAGE MODAL */}
            {isEditOpen && selectedMsg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
                    <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                            <h3 className="font-bold text-lg text-white">Edit Message</h3>
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

                        <form onSubmit={handleEditSave} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium mb-1 text-gray-300">Message Content</label>
                                <textarea
                                    rows={4}
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    required
                                    className="w-full p-3 bg-gray-950 border border-gray-800 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="flex gap-2.5">
                                <Button type="button" variant="secondary" onClick={() => setIsEditOpen(false)} className="flex-1">
                                    Cancel
                                </Button>
                                <Button type="submit" isLoading={actionLoading} className="flex-1 bg-blue-600 hover:bg-blue-500">
                                    Save Edit
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* PERMANENT DELETE MODAL */}
            {isDeleteOpen && selectedMsg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
                    <div className="w-full max-w-sm bg-gray-900 border border-red-500/20 rounded-3xl p-6 shadow-2xl space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto">
                            <Trash2 size={24} />
                        </div>
                        <div className="text-center">
                            <h3 className="font-bold text-lg text-white">Hard Delete Message?</h3>
                            <p className="text-xs text-gray-400 mt-1">
                                This will permanently erase this message from the database. This action cannot be reversed.
                            </p>
                        </div>

                        <div className="flex gap-2.5 pt-2">
                            <Button variant="secondary" onClick={() => setIsDeleteOpen(false)} className="flex-1">
                                Cancel
                            </Button>
                            <Button
                                variant="danger"
                                onClick={handlePermanentDelete}
                                isLoading={actionLoading}
                                className="flex-1 bg-red-600 hover:bg-red-500"
                            >
                                Permanent Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* BROADCAST ADMIN MESSAGE MODAL */}
            {isBroadcastOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
                    <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                            <h3 className="font-bold text-lg text-white flex items-center gap-2">
                                <Shield size={18} className="text-blue-500" />
                                <span>Post Administrative Notice</span>
                            </h3>
                            <button onClick={() => setIsBroadcastOpen(false)} className="text-gray-400 hover:text-white">
                                <X size={18} />
                            </button>
                        </div>

                        {modalError && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
                                <AlertCircle size={15} />
                                <span>{modalError}</span>
                            </div>
                        )}

                        <form onSubmit={handleBroadcast} className="space-y-4">
                            <Input
                                label="Conversation ID *"
                                placeholder="Paste Conversation UUID"
                                value={broadcastConvId}
                                onChange={(e) => setBroadcastConvId(e.target.value)}
                                required
                                className="bg-gray-950 border-gray-800 text-sm font-mono"
                            />
                            <div>
                                <label className="block text-xs font-medium mb-1 text-gray-300">Notice Text *</label>
                                <textarea
                                    rows={4}
                                    placeholder="Type official administrative notice..."
                                    value={broadcastContent}
                                    onChange={(e) => setBroadcastContent(e.target.value)}
                                    required
                                    className="w-full p-3 bg-gray-950 border border-gray-800 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="flex gap-2.5">
                                <Button type="button" variant="secondary" onClick={() => setIsBroadcastOpen(false)} className="flex-1">
                                    Cancel
                                </Button>
                                <Button type="submit" isLoading={actionLoading} className="flex-1 bg-blue-600 hover:bg-blue-500">
                                    Send Notice
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
