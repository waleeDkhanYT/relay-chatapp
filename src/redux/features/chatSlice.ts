import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface Message {
    id: string
    content: string
    senderId: string
    conversationId: string
    createdAt: string
    readBy: string[]
    isDeleted: boolean
    deletedForUserIds: string[]
    sender?: {
        id: string
        username: string
    }
}

interface Conversation {
    id: string
    type: 'DIRECT' | 'GROUP'
    name: string | null
    members: {
        id: string
        userId: string
        user: {
            id: string
            username: string
            avatar: string | null
            fullName: string | null
            age: number | null
            createdAt: string
        }
    }[]
    messages: Message[]
    lastMessage?: Message
}

interface ChatState {
    activeConversationId: string | null
    conversations: Conversation[]
    messages: Message[]
    onlineUsers: string[]
    unreadCounts: Record<string, number>
}

const initialState: ChatState = {
    activeConversationId: null,
    conversations: [],
    messages: [],
    onlineUsers: [],
    unreadCounts: {},
}

export const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        setActiveConversation: (state, action: PayloadAction<string | null>) => {
            state.activeConversationId = action.payload
            state.unreadCounts[action.payload || ''] = 0
            state.messages = []
        },
        setConversations: (state, action: PayloadAction<Conversation[]>) => {
            state.conversations = action.payload
        },
        setMessages: (state, action: PayloadAction<Message[]>) => {
            state.messages = action.payload
        },
        addConversation: (state, action: PayloadAction<Conversation>) => {
            const exists = state.conversations.some(c => c.id === action.payload.id);
            if (!exists) {
                state.conversations.unshift(action.payload);
            }
        },
        addMessage: (state, action: PayloadAction<Message>) => {
            const { conversationId, id } = action.payload;

            const convIndex = state.conversations.findIndex(c => c.id === conversationId);
            if (convIndex !== -1) {
                state.conversations[convIndex].lastMessage = action.payload;
                const [conv] = state.conversations.splice(convIndex, 1);
                state.conversations.unshift(conv);
            }

            if (state.activeConversationId === conversationId) {
                const exists = state.messages.some(m => m.id === id);
                if (!exists) {
                    state.messages.push(action.payload);
                }
            }

            if (conversationId !== state.activeConversationId) {
                state.unreadCounts[conversationId] = (state.unreadCounts[conversationId] || 0) + 1;
            }
        },
        setOnlineUsers: (state, action: PayloadAction<string[]>) => {
            state.onlineUsers = action.payload
        },
        markMessagesAsRead: (state, action: PayloadAction<{ conversationId: string, readerId: string, messageIds: string[] }>) => {
            const { conversationId, readerId, messageIds } = action.payload;

            // Update messages in active view
            if (state.activeConversationId === conversationId) {
                state.messages.forEach(msg => {
                    if (messageIds.includes(msg.id) && !msg.readBy.includes(readerId)) {
                        msg.readBy.push(readerId);
                    }
                });
            }

            // Update lastMessage in conversations list if applicable
            const conv = state.conversations.find(c => c.id === conversationId);
            if (conv && conv.lastMessage && messageIds.includes(conv.lastMessage.id)) {
                if (!conv.lastMessage.readBy.includes(readerId)) {
                    conv.lastMessage.readBy.push(readerId);
                }
            }

            // If I am the reader, reset unread count
            // (Only if logic requires it, but usually standard markAsRead handles this)
        },
        messageDeleted: (state, action: PayloadAction<{ messageId: string, conversationId: string, deleteForEveryone: boolean, userId: string }>) => {
            const { messageId, conversationId, deleteForEveryone, userId } = action.payload;

            // Helper to update a message object
            const updateMsg = (msg: Message) => {
                if (deleteForEveryone) {
                    msg.isDeleted = true;
                } else {
                    if (!msg.deletedForUserIds.includes(userId)) {
                        msg.deletedForUserIds.push(userId);
                    }
                }
            };

            // Update in messages list
            if (state.activeConversationId === conversationId) {
                const msg = state.messages.find(m => m.id === messageId);
                if (msg) updateMsg(msg);
            }

            // Update in conversations list (lastMessage)
            const conv = state.conversations.find(c => c.id === conversationId);
            if (conv && conv.lastMessage?.id === messageId) {
                updateMsg(conv.lastMessage);
            }
        },
        markAsRead: (state, action: PayloadAction<string>) => {
            // Reset unread count for local user
            state.unreadCounts[action.payload] = 0
        }
    },
})

export const { setActiveConversation, setConversations, setMessages, addMessage, setOnlineUsers, markAsRead, addConversation, markMessagesAsRead, messageDeleted } = chatSlice.actions
export default chatSlice.reducer
