"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Search, UserPlus, Check, User as UserIcon } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setConversations } from "@/redux/features/chatSlice";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface GroupDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    conversationId: string;
}

interface UserSummary {
    id: string;
    username: string;
    fullName?: string | null;
    avatar?: string | null;
}

export default function GroupDetailsModal({ isOpen, onClose, conversationId }: GroupDetailsModalProps) {
    const dispatch = useAppDispatch();
    const { conversations } = useAppSelector((state) => state.chat);
    const currentUser = useAppSelector((state) => state.auth.user);

    // Find the conversation from store
    const conversation = conversations.find(c => c.id === conversationId);

    const [isAdding, setIsAdding] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<UserSummary[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<UserSummary[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [loading, setLoading] = useState(false);

    // Filter out current members from search results
    const currentMemberIds = conversation?.members.map(m => m.user.id) || [];

    useEffect(() => {
        if (!isOpen) {
            setIsAdding(false);
            setSearchQuery("");
            setSearchResults([]);
            setSelectedUsers([]);
        }
    }, [isOpen]);

    // Search users
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length >= 2) {
                setIsSearching(true);
                try {
                    const res = await fetch(`/api/users/search?q=${searchQuery}&userId=${currentUser?.id}`);
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        // Filter out existing members
                        const filtered = data.filter(u => !currentMemberIds.includes(u.id));
                        setSearchResults(filtered);
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
    }, [searchQuery, currentUser?.id, currentMemberIds]);

    const toggleUser = (user: UserSummary) => {
        setSelectedUsers(prev =>
            prev.find(u => u.id === user.id)
                ? prev.filter(u => u.id !== user.id)
                : [...prev, user]
        );
    };

    const handleAddMembers = async () => {
        if (selectedUsers.length === 0) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/chats/${conversationId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    memberIds: selectedUsers.map(u => u.id)
                })
            });

            if (res.ok) {
                const updatedConversation = await res.json();

                // Update local state
                const updatedConversations = conversations.map(c =>
                    c.id === conversationId ? updatedConversation : c
                );
                dispatch(setConversations(updatedConversations));

                setIsAdding(false);
                setSelectedUsers([]);
                setSearchQuery("");
            }
        } catch (error) {
            console.error("Failed to add members", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !conversation) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col max-h-[85vh]"
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold">{conversation.name || "Group Details"}</h2>
                        <p className="text-sm text-gray-500">{conversation.members.length} members</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Add Member Section */}
                    {isAdding ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold">Add Members</h3>
                                <button
                                    onClick={() => setIsAdding(false)}
                                    className="text-sm text-blue-500 hover:underline"
                                >
                                    Cancel
                                </button>
                            </div>

                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-black/20 rounded-xl border-none ring-1 ring-gray-100 dark:ring-gray-800 focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                />
                            </div>

                            {/* Selection Chips */}
                            {selectedUsers.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {selectedUsers.map(u => (
                                        <span key={u.id} className="pk-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center gap-1 px-2">
                                            {u.username}
                                            <button onClick={() => toggleUser(u)}><X size={12} /></button>
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Results */}
                            <div className="space-y-1">
                                {searchResults.map(user => {
                                    const isSelected = selectedUsers.some(u => u.id === user.id);
                                    return (
                                        <button
                                            key={user.id}
                                            onClick={() => toggleUser(user)}
                                            className={`flex items-center justify-between w-full p-3 rounded-xl transition-all ${isSelected ? 'bg-blue-50 ring-1 ring-blue-500' : 'hover:bg-gray-50'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                                    {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <UserIcon size={16} />}
                                                </div>
                                                <span className="font-semibold text-sm">{user.username}</span>
                                            </div>
                                            {isSelected && <Check size={16} className="text-blue-500" />}
                                        </button>
                                    )
                                })}
                                {searchQuery && searchResults.length === 0 && !isSearching && (
                                    <p className="text-center text-gray-400 text-sm py-4">No users found</p>
                                )}
                            </div>

                            <Button
                                onClick={handleAddMembers}
                                disabled={selectedUsers.length === 0}
                                isLoading={loading}
                                className="w-full mt-4"
                            >
                                Add Selected
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <button
                                onClick={() => setIsAdding(true)}
                                className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors text-blue-600 font-semibold"
                            >
                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <UserPlus size={20} />
                                </div>
                                Add Member
                            </button>

                            <div className="space-y-2">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider px-2">Members</h3>
                                {conversation.members.map(member => (
                                    <div key={member.id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                                                {member.user.avatar ?
                                                    <img src={member.user.avatar} className="w-full h-full object-cover" /> :
                                                    <span className="font-bold text-gray-500">{member.user.username[0].toUpperCase()}</span>
                                                }
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm">{member.user.fullName || member.user.username}</p>
                                                {member.user.id === currentUser?.id && <span className="text-xs text-green-500">You</span>}
                                                {/* Start Admin Logic (if we had it) */}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
