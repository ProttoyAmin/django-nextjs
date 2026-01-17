import { api } from "../api";
import { authenticatedRequest } from "../auth";

export async function genericToggleLike(contentType: string, objectId: string | number) {
  return authenticatedRequest(async (token) => {
    const response = await api.post(
      `activities/likes/toggle/`,
      { content_type: contentType, object_id: objectId },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  });
}

export async function genericCreateComment(
  contentType: string,
  objectId: string | number,
  content: string,
  parentId?: number
) {
  return authenticatedRequest(async (token) => {
    const response = await api.post(
      `activities/comments/create/`,
      {
        content_type: contentType,
        object_id: objectId,
        content: content,
        parent: parentId
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  });
}

export async function genericGetComments(
  contentType: string,
  objectId: string | number,
  parentId?: number,
  page: number = 1
) {
  return authenticatedRequest(async (token) => {
    let params = `?content_type=${contentType}&object_id=${objectId}&page=${page}`;
    if (parentId) params += `&parent=${parentId}`;
    
    const response = await api.get(`activities/comments/${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function genericGetLikes(contentType: string, objectId: string | number) {
  return authenticatedRequest(async (token) => {
    const response = await api.get(
      `activities/likes/?content_type=${contentType}&object_id=${objectId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  });
}

export async function checkLikeStatus(contentType: string, objectId: string | number) {
  return authenticatedRequest(async (token) => {
    const response = await api.get(
      `activities/likes/check/?content_type=${contentType}&object_id=${objectId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  });
}

export async function getMyLikes(contentType?: string, page: number = 1) {
  return authenticatedRequest(async (token) => {
    const typeParam = contentType ? `?content_type=${contentType}&page=${page}` : `?page=${page}`;
    const response = await api.get(`activities/my-likes/${typeParam}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function getMyComments(contentType?: string, page: number = 1) {
  return authenticatedRequest(async (token) => {
    const typeParam = contentType ? `?content_type=${contentType}&page=${page}` : `?page=${page}`;
    const response = await api.get(`activities/my-comments/${typeParam}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function getMyShares(page: number = 1) {
  return authenticatedRequest(async (token) => {
    const response = await api.get(`activities/my-shares/?page=${page}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function genericCreateShare(
  contentType: string,
  objectId: string | number,
  message?: string
) {
  return authenticatedRequest(async (token) => {
    const response = await api.post(
      `activities/shares/create/`,
      {
        content_type: contentType,
        object_id: objectId,
        message: message
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  });
}

export async function genericDeleteShare(contentType: string, objectId: string | number) {
  return authenticatedRequest(async (token) => {
    const response = await api.delete(`activities/shares/delete/`, {
      data: {
        content_type: contentType,
        object_id: objectId
      },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function updateComment(commentId: string | number, content: string) {
  return authenticatedRequest(async (token) => {
    const response = await api.patch(
      `activities/comments/${commentId}/`,
      { content },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data;
  });
}

export async function deleteComment(commentId: string | number) {
  return authenticatedRequest(async (token) => {
    const response = await api.delete(`activities/comments/${commentId}/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}

export async function getCommentRepliesGeneric(commentId: string | number, page: number = 1) {
  return authenticatedRequest(async (token) => {
    const response = await api.get(`activities/comments/${commentId}/replies/?page=${page}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  });
}
