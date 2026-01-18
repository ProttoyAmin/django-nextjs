import { NotificationResponse } from "../types/notification";
import { ApiClient } from "./ApiClient";

export class NotificationService {
    private apiClient: ApiClient;

    constructor() {
        this.apiClient = new ApiClient(process.env.NEXT_PUBLIC_NOTIFICATIONS_API || '');
    }

    async getNotifications(verb?: string): Promise<any> {
        const url = verb ? `?type=${verb}` : '';
        return this.apiClient.request<NotificationResponse>(url, 'GET');
    }

    async getUnreadNotifications(): Promise<any> {
        return this.apiClient.request<any>('unread/', 'GET');
    }

    async getReadNotifications(): Promise<any> {
        return this.apiClient.request<any>('read/', 'GET');
    }

    async getUnseenNotifications(): Promise<any> {
        return this.apiClient.request<any>('unseen/', 'GET');
    }

    async getSeenNotifications(): Promise<any> {
        return this.apiClient.request<any>('seen/', 'GET');
    }

    async getNotification(notificationId: string | number): Promise<any> {
        return this.apiClient.request<any>(`${notificationId}/`, 'GET');
    }

    async markAsRead(notificationId: string | number): Promise<any> {
        return this.apiClient.request<any>(`${notificationId}/read/`, 'PATCH');
    }

    async markAsUnread(notificationId: string | number): Promise<any> {
        return this.apiClient.request<any>(`${notificationId}/unread/`, 'PATCH');
    }

    async markAsSeen(notificationId: string | number): Promise<any> {
        return this.apiClient.request<any>(`${notificationId}/seen/`, 'PATCH');
    }

    async markAsUnseen(notificationId: string | number): Promise<any> {
        return this.apiClient.request<any>(`${notificationId}/unseen/`, 'PATCH');
    }

    async markAllAsRead(): Promise<any> {
        return this.apiClient.request<any>('mark-all-read/', 'POST');
    }

    async markAllAsUnread(): Promise<any> {
        return this.apiClient.request<any>('mark-all-unread/', 'POST');
    }

    async markAllAsSeen(): Promise<any> {
        return this.apiClient.request<any>('mark-all-seen/', 'PATCH');
    }

    async markAllAsUnseen(): Promise<any> {
        return this.apiClient.request<any>('mark-all-unseen/', 'PATCH');
    }
}