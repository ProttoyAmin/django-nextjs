export interface Club {
    id: string | number;
    name: string;
    origin: string;
    slug: string;
    about?: string;
    avatar?: string;
    banner?: string;
    is_public: boolean;
    is_visible: boolean;
    is_active: boolean;
    is_owner: boolean;
    owner: number | string;
    member_count: number;
    post_count: number;
    event_count: number;
    user_role?: {
        name: string,
        permissions: {
            can_manage_events: boolean,
            can_manage_members: boolean,
            can_manage_posts: boolean,
            can_manage_settings: boolean
        }
    };
    is_member: boolean;
    url: string;
    members_url: string;
    posts_url: string;
    events_url: string;
    join_url: string;
    leave_url: string;
    created_at: string;
    updated_at: string;
    members: number[];
    allow_public_posts: boolean;
    privacy: 'public' | 'closed' | 'secret';
    rules: string;
    member_count: number;
    post_count: number;
    event_count: number;
}



export interface UserClub {
    id: string;
    club_avatar: string;
    club_id: string | number;
    club_name: string;
    club_slug: string;
    club_url: string;
    is_active: boolean;
    is_member: boolean;
    is_public: boolean;
    is_visible: boolean;
    joined_at: string;
    role_name: string;
    role_permissions: {
        can_manage_members: boolean;
        can_manage_posts: boolean;
        can_manage_events: boolean;
        can_manage_settings: boolean;
    };
}
