/**
 * Redux Store - Main Export File
 * 
 * Import everything you need from this file for a clean API
 */

// Store and types
export { store, persistor } from './store';
export type { RootState, AppDispatch } from './store';

// Hooks
export { useAppDispatch, useAppSelector } from './hooks';

// Auth
export { login, logout, setAuthenticated } from './slices/auth';
export { selectIsAuthenticated } from './slices/auth/selectors';

// User
export {
    setUser,
    updateUser,
    clearUser,
    setUserLoading,
    setUserError,
    updateUserCounts
} from './slices/user';
export {
    selectCurrentUser,
    selectUserLoading,
    selectUserError,
    selectUserId,
    selectUsername,
    selectUserAvatar,
    selectUserCounts,
    selectIsPrivateAccount
} from './slices/user/selectors';

// Follow
export {
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
} from './slices/follow';
export {
    selectFollowRelationships,
    selectFollowersLoading,
    selectFollowingLoading,
    selectFollowError,
    selectFollowers,
    selectFollowings,
    selectFollowersCount,
    selectFollowingsCount,
    selectFollowRelationshipByUserId,
    selectIsFollowing,
    selectIsFollowedBy,
    selectIsMutual,
    selectFollowStatus,
    selectFollowLoadingByUserId,
    selectFollowerByUserId,
    selectFollowingByUserId,
    selectIsInFollowers,
    selectIsInFollowings,
} from './slices/follow/selectors';

// Helpers
export {
    handleUserLogin,
    handleUserLogout,
    handleUserProfileUpdate,
    initializeFollowRelationship,
    handleFollowToggle,
    syncFollowRelationship,
} from './helpers';
