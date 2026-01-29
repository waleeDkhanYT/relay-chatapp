import { createSlice } from '@reduxjs/toolkit'

interface UiState {
    isSearchModalOpen: boolean
    isFriendRequestModalOpen: boolean
}

const initialState: UiState = {
    isSearchModalOpen: false,
    isFriendRequestModalOpen: false,
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
    },
})

export const { toggleSearchModal, toggleFriendRequestModal } = uiSlice.actions
export default uiSlice.reducer
