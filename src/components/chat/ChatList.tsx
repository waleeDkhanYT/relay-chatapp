"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setActiveConversation, setConversations } from "@/redux/features/chatSlice";
import { MessageSquare, Users, Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import GroupChatModal from "./GroupChatModal";

export default function ChatList() {
    const dispatch = useAppDispatch();
    const { conversations, activeConversationId } = useAppSelector((state) => state.chat);
    const currentUser = useAppSelector((state) => state.auth.user);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

    useEffect(() => {
        if (currentUser?.id) {
            fetch(`/api/chats?userId=${currentUser.id}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        dispatch(setConversations(data));
                    }
                })
                .catch(err => console.error("Failed to fetch chats", err));
        }
    }, [currentUser, dispatch]);

    if (conversations.length === 0) {
        return (
            <div className="flex flex-col h-full">
                <div className="p-4 text-center text-gray-400 text-sm flex-1">
                    No active conversations
                </div>
                <div className="p-4">
                    <Button onClick={() => setIsGroupModalOpen(true)} variant="secondary" className="w-full text-sm">
                        <Plus size={16} /> Create Group
                    </Button>
                </div>
                <GroupChatModal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full relative">
            <div className="p-2 border-b border-gray-100 dark:border-gray-800">
                <Button onClick={() => setIsGroupModalOpen(true)} variant="secondary" size="sm" className="w-full">
                    <Plus size={16} /> New Group
                </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
                {conversations.map((chat) => {
                    const isGroup = chat.type === "GROUP";
                    const otherMember = chat.members.find(m => m.user.id !== currentUser?.id)?.user;
                    const chatName = isGroup ? chat.name : otherMember?.username || "Unknown User";
                    const isActive = chat.id === activeConversationId;

                    // Safety check for name
                    const displayName = chatName || "Unknown";
                    const initial = displayName[0]?.toUpperCase() || "?";

                    return (
                        <button
                            key={chat.id}
                            onClick={() => dispatch(setActiveConversation(chat.id))}
                            className={`flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left ${isActive ? "bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500" : ""
                                }`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isGroup ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                {isGroup ? <Users size={20} /> : <span className="font-bold">{initial}</span>}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <div className="flex justify-between items-baseline">
                                    <span className="font-medium truncate">{displayName}</span>
                                    <span className="text-xs text-gray-400">12:30 PM</span>
                                </div>
                                <p className="text-sm text-gray-500 truncate">
                                    {chat.lastMessage?.content || "No messages yet"}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>
            <GroupChatModal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} />
        </div>
    );
}

