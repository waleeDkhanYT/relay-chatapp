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
}

const initialState: ChatState = {
    activeConversationId: null,
    conversations: [],
    messages: [],
    onlineUsers: [],
}

export const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        setActiveConversation: (state, action: PayloadAction<string | null>) => {
            state.activeConversationId = action.payload
        },
        setConversations: (state, action: PayloadAction<Conversation[]>) => {
            state.conversations = action.payload
        },
        setMessages: (state, action: PayloadAction<Message[]>) => {
            state.messages = action.payload
        },
        addMessage: (state, action: PayloadAction<Message>) => {
            state.messages.push(action.payload)
        },
        setOnlineUsers: (state, action: PayloadAction<string[]>) => {
            state.onlineUsers = action.payload
        }
    },
})

export const { setActiveConversation, setConversations, setMessages, addMessage, setOnlineUsers } = chatSlice.actions
export default chatSlice.reducer
