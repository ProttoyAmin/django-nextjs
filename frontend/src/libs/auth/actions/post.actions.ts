import { getServerCookie } from "../../utils/cookieUtils";
import { activityApi, api, postApi } from "../api";
import { authenticatedRequest } from "../auth";

// export async function getPostsFeed(page: number = 1, postType?: 'TEXT' | 'IMAGE' | 'VIDEO') {
//   return authenticatedRequest(async (token) => {
//     const typeParam = postType ? `?post_type=${postType}&page=${page}` : `?page=${page}`;
//     const response = await api.get(`posts/feed/${typeParam}`, {
//       headers: {
//         'Authorization': `Bearer ${token}`
//       }
//     });
//     return response.data;
//   });
// }

// export async function getTrendingPosts() {
//   try {
//     const accessToken = await getServerCookie('access');
//     const response = await api.get(`posts/trending/`, {
//       headers: accessToken ? {
//         'Authorization': `Bearer ${accessToken}`
//       } : {}
//     });
//     return { success: true, data: response.data };
//   } catch (error: any) {
//     if (error.response) {
//       return {
//         success: false,
//         errors: error.response.data
//       };
//     }
//     return {
//       success: false,
//       errors: { detail: "Something went wrong!" }
//     };
//   }
// }

// export async function createPost(data: {
//   post_type: 'TEXT' | 'IMAGE' | 'VIDEO';
//   content: string;
//   image?: string;
//   video?: string;
//   is_public?: boolean;
//   original_post?: number;
// }) {
//   return authenticatedRequest(async (token) => {
//     const response = await api.post(`posts/create/`, data, {
//       headers: {
//         'Authorization': `Bearer ${token}`
//       }
//     });
//     return response.data;
//   });
// }

// export async function getPostDetail(postId: string | number) {
//   return authenticatedRequest(async (token) => {
//     const response = await api.get(`posts/${postId}/`, {
//       headers: {
//         'Authorization': `Bearer ${token}`
//       }
//     });
//     return response.data;
//   });
// }

// export async function updatePost(postId: string | number, data: {
//   content?: string;
//   image?: string;
//   video?: string;
//   is_public?: boolean;
// }) {
//   return authenticatedRequest(async (token) => {
//     const response = await api.patch(`posts/${postId}/`, data, {
//       headers: {
//         'Authorization': `Bearer ${token}`
//       }
//     });
//     return response.data;
//   });
// }

// export async function deletePost(postId: string | number) {
//   return authenticatedRequest(async (token) => {
//     const response = await api.delete(`posts/${postId}/`, {
//       headers: {
//         'Authorization': `Bearer ${token}`
//       }
//     });
//     return response.data;
//   });
// }

// export async function repostPost(postId: string | number, content?: string) {
//   return authenticatedRequest(async (token) => {
//     const response = await api.post(`posts/${postId}/repost/`,
//       { content },
//       {
//         headers: {
//           'Authorization': `Bearer ${token}`
//         }
//       }
//     );
//     return response.data;
//   });
// }

// export async function togglePostLike(postId: string | number) {
//   return authenticatedRequest(async (token) => {
//     const response = await postApi.post(`${postId}/like/`, {}, {
//       headers: {
//         'Authorization': `Bearer ${token}`
//       }
//     });
//     return response.data;
//   });
// }

// export async function getPostLikes(postId: string | number) {
//   try {
//     const accessToken = await getServerCookie('access');
//     const response = await api.get(`posts/${postId}/likes/`, {
//       headers: accessToken ? {
//         'Authorization': `Bearer ${accessToken}`
//       } : {}
//     });
//     return { success: true, data: response.data };
//   } catch (error: any) {
//     if (error.response) {
//       return {
//         success: false,
//         errors: error.response.data
//       };
//     }
//     return {
//       success: false,
//       errors: { detail: "Something went wrong!" }
//     };
//   }
// }

// export async function getPostComments(postId: string | number, page: number = 1) {
//   try {
//     const accessToken = await getServerCookie('access');
//     const response = await api.get(`posts/${postId}/comments/?page=${page}`, {
//       headers: accessToken ? {
//         'Authorization': `Bearer ${accessToken}`
//       } : {}
//     });
//     return { success: true, data: response.data };
//   } catch (error: any) {
//     if (error.response) {
//       return {
//         success: false,
//         errors: error.response.data
//       };
//     }
//     return {
//       success: false,
//       errors: { detail: "Something went wrong!" }
//     };
//   }
// }

// export async function createPostComment(postId: string | number, content: string, parentId?: number) {
//   return authenticatedRequest(async (token) => {
//     const response = await api.post(
//       `posts/${postId}/comments/create/`,
//       { content, parent: parentId },
//       {
//         headers: {
//           'Authorization': `Bearer ${token}`
//         }
//       }
//     );
//     return response.data;
//   });
// }

// export async function updatePostComment(postId: string | number, commentId: string | number, content: string) {
//   return authenticatedRequest(async (token) => {
//     const response = await api.patch(
//       `posts/${postId}/comments/${commentId}/`,
//       { content },
//       {
//         headers: {
//           'Authorization': `Bearer ${token}`
//         }
//       }
//     );
//     return response.data;
//   });
// }

// export async function deletePostComment(postId: string | number, commentId: string | number) {
//   return authenticatedRequest(async (token) => {
//     const response = await api.delete(`posts/${postId}/comments/${commentId}/`, {
//       headers: {
//         'Authorization': `Bearer ${token}`
//       }
//     });
//     return response.data;
//   });
// }

// export async function toggleCommentLike(postId: string | number, commentId: string | number) {
//   return authenticatedRequest(async (token) => {
//     const response = await api.post(`posts/${postId}/comments/${commentId}/like/`, {}, {
//       headers: {
//         'Authorization': `Bearer ${token}`
//       }
//     });
//     return response.data;
//   });
// }

// export async function getCommentReplies(commentId: string | number, page: number = 1) {
//     return authenticatedRequest(async (token) => {
//         const response = await activityApi.get(`comments/${commentId}/replies/?page=${page}`, {
//             headers: {
//                 'Authorization': `Bearer ${token}`
//             }
//         });
//         return response.data;
//     });
// }

// export async function togglePostShare(postId: string | number, message?: string) {
//   return authenticatedRequest(async (token) => {
//     const response = await api.post(
//       `posts/${postId}/share/`,
//       { message },
//       {
//         headers: {
//           'Authorization': `Bearer ${token}`
//         }
//       }
//     );
//     return response.data;
//   });
// }

// export async function getPostShares(postId: string | number) {
//   try {
//     const accessToken = await getServerCookie('access');
//     const response = await api.get(`posts/${postId}/shares/`, {
//       headers: accessToken ? {
//         'Authorization': `Bearer ${accessToken}`
//       } : {}
//     });
//     return { success: true, data: response.data };
//   } catch (error: any) {
//     if (error.response) {
//       return {
//         success: false,
//         errors: error.response.data
//       };
//     }
//     return {
//       success: false,
//       errors: { detail: "Something went wrong!" }
//     };
//   }
// }