'use server'
import { LForm, RForm, UserType } from '@/types';
import { setServerCookie, getServerCookie, deleteServerCookie } from '../../utils/cookieUtils'
import { api, clubApi, connApi, postApi } from "../api"
import { authenticatedRequest } from "../auth";

export async function RegisterUser(data: RForm) {
  try {
    const response = await api.post("register/", data);
    return { success: true, data: response.data };
  } catch (error: any) {
    if (error.response && error.response.data) {
      return {
        success: false,
        errors: error.response.data
      };
    } else {
      return {
        success: false,
        errors: { detail: "Something went wrong!" }
      };
    }
  }
}


export async function registerUser(data: RForm) {
  try {
    const response = await api.post("users/", data);
    return { success: true, data: response.data };
  } catch (error: any) {
    if (error.response && error.response.data) {
      return {
        success: false,
        errors: error.response.data
      };
    } else {
      return {
        success: false,
        errors: { detail: "Something went wrong!" }
      };
    }
  }
}

export async function LoginUser(credentials: LForm) {
  try {
    const response = await api.post('obtain/', credentials);

    await setServerCookie('access', response.data.access, {
      maxAge: 60 * 2, // 60 minutes
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    await setServerCookie('refresh', response.data.refresh, {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return { success: true, data: response.data };
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

export async function LogoutUser() {
  try {
    const accessToken = await getServerCookie('access');
    const refreshToken = await getServerCookie('refresh');

    if (accessToken && refreshToken) {
      try {
        await api.post(
          '/jwt/logout/',
          { refresh: refreshToken },
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );
      } catch (error) {
        console.error("Backend logout failed:", error);
      }
    }

    await deleteServerCookie('access', '/');
    await deleteServerCookie('refresh', '/');

    return { success: true, data: { message: "Logged out successfully" } };
  } catch (error: any) {
    await deleteServerCookie('access', '/');
    await deleteServerCookie('refresh', '/');

    if (error.response && error.response.data) {
      return {
        success: false,
        errors: error.response.data
      };
    } else {
      return {
        success: false,
        errors: { detail: "Something went wrong!" }
      };
    }
  }
}


export async function CheckAuth() {
  return authenticatedRequest(async (token) => {
    const response = await api.get('users/me/', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}


// libs/auth/auth.ts
export async function getUserByUsername(username: string) {
  try {
    const accessToken = await getServerCookie('access');

    const response = await api.get(`users/user/${username}/`, {
      headers: accessToken ? {
        'Authorization': `Bearer ${accessToken}`
      } : {}
    });

    return {
      success: true,
      data: response.data,
      status: response.status,
    };
  } catch (error: any) {
    if (error.response) {
      console.warn("Error fetching user:", error.response.data);
      return {
        success: false,
        data: error.response.data,
        status: error.response.status,
      };
    }
    return {
      success: false,
      errors: { detail: "Something went wrong!" }
    };
  }
}

export async function getUserRoles(clubId: string | number, userId: string | number) {
  return authenticatedRequest(async (token) => {
    const response = await clubApi.get(`${clubId}/roles/user/${userId}/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}


export async function getUserById(userId: string | number) {
  try {
    const accessToken = await getServerCookie('access');

    const response = await api.get(`${userId}/`, {
      headers: accessToken ? {
        'Authorization': `Bearer ${accessToken}`
      } : {}
    });

    return {
      success: true,
      data: response.data,
      status: response.status,
    };
  } catch (error: any) {
    if (error.response) {
      return {
        success: false,
        data: error.response.data,
        status: error.response.status,
      };
    }
    return {
      success: false,
      errors: { detail: "Something went wrong!" }
    };
  }
}

export async function getUserDetails() {
  return authenticatedRequest(async (token) => {
    const response = await api.get(`me/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function updateUserProfile(data: UserType) {
  return authenticatedRequest(async (token) => {
    const response = await api.patch('me/profile/', data, {
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

    const response = await api.post('me/upload-profile-picture/', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      }
    });
    return response.data;
  });
}


export async function clearProfilePicture() {
  return authenticatedRequest(async (token) => {

    const response = await api.post('me/clear-profile-picture/', {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      }
    });
    return response.data;
  });
}


export async function searchUsers(query: string) {
  return authenticatedRequest(async (token) => {
    const response = await api.get(`users/?search=${query}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}


export async function getUserClubs(userId: string | number, role?: 'admin' | 'moderator' | 'member') {
  return authenticatedRequest(async (token) => {
    const roleParam = role ? `?role=${role}` : '';
    const response = await api.get(`${userId}/clubs/${roleParam}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function getUserPosts(
  userId: string | number,
  post_type?: 'TEXT' | 'IMAGE' | 'VIDEO',
  source?: 'all' | 'user' | 'club',
  page: number = 1
) {
  return authenticatedRequest(async (token) => {
    let params = new URLSearchParams();
    params.append('page', page.toString());

    if (source) {
      params.append('source', source);
    }

    if (post_type) {
      params.append('post_type', post_type);
    }

    const response = await api.get(`${userId}/posts/?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function getUserActivity(userId: string | number, limit: number = 10) {
  return authenticatedRequest(async (token) => {
    const response = await api.get(`users/${userId}/activity/?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}
export async function connectUserToInstitute(data: any) {
  return authenticatedRequest(async (token) => {
    const response = await api.post(`validate/`, data, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}



export async function activateUser(uid: string, token: string) {
  try {
    const response = await api.post("users/activation/", { uid, token });
    return { success: true, data: response.data };
  } catch (error: any) {
    if (error.response && error.response.data) {
      return {
        success: false,
        errors: error.response.data
      };
    } else {
      return {
        success: false,
        errors: { detail: "Something went wrong!" }
      };
    }
  }
}
