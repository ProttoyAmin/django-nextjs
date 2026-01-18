"use server";

import { NotificationService } from "@/src/services/Notification";

const notification = new NotificationService();

export async function getNotifications(verb?: string) {
    try {
        const result = await notification.getNotifications(verb);
        return { success: true, data: result };
    } catch (error: any) {
        return {
            success: false,
            errors: { detail: error.message || "Failed to get notifications" }
        };
    }
}


export async function markAllAsRead() {
    try {
        const result = await notification.markAllAsRead();
        return { success: true, data: result };
    } catch (error: any) {
        return {
            success: false,
            errors: { detail: error.message || "Failed to mark all as read" }
        };
    }
}