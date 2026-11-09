"use client";

import { useState, useEffect, useCallback } from "react";
import {
    UserCheck,
    Search,
    Filter,
    Plus,
    Check,
    X,
    Trash2,
    RotateCcw,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    ArrowRight
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { format } from "date-fns";
import { adminFetch } from "@/lib/adminClient";

export default function AdminRequestsPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [loading, setLoading] = useState(true);

    // Modals
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedReq, setSelectedReq] = useState<any>(null);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [senderId, setSenderId] = useState("");
    const [receiverId, setReceiverId] = useState("");
    const [newStatus, setNewStatus] = useState("PENDING");
    const [actionLoading, setActionLoading] = useState(false);
    const [modalError, setModalError] = useState("");

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                search,
                status: statusFilter,
                sortBy: "createdAt",
                order: "desc"
            });

            const res = await adminFetch(`/api/admin/requests?${params.toString()}`);

            if (res.ok) {
                const data = await res.json();
                setRequests(data.requests || []);
                setTotal(data.total || 0);
                setTotalPages(data.totalPages || 1);
            }
        } catch (err) {
            console.error("Failed to load friend requests", err);
        } finally {
            setLoading(false);
        }
    }, [page, limit, search, statusFilter]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const loadUsers = async () => {
        try {
            const res = await adminFetch("/api/admin/users?limit=100");
            if (res.ok) {
                const json = await res.json();
                setAllUsers(json.users || []);
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Update Status
    const handleUpdateStatus = async (requestId: string, status: string) => {
        try {
            const res = await adminFetch(`/api/admin/requests/${requestId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ status })
            });

            if (res.ok) {
                fetchRequests();
            }
        } catch (err) {
            console.error("Failed to update status", err);
        }
    };

    // Create Connection
    const handleCreateConnection = async (e: React.FormEvent) => {
        e.preventDefault();
        if (senderId === receiverId) {
            setModalError("Sender and receiver must be different users");
            return;
        }

        setActionLoading(true);
        setModalError("");

        try {
            const res = await adminFetch("/api/admin/requests", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    senderId,
                    receiverId,
                    status: newStatus
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to create connection");

            setIsCreateOpen(false);
            setSenderId("");
            setReceiverId("");
            fetchRequests();
        } catch (err: any) {
            setModalError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // Delete Request
    const handleDelete = async () => {
        if (!selectedReq) return;
        setActionLoading(true);

        try {
            const res = await adminFetch(`/api/admin/requests/${selectedReq.id}`, {
                method: "DELETE"
            });

            if (res.ok) {
                setIsDeleteOpen(false);
                fetchRequests();
            }
        } catch (err) {
            console.error("Failed to delete request", err);
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
                        <UserCheck className="text-emerald-500" />
                        <span>Friend Requests & Connections</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-400 mt-1">
                        Monitor social graph, approve connections, and force-link users ({total} total)
                    </p>
                </div>
                <button
                    onClick={() => {
                        loadUsers();
                        setSenderId("");
                        setReceiverId("");
                        setModalError("");
                        setIsCreateOpen(true);
                    }}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all active:scale-95 self-start sm:self-auto"
                >
                    <Plus size={16} />
                    <span>Create Connection</span>
                </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-4 shadow-xl flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search sender or receiver..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                </div>

                <div className="flex items-center gap-2.5 w-full md:w-auto">
                    <div className="flex items-center gap-1.5 bg-gray-950 border border-gray-800 rounded-xl px-3 py-1.5 text-xs">
                        <span className="text-gray-400 font-medium">Status:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPage(1);
                            }}
                            className="bg-transparent text-white font-semibold outline-none cursor-pointer"
                        >
                            <option value="ALL" className="bg-gray-900">All Statuses</option>
                            <option value="PENDING" className="bg-gray-900">Pending</option>
                            <option value="ACCEPTED" className="bg-gray-900">Accepted</option>
                            <option value="REJECTED" className="bg-gray-900">Rejected</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-gray-900/80 border border-gray-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm text-gray-300">
                        <thead className="bg-gray-950/70 border-b border-gray-800 text-[11px] uppercase tracking-wider text-gray-400">
                            <tr>
                                <th className="py-3.5 px-4">Sender</th>
                                <th className="py-3.5 px-4">Receiver</th>
                                <th className="py-3.5 px-4">Status</th>
                                <th className="py-3.5 px-4 hidden md:table-cell">Requested Date</th>
                                <th className="py-3.5 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/60">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="p-4"><div className="h-4 w-28 bg-gray-800 rounded" /></td>
                                        <td className="p-4"><div className="h-4 w-28 bg-gray-800 rounded" /></td>
                                        <td className="p-4"><div className="h-5 w-20 bg-gray-800 rounded-full" /></td>
                                        <td className="p-4 hidden md:table-cell"><div className="h-4 w-24 bg-gray-800 rounded" /></td>
                                        <td className="p-4 text-right"><div className="h-7 w-20 bg-gray-800 rounded ml-auto" /></td>
                                    </tr>
                                ))
                            ) : requests.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-gray-500 text-sm">
                                        No friend requests found.
                                    </td>
                                </tr>
                            ) : (
                                requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-gray-800/40 transition-colors group">
                                        {/* Sender */}
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-full bg-blue-900/40 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                                                    {req.sender?.username?.[0]?.toUpperCase() || "?"}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-white text-xs truncate">
                                                        @{req.sender?.username}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500 truncate">{req.sender?.email}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Receiver */}
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-full bg-purple-900/40 text-purple-400 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                                                    {req.receiver?.username?.[0]?.toUpperCase() || "?"}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-white text-xs truncate">
                                                        @{req.receiver?.username}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500 truncate">{req.receiver?.email}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="py-3.5 px-4">
                                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                                                req.status === "ACCEPTED"
                                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                    : req.status === "REJECTED"
                                                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                                    : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                                            }`}>
                                                {req.status}
                                            </span>
                                        </td>

                                        {/* Requested Date */}
                                        <td className="py-3.5 px-4 hidden md:table-cell text-xs text-gray-400">
                                            {format(new Date(req.createdAt), "MMM d, yyyy")}
                                        </td>

                                        {/* Actions */}
                                        <td className="py-3.5 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {req.status !== "ACCEPTED" && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(req.id, "ACCEPTED")}
                                                        className="p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                                        title="Force Accept & Create Chat"
                                                    >
                                                        <Check size={15} />
                                                    </button>
                                                )}
                                                {req.status !== "REJECTED" && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(req.id, "REJECTED")}
                                                        className="p-1.5 text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors"
                                                        title="Mark Rejected"
                                                    >
                                                        <X size={15} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        setSelectedReq(req);
                                                        setIsDeleteOpen(true);
                                                    }}
                                                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="Delete Record"
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
                        Showing <span className="font-bold text-white">{requests.length > 0 ? (page - 1) * limit + 1 : 0}</span> to{" "}
                        <span className="font-bold text-white">{Math.min(page * limit, total)}</span> of{" "}
                        <span className="font-bold text-white">{total}</span> requests
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

            {/* CREATE CONNECTION MODAL */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
                    <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                            <h3 className="font-bold text-lg text-white">Force Connect Users</h3>
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

                        <form onSubmit={handleCreateConnection} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium mb-1 text-gray-300">User 1 (Sender)</label>
                                <select
                                    value={senderId}
                                    onChange={(e) => setSenderId(e.target.value)}
                                    required
                                    className="w-full p-2.5 bg-gray-950 border border-gray-800 rounded-xl text-xs sm:text-sm text-white outline-none"
                                >
                                    <option value="">Select User 1...</option>
                                    {allUsers.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            @{u.username} ({u.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium mb-1 text-gray-300">User 2 (Receiver)</label>
                                <select
                                    value={receiverId}
                                    onChange={(e) => setReceiverId(e.target.value)}
                                    required
                                    className="w-full p-2.5 bg-gray-950 border border-gray-800 rounded-xl text-xs sm:text-sm text-white outline-none"
                                >
                                    <option value="">Select User 2...</option>
                                    {allUsers.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            @{u.username} ({u.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium mb-1 text-gray-300">Connection Status</label>
                                <select
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                    className="w-full p-2.5 bg-gray-950 border border-gray-800 rounded-xl text-xs sm:text-sm text-white outline-none"
                                >
                                    <option value="ACCEPTED">ACCEPTED (Immediately creates direct chat)</option>
                                    <option value="PENDING">PENDING (Awaiting receiver approval)</option>
                                </select>
                            </div>

                            <div className="flex gap-2.5 pt-2">
                                <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)} className="flex-1">
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    isLoading={actionLoading}
                                    disabled={!senderId || !receiverId || senderId === receiverId}
                                    className="flex-1 bg-blue-600 hover:bg-blue-500"
                                >
                                    Save Connection
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE MODAL */}
            {isDeleteOpen && selectedReq && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
                    <div className="w-full max-w-sm bg-gray-900 border border-red-500/20 rounded-3xl p-6 shadow-2xl space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto">
                            <Trash2 size={24} />
                        </div>
                        <div className="text-center">
                            <h3 className="font-bold text-lg text-white">Delete Friend Request?</h3>
                            <p className="text-xs text-gray-400 mt-1">
                                Are you sure you want to remove this connection record between @{selectedReq.sender?.username} and @{selectedReq.receiver?.username}?
                            </p>
                        </div>

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
