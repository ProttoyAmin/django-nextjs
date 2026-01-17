import { api } from "../api";
import { authenticatedRequest } from "../auth";

export async function getClubEvents(clubId: string | number, eventStatus?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled', page: number = 1) {
  return authenticatedRequest(async (token) => {
    const statusParam = eventStatus ? `?status=${eventStatus}&page=${page}` : `?page=${page}`;
    const response = await api.get(`clubs/${clubId}/events/${statusParam}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function createClubEvent(clubId: string | number, data: {
  title: string;
  description: string;
  location?: string;
  start_time: string;
  end_time: string;
  status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  max_participants?: number;
  image?: string;
}) {
  return authenticatedRequest(async (token) => {
    const response = await api.post(`clubs/${clubId}/events/create/`, data, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function getClubEventDetail(clubId: string | number, eventId: string | number) {
  return authenticatedRequest(async (token) => {
    const response = await api.get(`clubs/${clubId}/events/${eventId}/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function updateClubEvent(clubId: string | number, eventId: string | number, data: {
  title?: string;
  description?: string;
  location?: string;
  start_time?: string;
  end_time?: string;
  status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  max_participants?: number;
  image?: string;
}) {
  return authenticatedRequest(async (token) => {
    const response = await api.patch(`clubs/${clubId}/events/${eventId}/`, data, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function deleteClubEvent(clubId: string | number, eventId: string | number) {
  return authenticatedRequest(async (token) => {
    const response = await api.delete(`clubs/${clubId}/events/${eventId}/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function joinClubEvent(clubId: string | number, eventId: string | number) {
  return authenticatedRequest(async (token) => {
    const response = await api.post(`clubs/${clubId}/events/${eventId}/join/`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function leaveClubEvent(clubId: string | number, eventId: string | number) {
  return authenticatedRequest(async (token) => {
    const response = await api.post(`clubs/${clubId}/events/${eventId}/leave/`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function getEventParticipants(clubId: string | number, eventId: string | number) {
  return authenticatedRequest(async (token) => {
    const response = await api.get(`clubs/${clubId}/events/${eventId}/participants/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}