"use client";

import { useState, useEffect } from "react";
import { UserPlus, MessageSquare, LogOut, User } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { toggleSearchModal, openProfileModal, closeProfileModal } from "@/redux/features/uiSlice";
import { logout } from "@/redux/features/authSlice";
import { useRouter } from "next/navigation";
import UserSearchModal from "@/components/social/UserSearchModal";
// import FriendRequestsList from "@/components/social/FriendRequestsList";
import ContactsList from "@/components/social/ContactsList";
// import Button from "@/components/ui/Button";
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

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogout = () => {
        dispatch(logout());
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        document.cookie = 'token=; Max-Age=0; path=/;';
        router.push('/login');
    };

    if (!mounted) return null;

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-black text-gray-900 dark:text-gray-100 font-sans">
            <SocketManager />
            {/* Sidebar */}
            <aside className="w-80 border-r border-gray-200 dark:border-gray-800 flex flex-col bg-white dark:bg-gray-900 shadow-xl z-10">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <h1
                        onClick={() => dispatch(openProfileModal())}
                        className="text-2xl font-black bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity tracking-tight"
                    >
                        Relay
                    </h1>
                    <div className="flex gap-1">
                        <button
                            onClick={() => dispatch(toggleSearchModal())}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all active:scale-90"
                            title="Search Users"
                        >
                            <UserPlus size={20} className="text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                            onClick={handleLogout}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all active:scale-90 group"
                            title="Logout"
                        >
                            <LogOut size={20} className="text-gray-600 dark:text-gray-400 group-hover:text-red-500" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex p-2 gap-2 bg-gray-50/50 dark:bg-gray-800/20 m-2 rounded-2xl">
                    <button
                        onClick={() => setActiveTab('chats')}
                        className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === 'chats'
                            ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        Chats
                    </button>
                    <button
                        onClick={() => setActiveTab('contacts')}
                        className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === 'contacts'
                            ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        Contacts
                    </button>
                </div>

                {/* List Content */}
                <div className="flex-1 overflow-y-auto px-2">
                    {activeTab === 'contacts' && <ContactsList onTabSwitch={() => setActiveTab('chats')} />}
                    {activeTab === 'chats' && <ChatList />}
                </div>

                {/* Main User Profile Section */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                    <button
                        onClick={() => dispatch(openProfileModal())}
                        className="flex items-center gap-3 w-full p-2 rounded-2xl hover:bg-white dark:hover:bg-gray-800 transition-all group border border-transparent hover:border-gray-200 dark:hover:border-gray-700 shadow-sm hover:shadow-md"
                    >
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-linear-to-tr from-blue-500 to-purple-500 p-0.5">
                                <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                                    {currentUser?.avatar ? (
                                        <img src={currentUser.avatar} alt="Me" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={24} className="text-blue-500" />
                                    )}
                                </div>
                            </div>
                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-sm font-bold truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {currentUser?.fullName || currentUser?.username || "My Profile"}
                            </p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">View & Edit Profile</p>
                        </div>
                    </button>
                </div>
            </aside>

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col bg-white dark:bg-black relative">
                <ChatWindow />
            </main>

            <UserSearchModal />
            <ProfileModal
                isOpen={profileModal.isOpen}
                onClose={() => dispatch(closeProfileModal())}
                userId={profileModal.userId}
            />
        </div>
    );
}
