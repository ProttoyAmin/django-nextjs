'use server'

import { api } from "../auth/api";
import { authenticatedRequest, refreshAccessToken } from "../auth/auth";
import { getServerCookie } from "./cookieUtils";

export async function getProtectedData(endpoint: string) {
  return authenticatedRequest(async (token) => {
    const response = await api.get(endpoint, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

// Helper function to check if user is authenticated (has valid token)
export async function isAuthenticated(): Promise<boolean> {
  const accessToken = await getServerCookie('access');
  const refreshToken = await getServerCookie('refresh');

  if (accessToken) return true;
  if (refreshToken) {
    const newToken = await refreshAccessToken();
    return !!newToken;
  }

  return false;
}

// Helper function to get current access token (useful for API calls)
export async function getAccessToken(): Promise<string | null> {
  let accessToken = await getServerCookie('access');

  if (!accessToken) {
    accessToken = await refreshAccessToken();
  }

  return accessToken;
}
