"use client";

import { useEffect, useState } from "react";
import { Check, X, User as UserIcon } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { removePendingRequest } from "@/redux/features/friendSlice";
import { setActiveConversation, setConversations } from "@/redux/features/chatSlice";
import Button from "@/components/ui/Button";

export default function ContactsList({ onTabSwitch }: { onTabSwitch?: () => void }) {
    const dispatch = useAppDispatch();
    const currentUser = useAppSelector((state) => state.auth.user);
    const { conversations } = useAppSelector((state) => state.chat);
    const [requests, setRequests] = useState<any[]>([]);
    const [friends, setFriends] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        if (!currentUser?.id) return;
        setLoading(true);
        try {
            const [reqRes, friendRes] = await Promise.all([
                fetch(`/api/users/request?userId=${currentUser.id}`),
                fetch(`/api/users/friends?userId=${currentUser.id}`)
            ]);

            const [reqData, friendData] = await Promise.all([
                reqRes.json(),
                friendRes.json()
            ]);

            if (Array.isArray(reqData)) setRequests(reqData);
            if (Array.isArray(friendData)) setFriends(friendData);
        } catch (error) {
            console.error("Failed to fetch contacts data", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchConversations = async () => {
        if (!currentUser?.id) return;
        try {
            const res = await fetch(`/api/chats?userId=${currentUser.id}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                dispatch(setConversations(data));
            }
        } catch (error) {
            console.error("Failed to refresh chats", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentUser?.id]);

    const handleResponse = async (requestId: string, status: "ACCEPTED" | "REJECTED") => {
        try {
            const res = await fetch("/api/users/request", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requestId, status }),
            });

            if (res.ok) {
                if (status === "ACCEPTED") {
                    await fetchData();
                    await fetchConversations(); // Update chat list for sender
                } else {
                    setRequests((prev) => prev.filter((r) => r.id !== requestId));
                }
                dispatch(removePendingRequest(requestId));
            }
        } catch (error) {
            console.error("Failed to respond", error);
        }
    };

    const handleFriendClick = (friendId: string) => {
        // Find if a conversation exists for this friend
        const existingConv = conversations.find(c =>
            c.type === 'DIRECT' &&
            c.members.some(m => m.userId === friendId)
        );

        if (existingConv) {
            dispatch(setActiveConversation(existingConv.id));
            if (onTabSwitch) onTabSwitch();
        } else {
            // This case should ideally not happen if ACCEPTED request creates a conv
            console.log("Conversation not found for friend:", friendId);
        }
    };

    return (
        <div className="p-4 space-y-6">
            {/* Friends Section */}
            <div className="space-y-3">
                <h3 className="font-semibold text-gray-500 text-xs uppercase tracking-wider">Friends</h3>
                {friends.length === 0 && !loading && (
                    <p className="text-gray-400 text-sm">No friends yet</p>
                )}
                <div className="space-y-2">
                    {friends.map((friend) => (
                        <div
                            key={friend.id}
                            onClick={() => handleFriendClick(friend.id)}
                            className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                        >
                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                                {friend.username[0].toUpperCase()}
                            </div>
                            <div>
                                <p className="font-medium text-sm">{friend.username}</p>
                                <p className="text-xs text-gray-500">{friend.email}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Requests Section */}
            {requests.length > 0 && (
                <div className="space-y-3">
                    <h3 className="font-semibold text-gray-500 text-xs uppercase tracking-wider">Friend Requests</h3>
                    <div className="space-y-2">
                        {requests.map((req) => (
                            <div key={req.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                                        <UserIcon size={16} />
                                    </div>
                                    <span className="font-medium text-sm">{req.sender.username}</span>
                                </div>
                                <div className="flex gap-1">
                                    <Button size="sm" onClick={() => handleResponse(req.id, "ACCEPTED")} className="p-1! bg-green-500 hover:bg-green-600 text-white">
                                        <Check size={14} />
                                    </Button>
                                    <Button size="sm" variant="danger" onClick={() => handleResponse(req.id, "REJECTED")} className="p-1!">
                                        <X size={14} />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
