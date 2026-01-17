import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Comment } from "@/types";
import { RootState } from "../../store";

interface StoreComment extends Comment {
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
    can_edit: boolean;
    created_at: string;
    updated_at: string;
}

interface CommentState {
    byPostId: Record<number | string, Record<number | string, StoreComment>>;
    byClubId: Record<number | string, Record<number | string, StoreComment>>;
}

const initialState: CommentState = {
    byPostId: {},
    byClubId: {},
}

const commentSlice = createSlice({
    name: 'comment',
    initialState,
    reducers: {
        setPostComments: (state, action: PayloadAction<{ postId: number | string; comments: Comment[] }>) => {
            const { postId, comments } = action.payload;
            if (!state.byPostId[postId]) {
                state.byPostId[postId] = {};
            }
            comments.forEach(comment => {
                state.byPostId[postId][comment.id] = comment;
            });
        },
        setClubComments: (state, action: PayloadAction<{ clubId: number | string; comments: Comment[] }>) => {
            const { clubId, comments } = action.payload;
            if (!state.byClubId[clubId]) {
                state.byClubId[clubId] = {};
            }
            comments.forEach(comment => {
                state.byClubId[clubId][comment.id] = comment;
            });
        },
        addPostComment: (state, action: PayloadAction<{ postId: number | string; comment: Comment }>) => {
            const { postId, comment } = action.payload;
            if (!state.byPostId[postId]) {
                state.byPostId[postId] = {};
            }
            state.byPostId[postId][comment.id] = comment;
        },
        removePostComment: (state, action: PayloadAction<{ postId: number | string; commentId: number | string }>) => {
            const { postId, commentId } = action.payload;
            if (state.byPostId[postId]) {
                delete state.byPostId[postId][commentId];
            }
        },
        addClubComment: (state, action: PayloadAction<{ clubId: number | string; comment: Comment }>) => {
            const { clubId, comment } = action.payload;
            if (!state.byClubId[clubId]) {
                state.byClubId[clubId] = {};
            }
            state.byClubId[clubId][comment.id] = comment;
        },
        removeClubComment: (state, action: PayloadAction<{ clubId: number | string; commentId: number | string }>) => {
            const { clubId, commentId } = action.payload;
            if (state.byClubId[clubId]) {
                delete state.byClubId[clubId][commentId];
            }
        },
        updatePostComment: (state, action: PayloadAction<{ postId: number | string; comment: Comment }>) => {
            const { postId, comment } = action.payload;
            if (state.byPostId[postId]?.[comment.id]) {
                state.byPostId[postId][comment.id] = comment;
            }
        },
        updateClubComment: (state, action: PayloadAction<{ clubId: number | string; comment: Comment }>) => {
            const { clubId, comment } = action.payload;
            if (state.byClubId[clubId]?.[comment.id]) {
                state.byClubId[clubId][comment.id] = comment;
            }
        },
        updatePostCommentLike: (state, action: PayloadAction<{ postId: number | string; commentId: number | string }>) => {
            const { postId, commentId } = action.payload;
            const comment = state.byPostId[postId]?.[commentId];
            if (comment) {
                comment.is_liked = !comment.is_liked;
                comment.like_count = comment.is_liked ? comment.like_count + 1 : comment.like_count - 1;
            }
        },
        updateClubPostCommentLike: (state, action: PayloadAction<{ clubId: number | string; commentId: number | string }>) => {
            const { clubId, commentId } = action.payload;
            const comment = state.byClubId[clubId]?.[commentId];
            if (comment) {
                comment.is_liked = !comment.is_liked;
                comment.like_count = comment.is_liked ? comment.like_count + 1 : comment.like_count - 1;
            }
        }
    }
})

export const {
    setPostComments,
    setClubComments,
    addPostComment,
    removePostComment,
    addClubComment,
    removeClubComment,
    updatePostComment,
    updateClubComment,
    updatePostCommentLike,
    updateClubPostCommentLike
} = commentSlice.actions;

// Selectors
export const selectPostComments = (state: RootState, postId: number | string): Comment[] => {
    const comments = state.comment.byPostId[postId];
    return comments ? Object.values(comments) : [];
};

export const selectClubComments = (state: RootState, clubId: number | string): Comment[] => {
    const comments = state.comment.byClubId[clubId];
    return comments ? Object.values(comments) : [];
};

export const selectPostCommentById = (state: RootState, postId: number | string, commentId: number | string): Comment | undefined => {
    return state.comment.byPostId[postId]?.[commentId];
};

export const selectClubCommentById = (state: RootState, clubId: number | string, commentId: number | string): Comment | undefined => {
    return state.comment.byClubId[clubId]?.[commentId];
};

export default commentSlice.reducer;