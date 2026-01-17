import { UserType } from "@/types";
import { createSlice } from "@reduxjs/toolkit";

interface AuthState {
    isAuthenticated: boolean;
    user: UserType | null;
}

const initialState: AuthState = {
    isAuthenticated: false,
    user: null,
};

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setAuthenticated: (state, action) => {
            state.isAuthenticated = action.payload;
            state.user = action.payload;
        },
        login: (state) => {
            state.isAuthenticated = true;
        },
        logout: (state) => {
            state.isAuthenticated = false;
            state.user = null;
        },
    }
});

export const { setAuthenticated, login, logout } = authSlice.actions;
export default authSlice.reducer;
