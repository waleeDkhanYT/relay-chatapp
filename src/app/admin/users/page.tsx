"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Users,
    Search,
    Filter,
    Plus,
    Edit,
    Trash2,
    Shield,
    ChevronLeft,
    ChevronRight,
    X,
    Eye,
    Check,
    AlertCircle,
    Loader2,
    UserPlus,
    KeyRound
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { format } from "date-fns";
import { adminFetch } from "@/lib/adminClient";

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");
    const [sortBy, setSortBy] = useState("createdAt");
    const [order, setOrder] = useState<"asc" | "desc">("desc");
    const [loading, setLoading] = useState(true);

    // Modals state
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [modalError, setModalError] = useState("");

    // Form inputs for Create / Edit
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        fullName: "",
        age: "",
        role: "USER",
        avatar: ""
    });

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                search,
                role: roleFilter,
                sortBy,
                order
            });

            const res = await adminFetch(`/api/admin/users?${params.toString()}`);

            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
                setTotal(data.total || 0);
                setTotalPages(data.totalPages || 1);
            }
        } catch (err) {
            console.error("Failed to load users", err);
        } finally {
            setLoading(false);
        }
    }, [page, limit, search, roleFilter, sortBy, order]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Handle Create User
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        setModalError("");

        try {
            const res = await adminFetch("/api/admin/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to create user");

            setIsCreateOpen(false);
            setFormData({ username: "", email: "", password: "", fullName: "", age: "", role: "USER", avatar: "" });
            fetchUsers();
        } catch (err: any) {
            setModalError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // Handle Edit User
    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        setActionLoading(true);
        setModalError("");

        try {
            const res = await adminFetch(`/api/admin/users/${selectedUser.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to update user");

            setIsEditOpen(false);
            fetchUsers();
        } catch (err: any) {
            setModalError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // Handle Delete User
    const handleDelete = async () => {
        if (!selectedUser) return;
        setActionLoading(true);
        setModalError("");

        try {
            const res = await adminFetch(`/api/admin/users/${selectedUser.id}`, {
                method: "DELETE"
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to delete user");

            setIsDeleteOpen(false);
            fetchUsers();
        } catch (err: any) {
            setModalError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const openEditModal = (u: any) => {
        setSelectedUser(u);
        setFormData({
            username: u.username || "",
            email: u.email || "",
            password: "",
            fullName: u.fullName || "",
            age: u.age?.toString() || "",
            role: u.role || "USER",
            avatar: u.avatar || ""
        });
        setModalError("");
        setIsEditOpen(true);
    };

    const openViewModal = (u: any) => {
        setSelectedUser(u);
        setIsViewOpen(true);
    };

    const openDeleteModal = (u: any) => {
        setSelectedUser(u);
        setModalError("");
        setIsDeleteOpen(true);
    };

    return (
        <AdminLayout>
            {/* Header & Stats */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
                        <Users className="text-blue-500" />
                        <span>User Management</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-400 mt-1">
                        View, search, edit, create, and moderate all platform users ({total} total)
                    </p>
                </div>
                <button
                    onClick={() => {
                        setFormData({ username: "", email: "", password: "", fullName: "", age: "", role: "USER", avatar: "" });
                        setModalError("");
                        setIsCreateOpen(true);
                    }}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all active:scale-95 self-start sm:self-auto"
                >
                    <UserPlus size={16} />
                    <span>Create New User</span>
                </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-4 shadow-xl flex flex-col md:flex-row gap-3 items-center justify-between">
                {/* Search Input */}
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search by name, username, email..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                    {/* Role Filter */}
                    <div className="flex items-center gap-1.5 bg-gray-950 border border-gray-800 rounded-xl px-3 py-1.5 text-xs">
                        <span className="text-gray-400 font-medium">Role:</span>
                        <select
                            value={roleFilter}
                            onChange={(e) => {
                                setRoleFilter(e.target.value);
                                setPage(1);
                            }}
                            className="bg-transparent text-white font-semibold outline-none cursor-pointer"
                        >
                            <option value="ALL" className="bg-gray-900">All Roles</option>
                            <option value="USER" className="bg-gray-900">User</option>
                            <option value="ADMIN" className="bg-gray-900">Admin</option>
                        </select>
                    </div>

                    {/* Sort Filter */}
                    <div className="flex items-center gap-1.5 bg-gray-950 border border-gray-800 rounded-xl px-3 py-1.5 text-xs">
                        <span className="text-gray-400 font-medium">Sort:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-transparent text-white font-semibold outline-none cursor-pointer"
                        >
                            <option value="createdAt" className="bg-gray-900">Join Date</option>
                            <option value="username" className="bg-gray-900">Username</option>
                            <option value="email" className="bg-gray-900">Email</option>
                        </select>
                        <button
                            onClick={() => setOrder(order === "asc" ? "desc" : "asc")}
                            className="text-gray-400 hover:text-white font-bold ml-1"
                            title="Toggle Sort Order"
                        >
                            {order === "asc" ? "↑" : "↓"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-gray-900/80 border border-gray-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm text-gray-300">
                        <thead className="bg-gray-950/70 border-b border-gray-800 text-[11px] uppercase tracking-wider text-gray-400">
                            <tr>
                                <th className="py-3.5 px-4">User</th>
                                <th className="py-3.5 px-4">Role</th>
                                <th className="py-3.5 px-4 hidden md:table-cell">Activity</th>
                                <th className="py-3.5 px-4 hidden lg:table-cell">Joined</th>
                                <th className="py-3.5 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/60">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="p-4 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-800" />
                                            <div className="space-y-1.5">
                                                <div className="h-3.5 w-28 bg-gray-800 rounded" />
                                                <div className="h-2.5 w-36 bg-gray-800 rounded" />
                                            </div>
                                        </td>
                                        <td className="p-4"><div className="h-5 w-16 bg-gray-800 rounded-full" /></td>
                                        <td className="p-4 hidden md:table-cell"><div className="h-3 w-20 bg-gray-800 rounded" /></td>
                                        <td className="p-4 hidden lg:table-cell"><div className="h-3 w-24 bg-gray-800 rounded" /></td>
                                        <td className="p-4 text-right"><div className="h-7 w-20 bg-gray-800 rounded ml-auto" /></td>
                                    </tr>
                                ))
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-gray-500 text-sm">
                                        No users found matching current filters.
                                    </td>
                                </tr>
                            ) : (
                                users.map((u) => (
                                    <tr key={u.id} className="hover:bg-gray-800/40 transition-colors group">
                                        {/* User Cell */}
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-900/40 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden ring-1 ring-white/10">
                                                    {u.avatar ? (
                                                        <img src={u.avatar} alt={u.username} className="w-full h-full object-cover" />
                                                    ) : (
                                                        u.username[0]?.toUpperCase() || "?"
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-white truncate text-xs sm:text-sm">
                                                        {u.fullName || u.username}
                                                    </p>
                                                    <p className="text-gray-400 text-[11px] truncate">@{u.username} • {u.email}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Role Cell */}
                                        <td className="py-3.5 px-4">
                                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                                u.role === "ADMIN"
                                                    ? "bg-purple-500/10 text-purple-400 border border-purple-500/30"
                                                    : "bg-gray-800 text-gray-300"
                                            }`}>
                                                {u.role === "ADMIN" && <Shield size={10} />}
                                                {u.role || "USER"}
                                            </span>
                                        </td>

                                        {/* Activity Cell */}
                                        <td className="py-3.5 px-4 hidden md:table-cell text-xs text-gray-400">
                                            <span>{u._count?.messages || 0} msgs</span>
                                            <span className="mx-1.5">•</span>
                                            <span>{u._count?.conversations || 0} chats</span>
                                        </td>

                                        {/* Joined Cell */}
                                        <td className="py-3.5 px-4 hidden lg:table-cell text-xs text-gray-400">
                                            {format(new Date(u.createdAt), "MMM d, yyyy")}
                                        </td>

                                        {/* Actions Cell */}
                                        <td className="py-3.5 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => openViewModal(u)}
                                                    className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye size={15} />
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(u)}
                                                    className="p-1.5 text-gray-400 hover:text-yellow-400 hover:bg-gray-800 rounded-lg transition-colors"
                                                    title="Edit User"
                                                >
                                                    <Edit size={15} />
                                                </button>
                                                <button
                                                    onClick={() => openDeleteModal(u)}
                                                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="Delete User"
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

                {/* Pagination Bar */}
                <div className="p-4 bg-gray-950/70 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
                    <div>
                        Showing <span className="font-bold text-white">{users.length > 0 ? (page - 1) * limit + 1 : 0}</span> to{" "}
                        <span className="font-bold text-white">{Math.min(page * limit, total)}</span> of{" "}
                        <span className="font-bold text-white">{total}</span> users
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

            {/* CREATE USER MODAL */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
                    <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                            <h3 className="font-bold text-lg text-white flex items-center gap-2">
                                <UserPlus size={18} className="text-blue-500" />
                                <span>Create New User</span>
                            </h3>
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

                        <form onSubmit={handleCreate} className="space-y-3.5">
                            <Input
                                label="Username *"
                                placeholder="e.g. johndoe"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                required
                                className="bg-gray-950 border-gray-800 text-sm"
                            />
                            <Input
                                label="Email Address *"
                                type="email"
                                placeholder="e.g. john@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                className="bg-gray-950 border-gray-800 text-sm"
                            />
                            <Input
                                label="Password *"
                                type="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                className="bg-gray-950 border-gray-800 text-sm"
                            />
                            <Input
                                label="Full Name"
                                placeholder="e.g. John Doe"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                className="bg-gray-950 border-gray-800 text-sm"
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    label="Age"
                                    type="number"
                                    placeholder="e.g. 25"
                                    value={formData.age}
                                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                    className="bg-gray-950 border-gray-800 text-sm"
                                />
                                <div>
                                    <label className="block text-xs font-medium mb-1 text-gray-300">Role</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-lg border border-gray-800 bg-gray-950 text-white text-sm outline-none"
                                    >
                                        <option value="USER">User</option>
                                        <option value="ADMIN">Administrator</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-2.5 pt-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" isLoading={actionLoading} className="flex-1 bg-blue-600 hover:bg-blue-500">
                                    Create User
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT USER MODAL */}
            {isEditOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
                    <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                            <h3 className="font-bold text-lg text-white flex items-center gap-2">
                                <Edit size={18} className="text-yellow-400" />
                                <span>Edit User @{selectedUser.username}</span>
                            </h3>
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

                        <form onSubmit={handleEdit} className="space-y-3.5">
                            <Input
                                label="Username"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                required
                                className="bg-gray-950 border-gray-800 text-sm"
                            />
                            <Input
                                label="Email Address"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                className="bg-gray-950 border-gray-800 text-sm"
                            />
                            <Input
                                label="Full Name"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                className="bg-gray-950 border-gray-800 text-sm"
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    label="Age"
                                    type="number"
                                    value={formData.age}
                                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                    className="bg-gray-950 border-gray-800 text-sm"
                                />
                                <div>
                                    <label className="block text-xs font-medium mb-1 text-gray-300">Role</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-lg border border-gray-800 bg-gray-950 text-white text-sm outline-none"
                                    >
                                        <option value="USER">User</option>
                                        <option value="ADMIN">Administrator</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <Input
                                    label="Reset Password (Leave blank to keep current)"
                                    type="password"
                                    placeholder="Enter new password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="bg-gray-950 border-gray-800 text-sm"
                                />
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
                                <Button type="submit" isLoading={actionLoading} className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-black font-bold">
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* VIEW USER DETAILS MODAL */}
            {isViewOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
                    <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                            <h3 className="font-bold text-lg text-white">User Details</h3>
                            <button onClick={() => setIsViewOpen(false)} className="text-gray-400 hover:text-white">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-blue-900/40 text-blue-400 flex items-center justify-center font-bold text-xl ring-2 ring-blue-500/20 overflow-hidden shrink-0">
                                {selectedUser.avatar ? (
                                    <img src={selectedUser.avatar} alt={selectedUser.username} className="w-full h-full object-cover" />
                                ) : (
                                    selectedUser.username[0]?.toUpperCase()
                                )}
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-black text-lg text-white truncate">
                                    {selectedUser.fullName || selectedUser.username}
                                </h4>
                                <p className="text-xs text-gray-400">@{selectedUser.username}</p>
                                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                                    selectedUser.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400' : 'bg-gray-800 text-gray-300'
                                }`}>
                                    {selectedUser.role || 'USER'}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="p-3 rounded-xl bg-gray-950 border border-gray-800">
                                <span className="text-gray-500 block text-[10px] uppercase">Email</span>
                                <span className="font-semibold text-gray-200 truncate block">{selectedUser.email}</span>
                            </div>
                            <div className="p-3 rounded-xl bg-gray-950 border border-gray-800">
                                <span className="text-gray-500 block text-[10px] uppercase">Age</span>
                                <span className="font-semibold text-gray-200">{selectedUser.age || "Not specified"}</span>
                            </div>
                            <div className="p-3 rounded-xl bg-gray-950 border border-gray-800">
                                <span className="text-gray-500 block text-[10px] uppercase">Messages Sent</span>
                                <span className="font-bold text-blue-400 text-sm">{selectedUser._count?.messages || 0}</span>
                            </div>
                            <div className="p-3 rounded-xl bg-gray-950 border border-gray-800">
                                <span className="text-gray-500 block text-[10px] uppercase">Conversations</span>
                                <span className="font-bold text-purple-400 text-sm">{selectedUser._count?.conversations || 0}</span>
                            </div>
                        </div>

                        <div className="p-3 rounded-xl bg-gray-950 border border-gray-800 text-xs">
                            <span className="text-gray-500 block text-[10px] uppercase mb-0.5">Joined System</span>
                            <span className="text-gray-300 font-medium">
                                {format(new Date(selectedUser.createdAt), "MMMM d, yyyy 'at' hh:mm a")}
                            </span>
                        </div>

                        <Button onClick={() => setIsViewOpen(false)} className="w-full bg-gray-800 hover:bg-gray-700">
                            Close
                        </Button>
                    </div>
                </div>
            )}

            {/* DELETE USER CONFIRMATION MODAL */}
            {isDeleteOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
                    <div className="w-full max-w-sm bg-gray-900 border border-red-500/20 rounded-3xl p-6 shadow-2xl space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto">
                            <Trash2 size={24} />
                        </div>
                        <div className="text-center">
                            <h3 className="font-bold text-lg text-white">Delete User?</h3>
                            <p className="text-xs text-gray-400 mt-1">
                                Are you sure you want to permanently delete <span className="font-bold text-white">@{selectedUser.username}</span>? This will remove all their messages and conversation memberships.
                            </p>
                        </div>

                        {modalError && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
                                <AlertCircle size={15} />
                                <span>{modalError}</span>
                            </div>
                        )}

                        <div className="flex gap-2.5 pt-2">
                            <Button
                                variant="secondary"
                                onClick={() => setIsDeleteOpen(false)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="danger"
                                onClick={handleDelete}
                                isLoading={actionLoading}
                                className="flex-1 bg-red-600 hover:bg-red-500"
                            >
                                Delete User
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
