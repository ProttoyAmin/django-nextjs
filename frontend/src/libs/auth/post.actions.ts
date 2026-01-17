'use server'

import { PostService } from '../../services/PostService';
import {
  PostType,
  CreatePostRequest,
  CreatePostResponse,
  UploadResponse
} from '../../types/post';

const postService = new PostService();

export async function createPost(postData: CreatePostRequest): Promise<{ success: boolean; data?: CreatePostResponse; errors?: any }> {
  try {
    const result = await postService.createPost(postData);
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      errors: { detail: error.message || "Failed to create post" }
    };
  }
}

export async function createTextPost(content: string, isPublic: boolean = true, clubId?: string): Promise<{ success: boolean; data?: CreatePostResponse; errors?: any }> {
  try {
    console.log('post.acitions.ts')
    const result = await postService.createTextPost(content, isPublic, clubId);
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      errors: { detail: error.message || "Failed to create text post" }
    };
  }
}

export async function createImagePostWithFile(
  content: string | null,
  imageFile: File,
  isPublic: boolean = true
): Promise<{ success: boolean; data?: CreatePostResponse; errors?: any }> {
  try {
    const result = await postService.createImagePostWithFile(content, imageFile, isPublic);
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      errors: { detail: error.message || "Failed to create image post" }
    };
  }
}

export async function createImagePostWithUrl(
  content: string | null,
  imageUrl: string,
  isPublic: boolean = true
): Promise<{ success: boolean; data?: CreatePostResponse; errors?: any }> {
  try {
    const result = await postService.createImagePostWithUrl(content, imageUrl, isPublic);
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      errors: { detail: error.message || "Failed to create image post" }
    };
  }
}

export async function createVideoPostWithFile(
  content: string | null,
  videoFile: File,
  isPublic: boolean = true
): Promise<{ success: boolean; data?: CreatePostResponse; errors?: any }> {
  try {
    console.log('content: ', content, 'video file', videoFile)
    const result = await postService.createVideoPostWithFile(content, videoFile, isPublic);
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      errors: { detail: error.message || "Failed to create video post" }
    };
  }
}

export async function createVideoPostWithUrl(
  content: string | null,
  videoUrl: string,
  isPublic: boolean = true
): Promise<{ success: boolean; data?: CreatePostResponse; errors?: any }> {
  try {
    const result = await postService.createVideoPostWithUrl(content, videoUrl, isPublic);
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      errors: { detail: error.message || "Failed to create video post" }
    };
  }
}

export async function createMixedMediaPost(
  content: string | null,
  mediaFiles: File[],
  isPublic: boolean = true,
  clubId?: string
): Promise<{ success: boolean; data?: CreatePostResponse; errors?: any }> {
  try {
    const result = await postService.createMixedMediaPost(content, mediaFiles, isPublic, clubId);
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      errors: { detail: error.message || "Failed to create mixed media post" }
    };
  }
}

export async function getPost(postId: number | string): Promise<{ success: boolean; data?: PostType; errors?: any }> {
  try {
    const result = await postService.getPost(postId);
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      errors: { detail: error.message || "Failed to get post" }
    };
  }
}

export async function getPosts(
  page?: number,
  postType?: 'TEXT' | 'IMAGE' | 'VIDEO',
  search?: string
): Promise<{ success: boolean; data?: any; errors?: any }> {
  try {
    const result = await postService.getPosts(page, postType, search);
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      errors: { detail: error.message || "Failed to get posts" }
    };
  }
}

export async function updatePost(postId: number | string, updates: Partial<CreatePostRequest>): Promise<{ success: boolean; data?: CreatePostResponse; errors?: any }> {
  try {
    const result = await postService.updatePost(postId, updates);
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      errors: { detail: error.message || "Failed to update post" }
    };
  }
}

export async function deletePost(postId: number | string): Promise<{ success: boolean; errors?: any }> {
  try {
    await postService.deletePost(postId);
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      errors: { detail: error.message || "Failed to delete post" }
    };
  }
}

export async function togglePostLike(postId: number | string): Promise<{ success: boolean; data?: any; errors?: any }> {
  try {
    const result = await postService.togglePostLike(postId);
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      errors: { detail: error.message || "Failed to toggle like" }
    };
  }
}

export async function sharePost(postId: number | string, message?: string): Promise<{ success: boolean; data?: any; errors?: any }> {
  try {
    const result = await postService.sharePost(postId, message);
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      errors: { detail: error.message || "Failed to share post" }
    };
  }
}

export async function repost(postId: number | string, content?: string): Promise<{ success: boolean; data?: CreatePostResponse; errors?: any }> {
  try {
    const result = await postService.repost(postId, content);
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      errors: { detail: error.message || "Failed to repost" }
    };
  }
}

export async function getPostLikes(postId: number | string): Promise<{ success: boolean; data?: any; errors?: any }> {
  try {
    const result = await postService.getPostLikes(postId);
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      errors: { detail: error.message || "Failed to get post likes" }
    };
  }
}

export async function getPostComments(postId: number | string): Promise<{ success: boolean; data?: any; errors?: any }> {
  try {
    const result = await postService.getPostComments(postId);
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      errors: { detail: error.message || "Failed to get post comments" }
    };
  }
}

export async function createPostComment(postId: number | string, content: string, parent?: number): Promise<{ success: boolean; data?: any; errors?: any }> {
  try {
    const result = await postService.createPostComment(postId, content, parent);
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      errors: { detail: error.message || "Failed to create comment" }
    };
  }
}

export async function updatePostComment(postId: number | string, commentId: number, content: string): Promise<{ success: boolean; data?: any; errors?: any }> {
  try {
    const result = await postService.updatePostComment(postId, commentId, content);
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      errors: { detail: error.message || "Failed to update comment" }
    };
  }
}

export async function deletePostComment(postId: number | string, commentId: number): Promise<{ success: boolean; errors?: any }> {
  try {
    await postService.deletePostComment(postId, commentId);
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      errors: { detail: error.message || "Failed to delete comment" }
    };
  }
}

export async function toggleCommentLike(postId: number | string, commentId: number): Promise<{ success: boolean; data?: any; errors?: any }> {
  try {
    const result = await postService.toggleCommentLike(postId, commentId);
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      errors: { detail: error.message || "Failed to toggle comment like" }
    };
  }
}

// export async function getCommentReplies(postId: number | string, commentId: number): Promise<{ success: boolean; data?: any; errors?: any }> {
//   try {
//     const result = await postService.getCommentReplies(postId, commentId);
//     return { success: true, data: result };
//   } catch (error: any) {
//     return {
//       success: false,
//       errors: { detail: error.message || "Failed to get comment replies" }
//     };
//   }
// }

export async function getPostShares(postId: number | string): Promise<{ success: boolean; data?: any; errors?: any }> {
  try {
    const result = await postService.getPostShares(postId);
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      errors: { detail: error.message || "Failed to get post shares" }
    };
  }
}

export async function getFeed(): Promise<{ success: boolean; data?: any; errors?: any }> {
  try {
    const result = await postService.getFeed();
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      errors: { detail: error.message || "Failed to get feed" }
    };
  }
}

export async function getTrendingPosts(): Promise<{ success: boolean; data?: any; errors?: any }> {
  try {
    const result = await postService.getTrendingPosts();
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      errors: { detail: error.message || "Failed to get trending posts" }
    };
  }
}