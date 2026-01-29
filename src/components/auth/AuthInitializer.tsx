"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/redux/hooks";
import { setCredentials } from "@/redux/features/authSlice";

export default function AuthInitializer() {
    const dispatch = useAppDispatch();

    useEffect(() => {
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");

        if (token && userStr) {
            try {
                const user = JSON.parse(userStr);
                dispatch(setCredentials({ user, token }));
            } catch (e) {
                console.error("Failed to parse user from local storage", e);
                localStorage.removeItem("token");
                localStorage.removeItem("user");
            }
        }
    }, [dispatch]);

    return null;
}
