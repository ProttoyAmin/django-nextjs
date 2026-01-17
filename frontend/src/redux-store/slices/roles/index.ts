import { assignRole, createRole, deleteRole, getRoles } from "@/src/libs/auth/actions/clubs.actions";
import { getUserRoles } from "@/src/libs/auth/actions/user.actions";
import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";

export interface RoleType {
    id: number | string;
    name: string;
    color: string;
    user_count: number;
    is_default: boolean;
    permissions: {
        can_manage_posts: boolean;
        can_manage_members: boolean;
        can_manage_roles: boolean;
        can_manage_events: boolean;
        can_manage_settings: boolean;
    }
}


export interface ClubRoleType {
    club_id: string | number;
    club_name: string;
    total_roles: number;
    roles: RoleType[]
}

export interface UserRoleType {
    club_id: string | number;
    club_name: string;
    user_id: string | number;
    username: string;
    is_member: boolean;
    joined_at: string;
    roles: RoleType[]
}

interface RolesState {
    clubRoles: RoleType[];
    fetched: boolean;
    userRoles: Record<string, RoleType[]>
    loading: boolean
    error: string | null
}

const initialState: RolesState = {
    clubRoles: [],
    fetched: false,
    userRoles: {},
    loading: false,
    error: null
}


export const fetchUserRolesThunk = createAsyncThunk<
    { key: string; roles: RoleType[]; fromCache: boolean },
    { clubId: string; userId: number | string }
>(
    "roles/fetchUserRolesThunk",
    async ({ clubId, userId }, { getState, rejectWithValue }) => {
        const key = `${clubId}-${userId}`;
        const state: any = getState();

        if (state.roles.userRoles[key]) {
            return {
                key,
                roles: state.roles.userRoles[key],
                fromCache: true
            };
        }

        const response = await getUserRoles(clubId, userId);

        if (!response.success) return rejectWithValue(response.errors);

        const membership = response.data;
        const roles: RoleType[] = membership.roles || [];

        return {
            key,
            roles: roles,
            fromCache: false
        };
    }
);

export const fetchRolesThunk = createAsyncThunk<
    RoleType[],
    { clubId: string }
>(
    "roles/fetchRolesThunk",
    async ({ clubId }, { getState, rejectWithValue }) => {
        const response = await getRoles(clubId);

        if (!response.success) return rejectWithValue(response.errors);

        return response.data.roles;
    }
)

export const createRoleThunk = createAsyncThunk<
    RoleType,
    { clubId: string; data: any }
>(
    "roles/createRole",
    async ({ clubId, data }, { rejectWithValue }) => {
        const response = await createRole(clubId, data);

        if (!response.success) {
            return rejectWithValue(response.errors);
        }

        return response.data.role;
    }
);

// export const updateRoleThunk = createAsyncThunk<
//     RoleType,
//     { clubId: string; data: any }
// >(
//     "roles/updateRole",
//     async ({ clubId, data }, { rejectWithValue }) => {
//         const response = await updateRole(clubId, data);

//         if (!response.success) {
//             return rejectWithValue(response.errors);
//         }

//         return response.data.role;
//     }
// );

export const deleteRoleThunk = createAsyncThunk<
    ClubRoleType,
    { clubId: string; roleId: string }
>(
    "roles/deleteRole",
    async ({ clubId, roleId }, { rejectWithValue }) => {
        const response = await deleteRole(clubId, roleId);
        console.log('response', response)

        if (!response.success) {
            return rejectWithValue(response.errors);
        }


        return response.data.role;
    }
);

export const assignRoleThunk = createAsyncThunk<
    {
        key: string;
        roles: RoleType[]; // Return updated roles array for the user
        userId: string;
        operation: 'assign' | 'remove';
    },
    { clubId: string; userId: string; data: any; operation?: 'assign' | 'remove' }
>(
    "roles/assignRole",
    async ({ clubId, userId, data, operation = 'assign' }, { rejectWithValue }) => {
        const response = await assignRole(clubId, userId, data);

        if (!response.success) {
            return rejectWithValue(response.errors);
        }

        const key = `${clubId}-${userId}`;
        const updatedRoles = response.data.roles || [response.data.role];

        return {
            key,
            roles: updatedRoles,
            userId,
            operation
        };
    }
);

const rolesSlice = createSlice({
    name: 'roles',
    initialState,
    reducers: {
        setRoles: (state, action: PayloadAction<RoleType[]>) => {
            state.clubRoles = action.payload;
            state.fetched = true;
        },
        setUserRoles: (state, action: PayloadAction<{ key: string, roles: RoleType[] }>) => {
            const { key, roles } = action.payload
            state.userRoles[key] = roles
        },
        clearUserRoles(state, action: PayloadAction<{ key: string }>) {
            delete state.userRoles[action.payload.key];
        },
        clearAllRoles(state) {
            state.clubRoles = []
            state.fetched = false
            state.userRoles = {}
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUserRolesThunk.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchUserRolesThunk.fulfilled, (state, action) => {
                state.userRoles[action.payload.key] = action.payload.roles;
                state.loading = false;
            })
            .addCase(fetchUserRolesThunk.rejected, (state) => {
                state.loading = false;
            })
            // Fetch Roles
            .addCase(fetchRolesThunk.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchRolesThunk.fulfilled, (state, action) => {
                state.clubRoles = action.payload;
                state.fetched = true;
                state.loading = false;
            })
            .addCase(fetchRolesThunk.rejected, (state) => {
                state.loading = false;
            })
            .addCase(assignRoleThunk.pending, (state) => {
                state.loading = true;
            })
            .addCase(assignRoleThunk.fulfilled, (state, action) => {
                const { key, roles, operation } = action.payload;
                state.userRoles[key] = roles;
                state.loading = false;
            })
            .addCase(assignRoleThunk.rejected, (state) => {
                state.loading = false;
            })
            .addCase(deleteRoleThunk.pending, (state) => {
                state.loading = true;
            })
            .addCase(deleteRoleThunk.fulfilled, (state, action) => {
                const { roleId } = action.meta.arg;
                state.clubRoles = state.clubRoles.filter(role => role.id !== roleId);
                state.loading = false;
            })
            .addCase(deleteRoleThunk.rejected, (state) => {
                state.loading = false;
            });


        builder
            .addCase(createRoleThunk.pending, (state) => {
                state.loading = true;
            })
            .addCase(createRoleThunk.fulfilled, (state, action) => {
                state.clubRoles.push(action.payload);
                state.loading = false;
            })
            .addCase(createRoleThunk.rejected, (state) => {
                state.loading = false;
            });
    }
})

export const { setRoles, setUserRoles, clearUserRoles, clearAllRoles } = rolesSlice.actions;
export default rolesSlice.reducer;