'use server'
import { connApi } from "../api";
import { authenticatedRequest } from "../auth";


export async function toggleFollow(userId: string | number) {
  return authenticatedRequest(async (token) => {
    const response = await connApi.post(`${userId}/toggle/`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function getFollowStatus(userId: string | number) {
  return authenticatedRequest(async (token) => {
    const response = await connApi.get(`${userId}/status/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function getFollowers(userId: string | number, search?: string, page: number = 1) {
  return authenticatedRequest(async (token) => {
    const searchParam = search ? `?search=${search}&page=${page}` : `?page=${page}`;
    const response = await connApi.get(`${userId}/followers/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function getFollowing(userId: string | number, search?: string, page: number = 1) {
  return authenticatedRequest(async (token) => {
    const searchParam = search ? `?search=${search}&page=${page}` : `?page=${page}`;
    const response = await connApi.get(`${userId}/following/${searchParam}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function removeFollower(userId: string | number) {
  return authenticatedRequest(async (token) => {
    const response = await connApi.delete(`${userId}/remove/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function getPendingFollowRequests(page: number = 1) {
  return authenticatedRequest(async (token) => {
    const response = await connApi.get(`requests/?page=${page}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function acceptFollowRequest(userId: string | number) {
  return authenticatedRequest(async (token) => {
    const response = await connApi.post(`requests/${userId}/accept/`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function rejectFollowRequest(userId: string | number) {
  return authenticatedRequest(async (token) => {
    const response = await connApi.post(`requests/${userId}/reject/`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function blockUser(userId: string | number) {
  return authenticatedRequest(async (token) => {
    const response = await connApi.post(`${userId}/block/`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function unblockUser(userId: string | number) {
  return authenticatedRequest(async (token) => {
    const response = await connApi.post(`${userId}/unblock/`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function getBlockedUsers(page: number = 1) {
  return authenticatedRequest(async (token) => {
    const response = await connApi.get(`blocked/?page=${page}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function getSuggestedUsers() {
  return authenticatedRequest(async (token) => {
    const response = await connApi.get(`suggestions/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function getMutualFollowers(userId: string | number) {
  return authenticatedRequest(async (token) => {
    const response = await connApi.get(`${userId}/mutual/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function getMutualConnections() {
  return authenticatedRequest(async (token) => {
    const response = await connApi.get(`relations/connected/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  })
}