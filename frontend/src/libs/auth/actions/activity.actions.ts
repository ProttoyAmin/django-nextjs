'use server';

import { ActivityService } from "@/src/services/ActivityService";

const activityService = new ActivityService();

export async function getCommentReplies(commentId: number | string, parentId?: number | string): Promise<{ success: boolean; data?: any; errors?: any }> {
    try {
        const result = await activityService.getCommentReplies(commentId);
        return { success: true, data: result };
    } catch (error: any) {
        return {
            success: false,
            errors: { detail: error.message || "Failed to get comment replies" }
        };
    }
}