import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface FriendRequest {
    id: string
    sender: {
        id: string
        username: string
        avatar: string | null
    }
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
}

interface FriendState {
    friends: any[] // Define Friend type properly
    pendingRequests: FriendRequest[]
    sentRequests: string[] // IDs of users we sent requests to
}

const initialState: FriendState = {
    friends: [],
    pendingRequests: [],
    sentRequests: [],
}

export const friendSlice = createSlice({
    name: 'friends',
    initialState,
    reducers: {
        setPendingRequests: (state, action: PayloadAction<FriendRequest[]>) => {
            state.pendingRequests = action.payload
        },
        addSentRequest: (state, action: PayloadAction<string>) => {
            state.sentRequests.push(action.payload)
        },
        removePendingRequest: (state, action: PayloadAction<string>) => {
            state.pendingRequests = state.pendingRequests.filter(req => req.id !== action.payload)
        }
    },
})

export const { setPendingRequests, addSentRequest, removePendingRequest } = friendSlice.actions
export default friendSlice.reducer
