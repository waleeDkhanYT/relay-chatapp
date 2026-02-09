import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UiState {
    isSearchModalOpen: boolean
    isFriendRequestModalOpen: boolean
    profileModal: {
        isOpen: boolean
        userId?: string
    }
}

const initialState: UiState = {
    isSearchModalOpen: false,
    isFriendRequestModalOpen: false,
    profileModal: {
        isOpen: false
    }
}

export const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        toggleSearchModal: (state) => {
            state.isSearchModalOpen = !state.isSearchModalOpen
        },
        toggleFriendRequestModal: (state) => {
            state.isFriendRequestModalOpen = !state.isFriendRequestModalOpen
        },
        openProfileModal: (state, action: PayloadAction<string | undefined>) => {
            state.profileModal = {
                isOpen: true,
                userId: action.payload
            }
        },
        closeProfileModal: (state) => {
            state.profileModal.isOpen = false
        }
    },
})

export const { toggleSearchModal, toggleFriendRequestModal, openProfileModal, closeProfileModal } = uiSlice.actions
export default uiSlice.reducer
