// src/utils/permissions.ts
import { PostType } from '../types/post';

// Define minimal interfaces needed for permissions
// These should ideally match your backend User and Membership serializers

export interface User {
    id: number | string;
    username: string;
    is_superuser?: boolean;
    // Add other fields as needed
}

export interface Club {
    id: number | string;
    owner_id?: number | string;
}

export interface ClubMembership {
    user_id: number | string;
    club_id: number | string;
    role: 'member' | 'moderator' | 'admin';
}

export interface ClubPost {
    id: number | string;
    author_id: number | string;
    club_id: number | string;
    creator_id?: number | string; // Alias for author in some contexts
}

/**
 * Check if a user can edit a regular post
 */
export const canEditPost = (user: User | null | undefined, post: PostType): boolean => {
    if (!user) return false;
    if (user.is_superuser) return true;
    return user.id === post.author_id;
};

/**
 * Check if a user can delete a regular post
 */
export const canDeletePost = (user: User | null | undefined, post: PostType): boolean => {
    return canEditPost(user, post);
};

/**
 * Check if a user is an admin of a club
 */
export const isClubAdmin = (membership: ClubMembership | null | undefined): boolean => {
    return membership?.role === 'admin';
};

/**
 * Check if a user is a moderator or admin of a club
 */
export const isClubModerator = (membership: ClubMembership | null | undefined): boolean => {
    return membership?.role === 'admin' || membership?.role === 'moderator';
};

/**
 * Check if a user can edit a club post
 * Allowed if:
 * 1. User is the author
 * 2. User is a club admin
 * 3. User is a club moderator
 */
export const canEditClubPost = (
    user: User | null | undefined,
    post: ClubPost,
    membership: ClubMembership | null | undefined
): boolean => {
    if (!user) return false;
    if (user.is_superuser) return true;

    // Author can always edit
    if (user.id === post.author_id || user.id === post.creator_id) return true;

    // Club admins/mods can edit
    if (membership && String(membership.club_id) === String(post.club_id)) {
        return isClubModerator(membership);
    }

    return false;
};

/**
 * Check if a user can view another user's profile
 * This logic mimics the backend `can_view_profile` method
 */

interface FollowStatus {
    is_private: boolean; is_followed_by?: boolean; is_blocked?: boolean
}

export const canViewProfile = (
    currentUser: UserType | null | undefined,
    targetUser: UserType & FollowStatus
): boolean => {
    console.log('currentUser', currentUser)
    console.log('targetUser', targetUser)
    if (currentUser && currentUser.username === targetUser.username) return true;
    if (targetUser.is_blocked) return false;
    if (!targetUser.is_private) return true;
    if (currentUser && targetUser.is_following) return true;
    return false;
};

import { RoleType } from '../redux-store/slices/roles';
import { UserType } from '@/types';

type Perms = {
    can_manage_settings: boolean;
    can_manage_posts: boolean;
    can_manage_roles: boolean;
    can_manage_members: boolean;
}


export const canViewSettings = (permissions: Perms | null): boolean => {
    if (!permissions) return false;
    return Object.values(permissions).some((perm) => perm === true);
}


export const canManageSettings = (permissions: Perms | null): boolean => {
    if (!permissions) return false;
    if (permissions.can_manage_settings) return true;
    return false;
}

export const canManageRoles = (permissions: Perms | null): boolean => {
    if (!permissions) return false;
    if (permissions.can_manage_roles) return true;
    return false;
}

export const canManageMembers = (permissions: Perms | null): boolean => {
    if (!permissions) return false;
    if (permissions.can_manage_members) return true;
    return false;
}

export const canManagePosts = (permissions: Perms | null): boolean => {
    if (!permissions) return false;
    if (permissions.can_manage_posts) return true;
    return false;
}
