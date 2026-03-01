"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { Users, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { setActiveConversation, setConversations } from "@/redux/features/chatSlice";
import { openProfileModal } from "@/redux/features/uiSlice";
import Button from "@/components/ui/Button";
import GroupChatModal from "./GroupChatModal";
import Image from "next/image";

export default function ChatList() {
    const dispatch = useAppDispatch();
    const { conversations, activeConversationId, unreadCounts } = useAppSelector((state) => state.chat);
    const currentUser = useAppSelector((state) => state.auth.user);
    const [isLoading, setIsLoading] = useState(true);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

    useEffect(() => {
        if (currentUser?.id) {
            setIsLoading(true);
            fetch(`/api/chats?userId=${currentUser.id}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        dispatch(setConversations(data));
                    }
                })
                .catch(err => console.error("Failed to fetch chats", err))
                .finally(() => setIsLoading(false));
        }
    }, [currentUser, dispatch]);

    if (isLoading) {
        return (
            <div className="flex flex-col h-full animate-pulse p-4 gap-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

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
                    const chatName = isGroup ? chat.name :
                        otherMember?.fullName ? otherMember.fullName : otherMember?.username || "Unknown User";
                    const isActive = chat.id === activeConversationId;
                    const unreadCount = unreadCounts[chat.id] || 0;

                    // Safety check for name
                    const displayName = chatName || "Unknown";
                    const initial = displayName[0]?.toUpperCase() || "?";

                    return (
                        <button
                            key={chat.id}
                            onClick={() => dispatch(setActiveConversation(chat.id))}
                            className={`flex items-center w-full gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left ${isActive ? "bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500" : ""
                                }`}
                        >
                            <div className="relative group/avatar" onClick={(e) => {
                                e.stopPropagation();
                                if (!isGroup && otherMember) {
                                    dispatch(openProfileModal(otherMember.id));
                                }
                            }}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center 
                                    ${isGroup ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}
                                    group-hover/avatar:ring-2 ring-blue-500 transition-all`}>
                                    {isGroup ? <Users size={20} /> :
                                        otherMember?.avatar ?
                                            <Image
                                                src={otherMember?.avatar} alt={otherMember?.username}
                                                className="object-cover rounded-full" fill sizes="40px"
                                            />
                                            : <span className="font-bold">{initial}</span>}
                                </div>
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <div className="flex justify-between items-baseline">
                                    <span className="font-medium truncate">{displayName}</span>
                                    {chat.lastMessage && (
                                        <span className="text-[10px] text-gray-400">
                                            {formatDistanceToNow(new Date(chat.lastMessage.createdAt), { addSuffix: true })}
                                        </span>
                                    )}
                                </div>
                                <p className={`text-sm truncate ${unreadCount > 0 ? 'text-gray-900 dark:text-gray-100 font-semibold' : 'text-gray-500'}`}>
                                    {chat?.messages[chat.messages.length - 1]?.isDeleted ?
                                        "This message was deleted" : chat?.messages[chat.messages.length - 1]?.content
                                        || "No messages yet"}
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

