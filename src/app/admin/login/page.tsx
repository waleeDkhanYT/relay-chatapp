"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, Lock, Mail, ArrowRight, KeyRound, AlertCircle, Sparkles } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Authentication failed");
            }

            // Save credentials
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            window.location.href = "/admin";
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fillCredentials = () => {
        setEmail("admin@relayapp.com");
        setPassword("AdminSn7dF4LMKBjT8Mt");
        setError("");
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background glowing effects */}
            <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md bg-gray-900/90 border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10"
            >
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-linear-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/25 ring-1 ring-white/10">
                        <Shield size={30} />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight bg-linear-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                        Admin Portal
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-400 mt-1">
                        Sign in to manage users, chats, messages, and platform analytics
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <Input
                            label="Admin Email"
                            type="email"
                            placeholder="admin@relayapp.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="bg-gray-950 border-gray-800 focus:border-blue-500 text-sm"
                        />
                    </div>

                    <div>
                        <Input
                            label="Password"
                            type="password"
                            placeholder="••••••••••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="bg-gray-950 border-gray-800 focus:border-blue-500 text-sm"
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs">
                            <AlertCircle size={16} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <Button
                        type="submit"
                        isLoading={loading}
                        className="w-full h-12 rounded-xl text-base font-bold bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
                    >
                        Sign In as Admin <ArrowRight size={18} />
                    </Button>
                </form>

                {/* Footer link to public app */}
                <div className="mt-6 pt-4 border-t border-gray-800 text-center">
                    <button
                        onClick={() => router.push("/login")}
                        className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                    >
                        Not an admin? Return to User Sign In
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
