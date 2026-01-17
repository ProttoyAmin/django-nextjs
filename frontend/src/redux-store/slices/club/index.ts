import { Club } from "@/src/types/club";
import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { getClubDetail, getClubMembers, removeMember, updateClub, updateClubMedia } from "@/src/libs/auth/actions/clubs.actions";
import { RootState } from "../../store";
import { getUserClubs } from "@/src/libs/auth/actions/user.actions";
import { UserType } from "@/types";

export interface RoleDetail {
    id: string;
    name: string;
    permissions: Record<string, boolean>;
    is_default: boolean;
    color: string;
    user_count: number;
}

export interface ClubMember extends UserType {
    club_id: string;
    club_name: string;
    is_member: boolean;
    is_owner: boolean;
    user_id: number | string;
    roles: string[];
    role_details: RoleDetail[];
    role_names: string[];
    primary_role: string;
    primary_role_details: RoleDetail;
    joined_at: string;
}

export interface ClubMembersResults {
    club_id: string;
    club_name: string;
    total_members: number;
    is_member: boolean;
    is_owner: boolean;
    members: ClubMember[];
}

interface ClubMembersResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: ClubMembersResults;
}

export interface UserClubsResponse {
    clubs: Array<{
        club_id: string,
        club_name: string,
        club_slug: string,
        club_avatar: string,
        is_public: boolean,
        is_visible: boolean,
        is_active: boolean,
        club_url: string,
        role_name: string,
        role_permissions: {
            can_manage_members: boolean,
            can_manage_posts: boolean,
            can_manage_events: boolean,
            can_manage_settings: boolean
        },
        joined_at: string
    }>;
}

export interface mediaData {
    avatar?: any;
    banner?: any;
}




interface ClubsState {
    entities: Record<string, Club>;
    members: Record<string, ClubMembersResults>;
    ids: string[];
    userClubs: UserClubsResponse | null;
    currentClubId: string | null;
    isLoading: boolean;
    error: string | null;
    lastFetched: Record<string, number>; // Add this for caching
}

const initialState: ClubsState = {
    entities: {},
    members: {},
    ids: [],
    userClubs: null,
    currentClubId: null,
    isLoading: false,
    error: null,
    lastFetched: {}, // Initialize
};

export const fetchClubs = createAsyncThunk(
    'club/fetchClubs',
    async ({ user_id }: { user_id: number | string }) => {
        const response = await getUserClubs(user_id);
        if (response.success && response.data) {
            return response.data as UserClubsResponse;
        }
        throw new Error(response.errors || 'Failed to fetch clubs');
    },
    {
        condition: ({ user_id }, { getState }) => {
            const state = getState() as RootState;
            const userClubs = state.club.userClubs;
            const lastFetched = state.club.lastFetched[user_id];

            // Don't fetch if we already have data and it was fetched recently (5 minutes)
            if (userClubs?.clubs && userClubs.clubs.length > 0 && lastFetched) {
                const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
                if (lastFetched > fiveMinutesAgo) {
                    return false;
                }
            }
            return true;
        }
    }
)

export const fetchClub = createAsyncThunk(
    'club/fetchClub',
    async ({ clubId }: { clubId: string | number }) => {
        const response = await getClubDetail(clubId);
        if (response.success && response.data) {
            return response.data as Club;
        }
        throw new Error(response.errors || 'Failed to fetch club');
    },
    {
        condition: ({ clubId }, { getState }) => {
            const state = getState() as RootState;
            if (clubId && state.club.entities[clubId]) {
                return false;
            }
            return true;
        }
    }
)

export const fetchUserClubsThunk = createAsyncThunk(
    'club/fetchUserClubsThunk',
    async ({ user_id }: { user_id: number | string }) => {
        const response = await getUserClubs(user_id);
        if (response.success && response.data) {
            let clubsArray;

            if (Array.isArray(response.data)) {
                clubsArray = response.data;
            } else if (response.data.clubs && Array.isArray(response.data.clubs)) {
                clubsArray = response.data.clubs;
            } else if (response.data.results && Array.isArray(response.data.results)) {
                clubsArray = response.data.results;
            } else {
                if (response.data.club_id || response.data.id) {
                    clubsArray = [response.data];
                } else {
                    clubsArray = [];
                }
            }

            return { clubs: clubsArray };
        }
        throw new Error(response.errors || 'Failed to fetch clubs');
    },
    {
        condition: ({ user_id }, { getState }) => {
            const state = getState() as RootState;
            const userClubs = state.club.userClubs;
            const lastFetched = state.club.lastFetched[user_id];

            if (userClubs?.clubs && userClubs.clubs.length > 0 && lastFetched) {
                const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
                if (lastFetched > fiveMinutesAgo) {
                    return false;
                }
            }
            return true;
        }
    }
)


