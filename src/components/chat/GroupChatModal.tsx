"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Check, Search, User as UserIcon } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setConversations, setActiveConversation } from "@/redux/features/chatSlice";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

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
            if (searchQuery.length >= 2) {
                setIsSearching(true);
                try {
                    const res = await fetch(`/api/users/search?q=${searchQuery}&userId=${currentUser?.id}`);
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
        // Clear search query after selection for better flow? Maybe not.
    };

    const handleCreate = async () => {
        if (!groupName || selectedUsers.length === 0) return;
        setLoading(true);
        try {
            const res = await fetch("/api/chats", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: 'GROUP',
                    name: groupName,
                    memberIds: [currentUser!.id, ...selectedUsers.map(u => u.id)]
                })
            });
            const newChat = await res.json();
            if (res.ok) {
                dispatch(setConversations([newChat, ...conversations]));
                dispatch(setActiveConversation(newChat.id));
                onClose();
                // Reset state
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800"
            >
                <div className="p-6">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                                <Users size={24} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <h2 className="text-2xl font-black tracking-tight">Create Group</h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-6">
                        <Input
                            label="Group Name"
                            placeholder="e.g. Weekend Trip 🏕️"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="bg-gray-50 dark:bg-black/20 border-none ring-1 ring-gray-100 dark:ring-gray-800 transition-all focus:ring-2 focus:ring-blue-500"
                        />

                        <div className="space-y-3">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                                Add Members <span className="text-gray-400 font-normal">({selectedUsers.length} selected)</span>
                            </label>

                            {/* Selected Members Chips */}
                            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-gray-50/50 dark:bg-black/10 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                                <AnimatePresence>
                                    {selectedUsers.map(user => (
                                        <motion.div
                                            key={user.id}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white rounded-full text-sm font-bold shadow-sm"
                                        >
                                            <span className="truncate max-w-[100px]">{user.username}</span>
                                            <button onClick={() => toggleUser(user)} className="p-0.5 hover:bg-white/20 rounded-full">
                                                <X size={14} />
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
                                    <Search size={18} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search by username..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-black/20 rounded-2xl border-none ring-1 ring-gray-100 dark:ring-gray-800 focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                                />
                                {isSearching && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <div className="w-4 h-4 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>

                            {/* Search Results */}
                            <div className="max-h-52 overflow-y-auto space-y-1 rounded-2xl border border-gray-100 dark:border-gray-800 p-1">
                                {searchResults.length > 0 ? (
                                    searchResults.map(user => {
                                        const isSelected = selectedUsers.some(u => u.id === user.id);
                                        return (
                                            <button
                                                key={user.id}
                                                onClick={() => toggleUser(user)}
                                                className={`flex items-center justify-between w-full p-2.5 rounded-xl transition-all ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500/50' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-linear-to-tr from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center overflow-hidden">
                                                        {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <UserIcon size={18} className="text-gray-400" />}
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-sm font-bold">{user.username}</p>
                                                    </div>
                                                </div>
                                                {isSelected && <Check size={18} className="text-blue-500" />}
                                            </button>
                                        );
                                    })
                                ) : searchQuery.length >= 2 && !isSearching ? (
                                    <p className="py-8 text-center text-sm text-gray-400">No users found</p>
                                ) : (
                                    <p className="py-8 text-center text-sm text-gray-400 flex flex-col items-center gap-2">
                                        <Search size={20} className="opacity-20" />
                                        Search result will appear here
                                    </p>
                                )}
                            </div>
                        </div>

                        <Button
                            onClick={handleCreate}
                            isLoading={loading}
                            className="w-full h-14 rounded-2xl text-lg font-black shadow-xl shadow-blue-500/20 transition-all hover:translate-y-[-2px] disabled:opacity-50 disabled:translate-y-0"
                            disabled={!groupName || selectedUsers.length === 0}
                        >
                            Create Group
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
