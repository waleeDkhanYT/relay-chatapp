import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface Message {
    id: string
    content: string
    senderId: string
    conversationId: string
    createdAt: string
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
        userId: string
        user: {
            id: string
            username: string
            avatar: string | null
        }
    }[]
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
            // Clear current messages to prevent stale data while switching
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

            // 1. Sidebar Update: Always update the last message and move chat to top
            const convIndex = state.conversations.findIndex(c => c.id === conversationId);
            if (convIndex !== -1) {
                state.conversations[convIndex].lastMessage = action.payload;
                // Move updated conversation to the top
                const [conv] = state.conversations.splice(convIndex, 1);
                state.conversations.unshift(conv);
            }

            // 2. Active Chat Update: Only push to message list if it belongs to the active conversation
            if (state.activeConversationId === conversationId) {
                // Prevent duplicates (e.g. from both optimistic and socket events)
                const exists = state.messages.some(m => m.id === id);
                if (!exists) {
                    state.messages.push(action.payload);
                }
            }

            // 3. Unread Count Update: Increment if message is NOT for the active conversation
            if (conversationId !== state.activeConversationId) {
                state.unreadCounts[conversationId] = (state.unreadCounts[conversationId] || 0) + 1;
            }
        },
        setOnlineUsers: (state, action: PayloadAction<string[]>) => {
            state.onlineUsers = action.payload
        },
        markAsRead: (state, action: PayloadAction<string>) => {
            state.unreadCounts[action.payload] = 0
        }
    },
})

export const { setActiveConversation, setConversations, setMessages, addMessage, setOnlineUsers, markAsRead, addConversation } = chatSlice.actions
export default chatSlice.reducer
