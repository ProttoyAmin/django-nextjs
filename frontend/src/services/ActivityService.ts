import { ApiClient } from "./ApiClient";
import { Comment } from "@/types";

export class ActivityService {
    private apiClient: ApiClient;

    constructor() {
        this.apiClient = new ApiClient(process.env.NEXT_PUBLIC_ACTIVITIES_API || '');
    }

    async getCommentReplies(commentId: number | string, parentId?: number | string): Promise<Comment[]> {
        return this.apiClient.request<Comment[]>(`comments/${commentId}/replies/`, 'GET');
    }
}
