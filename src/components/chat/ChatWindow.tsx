"use client";

import { motion, AnimatePresence } from "framer-motion";

import { useState, useEffect, useRef } from "react";
import { Send, MoreVertical, Phone, Video, Check, CheckCheck, Trash2, Users, MoreHorizontal } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { addMessage, setMessages } from "@/redux/features/chatSlice";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { openProfileModal } from "@/redux/features/uiSlice";
import { socket } from "@/lib/socket";
import { format } from "date-fns";
import GroupDetailsModal from "./GroupDetailsModal";

export default function ChatWindow() {
    const dispatch = useAppDispatch();
    const { activeConversationId, conversations, messages } = useAppSelector((state) => state.chat);
    const currentUser = useAppSelector((state) => state.auth.user);

    const [inputText, setInputText] = useState("");
    // Replaced context menu with a simple active message ID for the dropdown
    const [activeMessageMenuId, setActiveMessageMenuId] = useState<string | null>(null);
    const [isGroupDetailsOpen, setIsGroupDetailsOpen] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const activeChat = conversations.find(c => c.id === activeConversationId);
    const otherMember = activeChat?.members.find(m => m.user.id !== currentUser?.id)?.user;
    const chatName = activeChat?.type === "GROUP" ? activeChat.name : otherMember?.username;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        const handleClickOutside = () => setActiveMessageMenuId(null);
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    useEffect(() => {
        if (activeConversationId && currentUser) {
            // Join socket room
            socket.emit("join_room", activeConversationId);

            // Mark as read immediately when entering chat
            socket.emit("mark_read", { conversationId: activeConversationId, userId: currentUser.id });

            // Fetch history
            fetch(`/api/messages?conversationId=${activeConversationId}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        dispatch(setMessages(data));
                    }
                })
                .catch(err => console.error("Failed to fetch messages", err));
        }
    }, [activeConversationId, dispatch, currentUser]);


    const handleSend = () => {
        if (!inputText.trim() || !activeConversationId) return;

        const msgData = {
            id: crypto.randomUUID(),
            content: inputText,
            senderId: currentUser!.id,
            conversationId: activeConversationId,
            createdAt: new Date().toISOString(),
            sender: { id: currentUser!.id, username: currentUser!.username },
            readBy: [],
            isDeleted: false,
            deletedForUserIds: []
        };

        socket.emit('send_message', msgData);
        dispatch(addMessage(msgData));

        setInputText("");
    };

    const toggleMessageMenu = (e: React.MouseEvent, msgId: string) => {
        e.stopPropagation();
        setActiveMessageMenuId(activeMessageMenuId === msgId ? null : msgId);
    };

    const handleDelete = (msgId: string, deleteForEveryone: boolean) => {
        if (!currentUser) return;

        socket.emit("delete_message", {
            messageId: msgId,
            userId: currentUser.id,
            deleteForEveryone,
            conversationId: activeConversationId
        });

        setActiveMessageMenuId(null);
    };

    if (!activeConversationId) return (
        <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
                <h2 className="text-xl font-bold text-gray-400">Select a chat to start messaging</h2>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900 relative">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0">
                <div className="flex items-center gap-3">
                    <div
                        onClick={() => !activeChat?.type && otherMember && dispatch(openProfileModal(otherMember.id))}
                        className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold cursor-pointer hover:ring-2 ring-blue-500 transition-all"
                    >
                        {chatName?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div>
                        <h3 className="font-bold">{chatName || "Chat"}</h3>
                        <span className="text-xs text-green-500 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span> Online
                        </span>
                    </div>
                </div>
                <div className="flex gap-2 text-gray-500">
                    <button className="p-2 hover:bg-gray-100 rounded-lg"><Phone size={20} /></button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg"><Video size={20} /></button>
                    {activeChat?.type === 'GROUP' && (
                        <button
                            onClick={() => setIsGroupDetailsOpen(true)}
                            className="p-2 hover:bg-gray-100 rounded-lg text-blue-500"
                            title="Group Details"
                        >
                            <Users size={20} />
                        </button>
                    )}
                    <button className="p-2 hover:bg-gray-100 rounded-lg"><MoreVertical size={20} /></button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-black/20">
                {messages.map((msg) => {
                    const isMe = msg.senderId === currentUser?.id;
                    const isRead = msg.readBy?.length > 0;

                    if (msg.deletedForUserIds?.includes(currentUser?.id || "")) return null;

                    return (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'} group/message`}
                        >
                            <div
                                className={`max-w-[70%] p-3 rounded-2xl relative ${isMe
                                    ? 'bg-blue-600 text-white rounded-br-none shadow-md'
                                    : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-bl-none shadow-sm'
                                    }`}
                            >
                                {/* 3-Dot Menu Button */}
                                {!msg.isDeleted && (
                                    <div className={`absolute top-1 ${isMe ? 'left-1 -translate-x-full' : 'right-1 translate-x-full'} flex items-center`}>
                                        <div className="relative">
                                            <button
                                                onClick={(e) => toggleMessageMenu(e, msg.id)}
                                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-500"
                                            >
                                                <MoreVertical size={16} />
                                            </button>

                                            {/* Dropdown */}
                                            {activeMessageMenuId === msg.id && (
                                                <div className={`absolute z-50 top-full ${isMe ? 'right-0' : 'left-0'} mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 py-1 overflow-hidden`}>
                                                    <button
                                                        onClick={() => handleDelete(msg.id, false)}
                                                        className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2"
                                                    >
                                                        <Trash2 size={14} /> Delete for me
                                                    </button>
                                                    {isMe && (
                                                        <button
                                                            onClick={() => handleDelete(msg.id, true)}
                                                            className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-red-600 flex items-center gap-2"
                                                        >
                                                            <Trash2 size={14} /> Delete for all
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {!isMe && <p className="text-xs text-blue-500 font-semibold mb-1">{msg.sender?.username}</p>}

                                {msg.isDeleted ? (
                                    <p className="text-sm italic opacity-60 flex items-center gap-1">
                                        <span className="block w-4 h-4 rounded-full border-2 border-current opacity-50"></span>
                                        This message was deleted
                                    </p>
                                ) : (
                                    <p className="text-sm leading-relaxed">{msg.content}</p>
                                )}

                                <div className={`text-[9px] flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                                    <span>{format(new Date(msg.createdAt), 'hh:mm a')}</span>
                                    {isMe && !msg.isDeleted && (
                                        <span>
                                            {isRead ? <CheckCheck size={12} className="text-blue-200" /> : <Check size={12} className="opacity-70" />}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                <Input
                    placeholder="Type a message..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    className="mb-0!"
                />
                <Button onClick={handleSend} disabled={!inputText.trim()} className="rounded-full w-12 h-12 flex items-center justify-center">
                    <Send size={18} />
                </Button>
            </div>

            {/* Modals */}
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
