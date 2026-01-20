import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Institute } from "@/src/types/institute";
import { getInstitutes } from "@/src/libs/auth/actions/institute.action";

interface InstituteState {
    institutes: Institute[];
    loading: boolean;
    error: string | null;
}

const initialState: InstituteState = {
    institutes: [],
    loading: false,
    error: null,
};

export const fetchInstitutes = createAsyncThunk(
    "institute/fetchInstitutes",
    async (query?: string) => {
        try {
            const response = await getInstitutes(query);
            return response;
        } catch (error: any) {
            return {
                success: false,
                errors: { detail: error.message || "Failed to get institutes" }
            };
        }
    }
);

const instituteSlice = createSlice({
    name: "institute",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchInstitutes.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchInstitutes.fulfilled, (state, action) => {
                state.loading = false;
                state.institutes = action.payload;
            })
            .addCase(fetchInstitutes.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || "Failed to fetch institutes";
            });
    },
});

export const { } = instituteSlice.actions;

export default instituteSlice.reducer;
