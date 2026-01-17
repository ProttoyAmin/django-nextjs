import { RootState } from "../../store";


// export const selectFollowRelationships = (state: RootState) => state.follow.relationships;

export const selectFeedPosts = (state: RootState) => state.post.feedIds.map(id => state.post.entities[id]);
export const selectUserPosts = (state: RootState) => state.post.userIds.map(id => state.post.entities[id]);
export const selectPostById = (postId: number) => (state: RootState) =>
    state.post.entities[postId];
export const selectUserPostById = (postId: number) => (state: RootState) =>
    state.post.entities[postId];
