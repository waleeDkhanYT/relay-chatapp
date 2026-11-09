"use client";

import { useEffect, useState } from "react";
import { Check, X, User as UserIcon, Loader2 } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { removePendingRequest } from "@/redux/features/friendSlice";
import { setActiveConversation, setConversations } from "@/redux/features/chatSlice";
import Button from "@/components/ui/Button";
import Image from "next/image";

export default function ContactsList({ onTabSwitch }: { onTabSwitch?: () => void }) {
    const dispatch = useAppDispatch();
    const currentUser = useAppSelector((state) => state.auth.user);
    const { conversations } = useAppSelector((state) => state.chat);
    const [requests, setRequests] = useState<any[]>([]);
    const [friends, setFriends] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

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
        setProcessingRequestId(requestId);
        try {
            const res = await fetch("/api/users/request", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requestId, status }),
            });

            if (res.ok) {
                if (status === "ACCEPTED") {
                    await fetchData();
                    await fetchConversations(); // Update chat list
                } else {
                    setRequests((prev) => prev.filter((r) => r.id !== requestId));
                }
                dispatch(removePendingRequest(requestId));
            }
        } catch (error) {
            console.error("Failed to respond to request", error);
        } finally {
            setProcessingRequestId(null);
        }
    };

    const handleFriendClick = (friendId: string) => {
        // Find if a direct conversation exists for this friend
        const existingConv = conversations.find(c =>
            c.type === 'DIRECT' &&
            c.members.some(m => m.userId === friendId)
        );

        if (existingConv) {
            dispatch(setActiveConversation(existingConv.id));
            if (onTabSwitch) onTabSwitch();
        } else {
            console.log("Conversation not found for friend:", friendId);
        }
    };

    if (loading) {
        return (
            <div className="p-3 space-y-6 animate-pulse">
                {/* Skeleton Friends */}
                <div className="space-y-3">
                    <div className="h-3 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
                    <div className="space-y-2">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center gap-3 p-2 rounded-xl">
                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3.5 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
                                    <div className="h-2.5 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Skeleton Friend Requests */}
                <div className="space-y-3">
                    <div className="h-3 w-28 bg-gray-200 dark:bg-gray-800 rounded" />
                    <div className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-800/40 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
                            <div className="h-3.5 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                        </div>
                        <div className="flex gap-1.5">
                            <div className="w-7 h-7 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                            <div className="w-7 h-7 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-2 sm:p-3 space-y-6">
            {/* Friends Section */}
            <div className="space-y-2">
                <div className="flex items-center justify-between px-2">
                    <h3 className="font-bold text-gray-400 dark:text-gray-500 text-[11px] uppercase tracking-wider">
                        Friends ({friends.length})
                    </h3>
                </div>

                {friends.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 text-xs">
                        No friends added yet. Use the search icon above to find people!
                    </div>
                ) : (
                    <div className="space-y-1">
                        {friends.map((friend) => (
                            <button
                                key={friend.id}
                                onClick={() => handleFriendClick(friend.id)}
                                className="w-full flex items-center gap-3 p-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/60 rounded-2xl transition-all text-left group"
                            >
                                <div className="relative w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 overflow-hidden shrink-0">
                                    {friend.avatar ? (
                                        <Image
                                            src={friend.avatar}
                                            alt={friend.username}
                                            fill
                                            sizes="40px"
                                            className="object-cover"
                                        />
                                    ) : (
                                        <span>{friend.username?.[0]?.toUpperCase() || "?"}</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm truncate text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {friend.username}
                                    </p>
                                    <p className="text-xs text-gray-400 truncate">{friend.email}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Friend Requests Section */}
            {requests.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="font-bold text-purple-600 dark:text-purple-400 text-[11px] uppercase tracking-wider">
                            Friend Requests ({requests.length})
                        </h3>
                    </div>

                    <div className="space-y-2">
                        {requests.map((req) => {
                            const isProcessing = processingRequestId === req.id;
                            return (
                                <div
                                    key={req.id}
                                    className="flex items-center justify-between p-2.5 bg-gray-50/70 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800 transition-all"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                                            <UserIcon size={16} />
                                        </div>
                                        <span className="font-medium text-xs sm:text-sm truncate text-gray-800 dark:text-gray-200">
                                            {req.sender.username}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <Button
                                            size="sm"
                                            onClick={() => handleResponse(req.id, "ACCEPTED")}
                                            disabled={isProcessing}
                                            className="p-1.5! bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-xs"
                                            title="Accept"
                                            aria-label="Accept friend request"
                                        >
                                            {isProcessing ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <Check size={14} />
                                            )}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="danger"
                                            onClick={() => handleResponse(req.id, "REJECTED")}
                                            disabled={isProcessing}
                                            className="p-1.5! rounded-lg shadow-xs"
                                            title="Reject"
                                            aria-label="Reject friend request"
                                        >
                                            <X size={14} />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
