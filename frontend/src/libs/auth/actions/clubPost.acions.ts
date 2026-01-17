'use server'

import { api } from "../api";
import { clubApi } from "../api";
import { authenticatedRequest } from "../auth";

export async function getClubPosts(clubId: string | number, page: number = 1) {
  return authenticatedRequest(async (token) => {
    const response = await clubApi.get(`${clubId}/posts/?page=${page}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}


export async function getClubPostDetail(clubId: string | number, postId: string | number) {
  return authenticatedRequest(async (token) => {
    const response = await clubApi.get(`${clubId}/posts/${postId}/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function updateClubPost(clubId: string | number, postId: string | number, data: {
  title?: string;
  content?: string;
  image?: string;
}) {
  return authenticatedRequest(async (token) => {
    const response = await clubApi.patch(`clubs/${clubId}/posts/${postId}/`, data, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function deleteClubPost(clubId: string | number, postId: string | number) {
  return authenticatedRequest(async (token) => {
    const response = await clubApi.delete(`clubs/${clubId}/posts/${postId}/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function toggleClubPostLike(clubId: string | number, postId: string | number) {
  return authenticatedRequest(async (token) => {
    const response = await api.post(`clubs/${clubId}/posts/${postId}/like/`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function getClubPostComments(clubId: string | number, postId: string | number, page: number = 1) {
  return authenticatedRequest(async (token) => {
    const response = await api.get(`clubs/${clubId}/posts/${postId}/comments/?page=${page}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function createClubPostComment(
  clubId: string | number,
  postId: string | number,
  content: string,
  parentId?: number
) {
  return authenticatedRequest(async (token) => {
    const response = await api.post(
      `clubs/${clubId}/posts/${postId}/comments/create/`,
      { content, parent: parentId },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  });
}

export async function toggleClubPostShare(clubId: string | number, postId: string | number, message?: string) {
  return authenticatedRequest(async (token) => {
    const response = await api.post(
      `clubs/${clubId}/posts/${postId}/share/`,
      { message },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  });
}