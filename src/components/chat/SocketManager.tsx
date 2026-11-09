"use client";

import { useEffect } from "react";
import { socket } from "@/lib/socket";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { addMessage, markMessagesAsRead, messageDeleted, setOnlineUsers } from "@/redux/features/chatSlice";

export default function SocketManager() {
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);
    const activeConversationId = useAppSelector((state) => state.chat.activeConversationId);

    useEffect(() => {
        if (user) {
            if (!socket.connected) {
                socket.connect();
            }

            // Identify user to server
            socket.emit("identify", user.id);
        } else {
            if (socket.connected) {
                socket.disconnect();
            }
        }
    }, [user]);

    useEffect(() => {
        const handleMessage = (msg: any) => {
            dispatch(addMessage(msg));
            socket.emit("join_room", msg.conversationId);

            // If user is currently looking at this conversation, mark it as read immediately
            if (user && activeConversationId === msg.conversationId && msg.senderId !== user.id) {
                socket.emit("mark_read", { conversationId: msg.conversationId, userId: user.id });
            }
        };

        const handleNewConversation = (data: { conversationId: string }) => {
            console.log("📣 New conversation created, joining room:", data.conversationId);
            socket.emit("join_room", data.conversationId);
        };

        const handleMessagesRead = (data: any) => {
            dispatch(markMessagesAsRead(data));
        };

        const handleMessageDeleted = (data: any) => {
            if (user) {
                dispatch(messageDeleted({ ...data, userId: user.id }));
            }
        };

        const handleOnlineUsers = (users: string[]) => {
            dispatch(setOnlineUsers(users));
        };

        socket.on("receive_message", handleMessage);
        socket.on("new_conversation_created", handleNewConversation);
        socket.on("messages_read", handleMessagesRead);
        socket.on("message_deleted", handleMessageDeleted);
        socket.on("online_users", handleOnlineUsers);

        return () => {
            socket.off("receive_message", handleMessage);
            socket.off("new_conversation_created", handleNewConversation);
            socket.off("messages_read", handleMessagesRead);
            socket.off("message_deleted", handleMessageDeleted);
            socket.off("online_users", handleOnlineUsers);
        };
    }, [dispatch, user, activeConversationId]);

    return null;
}
