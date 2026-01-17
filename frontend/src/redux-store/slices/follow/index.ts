import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Follower } from "@/types";

interface MutualFollower {
    user_id: number;
    username: string;
    first_name: string;
    last_name: string;
    avatar: string | null;
    bio: string;
}

interface Relationship {
    total_mutual: number;
    mutual_followers: MutualFollower[];
}

interface FollowRelationship {
    userId: number;
    isFollowing: boolean;
    isFollowedBy: boolean;
    isMutual: boolean;
    followStatus: 'pending' | 'accepted' | 'blocked' | null;
    isLoading: boolean;
}

interface FollowState {
    followers: Follower[];
    followings: Follower[];
    relationships: Record<number, FollowRelationship>;
    mutualConnections: Relationship | null;
    isLoadingFollowers: boolean;
    isLoadingFollowing: boolean;
    error: string | null;
}

const initialState: FollowState = {
    followers: [],
    followings: [],
    relationships: {},
    mutualConnections: null,
    isLoadingFollowers: false,
    isLoadingFollowing: false,
    error: null,
};

export const followSlice = createSlice({
    name: 'follow',
    initialState,
    reducers: {
        setUpFollowers: (state, action: PayloadAction<Follower[]>) => {
            state.followers = action.payload;
            action.payload.forEach(follower => {
                // Only add to relationships if your_follow_status is 'accepted'
                if (follower.your_follow_status === 'accepted') {
                    if (!state.relationships[follower.user_id]) {
                        state.relationships[follower.user_id] = {
                            userId: follower.user_id,
                            isFollowing: follower.you_follow_them,
                            isFollowedBy: true,
                            isMutual: follower.is_following_back,
                            followStatus: follower.status,
                            isLoading: false,
                        };
                    } else {
                        state.relationships[follower.user_id].isFollowedBy = true;
                        state.relationships[follower.user_id].isMutual =
                            state.relationships[follower.user_id].isFollowing && follower.is_following_back;
                    }
                }
            });
        },

        setUpFollowings: (state, action: PayloadAction<Follower[]>) => {
            state.followings = action.payload;
            action.payload.forEach(following => {
                if (following.is_following_back) {
                    if (!state.relationships[following.user_id]) {
                        state.relationships[following.user_id] = {
                            userId: following.user_id,
                            isFollowing: true,
                            isFollowedBy: following.is_following_back,
                            isMutual: following.is_following_back,
                            followStatus: following.status,
                            isLoading: false,
                        };
                    } else {
                        state.relationships[following.user_id].isFollowing = true;
                        state.relationships[following.user_id].isMutual =
                            state.relationships[following.user_id].isFollowedBy && following.is_following_back;
                    }
                }
            });
        },

        addFollower: (state, action: PayloadAction<Follower>) => {
            const follower = action.payload;
            if (!state.followers.find(f => f.user_id === follower.user_id)) {
                state.followers.push(follower);
            }
            // Only add to relationships if your_follow_status is 'accepted'
            if (follower.your_follow_status === 'accepted') {
                if (!state.relationships[follower.user_id]) {
                    state.relationships[follower.user_id] = {
                        userId: follower.user_id,
                        isFollowing: follower.you_follow_them,
                        isFollowedBy: true,
                        isMutual: follower.is_following_back,
                        followStatus: follower.status,
                        isLoading: false,
                    };
                } else {
                    state.relationships[follower.user_id].isFollowedBy = true;
                }
            }
        },

        removeFollower: (state, action: PayloadAction<number>) => {
            const userId = action.payload;
            state.followers = state.followers.filter(f => f.user_id !== userId);
            if (state.relationships[userId]) {
                state.relationships[userId].isFollowedBy = false;
                state.relationships[userId].isMutual = false;
            }
        },

        addFollowing: (state, action: PayloadAction<Follower>) => {
            const following = action.payload;
            if (!state.followings.find(f => f.user_id === following.user_id)) {
                state.followings.push(following);
            }
            // Only add to relationships if is_following_back is true
            if (following.is_following_back) {
                if (!state.relationships[following.user_id]) {
                    state.relationships[following.user_id] = {
                        userId: following.user_id,
                        isFollowing: true,
                        isFollowedBy: following.is_following_back,
                        isMutual: following.is_following_back,
                        followStatus: following.status,
                        isLoading: false,
                    };
                } else {
                    state.relationships[following.user_id].isFollowing = true;
                }
            }
        },

        removeFollowing: (state, action: PayloadAction<number>) => {
            const userId = action.payload;
            state.followings = state.followings.filter(f => f.user_id !== userId);
            if (state.relationships[userId]) {
                state.relationships[userId].isFollowing = false;
                state.relationships[userId].isMutual = false;
                state.relationships[userId].followStatus = null;
            }
        },

        setFollowRelationship: (state, action: PayloadAction<{
            userId: number;
            data: Partial<FollowRelationship>;
        }>) => {
            const { userId, data } = action.payload;
            state.relationships[userId] = {
                ...state.relationships[userId],
                userId,
                isLoading: false,
                ...data,
            } as FollowRelationship;
        },

        setMutualConnections: (state, action: PayloadAction<Relationship>) => {
            state.mutualConnections = action.payload;
        },

        updateFollowStatus: (state, action: PayloadAction<{
            userId: number;
            isFollowing: boolean;
            followStatus: 'pending' | 'accepted' | 'blocked' | null;
        }>) => {
            const { userId, isFollowing, followStatus } = action.payload;
            if (state.relationships[userId]) {
                state.relationships[userId].isFollowing = isFollowing;
                state.relationships[userId].followStatus = followStatus;
                state.relationships[userId].isMutual =
                    isFollowing && state.relationships[userId].isFollowedBy;
            } else {
                state.relationships[userId] = {
                    userId,
                    isFollowing,
                    isFollowedBy: false,
                    isMutual: false,
                    followStatus,
                    isLoading: false,
                };
            }

            if (isFollowing) {
                if (!state.followings.find(f => f.user_id === userId)) {
                    // We don't have full follower data
                }
            } else {
                state.followings = state.followings.filter(f => f.user_id !== userId);
            }
        },

        setFollowLoading: (state, action: PayloadAction<{
            userId: number;
            isLoading: boolean;
        }>) => {
            const { userId, isLoading } = action.payload;
            if (state.relationships[userId]) {
                state.relationships[userId].isLoading = isLoading;
            } else {
                state.relationships[userId] = {
                    userId,
                    isFollowing: false,
                    isFollowedBy: false,
                    isMutual: false,
                    followStatus: null,
                    isLoading,
                };
            }
        },

        clearFollowRelationship: (state, action: PayloadAction<number>) => {
            delete state.relationships[action.payload];
        },

        clearAllFollowData: (state) => {
            state.followers = [];
            state.followings = [];
            state.relationships = {};
        },

        setFollowersLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoadingFollowers = action.payload;
        },
        setFollowingLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoadingFollowing = action.payload;
        },

        setFollowError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
    }
});

export const {
    setUpFollowers,
    setUpFollowings,
    addFollower,
    removeFollower,
    addFollowing,
    removeFollowing,
    setFollowRelationship,
    updateFollowStatus,
    setFollowLoading,
    clearFollowRelationship,
    clearAllFollowData,
    setFollowersLoading,
    setFollowingLoading,
    setFollowError,
    setMutualConnections,
} = followSlice.actions;

export default followSlice.reducer;
