"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import {
    Send,
    MoreVertical,
    Phone,
    Video,
    Check,
    CheckCheck,
    Trash2,
    Users,
    ArrowLeft
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { addMessage, setMessages, setActiveConversation } from "@/redux/features/chatSlice";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { openProfileModal } from "@/redux/features/uiSlice";
import { socket } from "@/lib/socket";
import { format } from "date-fns";
import GroupDetailsModal from "./GroupDetailsModal";

export default function ChatWindow() {
    const dispatch = useAppDispatch();
    const { activeConversationId, conversations, messages, onlineUsers } = useAppSelector((state) => state.chat);
    const currentUser = useAppSelector((state) => state.auth.user);

    const [inputText, setInputText] = useState("");
    const [activeMessageMenuId, setActiveMessageMenuId] = useState<string | null>(null);
    const [isGroupDetailsOpen, setIsGroupDetailsOpen] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const activeChat = conversations.find((c) => c.id === activeConversationId);
    const isGroup = activeChat?.type === "GROUP";
    const otherMember = activeChat?.members.find((m) => m.user.id !== currentUser?.id)?.user;
    const chatName = isGroup ? activeChat?.name : otherMember?.fullName || otherMember?.username;
    const isOtherUserOnline = otherMember ? onlineUsers.includes(otherMember.id) : false;

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoadingMessages]);

    // Handle outside clicks for message 3-dot menu
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest("[data-message-menu]")) {
                setActiveMessageMenuId(null);
            }
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    // Load messages and mark conversation as read
    useEffect(() => {
        if (activeConversationId && currentUser) {
            // Join socket room
            socket.emit("join_room", activeConversationId);

            // Mark as read immediately when entering chat
            socket.emit("mark_read", { conversationId: activeConversationId, userId: currentUser.id });

            // Fetch history with loading skeleton state
            setIsLoadingMessages(true);
            fetch(`/api/messages?conversationId=${activeConversationId}`)
                .then((res) => res.json())
                .then((data) => {
                    if (Array.isArray(data)) {
                        dispatch(setMessages(data));
                    }
                })
                .catch((err) => console.error("Failed to fetch messages", err))
                .finally(() => setIsLoadingMessages(false));
        }
    }, [activeConversationId, dispatch, currentUser]);

    // Automatically mark new incoming messages as read when viewing this chat
    useEffect(() => {
        if (activeConversationId && currentUser && messages.length > 0) {
            const hasUnread = messages.some(
                (m) => m.senderId !== currentUser.id && (!m.readBy || !m.readBy.includes(currentUser.id))
            );
            if (hasUnread) {
                socket.emit("mark_read", { conversationId: activeConversationId, userId: currentUser.id });
            }
        }
    }, [messages, activeConversationId, currentUser]);

    const handleSend = () => {
        if (!inputText.trim() || !activeConversationId || !currentUser) return;

        const msgData = {
            id: crypto.randomUUID(),
            content: inputText.trim(),
            senderId: currentUser.id,
            conversationId: activeConversationId,
            createdAt: new Date().toISOString(),
            sender: { id: currentUser.id, username: currentUser.username },
            readBy: [],
            isDeleted: false,
            deletedForUserIds: []
        };

        socket.emit("send_message", msgData);
        dispatch(addMessage(msgData));

        setInputText("");
    };

    const toggleMessageMenu = (e: React.MouseEvent, msgId: string) => {
        e.stopPropagation();
        setActiveMessageMenuId((prev) => (prev === msgId ? null : msgId));
    };

    const handleDelete = (msgId: string, deleteForEveryone: boolean) => {
        if (!currentUser || !activeConversationId) return;

        socket.emit("delete_message", {
            messageId: msgId,
            userId: currentUser.id,
            deleteForEveryone,
            conversationId: activeConversationId
        });

        setActiveMessageMenuId(null);
    };

    if (!activeConversationId) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-gray-50/50 dark:bg-black/20">
                <div className="w-16 h-16 rounded-3xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 shadow-sm">
                    <Send size={28} />
                </div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">No Chat Selected</h2>
                <p className="text-sm text-gray-500 max-w-sm mt-1">
                    Choose a conversation from the sidebar or start a new chat with your contacts.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900 relative">
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between z-20 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md sticky top-0">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    {/* Back button for mobile view */}
                    <button
                        onClick={() => dispatch(setActiveConversation(null))}
                        className="md:hidden p-2 -ml-1 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300"
                        title="Back to conversations"
                        aria-label="Back to conversations"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    <div
                        onClick={() => !isGroup && otherMember && dispatch(openProfileModal(otherMember.id))}
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-all ${
                            isGroup
                                ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                                : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 cursor-pointer hover:ring-2 ring-blue-500"
                        }`}
                    >
                        {isGroup ? <Users size={18} /> : chatName?.[0]?.toUpperCase() || "?"}
                    </div>

                    <div className="min-w-0">
                        <h3 className="font-bold text-sm sm:text-base truncate text-gray-900 dark:text-white">
                            {chatName || "Chat"}
                        </h3>
                        {isGroup ? (
                            <span className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                                {activeChat?.members.length} members
                            </span>
                        ) : (
                            <span
                                className={`text-[11px] sm:text-xs flex items-center gap-1.5 font-medium ${
                                    isOtherUserOnline ? "text-green-500" : "text-gray-400"
                                }`}
                            >
                                <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                        isOtherUserOnline ? "bg-green-500 animate-pulse" : "bg-gray-400"
                                    }`}
                                />
                                {isOtherUserOnline ? "Online" : "Offline"}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 text-gray-500 shrink-0">
                    <button
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors hidden sm:inline-flex"
                        title="Voice Call (Coming Soon)"
                    >
                        <Phone size={18} />
                    </button>
                    <button
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors hidden sm:inline-flex"
                        title="Video Call (Coming Soon)"
                    >
                        <Video size={18} />
                    </button>
                    {isGroup && (
                        <button
                            onClick={() => setIsGroupDetailsOpen(true)}
                            className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl transition-colors"
                            title="Group Details"
                        >
                            <Users size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-gray-50 dark:bg-black/20">
                {/* Loading Skeleton */}
                {isLoadingMessages ? (
                    <div className="space-y-4 py-4 animate-pulse">
                        <div className="flex justify-start">
                            <div className="w-48 h-10 bg-gray-200 dark:bg-gray-800 rounded-2xl rounded-bl-none" />
                        </div>
                        <div className="flex justify-end">
                            <div className="w-56 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl rounded-br-none" />
                        </div>
                        <div className="flex justify-start">
                            <div className="w-64 h-14 bg-gray-200 dark:bg-gray-800 rounded-2xl rounded-bl-none" />
                        </div>
                        <div className="flex justify-end">
                            <div className="w-40 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-2xl rounded-br-none" />
                        </div>
                        <div className="flex justify-start">
                            <div className="w-52 h-11 bg-gray-200 dark:bg-gray-800 rounded-2xl rounded-bl-none" />
                        </div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                        <p className="text-sm">No messages yet.</p>
                        <p className="text-xs text-gray-500 mt-1">Send a message below to start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.senderId === currentUser?.id;
                        // Double tick: check if readBy includes any user other than the sender
                        const isRead = msg.readBy && msg.readBy.some((id: string) => id !== msg.senderId);

                        if (msg.deletedForUserIds?.includes(currentUser?.id || "")) return null;

                        const isMenuOpen = activeMessageMenuId === msg.id;

                        return (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                                className={`flex ${isMe ? "justify-end" : "justify-start"} group/message relative`}
                            >
                                <div
                                    className={`max-w-[85%] sm:max-w-[70%] p-3 rounded-2xl relative transition-shadow ${
                                        isMe
                                            ? "bg-blue-600 text-white rounded-br-none shadow-md"
                                            : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-bl-none shadow-sm text-gray-900 dark:text-gray-100"
                                    }`}
                                >
                                    {/* 3-Dot Options Menu Button */}
                                    {!msg.isDeleted && (
                                        <div
                                            data-message-menu={msg.id}
                                            className={`absolute top-1.5 ${
                                                isMe ? "-left-8" : "-right-8"
                                            } z-30 flex items-center`}
                                        >
                                            <button
                                                type="button"
                                                onClick={(e) => toggleMessageMenu(e, msg.id)}
                                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all opacity-0 group-hover/message:opacity-100 focus:opacity-100"
                                                title="Message options"
                                                aria-label="Message options"
                                            >
                                                <MoreVertical size={16} />
                                            </button>

                                            {/* Dropdown Menu */}
                                            <AnimatePresence>
                                                {isMenuOpen && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.9, y: 4 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.9, y: 4 }}
                                                        transition={{ duration: 0.15 }}
                                                        className={`absolute top-full mt-1 ${
                                                            isMe ? "right-0" : "left-0"
                                                        } w-36 sm:w-40 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 py-1.5 z-50 overflow-hidden`}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(msg.id, false);
                                                            }}
                                                            className="w-full text-left px-3.5 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs sm:text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2 transition-colors"
                                                        >
                                                            <Trash2 size={14} className="text-gray-500" />
                                                            <span>Delete for me</span>
                                                        </button>
                                                        {isMe && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDelete(msg.id, true);
                                                                }}
                                                                className="w-full text-left px-3.5 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs sm:text-sm text-red-600 flex items-center gap-2 transition-colors"
                                                            >
                                                                <Trash2 size={14} />
                                                                <span>Delete for all</span>
                                                            </button>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}

                                    {/* Sender Name in Group Chat */}
                                    {!isMe && isGroup && (
                                        <p className="text-[11px] font-bold text-blue-500 dark:text-blue-400 mb-1">
                                            {msg.sender?.username || "Member"}
                                        </p>
                                    )}

                                    {/* Message Body */}
                                    {msg.isDeleted ? (
                                        <p className="text-xs sm:text-sm italic opacity-60 flex items-center gap-1.5 py-0.5">
                                            <span className="block w-3.5 h-3.5 rounded-full border border-current opacity-60" />
                                            This message was deleted
                                        </p>
                                    ) : (
                                        <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
                                    )}

                                    {/* Timestamp & Read Receipt Checkmarks */}
                                    <div
                                        className={`text-[10px] flex items-center justify-end gap-1 mt-1 font-medium select-none ${
                                            isMe ? "text-blue-100" : "text-gray-400"
                                        }`}
                                    >
                                        <span>{format(new Date(msg.createdAt), "hh:mm a")}</span>
                                        {isMe && !msg.isDeleted && (
                                            <span
                                                className="inline-flex items-center ml-0.5"
                                                title={isRead ? "Read by recipient" : "Sent"}
                                            >
                                                {isRead ? (
                                                    <CheckCheck size={14} className="text-sky-300 drop-shadow-xs" />
                                                ) : (
                                                    <Check size={14} className="text-white/70" />
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-2.5 sm:p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <Input
                    placeholder="Type a message..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    className="mb-0! text-sm py-2.5"
                />
                <Button
                    onClick={handleSend}
                    disabled={!inputText.trim()}
                    className="rounded-2xl w-11 h-11 shrink-0 flex items-center justify-center p-0!"
                    aria-label="Send message"
                >
                    <Send size={18} />
                </Button>
            </div>

            {/* Group Details Modal */}
            <AnimatePresence>
                {isGroupDetailsOpen && activeConversationId && (
                    <GroupDetailsModal
                        isOpen={isGroupDetailsOpen}
                        onClose={() => setIsGroupDetailsOpen(false)}
                        conversationId={activeConversationId}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
