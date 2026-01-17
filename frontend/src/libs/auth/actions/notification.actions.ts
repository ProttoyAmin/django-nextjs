"use server";

import { NotificationService } from "@/src/services/Notification";

const notification = new NotificationService();

export async function getNotifications() {
    try {
        const result = await notification.getNotifications();
        return { success: true, data: result };
    } catch (error: any) {
        return {
            success: false,
            errors: { detail: error.message || "Failed to get notifications" }
        };
    }
}