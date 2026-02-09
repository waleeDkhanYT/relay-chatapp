"use client";

import { useEffect } from "react";
import { socket } from "@/lib/socket";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { addMessage } from "@/redux/features/chatSlice";

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
        const handleMessage = async (msg: any) => {
            // Check if we have this conversation in our list
            const state = (window as any).__REDUX_STATE__?.chat; // Hacky or just use a ref for conversations
            // Better: Just always dispatch addMessage, and in chatSlice we can't do much if it's missing.
            // Let's use the dispatch result or just check the store.

            // To be safe and clean, we'll fetch conversations if it's a brand new one
            dispatch(addMessage(msg));

            // If we're receiving a message, we might need to join the room if we haven't yet
            // (e.g. new conversation created while we were online)
            socket.emit("join_room", msg.conversationId);
        };

        socket.on("receive_message", handleMessage);

        return () => {
            socket.off("receive_message", handleMessage);
        };
    }, [dispatch, user]);

    return null;
}
