"use client";

import { useEffect } from "react";
import { socket } from "@/lib/socket";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { addMessage, markMessagesAsRead, messageDeleted } from "@/redux/features/chatSlice";

export default function SocketManager() {
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);

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
        };

        const handleNewConversation = (data: { conversationId: string }) => {
            console.log("📣 New conversation created, joining room:", data.conversationId);
            socket.emit("join_room", data.conversationId);
        };

        const handleMessagesRead = (data: any) => {
            dispatch(markMessagesAsRead(data));
        };

        const handleMessageDeleted = (data: any) => {
            // For 'delete for everyone', userId doesn't really matter in reducer for that case
            // For 'delete for me', it allows us to filter if strict
            if (user) {
                dispatch(messageDeleted({ ...data, userId: user.id }));
            }
        };

        socket.on("receive_message", handleMessage);
        socket.on("new_conversation_created", handleNewConversation);
        socket.on("messages_read", handleMessagesRead);
        socket.on("message_deleted", handleMessageDeleted);

        return () => {
            socket.off("receive_message", handleMessage);
            socket.off("new_conversation_created", handleNewConversation);
            socket.off("messages_read", handleMessagesRead);
            socket.off("message_deleted", handleMessageDeleted);
        };
    }, [dispatch, user]);

    return null;
}
