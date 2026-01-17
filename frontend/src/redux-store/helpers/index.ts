/**
 * Redux Helper Functions
 * 
 * Common operations for managing Redux state across the application
 */

import { AppDispatch } from '../store';
import { login, logout } from '../slices/auth';
import { setUser, clearUser, updateUser, updateUserCounts } from '../slices/user';
import {
    setFollowRelationship,
    updateFollowStatus,
    clearAllFollowData,
    setFollowLoading
} from '../slices/follow';
import { UserType } from '@/types';

/**
 * Handle user login
 * Sets authentication state and user data
 */
export const handleUserLogin = (dispatch: AppDispatch, userData: UserType) => {
    dispatch(login());
    dispatch(setUser(userData));
};

/**
 * Handle user logout
 * Clears all user-related state
 */
export const handleUserLogout = (dispatch: AppDispatch) => {
    dispatch(logout());
    dispatch(clearUser());
    dispatch(clearAllFollowData());
};

/**
 * Update user profile
 * Updates specific user fields
 */
export const handleUserProfileUpdate = (
    dispatch: AppDispatch,
    updates: Partial<UserType>
) => {
    dispatch(updateUser(updates));
};

/**
 * Initialize follow relationship for a user
 * Call this when viewing a user's profile
 */
export const initializeFollowRelationship = (
    dispatch: AppDispatch,
    userId: number,
    data: {
        isFollowing: boolean;
        isFollowedBy: boolean;
        isMutual: boolean;
        followStatus: 'pending' | 'accepted' | 'blocked' | null;
    }
) => {
    dispatch(setFollowRelationship({ userId, data }));
};

/**
 * Handle follow toggle with optimistic update
 * Returns a rollback function in case of error
 */
export const handleFollowToggle = (
    dispatch: AppDispatch,
    userId: number,
    currentState: {
        isFollowing: boolean;
        followStatus: 'pending' | 'accepted' | 'blocked' | null;
    },
    isPrivate: boolean
) => {
    const newIsFollowing = !currentState.isFollowing;
    const newStatus = newIsFollowing
        ? isPrivate ? 'pending' : 'accepted'
        : null;

    // Optimistic update
    dispatch(updateFollowStatus({
        userId,
        isFollowing: newIsFollowing,
        followStatus: newStatus as 'pending' | 'accepted' | 'blocked' | null,
    }));

    // Return rollback function
    return () => {
        dispatch(updateFollowStatus({
            userId,
            isFollowing: currentState.isFollowing,
            followStatus: currentState.followStatus,
        }));
    };
};

/**
 * Update user follower count
 * Call this after follow/unfollow actions
 */
export const updateFollowerCount = (
    dispatch: AppDispatch,
    increment: boolean
) => {
    // This would need the current count from state
    // Better to fetch from server or pass current count
    dispatch(updateUserCounts({
        // follower_count will be updated from server response
    }));
};

/**
 * Sync follow relationship from server response
 * Use this after API calls to ensure state matches server
 */
export const syncFollowRelationship = (
    dispatch: AppDispatch,
    userId: number,
    serverData: {
        is_following: boolean;
        is_followed_by?: boolean;
        is_mutual?: boolean;
        status: 'pending' | 'accepted' | 'blocked' | null;
    }
) => {
    dispatch(setFollowRelationship({
        userId,
        data: {
            isFollowing: serverData.is_following,
            isFollowedBy: serverData.is_followed_by || false,
            isMutual: serverData.is_mutual || false,
            followStatus: serverData.status,
        }
    }));
};
