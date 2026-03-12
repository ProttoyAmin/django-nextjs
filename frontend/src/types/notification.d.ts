export interface Notification {
    id: string | number,
    verb: string,
    description: string,
    is_read: boolean,
    is_seen: boolean,
    primary_actor: {
        id: string,
        username: string,
        first_name: string,
        last_name: string,
        avatar: string
    } | null,
    actor_count: number,
    target_type: string,
    target_content_type: string,
    target_id: string,
    target_post_id: string,
    target_preview: string | null,
    notification_url: string,
    message: string,
    created_at: string
}

export interface NotificationPaginatedData {
    count: number,
    next: string | null,
    previous: string | null,
    results: Notification[]
}

export interface NotificationResponse {
    success: boolean,
    data: NotificationPaginatedData,
    errors: string | null
}

