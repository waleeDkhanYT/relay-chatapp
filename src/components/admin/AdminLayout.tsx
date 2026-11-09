"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    MessageSquare,
    MessagesSquare,
    UserCheck,
    LogOut,
    Menu,
    X,
    Shield,
    ArrowUpRight,
    ExternalLink
} from "lucide-react";

interface AdminLayoutProps {
    children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [adminUser, setAdminUser] = useState<any>(null);

    useEffect(() => {
        try {
            const token = localStorage.getItem("token");
            const stored = localStorage.getItem("user");
            if (!token) {
                window.location.href = "/admin/login";
                return;
            }
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.role !== "ADMIN" && parsed.email !== "admin@relayapp.com") {
                    window.location.href = "/admin/login";
                    return;
                }
                setAdminUser(parsed);
            }
        } catch (e) {
            console.error("Error reading admin credentials:", e);
        }
    }, []);

    const handleLogout = async () => {
        try {
            await fetch("/api/admin/logout", {
                method: "POST",
                credentials: "include"
            });
        } catch (e) {
            console.error("Logout request failed:", e);
        } finally {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            document.cookie = "token=; Max-Age=0; path=/;";
            window.location.href = "/admin/login";
        }
    };

    const navItems = [
        { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { label: "Users", href: "/admin/users", icon: Users },
        { label: "Conversations", href: "/admin/conversations", icon: MessagesSquare },
        { label: "Messages", href: "/admin/messages", icon: MessageSquare },
        { label: "Friend Requests", href: "/admin/requests", icon: UserCheck },
    ];

    return (
        <div className="h-screen w-full bg-gray-950 text-gray-100 flex overflow-hidden antialiased selection:bg-blue-600/30">
            {/* Desktop Fixed Sidebar - Permanently full height & fixed width */}
            <aside className="hidden md:flex w-72 h-screen flex-col shrink-0 bg-gray-900 border-r border-gray-800 z-30 select-none">
                {/* Brand / Logo */}
                <div className="p-6 shrink-0 border-b border-gray-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 ring-1 ring-white/10">
                            <Shield size={22} />
                        </div>
                        <div>
                            <h1 className="font-black text-xl tracking-tight text-white flex items-center gap-1.5">
                                Relay
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-widest">
                                    Admin
                                </span>
                            </h1>
                            <p className="text-xs text-gray-500 font-medium">Control Center</p>
                        </div>
                    </div>
                </div>

                {/* Navigation Links with independent scroll */}
                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                    <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Management
                    </p>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive =
                            pathname === item.href ||
                            (item.href !== "/admin" && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                                    isActive
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold"
                                        : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60"
                                }`}
                            >
                                <Icon size={18} className={isActive ? "text-white" : "text-gray-400"} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}

                    <div className="pt-4 mt-4 border-t border-gray-800/60">
                        <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            App Switcher
                        </p>
                        <Link
                            href="/chat"
                            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800/60 transition-colors group"
                        >
                            <span className="flex items-center gap-3">
                                <MessageSquare size={18} className="text-gray-400 group-hover:text-blue-400" />
                                <span>Open Chat App</span>
                            </span>
                            <ExternalLink size={14} className="opacity-60 group-hover:opacity-100" />
                        </Link>
                    </div>
                </nav>

                {/* Footer / Current Admin Card */}
                <div className="p-4 shrink-0 border-t border-gray-800 bg-gray-900/50">
                    <div className="flex items-center justify-between p-2.5 rounded-2xl bg-gray-800/50 border border-gray-800">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-linear-to-tr from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs">
                                {adminUser?.username?.[0]?.toUpperCase() || "A"}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate">
                                    {adminUser?.fullName || adminUser?.username || "Administrator"}
                                </p>
                                <p className="text-[10px] text-gray-400 truncate">
                                    {adminUser?.email || "admin@relayapp.com"}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors shrink-0"
                            title="Sign out of Admin"
                            aria-label="Sign out"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Backdrop */}
            {isMobileMenuOpen && (
                <div
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 md:hidden"
                />
            )}

            {/* Mobile Drawer */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-72 h-screen bg-gray-900 border-r border-gray-800 flex flex-col md:hidden transition-transform duration-300 ease-in-out ${
                    isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                {/* Mobile Drawer Header */}
                <div className="p-6 shrink-0 border-b border-gray-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 ring-1 ring-white/10">
                            <Shield size={22} />
                        </div>
                        <div>
                            <h1 className="font-black text-xl tracking-tight text-white flex items-center gap-1.5">
                                Relay
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-widest">
                                    Admin
                                </span>
                            </h1>
                            <p className="text-xs text-gray-500 font-medium">Control Center</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Mobile Navigation Links */}
                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                    <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Management
                    </p>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive =
                            pathname === item.href ||
                            (item.href !== "/admin" && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                                    isActive
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold"
                                        : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/60"
                                }`}
                            >
                                <Icon size={18} className={isActive ? "text-white" : "text-gray-400"} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}

                    <div className="pt-4 mt-4 border-t border-gray-800/60">
                        <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            App Switcher
                        </p>
                        <Link
                            href="/chat"
                            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800/60 transition-colors group"
                        >
                            <span className="flex items-center gap-3">
                                <MessageSquare size={18} className="text-gray-400 group-hover:text-blue-400" />
                                <span>Open Chat App</span>
                            </span>
                            <ExternalLink size={14} className="opacity-60 group-hover:opacity-100" />
                        </Link>
                    </div>
                </nav>

                {/* Mobile Drawer Footer */}
                <div className="p-4 shrink-0 border-t border-gray-800 bg-gray-900/50">
                    <div className="flex items-center justify-between p-2.5 rounded-2xl bg-gray-800/50 border border-gray-800">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-linear-to-tr from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs">
                                {adminUser?.username?.[0]?.toUpperCase() || "A"}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate">
                                    {adminUser?.fullName || adminUser?.username || "Administrator"}
                                </p>
                                <p className="text-[10px] text-gray-400 truncate">
                                    {adminUser?.email || "admin@relayapp.com"}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors shrink-0"
                            title="Sign out of Admin"
                            aria-label="Sign out"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Viewport */}
            <div className="flex-1 h-screen flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header Bar */}
                <header className="md:hidden flex items-center justify-between p-4 bg-gray-900 border-b border-gray-800 shrink-0 z-20">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                            <Shield size={18} />
                        </div>
                        <span className="font-black text-lg tracking-tight bg-linear-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            Relay Admin
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href="/chat"
                            className="p-2 text-xs font-semibold text-gray-400 hover:text-white flex items-center gap-1 rounded-lg bg-gray-800"
                            title="Back to Chat App"
                        >
                            <span>Chat</span>
                            <ArrowUpRight size={14} />
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-800 transition-colors"
                            title="Sign out of Admin"
                            aria-label="Sign out"
                        >
                            <LogOut size={16} />
                        </button>
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
                            aria-label="Toggle Navigation"
                        >
                            <Menu size={20} />
                        </button>
                    </div>
                </header>

                {/* Independent Scrollable Content Area */}
                <main className="flex-1 overflow-y-auto min-w-0">
                    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 pb-12">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
