"use client";

import { io } from "socket.io-client";

// In production, this should point to your actual domain
// Since we are using a custom server on the same port (3000), we can just use the window origin or empty string
// But Next.js dev server hot reload might cause multiple connections, so we handle it carefully.

export const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000", {
    autoConnect: false,
});
