"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Search, UserPlus, Check } from "lucide-react";
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
    const [sentMap, setSentMap] = useState<Record<string, boolean>>({});

    const handleSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);

        try {
            const res = await fetch(`/api/users/search?q=${query}&userId=${currentUser?.id}`);
            const data = await res.json();
            setResults(data);
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setLoading(false);
        }
    };

    const sendRequest = async (receiverId: string) => {
        try {
            setSentMap(prev => ({ ...prev, [receiverId]: true }));
            const res = await fetch("/api/users/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ senderId: currentUser?.id, receiverId }),
            });

            if (res.ok) {
                dispatch(addSentRequest(receiverId));
            }
        } catch (error) {
            console.error("Failed to send request", error);
            setSentMap(prev => ({ ...prev, [receiverId]: false }));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 m-4"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Find Friends</h2>
                    <button
                        onClick={() => dispatch(toggleSearchModal())}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex gap-2 mb-6">
                    <Input
                        placeholder="Search by username or email..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                    <Button onClick={handleSearch} isLoading={loading}>
                        <Search size={20} />
                    </Button>
                </div>

                <div className="space-y-4 max-h-[300px] overflow-y-auto">
                    {results.length === 0 && !loading && query && (
                        <p className="text-center text-gray-500">No users found.</p>
                    )}

                    {results.map((user) => (
                        <div
                            key={user.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                                    {user.username[0].toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-medium">{user.username}</p>
                                    <p className="text-sm text-gray-500">{user.email}</p>
                                </div>
                            </div>

                            <Button
                                size="sm"
                                variant={sentMap[user.id] ? "secondary" : "primary"}
                                disabled={sentMap[user.id]}
                                onClick={() => sendRequest(user?.id)}
                                className="px-3!"
                            >
                                {sentMap[user.id] ? <Check size={16} /> : <UserPlus size={16} />}
                            </Button>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}