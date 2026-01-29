"use client";

import { motion } from "framer-motion";

import { useEffect, useState, useRef } from "react";
import { Send, MoreVertical, Phone, Video } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { addMessage, setMessages } from "@/redux/features/chatSlice";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

import { socket } from "@/lib/socket";

export default function ChatWindow() {
    const dispatch = useAppDispatch();
    const { activeConversationId, conversations, messages } = useAppSelector((state) => state.chat);
    const currentUser = useAppSelector((state) => state.auth.user);

    const [inputText, setInputText] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const activeChat = conversations.find(c => c.id === activeConversationId);
    const otherMember = activeChat?.members.find(m => m.user.id !== currentUser?.id)?.user;
    const chatName = activeChat?.type === "GROUP" ? activeChat.name : otherMember?.username;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (activeConversationId) {
            // Join socket room
            socket.emit("join_room", activeConversationId);

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
    }, [activeConversationId, dispatch]);

    useEffect(() => {
        const handleMessage = (msg: any) => {
            if (msg.conversationId === activeConversationId) {
                dispatch(addMessage(msg));
            }
        };

        socket.on("receive_message", handleMessage);

        return () => {
            socket.off("receive_message", handleMessage);
        };
    }, [activeConversationId, dispatch]);

    const handleSend = () => {
        if (!inputText.trim() || !activeConversationId) return;

        const msgData = {
            content: inputText,
            senderId: currentUser!.id,
            conversationId: activeConversationId,
            createdAt: new Date().toISOString(),
            sender: { id: currentUser!.id, username: currentUser!.username }
        };

        socket.emit('send_message', msgData);

        setInputText("");
    };

    if (!activeConversationId) return null;

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
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
                    <button className="p-2 hover:bg-gray-100 rounded-lg"><MoreVertical size={20} /></button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-black/20">
                {messages.map((msg) => {
                    const isMe = msg.senderId === currentUser?.id;
                    return (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[70%] p-3 rounded-2xl ${isMe
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-bl-none'
                                }`}>
                                {!isMe && <p className="text-xs text-gray-500 mb-1">{msg.sender?.username}</p>}
                                <p>{msg.content}</p>
                                <span className={`text-[10px] block mt-1 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
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
                <Button onClick={handleSend} disabled={!inputText.trim()}>
                    <Send size={20} />
                </Button>
            </div>
        </div>
    );
}
