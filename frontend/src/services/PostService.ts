
// services/PostService.ts
import { ApiClient } from './ApiClient';
import {
  PostType,
  CreatePostRequest,
  CreatePostResponse,
  UploadResponse
} from '../types/post';

// update types first before updating service

export class PostService {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = new ApiClient(process.env.NEXT_PUBLIC_POSTS_API || '');
  }

  async createPost(postData: CreatePostRequest): Promise<CreatePostResponse> {
    const hasFiles = postData.image_file instanceof File || postData.video_file instanceof File;
    console.log("has files? ", hasFiles)
    if (hasFiles) {
      const formData = new FormData();

      Object.entries(postData).forEach(([key, value]) => {
        if (value instanceof File) {
          formData.append(key, value);
        } else if (value !== undefined) {
          formData.append(key, String(value));
        }
      });
      console.log("post data: ", formData)
      console.log(this.apiClient)

      return this.apiClient.request<CreatePostResponse>('create-with-media/', 'POST', formData, true);
    } else {
      console.log("text data: ", postData)
      return this.apiClient.request<CreatePostResponse>('create/', 'POST', postData);
    }
  }

  async createTextPost(content: string, isPublic: boolean = true, clubId?: string): Promise<CreatePostResponse> {
    const postData: CreatePostRequest = {
      post_type: 'TEXT',
      content,
      is_public: isPublic,
      club_id: clubId,
    };

    return this.createPost(postData);
  }

  async createImagePostWithFile(
    content: string | null,
    imageFile: File,
    isPublic: boolean = true
  ): Promise<CreatePostResponse> {
    const postData: CreatePostRequest = {
      post_type: 'IMAGE',
      content: content || '',
      image_file: imageFile,
      is_public: isPublic,
    };

    return this.createPost(postData);
  }

  async createImagePostWithUrl(
    content: string | null,
    imageUrl: string,
    isPublic: boolean = true
  ): Promise<CreatePostResponse> {
    const postData: CreatePostRequest = {
      post_type: 'IMAGE',
      content: content || '',
      image_url: imageUrl,
      is_public: isPublic,
    };

    return this.createPost(postData);
  }

  async createVideoPostWithFile(
    content: string | null,
    videoFile: File,
    isPublic: boolean = true
  ): Promise<CreatePostResponse> {
    const postData: CreatePostRequest = {
      post_type: 'VIDEO',
      content: content || '',
      video_file: videoFile,
      is_public: isPublic,
    };

    return this.createPost(postData);
  }

  async createVideoPostWithUrl(
    content: string | null,
    videoUrl: string,
    isPublic: boolean = true
  ): Promise<CreatePostResponse> {
    const postData: CreatePostRequest = {
      post_type: 'VIDEO',
      content: content || '',
      video_url: videoUrl,
      is_public: isPublic,
    };

    return this.createPost(postData);
  }

  // async uploadMedia(file: File, fileType: 'image' | 'video'): Promise<UploadResponse> {
  //   return this.apiClient.uploadFile(file, fileType);
  // }

  async createMixedMediaPost(
    content: string | null,
    mediaFiles: File[],
    isPublic: boolean = true,
    clubId?: string
  ): Promise<CreatePostResponse> {
    const formData = new FormData();

    formData.append('content', content || '');
    formData.append('is_public', String(isPublic));
    if (clubId) {
      formData.append('club_id', clubId);
    }

    mediaFiles.forEach((file) => {
      formData.append('media_files', file);
    });

    return this.apiClient.request<CreatePostResponse>('create-mixed-media/', 'POST', formData, true);
  }

  async getPost(postId: number | string): Promise<PostType> {
    return this.apiClient.request<PostType>(`${postId}/`, 'GET');
  }

  async getPosts(
    page?: number,
    postType?: 'TEXT' | 'IMAGE' | 'VIDEO',
    search?: string
  ): Promise<any> {
    let url = '';
    const params = new URLSearchParams();

    if (page) params.append('page', page.toString());
    if (postType) params.append('post_type', postType);
    if (search) params.append('search', search);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return this.apiClient.request<any>(url, 'GET');
  }

  async updatePost(postId: number | string, updates: Partial<CreatePostRequest>): Promise<CreatePostResponse> {
    // Check if we have file uploads
    const hasFiles = updates.image_file instanceof File || updates.video_file instanceof File;

    if (hasFiles) {
      const formData = new FormData();

      Object.entries(updates).forEach(([key, value]) => {
        if (value instanceof File) {
          formData.append(key, value);
        } else if (value !== undefined) {
          formData.append(key, String(value));
        }
      });

      return this.apiClient.request<CreatePostResponse>(`${postId}/`, 'PATCH', formData, true);
    } else {
      return this.apiClient.request<CreatePostResponse>(`${postId}/`, 'PATCH', updates);
    }
  }

  async deletePost(postId: number | string): Promise<void> {
    return await this.apiClient.request<void>(`${postId}/`, 'DELETE');
  }

  async togglePostLike(postId: number | string): Promise<any> {
    return this.apiClient.request<any>(`${postId}/like/`, 'POST');
  }

  async sharePost(postId: number | string, message?: string): Promise<any> {
    const body = message ? { message } : undefined;
    return this.apiClient.request<any>(`${postId}/share/`, 'POST', body);
  }

  async repost(postId: number | string, content?: string): Promise<CreatePostResponse> {
    const body = content ? { content } : undefined;
    return this.apiClient.request<CreatePostResponse>(`/${postId}/repost/`, 'POST', body);
  }

  async getPostLikes(postId: number | string): Promise<any> {
    return this.apiClient.request<any>(`${postId}/likes/`, 'GET');
  }

  async getPostComments(postId: number | string): Promise<any> {
    return this.apiClient.request<any>(`${postId}/comments/`, 'GET');
  }

  async createPostComment(postId: number | string, content: string, parent?: number | string): Promise<any> {
    const body = { content, parent };
    return this.apiClient.request<any>(`${postId}/comments/create/`, 'POST', body);
  }

  async updatePostComment(postId: number | string, commentId: number, content: string): Promise<any> {
    const body = { content };
    return this.apiClient.request<any>(`/${postId}/comments/${commentId}/`, 'PATCH', body);
  }

  async deletePostComment(postId: number | string, commentId: number): Promise<any> {
    return this.apiClient.request<any>(`${postId}/comments/${commentId}/`, 'DELETE');
  }

  async toggleCommentLike(postId: number | string, commentId: number): Promise<any> {
    return this.apiClient.request<any>(`${postId}/comments/${commentId}/like/`, 'POST');
  }

  async getCommentReplies(postId: number | string, commentId: number): Promise<any> {
    return this.apiClient.request<any>(`/${postId}/comments/${commentId}/replies/`, 'GET');
  }

  async getPostShares(postId: number | string): Promise<any> {
    return this.apiClient.request<any>(`/${postId}/shares/`, 'GET');
  }

  async getFeed(): Promise<any> {
    return this.apiClient.request<any>('feed/', 'GET');
  }

  async getTrendingPosts(): Promise<any> {
    return this.apiClient.request<any>('trending/', 'GET');
  }
}