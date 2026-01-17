/**
 * Example Component: Using the New Redux Store
 * 
 * This file demonstrates how to use the refactored Redux store
 * in your components. You can reference this when updating existing components.
 */

'use client'

import React, { useEffect } from 'react';
import {
    useAppDispatch,
    useAppSelector,
    // Auth
    selectIsAuthenticated,
    login,
    logout,
    // User
    selectCurrentUser,
    selectUserCounts,
    setUser,
    clearUser,
    updateUser,
    // Follow
    selectIsFollowing,
    selectFollowStatus,
    selectFollowLoadingByUserId,
    updateFollowStatus,
    setFollowRelationship,
    // Helpers
    handleUserLogin,
    handleUserLogout,
    handleFollowToggle,
    syncFollowRelationship,
} from '@/src/redux-store';
import { UserType } from '@/types';

/**
 * Example 1: Authentication Component
 */
export function AuthExample() {
    const dispatch = useAppDispatch();
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const currentUser = useAppSelector(selectCurrentUser);

    const handleLogin = async () => {
        try {
            // Call your login API
            const response = await fetch('/api/login', {
                method: 'POST',
                body: JSON.stringify({ username: 'user', password: 'pass' })
            });
            const userData: UserType = await response.json();

            // Use helper function for login
            handleUserLogin(dispatch, userData);

            // Or do it manually
            // dispatch(login());
            // dispatch(setUser(userData));
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

    const handleLogout = () => {
        // Use helper function for logout
        handleUserLogout(dispatch);

        // Or do it manually
        // dispatch(logout());
        // dispatch(clearUser());
        // dispatch(clearAllFollowRelationships());
    };

    return (
        <div>
            {isAuthenticated ? (
                <div>
                    <p>Welcome, {currentUser?.username}!</p>
                    <button onClick={handleLogout}>Logout</button>
                </div>
            ) : (
                <button onClick={handleLogin}>Login</button>
            )}
        </div>
    );
}

/**
 * Example 2: User Profile Component
 */
export function UserProfileExample() {
    const dispatch = useAppDispatch();
    const currentUser = useAppSelector(selectCurrentUser);
    const userCounts = useAppSelector(selectUserCounts);

    const handleUpdateProfile = async (updates: Partial<UserType>) => {
        try {
            // Optimistic update
            dispatch(updateUser(updates));

            // Call API
            const response = await fetch('/api/profile', {
                method: 'PATCH',
                body: JSON.stringify(updates)
            });

            if (!response.ok) {
                // Rollback on error - you'd need to store previous state
                throw new Error('Update failed');
            }
        } catch (error) {
            console.error('Profile update failed:', error);
        }
    };

    return (
        <div>
            <h1>{currentUser?.username}</h1>
            <p>Followers: {userCounts.follower_count}</p>
            <p>Following: {userCounts.following_count}</p>
            <p>Posts: {userCounts.total_posts_count}</p>

            <button onClick={() => handleUpdateProfile({ bio: 'New bio!' })}>
                Update Bio
            </button>
        </div>
    );
}

/**
 * Example 3: Follow Button Component
 */
export function FollowButtonExample({ targetUserId, isPrivate }: {
    targetUserId: number;
    isPrivate: boolean;
}) {
    const dispatch = useAppDispatch();
    const isFollowing = useAppSelector(selectIsFollowing(targetUserId));
    const followStatus = useAppSelector(selectFollowStatus(targetUserId));
    const isLoading = useAppSelector(selectFollowLoadingByUserId(targetUserId));

    // Initialize follow relationship when component mounts
    useEffect(() => {
        const fetchFollowStatus = async () => {
            try {
                const response = await fetch(`/api/users/${targetUserId}/follow-status`);
                const data = await response.json();

                dispatch(setFollowRelationship({
                    userId: targetUserId,
                    data: {
                        isFollowing: data.is_following,
                        isFollowedBy: data.is_followed_by,
                        isMutual: data.is_mutual,
                        followStatus: data.status,
                    }
                }));
            } catch (error) {
                console.error('Failed to fetch follow status:', error);
            }
        };

        fetchFollowStatus();
    }, [targetUserId, dispatch]);

    const handleToggleFollow = async () => {
        // Get rollback function from helper
        const rollback = handleFollowToggle(
            dispatch,
            targetUserId,
            { isFollowing, followStatus },
            isPrivate
        );

        try {
            // Call API
            const response = await fetch(`/api/users/${targetUserId}/follow`, {
                method: 'POST'
            });
            const data = await response.json();

            // Sync with server response
            syncFollowRelationship(dispatch, targetUserId, {
                is_following: data.is_following,
                is_followed_by: data.is_followed_by,
                is_mutual: data.is_mutual,
                status: data.status,
            });
        } catch (error) {
            console.error('Follow toggle failed:', error);
            // Rollback on error
            rollback();
        }
    };

    const getButtonText = () => {
        if (isLoading) return 'Loading...';
        if (isFollowing) {
            return followStatus === 'pending' ? 'Requested' : 'Following';
        }
        return 'Follow';
    };

    return (
        <button onClick={handleToggleFollow} disabled={isLoading}>
            {getButtonText()}
        </button>
    );
}

/**
 * Example 4: App Initialization
 * 
 * Fetch user data when app loads (if authenticated)
 */
export function AppInitializationExample() {
    const dispatch = useAppDispatch();
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const currentUser = useAppSelector(selectCurrentUser);

    useEffect(() => {
        const initializeUser = async () => {
            if (isAuthenticated && !currentUser) {
                try {
                    const response = await fetch('/api/users/me');
                    const userData: UserType = await response.json();
                    dispatch(setUser(userData));
                } catch (error) {
                    console.error('Failed to fetch user:', error);
                    // If token is invalid, logout
                    handleUserLogout(dispatch);
                }
            }
        };

        initializeUser();
    }, [isAuthenticated, currentUser, dispatch]);

    return null; // This component doesn't render anything
}

/**
 * Example 5: Manual Redux Operations (without helpers)
 */
export function ManualReduxExample() {
    const dispatch = useAppDispatch();

    const manualLogin = (userData: UserType) => {
        // Set authentication
        dispatch(login());
        // Set user data
        dispatch(setUser(userData));
    };

    const manualLogout = () => {
        // Clear authentication
        dispatch(logout());
        // Clear user data
        dispatch(clearUser());
    };

    const manualFollowUpdate = (userId: number) => {
        // Optimistic update
        dispatch(updateFollowStatus({
            userId,
            isFollowing: true,
            followStatus: 'pending'
        }));
    };

    return (
        <div>
            <p>See code for manual Redux operations</p>
        </div>
    );
}
