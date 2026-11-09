"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { UserPlus, LogOut, User, Shield } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { toggleSearchModal, openProfileModal, closeProfileModal } from "@/redux/features/uiSlice";
import { logout } from "@/redux/features/authSlice";
import { useRouter } from "next/navigation";
import UserSearchModal from "@/components/social/UserSearchModal";
import ContactsList from "@/components/social/ContactsList";
import ChatList from "@/components/chat/ChatList";
import ChatWindow from "@/components/chat/ChatWindow";
import SocketManager from "@/components/chat/SocketManager";
import ProfileModal from "@/components/social/ProfileModal";

export default function ChatPage() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'chats' | 'contacts'>('chats');
    const [mounted, setMounted] = useState(false);
    const { profileModal } = useAppSelector((state) => state.ui);
    const currentUser = useAppSelector((state) => state.auth.user);
    const activeConversationId = useAppSelector((state) => state.chat.activeConversationId);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
        } catch (e) {
            console.error('Logout error:', e);
        } finally {
            dispatch(logout());
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            document.cookie = 'token=; Max-Age=0; path=/;';
            window.location.href = '/login';
        }
    };

    if (!mounted) return null;

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-black text-gray-900 dark:text-gray-100 font-sans overflow-hidden">
            <SocketManager />

            {/* Sidebar: Full width on mobile when no conversation is active; 80 (320px) on desktop */}
            <aside
                className={`w-full md:w-80 md:min-w-80 border-r border-gray-200 dark:border-gray-800 flex flex-col bg-white dark:bg-gray-900 shadow-xl z-10 h-full ${
                    activeConversationId ? "hidden md:flex" : "flex"
                }`}
            >
                {/* Header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <h1
                        onClick={() => dispatch(openProfileModal())}
                        className="text-2xl font-black bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity tracking-tight"
                    >
                        Relay
                    </h1>
                    <div className="flex items-center gap-1">
                        {(currentUser?.role === 'ADMIN' || currentUser?.email === 'admin@relayapp.com') && (
                            <Link
                                href="/admin"
                                className="p-2.5 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl transition-all active:scale-95"
                                title="Admin Control Center"
                                aria-label="Admin Control Center"
                            >
                                <Shield size={19} />
                            </Link>
                        )}
                        <button
                            onClick={() => dispatch(toggleSearchModal())}
                            className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all active:scale-95"
                            title="Search Users"
                            aria-label="Search Users"
                        >
                            <UserPlus size={19} className="text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                            onClick={handleLogout}
                            className="p-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all active:scale-95 group"
                            title="Logout"
                            aria-label="Logout"
                        >
                            <LogOut size={19} className="text-gray-600 dark:text-gray-400 group-hover:text-red-500" />
                        </button>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex p-1.5 gap-1.5 bg-gray-50/80 dark:bg-gray-800/30 m-2 rounded-2xl border border-gray-100 dark:border-gray-800/50">
                    <button
                        onClick={() => setActiveTab('chats')}
                        className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 ${
                            activeTab === 'chats'
                                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        Chats
                    </button>
                    <button
                        onClick={() => setActiveTab('contacts')}
                        className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 ${
                            activeTab === 'contacts'
                                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-xs'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        Contacts
                    </button>
                </div>

                {/* List Content */}
                <div className="flex-1 overflow-y-auto px-1 sm:px-2">
                    {activeTab === 'contacts' && <ContactsList onTabSwitch={() => setActiveTab('chats')} />}
                    {activeTab === 'chats' && <ChatList />}
                </div>

                {/* Bottom User Profile Section */}
                <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/30">
                    <button
                        onClick={() => dispatch(openProfileModal())}
                        className="flex items-center gap-3 w-full p-2 rounded-2xl hover:bg-white dark:hover:bg-gray-800 transition-all group border border-transparent hover:border-gray-200 dark:hover:border-gray-700 shadow-xs"
                    >
                        <div className="relative shrink-0">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-linear-to-tr from-blue-500 to-purple-500 p-0.5">
                                <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                                    {currentUser?.avatar ? (
                                        <img src={currentUser.avatar} alt="Me" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={20} className="text-blue-500" />
                                    )}
                                </div>
                            </div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                            <p className="text-sm font-bold truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {currentUser?.fullName || currentUser?.username || "My Profile"}
                            </p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">View Profile</p>
                        </div>
                    </button>
                </div>
            </aside>

            {/* Main Chat Area: Full width on mobile when a chat is open; takes remaining space on desktop */}
            <main
                className={`flex-1 flex flex-col bg-white dark:bg-black relative h-full overflow-hidden ${
                    activeConversationId ? "flex" : "hidden md:flex"
                }`}
            >
                <ChatWindow />
            </main>

            {/* Global Modals */}
            <UserSearchModal />
            <ProfileModal
                isOpen={profileModal.isOpen}
                onClose={() => dispatch(closeProfileModal())}
                userId={profileModal.userId}
            />
        </div>
    );
}
