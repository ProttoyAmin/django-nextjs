import { RootState } from "../../store";

// User selectors
export const selectCurrentUser = (state: RootState) => state.user.currentUser;
export const selectUserLoading = (state: RootState) => state.user.isLoading;
export const selectUserError = (state: RootState) => state.user.error;

// Derived selectors
export const selectUserId = (state: RootState) => state.user.currentUser?.id;
export const selectUsername = (state: RootState) => state.user.currentUser?.username;
export const selectUserAvatar = (state: RootState) =>
    state.user.currentUser?.profile_picture_url || state.user.currentUser?.avatar;

export const selectUserCounts = (state: RootState) => ({
    follower_count: state.user.currentUser?.follower_count || 0,
    following_count: state.user.currentUser?.following_count || 0,
    total_posts_count: state.user.currentUser?.total_posts_count || 0,
    pending_requests_count: state.user.currentUser?.pending_requests_count || 0,
});

export const selectIsPrivateAccount = (state: RootState) =>
    state.user.currentUser?.is_private || false;
