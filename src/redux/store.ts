import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/authSlice';
import uiReducer from './features/uiSlice';
import friendReducer from './features/friendSlice';
import chatReducer from './features/chatSlice';

export const makeStore = () => {
    return configureStore({
        reducer: {
            auth: authReducer,
            ui: uiReducer,
            friends: friendReducer,
            chat: chatReducer,
        },
    })
}

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']