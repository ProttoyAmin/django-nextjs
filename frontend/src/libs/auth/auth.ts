// libs/auth/auth.ts
'use server'
import { setServerCookie, getServerCookie, deleteServerCookie } from '../utils/cookieUtils'
import { api } from "./api"

export async function refreshAccessToken(): Promise<string | null> {
  try {
    const refreshToken = await getServerCookie('refresh');

    if (!refreshToken) {
      return null;
    }

    const response = await api.post('jwt/refresh/', {
      refresh: refreshToken
    });

    await setServerCookie('access', response.data.access, {
      maxAge: 60 * 60,  // 60 minutes
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    if (response.data.refresh) {
      await setServerCookie('refresh', response.data.refresh, {
        maxAge: 60 * 60 * 24 * 30,   // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
    }

    return response.data.access;
  } catch (error) {
    console.error('Token refresh failed:', error);
    await deleteServerCookie('access', '/');
    await deleteServerCookie('refresh', '/');
    return null;
  }
}

export async function authenticatedRequest<T>(
  requestFn: (token: string) => Promise<T>
): Promise<{ success: boolean; data?: T; errors?: any }> {
  try {
    let accessToken = await getServerCookie('access');

    if (!accessToken) {
      accessToken = await refreshAccessToken();
      if (!accessToken) {
        return {
          success: false,
          errors: { detail: "Not authenticated" }
        };
      }
    }

    try {
      const result = await requestFn(accessToken);
      return { success: true, data: result };
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('Token expired, refreshing...');
        accessToken = await refreshAccessToken();
        console.log(accessToken)

        if (!accessToken) {
          return {
            success: false,
            errors: { detail: "Session expired" }
          };
        }

        const result = await requestFn(accessToken);
        console.log(result)
        return { success: true, data: result };
      }

      throw error;
    }
  } catch (error: any) {
    if (error.response && error.response.data) {
      return {
        success: false,
        errors: error.response.data
      };
    } else {
      return {
        success: false,
        errors: { detail: error.message || "Something went wrong!" }
      };
    }
  }
}



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


export async function uploadProfilePicture(file: File) {
  return authenticatedRequest(async (token) => {
    const formData = new FormData();
    formData.append('profile_picture', file);

    const response = await api.post('users/upload-profile-picture/', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      }
    });
    return response.data;
  });
}
