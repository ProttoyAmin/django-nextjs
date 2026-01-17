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
    target_id: string,
    target_preview: string | null,
    notification_url: string,
    message: string,
    created_at: string
}

// The paginated data structure from the API
export interface NotificationPaginatedData {
    count: number,
    next: string | null,
    previous: string | null,
    results: Notification[]
}

// The action response wrapper
export interface NotificationResponse {
    success: boolean,
    data: NotificationPaginatedData,
    errors: string | null
}

