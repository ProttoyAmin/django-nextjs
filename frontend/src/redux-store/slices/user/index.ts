import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { UserType } from "@/types";
import { getUserDetails } from "@/src/libs/auth/actions/user.actions";
import { RootState } from "../../store";

interface UserState {
    currentUser: UserType | null;
    targetUser: UserType | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: UserState = {
    currentUser: null,
    targetUser: null,
    isLoading: false,
    error: null,
};


export const fetchUser = createAsyncThunk<UserType>(
    'user/fetchUser',
    async (_, { rejectWithValue }) => {
        try {
            const response = await getUserDetails();
            if (response.success && response.data) {
                return response.data as UserType;
            }
            return rejectWithValue(response.errors || 'Failed to fetch user');
        } catch (err: any) {
            return rejectWithValue(err.message || 'Failed to fetch user');
        }
    }
);


export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<UserType | null>) => {
            state.currentUser = action.payload;
            state.error = null;
        },
        setTargetUser: (state, action: PayloadAction<UserType | null>) => {
            state.targetUser = action.payload;
            state.error = null;
        },
        updateUser: (state, action: PayloadAction<Partial<UserType>>) => {
            if (state.currentUser) {
                state.currentUser = { ...state.currentUser, ...action.payload };
            }
        },
        updateTargetUser: (state, action: PayloadAction<Partial<UserType>>) => {
            if (state.targetUser) {
                state.targetUser = { ...state.targetUser, ...action.payload };
            }
        },
        clearUser: (state) => {
            state.currentUser = null;
            state.error = null;
        },
        setUserLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setUserError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
        updateUserCounts: (state, action: PayloadAction<{
            follower_count?: number;
            following_count?: number;
            total_posts_count?: number;
            pending_requests_count?: number;
        }>) => {
            if (state.currentUser) {
                state.currentUser = { ...state.currentUser, ...action.payload };
            }
        },
        addUserClub: (state, action: PayloadAction<{
            club_id: string | number;
            club_name: string;
            club_slug: string;
            club_avatar?: string;
            is_public: boolean;
            is_visible: boolean;
            is_active: boolean;
            club_url: string;
            role: string;
            joined_at: string;
        }>) => {
            if (state.currentUser) {
                if (!state.currentUser.clubs) {
                    state.currentUser.clubs = [];
                }
                state.currentUser.clubs.push(action.payload);
            }
        },
    },
    extraReducers: (builder) => {
        builder.addCase(fetchUser.pending, (state) => {
            state.isLoading = true;
        })
        builder.addCase(fetchUser.fulfilled, (state, action) => {
            state.isLoading = false;
            state.currentUser = action.payload;
        })
        builder.addCase(fetchUser.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload as string;
        })
    }
});

export const {
    setUser,
    setTargetUser,
    updateUser,
    updateTargetUser,
    clearUser,
    setUserLoading,
    setUserError,
    updateUserCounts,
    addUserClub
} = userSlice.actions;

export default userSlice.reducer;