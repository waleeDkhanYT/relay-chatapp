"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Check, Search, User as UserIcon } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setConversations, setActiveConversation } from "@/redux/features/chatSlice";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { socket } from "@/lib/socket";

interface GroupChatModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface UserSummary {
    id: string;
    username: string;
    avatar?: string;
}

export default function GroupChatModal({ isOpen, onClose }: GroupChatModalProps) {
    const dispatch = useAppDispatch();
    const currentUser = useAppSelector((state) => state.auth.user);
    const { conversations } = useAppSelector((state) => state.chat);

    const [groupName, setGroupName] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<UserSummary[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<UserSummary[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [loading, setLoading] = useState(false);

    // Search users as the user types
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.trim().length >= 2) {
                setIsSearching(true);
                try {
                    const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}&userId=${currentUser?.id}`);
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        setSearchResults(data);
                    }
                } catch (error) {
                    console.error("Search failed", error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, currentUser?.id]);

    const toggleUser = (user: UserSummary) => {
        setSelectedUsers(prev =>
            prev.find(u => u.id === user.id)
                ? prev.filter(u => u.id !== user.id)
                : [...prev, user]
        );
    };

    const handleCreate = async () => {
        if (!groupName.trim() || selectedUsers.length === 0 || !currentUser) return;
        setLoading(true);
        const memberIds = [currentUser.id, ...selectedUsers.map(u => u.id)];

        try {
            const res = await fetch("/api/chats", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "GROUP",
                    name: groupName.trim(),
                    memberIds
                })
            });
            const newChat = await res.json();
            if (res.ok) {
                // Inform online members via socket so they join the room
                socket.emit("join_new_conversation", {
                    conversationId: newChat.id,
                    memberIds
                });

                dispatch(setConversations([newChat, ...conversations]));
                dispatch(setActiveConversation(newChat.id));
                onClose();
                // Reset form state
                setGroupName("");
                setSelectedUsers([]);
                setSearchQuery("");
            }
        } catch (error) {
            console.error("Failed to create group", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 max-h-[90vh] flex flex-col"
            >
                <div className="p-4 sm:p-6 overflow-y-auto">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-2xl text-blue-600 dark:text-blue-400">
                                <Users size={22} />
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 dark:text-white">Create Group</h2>
                                <p className="text-xs text-gray-500">Chat with multiple friends at once</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-5">
                        <Input
                            label="Group Name"
                            placeholder="e.g. Project Sprint Team 🚀"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="text-sm py-2.5 bg-gray-50 dark:bg-black/20"
                        />

                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Members ({selectedUsers.length} selected)
                                </label>
                            </div>

                            {/* Selected Members Chips */}
                            <div className="flex flex-wrap gap-1.5 min-h-[44px] p-2 bg-gray-50/70 dark:bg-black/20 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                                <AnimatePresence>
                                    {selectedUsers.map(user => (
                                        <motion.div
                                            key={user.id}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            className="flex items-center gap-1.5 px-3 py-1 bg-blue-500 text-white rounded-full text-xs font-semibold shadow-xs"
                                        >
                                            <span className="truncate max-w-[120px]">{user.username}</span>
                                            <button
                                                type="button"
                                                onClick={() => toggleUser(user)}
                                                className="p-0.5 hover:bg-white/20 rounded-full"
                                            >
                                                <X size={12} />
                                            </button>
                                        </motion.div>
                                    ))}
                                    {selectedUsers.length === 0 && (
                                        <span className="text-xs text-gray-400 self-center px-2">No members selected yet</span>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Search Input */}
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <Search size={16} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search friends by username..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-black/20 rounded-2xl border-none ring-1 ring-gray-100 dark:ring-gray-800 focus:ring-2 focus:ring-blue-500 transition-all text-xs sm:text-sm outline-none"
                                />
                                {isSearching && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <div className="w-4 h-4 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>

                            {/* Search Results */}
                            <div className="max-h-48 overflow-y-auto space-y-1 rounded-2xl border border-gray-100 dark:border-gray-800 p-1">
                                {isSearching ? (
                                    <div className="p-3 space-y-2 animate-pulse">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="flex items-center gap-2.5 p-1.5">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
                                                <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-28" />
                                            </div>
                                        ))}
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    searchResults.map(user => {
                                        const isSelected = selectedUsers.some(u => u.id === user.id);
                                        return (
                                            <button
                                                key={user.id}
                                                type="button"
                                                onClick={() => toggleUser(user)}
                                                className={`flex items-center justify-between w-full p-2.5 rounded-xl transition-all ${
                                                    isSelected
                                                        ? "bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500/50"
                                                        : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="w-8 h-8 rounded-full bg-linear-to-tr from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                                                        {user.avatar ? (
                                                            <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <UserIcon size={16} className="text-gray-400" />
                                                        )}
                                                    </div>
                                                    <p className="text-xs sm:text-sm font-semibold truncate text-gray-800 dark:text-gray-200">{user.username}</p>
                                                </div>
                                                {isSelected && <Check size={16} className="text-blue-500 shrink-0" />}
                                            </button>
                                        );
                                    })
                                ) : searchQuery.trim().length >= 2 ? (
                                    <p className="py-6 text-center text-xs text-gray-400">No users found</p>
                                ) : (
                                    <p className="py-6 text-center text-xs text-gray-400 flex flex-col items-center gap-1.5">
                                        <Search size={18} className="opacity-30" />
                                        Type 2+ characters to search users
                                    </p>
                                )}
                            </div>
                        </div>

                        <Button
                            onClick={handleCreate}
                            isLoading={loading}
                            className="w-full h-12 rounded-2xl text-base font-bold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
                            disabled={!groupName.trim() || selectedUsers.length === 0}
                        >
                            Create Group
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
