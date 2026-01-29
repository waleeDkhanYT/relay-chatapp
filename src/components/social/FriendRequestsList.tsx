"use client";

import { useEffect, useState } from "react";
import { Check, X, User } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { removePendingRequest } from "@/redux/features/friendSlice";
import Button from "@/components/ui/Button";

export default function FriendRequestsList() {
    const dispatch = useAppDispatch();
    const currentUser = useAppSelector((state) => state.auth.user);
    const [requests, setRequests] = useState<any[]>([]);

    // fetch requests
    useEffect(() => {
        // In real app, fetch from API
        const fetchRequests = async () => {
            const res = await fetch("/api/users/request", {
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ senderId: currentUser?.id })
            });
            const data = await res.json();
            setRequests(data);
        };
        fetchRequests();
    }, []);
    console.log(requests);


    const handleResponse = async (requestId: string, status: "ACCEPTED" | "REJECTED") => {
        try {
            const res = await fetch("/api/users/request", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requestId, status }),
            });

            if (res.ok) {
                setRequests((prev) => prev.filter((r) => r.id !== requestId));
                dispatch(removePendingRequest(requestId));
            }
        } catch (error) {
            console.error("Failed to respond", error);
        }
    };

    if (requests.length === 0) {
        return (
            <div className="p-4 text-center text-gray-500 text-sm">
                No pending requests
            </div>
        )
    }

    return (
        <div className="p-4 space-y-3">
            <h3 className="font-semibold text-gray-500 text-xs uppercase tracking-wider">Friend Requests</h3>
            {requests?.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                            <User size={16} />
                        </div>
                        <span className="font-medium text-sm">{req.sender.username}</span>
                    </div>
                    <div className="flex gap-1">
                        <Button size="sm" onClick={() => handleResponse(req.id, "ACCEPTED")} className="p-1! bg-green-500 hover:bg-green-600">
                            <Check size={14} />
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleResponse(req.id, "REJECTED")} className="p-1!">
                            <X size={14} />
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
}
