"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    MessagesSquare,
    Search,
    Filter,
    Plus,
    Trash2,
    Eye,
    Users,
    MessageSquare,
    ChevronLeft,
    ChevronRight,
    X,
    AlertCircle,
    UserPlus,
    Check,
    Edit3
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { format, formatDistanceToNow } from "date-fns";
import { adminFetch } from "@/lib/adminClient";

export default function AdminConversationsPage() {
    const [conversations, setConversations] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("ALL");
    const [sortBy, setSortBy] = useState("updatedAt");
    const [order, setOrder] = useState<"asc" | "desc">("desc");
    const [loading, setLoading] = useState(true);

    // Modals
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedConv, setSelectedConv] = useState<any>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [modalError, setModalError] = useState("");

    // Form inputs
    const [groupName, setGroupName] = useState("");
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);

    const fetchConversations = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                search,
                type: typeFilter,
                sortBy,
                order
            });

            const res = await adminFetch(`/api/admin/conversations?${params.toString()}`);

            if (res.ok) {
                const data = await res.json();
                setConversations(data.conversations || []);
                setTotal(data.total || 0);
                setTotalPages(data.totalPages || 1);
            }
        } catch (err) {
            console.error("Failed to load conversations", err);
        } finally {
            setLoading(false);
        }
    }, [page, limit, search, typeFilter, sortBy, order]);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    // Fetch users for group creation / member management
    const loadAllUsers = async () => {
        setUsersLoading(true);
        try {
            const res = await adminFetch("/api/admin/users?limit=100&minimal=true");
            if (res.ok) {
                const json = await res.json();
                setAllUsers(json.users || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setUsersLoading(false);
        }
    };

    // Handle Create Group
    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        setModalError("");

        try {
            const res = await adminFetch("/api/admin/conversations", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    type: "GROUP",
                    name: groupName,
                    memberIds: selectedMemberIds
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to create group");

            setIsCreateOpen(false);
            setGroupName("");
            setSelectedMemberIds([]);
            fetchConversations();
        } catch (err: any) {
            setModalError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // Handle Edit Conversation
    const handleEditSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedConv) return;
        setActionLoading(true);
        setModalError("");

        try {
            const res = await adminFetch(`/api/admin/conversations/${selectedConv.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: groupName.trim(),
                    addMemberIds: selectedMemberIds
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to update conversation");

            setIsEditOpen(false);
            setSelectedMemberIds([]);
            fetchConversations();
        } catch (err: any) {
            setModalError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // Handle Delete Conversation
    const handleDelete = async () => {
        if (!selectedConv) return;
        setActionLoading(true);
        setModalError("");

        try {
            const res = await adminFetch(`/api/admin/conversations/${selectedConv.id}`, {
                method: "DELETE"
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to delete conversation");

            setIsDeleteOpen(false);
            fetchConversations();
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
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        Conversations & Groups
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-400 mt-1">
                        Monitor, inspect full chat histories, moderate messages, and manage user channels
                    </p>
                </div>
                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => {
                            setIsCreateOpen(true);
                            setSelectedMemberIds([]);
                            setGroupName("");
                            loadAllUsers();
                        }}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all active:scale-95"
                    >
                        <Plus size={14} />
                        <span>Create Group</span>
                    </button>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="p-4 bg-gray-900/80 border border-gray-800 rounded-3xl space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input
                        type="text"
                        placeholder="Search by group name or participant usernames..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className="w-full bg-gray-950 border border-gray-800 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-hidden focus:border-blue-500 transition-colors"
                    />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2.5">
                    <div className="flex items-center gap-1.5 bg-gray-950 border border-gray-800 rounded-2xl px-3 py-1.5">
                        <Filter size={13} className="text-gray-500" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Type:</span>
                        <select
                            value={typeFilter}
                            onChange={(e) => {
                                setTypeFilter(e.target.value);
                                setPage(1);
                            }}
                            className="bg-transparent text-xs text-white font-medium focus:outline-hidden cursor-pointer"
                        >
                            <option value="ALL" className="bg-gray-900">All</option>
                            <option value="DIRECT" className="bg-gray-900">Direct</option>
                            <option value="GROUP" className="bg-gray-900">Group</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-1.5 bg-gray-950 border border-gray-800 rounded-2xl px-3 py-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Sort:</span>
                        <select
                            value={`${sortBy}-${order}`}
                            onChange={(e) => {
                                const [s, o] = e.target.value.split("-");
                                setSortBy(s);
                                setOrder(o as "asc" | "desc");
                            }}
                            className="bg-transparent text-xs text-white font-medium focus:outline-hidden cursor-pointer"
                        >
                            <option value="updatedAt-desc" className="bg-gray-900">Last Active (Newest)</option>
                            <option value="updatedAt-asc" className="bg-gray-900">Last Active (Oldest)</option>
                            <option value="createdAt-desc" className="bg-gray-900">Created (Newest)</option>
                            <option value="createdAt-asc" className="bg-gray-900">Created (Oldest)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Conversations Table */}
            <div className="bg-gray-900/80 border border-gray-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-gray-800 text-gray-400 font-bold uppercase tracking-wider bg-gray-950/40">
                                <th className="py-3.5 px-4">Conversation</th>
                                <th className="py-3.5 px-4 hidden sm:table-cell">Type</th>
                                <th className="py-3.5 px-4">Participants</th>
                                <th className="py-3.5 px-4 hidden md:table-cell">Messages</th>
                                <th className="py-3.5 px-4 hidden lg:table-cell">Last Active</th>
                                <th className="py-3.5 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/60">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                            <span>Loading conversations...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : conversations.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <MessagesSquare size={32} className="opacity-30" />
                                            <span>No conversations found matching criteria.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                conversations.map((c) => {
                                    const isGroup = c.type === "GROUP";
                                    const title = isGroup
                                        ? c.name || "Untitled Group"
                                        : c.members?.map((m: any) => m.user?.username).filter(Boolean).join(" & ") || "Direct Chat";

                                    return (
                                        <tr key={c.id} className="hover:bg-gray-800/40 transition-colors group">
                                            {/* Name / Title */}
                                            <td className="py-3.5 px-4">
                                                <Link
                                                    href={`/admin/conversations/${c.id}`}
                                                    className="flex items-center gap-3 group/link hover:opacity-90"
                                                >
                                                    <div
                                                        className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                                            isGroup
                                                                ? "bg-purple-600/20 text-purple-400 border border-purple-500/20"
                                                                : "bg-blue-600/20 text-blue-400 border border-blue-500/20"
                                                        }`}
                                                    >
                                                        {isGroup ? <Users size={16} /> : <MessageSquare size={16} />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-white group-hover/link:text-blue-400 transition-colors truncate">
                                                            {title}
                                                        </p>
                                                        <p className="text-[10px] text-gray-500 font-mono truncate">
                                                            {c.id}
                                                        </p>
                                                    </div>
                                                </Link>
                                            </td>

                                            {/* Type Badge */}
                                            <td className="py-3.5 px-4 hidden sm:table-cell">
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                                                        isGroup
                                                            ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                                            : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                                    }`}
                                                >
                                                    {c.type}
                                                </span>
                                            </td>

                                            {/* Participants */}
                                            <td className="py-3.5 px-4">
                                                <div className="flex -space-x-2 overflow-hidden">
                                                    {c.members?.slice(0, 4).map((m: any) => (
                                                        <div
                                                            key={m.id}
                                                            title={m.user?.username}
                                                            className="inline-block h-6 w-6 rounded-full ring-2 ring-gray-900 bg-gray-800 text-center leading-6 text-[9px] font-bold text-gray-300"
                                                        >
                                                            {m.user?.username?.[0]?.toUpperCase()}
                                                        </div>
                                                    ))}
                                                    {c.members?.length > 4 && (
                                                        <div className="inline-block h-6 w-6 rounded-full ring-2 ring-gray-900 bg-gray-700 text-center leading-6 text-[9px] font-bold text-gray-300">
                                                            +{c.members.length - 4}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Message Count */}
                                            <td className="py-3.5 px-4 hidden md:table-cell text-xs font-semibold text-gray-300">
                                                {c._count?.messages || 0}
                                            </td>

                                            {/* Last Active */}
                                            <td className="py-3.5 px-4 hidden lg:table-cell text-xs text-gray-400">
                                                {formatDistanceToNow(new Date(c.updatedAt), { addSuffix: true })}
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {/* View Chat History on Dedicated Page */}
                                                    <Link
                                                        href={`/admin/conversations/${c.id}`}
                                                        className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-1"
                                                        title="Open Chat History Page"
                                                    >
                                                        <Eye size={15} />
                                                    </Link>

                                                    {/* Edit Group */}
                                                    {isGroup && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedConv(c);
                                                                setGroupName(c.name || "");
                                                                setSelectedMemberIds([]);
                                                                setModalError("");
                                                                setIsEditOpen(true);
                                                                loadAllUsers();
                                                            }}
                                                            className="p-1.5 text-gray-400 hover:text-yellow-400 hover:bg-gray-800 rounded-lg transition-colors"
                                                            title="Edit Group"
                                                        >
                                                            <Edit3 size={15} />
                                                        </button>
                                                    )}

                                                    {/* Delete Conversation */}
                                                    <button
                                                        onClick={() => {
                                                            setSelectedConv(c);
                                                            setIsDeleteOpen(true);
                                                        }}
                                                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                        title="Delete Conversation"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 bg-gray-950/70 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
                    <div>
                        Showing <span className="font-bold text-white">{conversations.length > 0 ? (page - 1) * limit + 1 : 0}</span> to{" "}
                        <span className="font-bold text-white">{Math.min(page * limit, total)}</span> of{" "}
                        <span className="font-bold text-white">{total}</span> conversations
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="p-2 bg-gray-900 border border-gray-800 rounded-xl hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="px-3 py-1 font-semibold text-gray-200">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="p-2 bg-gray-900 border border-gray-800 rounded-xl hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* CREATE GROUP MODAL */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
                    <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                            <h3 className="font-bold text-lg text-white">Create New Group</h3>
                            <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-white">
                                <X size={18} />
                            </button>
                        </div>

                        {modalError && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
                                <AlertCircle size={15} />
                                <span>{modalError}</span>
                            </div>
                        )}

                        <form onSubmit={handleCreateGroup} className="space-y-4 flex-1 flex flex-col overflow-hidden">
                            <div>
                                <Input
                                    label="Group Name"
                                    placeholder="e.g. Design Team, Announcements"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    required
                                    className="bg-gray-950 border-gray-800 text-sm"
                                />
                            </div>

                            <div className="flex-1 flex flex-col min-h-0 space-y-2">
                                <label className="text-xs font-semibold text-gray-300">
                                    Select Members ({selectedMemberIds.length} selected)
                                </label>
                                <div className="flex-1 overflow-y-auto max-h-48 space-y-1 p-2 bg-gray-950 rounded-xl border border-gray-800">
                                    {usersLoading ? (
                                        <div className="py-8 flex justify-center text-xs text-gray-500">
                                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
                                            <span>Loading users...</span>
                                        </div>
                                    ) : allUsers.map((u) => {
                                        const isSelected = selectedMemberIds.includes(u.id);
                                        return (
                                            <button
                                                key={u.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedMemberIds(
                                                        isSelected
                                                            ? selectedMemberIds.filter((id) => id !== u.id)
                                                            : [...selectedMemberIds, u.id]
                                                    );
                                                }}
                                                className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-colors ${
                                                    isSelected ? "bg-blue-600/20 text-blue-400 border border-blue-500/30" : "hover:bg-gray-900 text-gray-300"
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold">{u.username}</span>
                                                    <span className="text-gray-500 text-[10px]">({u.email})</span>
                                                </div>
                                                {isSelected && <Check size={14} className="text-blue-400" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex gap-2.5 pt-2">
                                <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)} className="flex-1">
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    isLoading={actionLoading}
                                    disabled={!groupName.trim() || selectedMemberIds.length === 0}
                                    className="flex-1 bg-blue-600 hover:bg-blue-500"
                                >
                                    Create Group
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT GROUP MODAL */}
            {isEditOpen && selectedConv && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
                    <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                            <div>
                                <h3 className="font-bold text-lg text-white">Edit Group</h3>
                                <p className="text-xs text-gray-400">Update group name and add members</p>
                            </div>
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

                        <form onSubmit={handleEditSave} className="space-y-4 flex-1 flex flex-col overflow-hidden">
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
                                    Add More Members ({selectedMemberIds.length} selected)
                                </label>
                                <div className="flex-1 overflow-y-auto max-h-48 space-y-1 p-2 bg-gray-950 rounded-xl border border-gray-800">
                                    {usersLoading ? (
                                        <div className="py-8 flex justify-center text-xs text-gray-500">
                                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
                                            <span>Loading users...</span>
                                        </div>
                                    ) : allUsers.length === 0 ? (
                                        <p className="text-xs text-gray-500 text-center py-6">No users found.</p>
                                    ) : (
                                        allUsers
                                            .filter((u) => !selectedConv.members?.some((m: any) => m.user?.id === u.id))
                                            .map((u) => {
                                                const isSelected = selectedMemberIds.includes(u.id);
                                                return (
                                                    <button
                                                        key={u.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedMemberIds((prev) =>
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
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setIsEditOpen(false)}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    isLoading={actionLoading}
                                    className="flex-1 bg-blue-600 hover:bg-blue-500"
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE CONVERSATION MODAL */}
            {isDeleteOpen && selectedConv && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
                    <div className="w-full max-w-sm bg-gray-900 border border-red-500/20 rounded-3xl p-6 shadow-2xl space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto">
                            <Trash2 size={24} />
                        </div>
                        <div className="text-center">
                            <h3 className="font-bold text-lg text-white">Delete Conversation?</h3>
                            <p className="text-xs text-gray-400 mt-1">
                                Are you sure you want to delete this conversation and all associated messages permanently?
                            </p>
                        </div>

                        {modalError && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
                                <AlertCircle size={15} />
                                <span>{modalError}</span>
                            </div>
                        )}

                        <div className="flex gap-2.5 pt-2">
                            <Button variant="secondary" onClick={() => setIsDeleteOpen(false)} className="flex-1">
                                Cancel
                            </Button>
                            <Button
                                variant="danger"
                                onClick={handleDelete}
                                isLoading={actionLoading}
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
