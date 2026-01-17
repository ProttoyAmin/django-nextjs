import { RootState } from "../../store";

export const selectFollowRelationships = (state: RootState) => state.follow.relationships;
export const selectFollowersLoading = (state: RootState) => state.follow.isLoadingFollowers;
export const selectFollowingLoading = (state: RootState) => state.follow.isLoadingFollowing;
export const selectFollowError = (state: RootState) => state.follow.error;

export const selectFollowers = (state: RootState) => state.follow.followers;
export const selectFollowings = (state: RootState) => state.follow.followings;

export const selectFollowersCount = (state: RootState) => state.follow.followers.length;
export const selectFollowingsCount = (state: RootState) => state.follow.followings.length;

export const selectFollowRelationshipByUserId = (userId: number) => (state: RootState) =>
    state.follow.relationships[userId];

export const selectIsFollowing = (userId: number) => (state: RootState) =>
    state.follow.relationships[userId]?.isFollowing || false;

export const selectIsFollowedBy = (userId: number) => (state: RootState) =>
    state.follow.relationships[userId]?.isFollowedBy || false;

export const selectIsMutual = (userId: number) => (state: RootState) =>
    state.follow.relationships[userId]?.isMutual || false;

export const selectFollowStatus = (userId: number) => (state: RootState) =>
    state.follow.relationships[userId]?.followStatus || null;

export const selectFollowLoadingByUserId = (userId: number) => (state: RootState) =>
    state.follow.relationships[userId]?.isLoading || false;

export const selectFollowerByUserId = (userId: number) => (state: RootState) =>
    state.follow.followers.find(f => f.user_id === userId);

export const selectFollowingByUserId = (userId: number) => (state: RootState) =>
    state.follow.followings.find(f => f.user_id === userId);

export const selectIsInFollowers = (userId: number) => (state: RootState) =>
    state.follow.followers.some(f => f.user_id === userId);

export const selectIsInFollowings = (userId: number) => (state: RootState) =>
    state.follow.followings.some(f => f.user_id === userId);
