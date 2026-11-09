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
            <div className="flex flex-col h-full animate-pulse p-3 space-y-3">
                <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-xl w-full mb-2" />
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex gap-3 items-center p-2 rounded-xl">
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="flex justify-between">
                                <div className="h-3.5 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
                                <div className="h-2.5 bg-gray-200 dark:bg-gray-800 rounded w-10" />
                            </div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (conversations.length === 0) {
        return (
            <div className="flex flex-col h-full">
                <div className="p-8 text-center text-gray-400 text-xs sm:text-sm flex-1 flex flex-col items-center justify-center gap-2">
                    <p className="font-semibold text-gray-500">No active conversations</p>
                    <p className="text-gray-400 max-w-[200px]">Start by creating a group or messaging a friend from Contacts.</p>
                </div>
                <div className="p-3">
                    <Button onClick={() => setIsGroupModalOpen(true)} variant="secondary" className="w-full text-xs sm:text-sm rounded-xl py-2.5">
                        <Plus size={16} /> Create Group
                    </Button>
                </div>
                <GroupChatModal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full relative">
            <div className="p-2 border-b border-gray-100 dark:border-gray-800">
                <Button onClick={() => setIsGroupModalOpen(true)} variant="secondary" size="sm" className="w-full text-xs font-semibold py-2 rounded-xl">
                    <Plus size={15} /> New Group
                </Button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-0.5 p-1">
                {conversations.map((chat) => {
                    const isGroup = chat.type === "GROUP";
                    const otherMember = chat.members.find(m => m.user.id !== currentUser?.id)?.user;
                    const chatName = isGroup ? chat.name :
                        otherMember?.fullName ? otherMember.fullName : otherMember?.username || "Unknown User";
                    const isActive = chat.id === activeConversationId;
                    const unreadCount = unreadCounts[chat.id] || 0;

                    const displayName = chatName || "Unknown";
                    const initial = displayName[0]?.toUpperCase() || "?";
                    const lastMsg = chat.lastMessage || (chat.messages && chat.messages[chat.messages.length - 1]);

                    return (
                        <button
                            key={chat.id}
                            onClick={() => dispatch(setActiveConversation(chat.id))}
                            className={`flex items-center w-full gap-3 p-2.5 sm:p-3 rounded-2xl transition-all text-left ${
                                isActive
                                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 shadow-xs"
                                    : "hover:bg-gray-50 dark:hover:bg-gray-800/60 text-gray-800 dark:text-gray-200"
                            }`}
                        >
                            <div className="relative shrink-0 group/avatar" onClick={(e) => {
                                e.stopPropagation();
                                if (!isGroup && otherMember) {
                                    dispatch(openProfileModal(otherMember.id));
                                }
                            }}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center relative overflow-hidden text-sm font-bold
                                    ${isGroup ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'}
                                    group-hover/avatar:ring-2 ring-blue-500 transition-all`}>
                                    {isGroup ? <Users size={18} /> :
                                        otherMember?.avatar ?
                                            <Image
                                                src={otherMember.avatar} alt={otherMember.username}
                                                className="object-cover rounded-full" fill sizes="40px"
                                            />
                                            : <span>{initial}</span>}
                                </div>
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 shadow-xs">
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline gap-2">
                                    <span className="font-semibold text-sm truncate">{displayName}</span>
                                    {lastMsg && (
                                        <span className="text-[10px] text-gray-400 shrink-0">
                                            {formatDistanceToNow(new Date(lastMsg.createdAt), { addSuffix: false })}
                                        </span>
                                    )}
                                </div>
                                <p className={`text-xs truncate mt-0.5 ${unreadCount > 0 ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
                                    {lastMsg?.isDeleted ? (
                                        <span className="italic opacity-70">This message was deleted</span>
                                    ) : (
                                        lastMsg?.content || "No messages yet"
                                    )}
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
