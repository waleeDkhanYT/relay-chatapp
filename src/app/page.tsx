"use client";

import { useState, useEffect } from "react";
import { UserPlus, MessageSquare, LogOut } from "lucide-react";
import { useAppDispatch } from "@/redux/hooks";
import { toggleSearchModal } from "@/redux/features/uiSlice";
import { logout } from "@/redux/features/authSlice";
import { useRouter } from "next/navigation";
import UserSearchModal from "@/components/social/UserSearchModal";
import FriendRequestsList from "@/components/social/FriendRequestsList";
import Button from "@/components/ui/Button";
import ChatList from "@/components/chat/ChatList";
import ChatWindow from "@/components/chat/ChatWindow";
import SocketManager from "@/components/chat/SocketManager";

export default function Home() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'chats' | 'contacts'>('chats');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Delete cookie via API or just let middleware handle it next request (client-side cookie delete is hard without library)
    // Best to call an API to logout to clear cookie
    document.cookie = 'token=; Max-Age=0; path=/;';
    router.push('/login');
  };

  if (!mounted) return null; // Avoid hydration mismatch

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-black text-gray-900 dark:text-gray-100 font-sans">
      <SocketManager />
      {/* Sidebar */}
      <aside className="w-80 border-r border-gray-200 dark:border-gray-800 flex flex-col bg-white dark:bg-gray-900">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h1 className="text-xl font-bold bg-linear-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            Relay
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => dispatch(toggleSearchModal())}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <UserPlus size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => handleLogout()}
              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut size={20} className="text-gray-600 dark:text-gray-400 hover:text-red-500" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex p-2 gap-2">
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'chats'
              ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30'
              : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
          >
            Chats
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'contacts'
              ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30'
              : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
          >
            Contacts
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'contacts' && <FriendRequestsList />}
          {activeTab === 'chats' && <ChatList />}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-gray-50 dark:bg-black/50">
        <ChatWindow />
      </main>

      <UserSearchModal />
    </div>
  );
}