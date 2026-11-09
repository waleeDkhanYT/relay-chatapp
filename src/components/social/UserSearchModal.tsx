"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Search, UserPlus, Check, Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { toggleSearchModal } from "@/redux/features/uiSlice";
import { addSentRequest } from "@/redux/features/friendSlice";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function UserSearchModal() {
    const dispatch = useAppDispatch();
    const isOpen = useAppSelector((state) => state.ui.isSearchModalOpen);
    const currentUser = useAppSelector((state) => state.auth.user);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [sendingId, setSendingId] = useState<string | null>(null);
    const [sentMap, setSentMap] = useState<Record<string, boolean>>({});

    const handleSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);

        try {
            const res = await fetch(`/api/users/search?q=${query}&userId=${currentUser?.id}`);
            const data = await res.json();
            setResults(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setLoading(false);
        }
    };

    const sendRequest = async (receiverId: string) => {
        setSendingId(receiverId);
        try {
            const res = await fetch("/api/users/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ senderId: currentUser?.id, receiverId }),
            });

            if (res.ok) {
                setSentMap(prev => ({ ...prev, [receiverId]: true }));
                dispatch(addSentRequest(receiverId));
            }
        } catch (error) {
            console.error("Failed to send request", error);
        } finally {
            setSendingId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-5 sm:p-6 border border-gray-100 dark:border-gray-800"
            >
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Find Friends</h2>
                        <p className="text-xs text-gray-500">Search users across Relay to connect</p>
                    </div>
                    <button
                        onClick={() => dispatch(toggleSearchModal())}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="Close"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex gap-2 mb-4">
                    <Input
                        placeholder="Search by username or email..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        className="mb-0! text-sm py-2.5"
                    />
                    <Button onClick={handleSearch} isLoading={loading} className="shrink-0 px-4">
                        <Search size={18} />
                    </Button>
                </div>

                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                    {/* Skeletons while searching */}
                    {loading && (
                        <div className="space-y-2 animate-pulse">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/40">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
                                        <div className="space-y-1.5">
                                            <div className="h-3.5 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                                            <div className="h-2.5 w-36 bg-gray-200 dark:bg-gray-700 rounded" />
                                        </div>
                                    </div>
                                    <div className="w-9 h-8 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && results.length === 0 && query && (
                        <div className="py-8 text-center text-gray-400 text-sm">
                            No users found matching &quot;{query}&quot;.
                        </div>
                    )}

                    {!loading && results.length === 0 && !query && (
                        <div className="py-8 text-center text-gray-400 text-xs">
                            Enter a username or email to search.
                        </div>
                    )}

                    {!loading && results.map((user) => {
                        const isSent = sentMap[user.id];
                        const isSending = sendingId === user.id;

                        return (
                            <div
                                key={user.id}
                                className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <div className="flex items-center gap-3 min-w-0 pr-2">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                                        {user.avatar ? (
                                            <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                                        ) : (
                                            user.username[0]?.toUpperCase() || "?"
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-sm truncate text-gray-900 dark:text-white">
                                            {user.fullName || user.username}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                                    </div>
                                </div>

                                <Button
                                    size="sm"
                                    variant={isSent ? "secondary" : "primary"}
                                    disabled={isSent || isSending}
                                    onClick={() => sendRequest(user.id)}
                                    className="px-3! shrink-0 rounded-xl text-xs"
                                    title={isSent ? "Request Sent" : "Add Friend"}
                                >
                                    {isSending ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : isSent ? (
                                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
                                            <Check size={14} /> Sent
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1">
                                            <UserPlus size={14} /> Add
                                        </span>
                                    )}
                                </Button>
                            </div>
                        );
                    })}
                </div>
            </motion.div>
        </div>
    );
}
