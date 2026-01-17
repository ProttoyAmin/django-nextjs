'use server'

import { mediaData } from "@/src/redux-store/slices/club";
import { clubApi } from "../api";
import { authenticatedRequest } from "../auth";
import { RoleType } from "@/src/redux-store/slices/roles";
import { Club } from "@/src/types/club";

export async function getClubs(search?: string, myClubs: boolean = false, page: number = 1) {
  return authenticatedRequest(async (token) => {
    let params = `?page=${page}`;
    if (search) params += `&search=${search}`;
    if (myClubs) params += `&my_clubs=true`;

    const response = await clubApi.get(`clubs/${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function createClub(data: {
  name: string;
  about?: string;
  avatar?: string;
  banner?: string;
}) {
  return authenticatedRequest(async (token) => {
    const response = await clubApi.post(`create/`, data, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function getClubDetail(clubId: string | number) {
  return authenticatedRequest(async (token) => {
    const response = await clubApi.get(`${clubId}/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function updateClub(clubId: string | number, data: Partial<Club>) {
  return authenticatedRequest(async (token) => {
    const response = await clubApi.patch(`${clubId}/`, data, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function deleteClub(clubId: string | number) {
  return authenticatedRequest(async (token) => {
    const response = await clubApi.delete(`${clubId}/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function joinClub(clubId: string | number) {
  return authenticatedRequest(async (token) => {
    const response = await clubApi.post(`${clubId}/join/`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function leaveClub(clubId: string | number) {
  return authenticatedRequest(async (token) => {
    const response = await clubApi.post(`${clubId}/leave/`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function getClubMembers(clubId: string | number, role?: string) {
  return authenticatedRequest(async (token) => {
    const roleParam = role ? `?role=${role}` : '';
    const response = await clubApi.get(`${clubId}/members/${roleParam}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function updateMemberRole(clubId: string | number, userId: string | number, role: 'member' | 'moderator' | 'admin') {
  return authenticatedRequest(async (token) => {
    const response = await clubApi.patch(
      `${clubId}/members/${userId}/role/`,
      { role },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  });
}

export async function removeMember(clubId: string | number, userId: string | number) {
  return authenticatedRequest(async (token) => {
    const response = await clubApi.delete(`${clubId}/members/${userId}/remove/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}


export async function updateClubMedia(clubId: string | number, avatar?: File, banner?: File, type?: 'remove' | 'update') {
  return authenticatedRequest(async (token) => {
    const formData = new FormData();
    if (avatar) formData.append('avatar', avatar);
    if (banner) formData.append('banner', banner);

    const response = await clubApi[type === 'remove' ? 'delete' : 'post'](`${clubId}/upload-media/`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      }
    });
    return response.data;
  });
}

// export async function removeClubMedia(clubId: string | number, mediaType: 'avatar' | 'banner') {
//   return authenticatedRequest(async (token) => {
//     const response = await clubApi.delete(`${clubId}/upload-media/${mediaType}/`, {
//       headers: {
//         'Authorization': `Bearer ${token}`
//       }
//     });
//     return response.data;
//   });
// }


export async function getRoles(clubId: string | number) {
  return authenticatedRequest(async (token) => {
    const response = await clubApi.get(`${clubId}/roles/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function createRole(clubId: string | number, data: RoleType) {
  return authenticatedRequest(async (token) => {
    const response = await clubApi.post(`${clubId}/roles/create/`, data, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function updateRole(clubId: string | number, roleId: string | number, data: RoleType) {
  return authenticatedRequest(async (token) => {
    const response = await clubApi.patch(`${clubId}/roles/${roleId}/`, data, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function deleteRole(clubId: string | number, roleId: string | number) {
  return authenticatedRequest(async (token) => {
    const response = await clubApi.delete(`${clubId}/roles/${roleId}/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function assignRole(clubId: string | number, userId: string | number, data: RoleType) {
  return authenticatedRequest(async (token) => {
    const response = await clubApi.post(`${clubId}/roles/assign/${userId}/`, data, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}
