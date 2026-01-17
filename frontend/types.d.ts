import { ReactNode } from "react";

export type RForm = {
    username: string;
    email: string;
    password: string;
    re_password: string;
    edu_mail: string;
    type: string;
}

export type LForm = {
    username_or_email: string;
    password: string;
}

// AuthGuard.tsx
export interface AuthGuardProps {
    children: React.ReactNode;
    requireAuth?: boolean;
}

// Button.tsx
export interface ButtonProps {
    name?: string;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
    variant?: string;
    disabled?: boolean;
    fullWidth?: boolean;
    loading?: boolean;
    icon?: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'squared' | 'rounded' | 'default';
    className?: string;
}

// User Type
export interface UserType {
    detail?: string;
    id: number | string;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    edu_mail: string | null;
    url: string;
    student_id: string | null;
    status: string;
    is_status_manual: boolean;
    department: string | null;
    year: string | null;
    level: string | null;
    profile_picture_url: string | null;
    avatar: string | null;
    bio: string;
    location: string | null;
    website: string | null;
    date_of_birth: string | null;
    email_verified: boolean;
    is_private: boolean;
    club_count: number;
    user_post_count: number;
    club_post_count: number;
    total_posts_count: number;
    follower_count: number;
    following_count: number;
    pending_requests_count: number;
    is_following: boolean;
    is_followed_by: boolean;
    is_mutual: boolean;
    follow_status: 'pending' | 'accepted' | 'blocked' | null;
    // Permissions and visibility
    can_view_profile: boolean;
    likes_given: number;
    comments_made: number;
    shares_made: number;
    likes_received: number;
    // Timestamps
    last_active: string;
    created_at: string;
    updated_at: string;
    last_login: string | null;
    // Composed structures
    clubs: Club[];
    clubs_url: string;
    posts_url: string;
    followers_url: string;
    following_url: string;
}

export interface Follower extends UserType {
    user_id: number;
    username: string;
    first_name: string;
    last_name: string;
    avatar: string | null;
    bio: string;
    is_following_back: boolean;
    you_follow_them: boolean;
    your_follow_status: 'accepted' | 'pending' | 'blocked' | null;
    is_private: boolean;
    user_url: string;
    status: 'accepted' | 'pending' | 'blocked' | null;
    created_at: string;
}

export interface EditProfileType {
    first_name: string;
    last_name: string;
    email: string;
    edu_mail: string | null;
    student_id: string | null;
    department: string | null;
    year: string | null;
}

export interface Post {
    id: number | string;
    url: string;
    author_id: number;
    author_username: string;
    author_avatar?: string;
    author_url: string;
    post_type: 'TEXT' | 'IMAGE' | 'VIDEO';
    content?: string;
    image?: string;
    video?: string;
    original_post?: number;
    original_post_data?: any;
    like_count: number;
    comment_count: number;
    share_count: number;
    repost_count: number;
    is_liked: boolean;
    is_shared: boolean;
    can_edit: boolean;
    likes_url: string;
    comments_url: string;
    shares_url: string;
    like_toggle_url: string;
    share_toggle_url: string;
    repost_url: string;
    is_public: boolean;
    created_at: string;
    updated_at: string;
}



export interface Follow {
    user_id: number;
    username: string;
    avatar?: string;
    bio?: string;
    is_following_back?: boolean;
    is_follower?: boolean;
    user_url: string;
    status: 'pending' | 'accepted' | 'blocked';
    created_at: string;
}

export interface FollowStatus {
    is_following: boolean;
    is_followed_by: boolean;
    is_mutual: boolean;
    follow_status?: 'pending' | 'accepted' | null;
}

export interface Comment {
    id: number | string;
    author_id: number;
    author_username: string;
    author_avatar?: string;
    profile_picture_url?: string;
    content: string;
    is_edited: boolean;
    like_count: number;
    reply_count: number;
    is_liked: boolean;
    parent: number | string | null;
    can_edit: boolean;
    created_at: string;
    updated_at: string;
}

export interface Event {
    id: number;
    url: string;
    club: number;
    club_name: string;
    club_url: string;
    creator_id: number;
    creator_username: string;
    creator_url: string;
    title: string;
    description: string;
    location?: string;
    start_time: string;
    end_time: string;
    status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
    max_participants?: number;
    participant_count: number;
    is_full: boolean;
    is_participant: boolean;
    can_edit: boolean;
    image?: string;
    participants_url: string;
    join_url: string;
    leave_url: string;
    created_at: string;
    updated_at: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    errors?: any;
    status?: number;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}