export const fetchClubMembersThunk = createAsyncThunk(
    'club/fetchClubMembersThunk',
    async ({ clubId, role }: { clubId: string | number, role?: string }) => {
        const response = await getClubMembers(clubId, role);
        if (response.success && response.data) {
            return response.data as ClubMembersResponse;
        }
        throw new Error(response.errors || 'Failed to fetch members');
    },
    {
        condition: ({ clubId }, { getState }) => {
            const state = getState() as RootState;
            // Note: In a real app, use RootState. Casting for now as per minimal change requirement.
            if (clubId && state.club.members[clubId]) {
                return false;
            }
            return true;
        }
    }
);

export const removeMemberFromClubThunk = createAsyncThunk(
    'club/removeMemberFromClub',
    async ({ clubId, memberId }: { clubId: string | number, memberId: string | number }, { rejectWithValue }) => {
        const response = await removeMember(clubId, memberId);
        if (response.success) {
            return { clubId, memberId };
        }
        return rejectWithValue(response.errors);
    }
);

export const postClubMediaThunk = createAsyncThunk(
    'club/postClubMedia',
    async ({ clubId, avatar, banner, type }: { clubId: string | number, avatar?: File, banner?: File, type?: 'remove' | 'update' }) => {
        const response = await updateClubMedia(clubId, avatar, banner, type);
        if (response.success && response.data) {
            return response.data as Club;
        }
        throw new Error(response.errors || 'Failed to update media');
    }
);

// export const removeClubMediaThunk = createAsyncThunk(
//     'club/removeClubMedia',
//     async ({ clubId, mediaType }: { clubId: string | number, mediaType: 'avatar' | 'banner' }) => {
//         const response = await removeClubMedia(clubId, mediaType);
//         console.log('Club Media Removed', response)
//         if (response.success && response.data) {
//             return response.data as Club;
//         }
//         throw new Error(response.errors || 'Failed to remove media');
//     }
// );

export const joinClubThunk = createAsyncThunk(
    'club/joinClub',
    async ({ clubId }: { clubId: string | number }) => {
        const response = await import("@/src/libs/auth/actions/clubs.actions").then(mod => mod.joinClub(clubId));
        if (response.success) {
            return { clubId, data: response.data };
        }
        throw new Error(response.errors || 'Failed to join club');
    }
);

export const leaveClubThunk = createAsyncThunk(
    'club/leaveClub',
    async ({ clubId }: { clubId: string | number }) => {
        const response = await import("@/src/libs/auth/actions/clubs.actions").then(mod => mod.leaveClub(clubId));
        if (response.success) {
            return { clubId, data: response.data };
        }
        throw new Error(response.errors || 'Failed to leave club');
    }
);

export const updateClubDetailsThunk = createAsyncThunk(
    'club/updateClubDetails',
    async ({ clubId, data }: { clubId: string | number, data: Partial<Club> }) => {
        const response = await updateClub(clubId, data)
        console.log('Club updated', response)
        if (response.success && response.data) {
            return response.data as Club;
        }
        throw new Error(response.errors || 'Failed to update club details');
    }
);

