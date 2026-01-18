import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { NotificationPaginatedData } from "@/src/types/notification";
import { getNotifications, markAllAsRead } from "@/src/libs/auth/actions/notification.actions";

interface NotificationState {
    notifications: NotificationPaginatedData | null;
    loading: boolean;
    error: string | null;
}

const initialState: NotificationState = {
    notifications: null,
    loading: false,
    error: null
}

export const fetchNotifications = createAsyncThunk(
    "notifications/fetchNotifications",
    async (verb?: string) => {
        try {
            const response = await getNotifications(verb);
            console.log('response ', response)
            return response;
        } catch (error: any) {
            return {
                success: false,
                errors: { detail: error.message || "Failed to get notifications" }
            };
        }
    }
)

export const markAllAsReadThunk = createAsyncThunk(
    "notifications/markAllAsRead",
    async () => {
        try {
            const response = await markAllAsRead();
            console.log('response ', response)
            return response;
        } catch (error: any) {
            return {
                success: false,
                errors: { detail: error.message || "Failed to mark all as read" }
            };
        }
    }
)


const notificationSlice = createSlice({
    name: "notifications",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotifications.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.loading = false;
                state.notifications = action.payload.data;
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(markAllAsReadThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(markAllAsReadThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.notifications = action.payload.data;
            })
            .addCase(markAllAsReadThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    }
})

export const { } = notificationSlice.actions;

export default notificationSlice.reducer;
