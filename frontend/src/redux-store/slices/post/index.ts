import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { PostType } from "@/src/types/post";
import { Comment } from "@/types";

export interface MediaState {
    id: string | number;
    image_file?: string;
    media_type: 'IMAGE' | 'VIDEO';
    order?: number;
    video_file?: string;
}

interface PostsState {
    entities: Record<string | number, PostType>;
    clubEntities: Record<string | number, PostType>;
    feedIds: (string | number)[];
    userIds: (string | number)[];
    clubIds: (string | number)[];
    currentClubId?: string | number;
}

const initialState: PostsState = {
    entities: {},
    clubEntities: {},
    feedIds: [],
    userIds: [],
    clubIds: [],
}

const postSlice = createSlice({
    name: 'post',
    initialState,
    reducers: {
        setFeedPosts: (state, action: PayloadAction<PostType[]>) => {
            action.payload.forEach(post => {
                state.entities[post.id] = post;
            });
            state.feedIds = action.payload.map(p => p.id);
        },
        setClubPosts: (state, action: PayloadAction<{ posts: PostType[], clubId: string | number }>) => {
            action.payload.posts.forEach(post => {
                state.clubEntities[post.id] = post;
            });
            state.clubIds = action.payload.posts.map(p => p.id);
            state.currentClubId = action.payload.clubId;
        },
        setUserPosts: (state, action: PayloadAction<PostType[]>) => {
            action.payload.forEach(post => {
                state.entities[post.id] = post;
            });
            state.userIds = action.payload.map(p => p.id);
        },
        updateUserPost: (state, action: PayloadAction<PostType>) => {
            state.entities[action.payload.id] = action.payload;
            state.clubEntities[action.payload.id] = action.payload;
        },
        updatePostLike: (state, action: PayloadAction<{ postId: string | number }>) => {
            const post = state.entities[action.payload.postId];
            if (post) {
                post.is_liked = !post.is_liked;
                post.like_count = post.is_liked ? post.like_count + 1 : post.like_count - 1;
            }
        },
        addClubPost: (state, action: PayloadAction<PostType>) => {
            state.clubEntities[action.payload.id] = action.payload;
            state.clubIds.push(action.payload.id);
        },
        updateClubPost: (state, action: PayloadAction<PostType>) => {
            state.clubEntities[action.payload.id] = action.payload;
        },
        removeClubPost: (state, action: PayloadAction<PostType>) => {
            delete state.clubEntities[action.payload.id];
            state.clubIds = state.clubIds.filter(id => id !== action.payload.id);
        },
        updateClubPostLike: (state, action: PayloadAction<{ postId: string | number }>) => {
            const post = state.clubEntities[action.payload.postId];
            if (post) {
                post.is_liked = !post.is_liked;
                post.like_count = post.is_liked ? post.like_count + 1 : post.like_count - 1;
            }
        },
        addPost: (state, action: PayloadAction<PostType>) => {
            state.entities[action.payload.id] = action.payload;
            state.feedIds.push(action.payload.id);
        },
        removePost: (state, action: PayloadAction<PostType>) => {
            delete state.entities[action.payload.id];
            state.feedIds = state.feedIds.filter(id => id !== action.payload.id);
        },
        addUserPost: (state, action: PayloadAction<PostType>) => {
            state.entities[action.payload.id] = action.payload;
            state.userIds.push(action.payload.id);
        },
        removeUserPost: (state, action: PayloadAction<PostType>) => {
            delete state.entities[action.payload.id];
            state.userIds = state.userIds.filter(id => id !== action.payload.id);
        },
        removePostById: (state, action: PayloadAction<string | number>) => {
            delete state.entities[action.payload];
            state.feedIds = state.feedIds.filter(id => id !== action.payload);
            state.userIds = state.userIds.filter(id => id !== action.payload)
        },
        removeClubPostById: (state, action: PayloadAction<string | number>) => {
            delete state.clubEntities[action.payload];
            state.clubIds = state.clubIds.filter(id => id !== action.payload);
        },
        updateUserPostById: (state, action: PayloadAction<PostType>) => {
            state.entities[action.payload.id] = action.payload;
        },

    }
})

export const {
    setFeedPosts,
    setClubPosts,
    setUserPosts,
    addPost,
    removePost,
    addUserPost,
    removeUserPost,
    updateUserPost,
    updateUserPostById,
    removePostById,
    updatePostLike,
    addClubPost,
    removeClubPost,
    updateClubPost,
    removeClubPostById,
    updateClubPostLike
} = postSlice.actions

export default postSlice.reducer