const clubSlice = createSlice({
    name: "club",
    initialState,
    reducers: {
        setClub: (state, action: PayloadAction<Club>) => {
            const c = action.payload

            state.entities[c.id as string] = c
            if (!state.ids.includes(c.id as string)) state.ids.push(c.id as string);
            state.error = null;
        },
        setCurrentClubId: (state, action: PayloadAction<string | null>) => {
            state.currentClubId = action.payload;
        },
        clearClub: (state, action: PayloadAction<string>) => {
            delete state.entities[action.payload];
            delete state.members[action.payload];
            state.ids = state.ids.filter(id => id !== action.payload);
            if (state.currentClubId === action.payload) state.currentClubId = null;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
        removeMemberFromClub: (state, action: PayloadAction<{ clubId: string; memberId: number }>) => {
            const { clubId, memberId } = action.payload;
            if (state.members[clubId]) {
                state.members[clubId].members = state.members[clubId].members.filter(m => m.id !== memberId);
                state.members[clubId].total_members -= 1;
            }
        },
        updateMemberInStore: (state, action: PayloadAction<{ clubId: string; member: ClubMember }>) => {
            const { clubId, member } = action.payload;
            if (state.members[clubId]) {
                const index = state.members[clubId].members.findIndex(m => m.id === member.id);
                if (index !== -1) {
                    state.members[clubId].members[index] = { ...state.members[clubId].members[index], ...member };
                } else {
                    state.members[clubId].members.push(member);
                    state.members[clubId].total_members += 1;
                }
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchClubMembersThunk.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchClubMembersThunk.fulfilled, (state, action) => {
                state.isLoading = false;
                const results = action.payload.results;
                if (results && results.club_id) {
                    state.members[results.club_id] = results;
                }
            })
            .addCase(fetchClubMembersThunk.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Failed to fetch club members';
            });

        builder
            .addCase(fetchUserClubsThunk.pending, (state) => {
                state.isLoading = true
                state.error = null
            })
            .addCase(fetchUserClubsThunk.fulfilled, (state, action) => {
                state.isLoading = false;
                const clubsData = action.payload;
                state.userClubs = clubsData;
                // Store timestamp for caching
                state.lastFetched[action.meta.arg.user_id] = Date.now();
            })
            .addCase(fetchUserClubsThunk.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Failed to fetch user clubs';
            });


        builder
            .addCase(postClubMediaThunk.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(postClubMediaThunk.fulfilled, (state, action) => {
                state.isLoading = false;
                const club = action.payload;
                if (club && club.id) {
                    state.entities[club.id as string] = club;
                    if (!state.ids.includes(club.id as string)) state.ids.push(club.id as string);
                }
            })
            .addCase(postClubMediaThunk.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Failed to post club media';
            });
        builder.addCase(fetchClub.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        })
            .addCase(fetchClub.fulfilled, (state, action) => {
                state.isLoading = false;
                const club = action.payload;
                if (club && club.id) {
                    state.entities[club.id as string] = club;
                    if (!state.ids.includes(club.id as string)) state.ids.push(club.id as string);
                }
            })
            .addCase(fetchClub.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Failed to fetch club';
            });

        builder.addCase(joinClubThunk.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        })
            .addCase(joinClubThunk.fulfilled, (state, action) => {
                state.isLoading = false;
                const { clubId } = action.payload;
                if (state.members[clubId as string]) {
                    state.members[clubId as string].is_member = true;
                }
                if (state.entities[clubId as string]) {
                    state.entities[clubId as string].is_member = true;
                }
            })
            .addCase(joinClubThunk.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Failed to join club';
            });

        // Leave Club
        builder.addCase(leaveClubThunk.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        })
            .addCase(leaveClubThunk.fulfilled, (state, action) => {
                state.isLoading = false;
                const { clubId } = action.payload;
                if (state.members[clubId as string]) {
                    state.members[clubId as string].is_member = false;
                }
                if (state.entities[clubId as string]) {
                    state.entities[clubId as string].is_member = false;
                }
            })
            .addCase(leaveClubThunk.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Failed to leave club';
            });

        // Update Club Details
        builder.addCase(updateClubDetailsThunk.pending, (state) => {
            state.isLoading = true;
            state.error = null;
        })
            .addCase(updateClubDetailsThunk.fulfilled, (state, action) => {
                state.isLoading = false;
                const club = action.payload;
                if (club && club.id) {
                    state.entities[club.id as string] = club;
                }
            })
            .addCase(updateClubDetailsThunk.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Failed to update club details';
            });
    }
});

export const {
    setClub,
    setCurrentClubId,
    setLoading,
    setError,
    clearClub,
    removeMemberFromClub,
    updateMemberInStore
} = clubSlice.actions;
export default clubSlice.reducer;