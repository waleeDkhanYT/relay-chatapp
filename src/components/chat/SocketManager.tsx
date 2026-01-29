"use client";

import { useEffect } from "react";
import { socket } from "@/lib/socket";
import { useAppSelector } from "@/redux/hooks";

export default function SocketManager() {
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

        return () => {
            // Cleanup if needed
        };
    }, [user]);

    return null;
}
