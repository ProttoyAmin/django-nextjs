import { authenticatedRequest } from '../libs/auth/auth';
import { UploadResponse } from '../types/post';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    data?: any,
    isFormData: boolean = false
  ): Promise<T> {
    return authenticatedRequest<T>(async (token: string) => {
      const config: RequestInit = {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        },
      };

      if (data) {
        if (isFormData) {
          config.body = data;
        } else {
          config.body = JSON.stringify(data);
        }
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    }).then(result => {
      if (result.success) {
        return result.data as T;
      } else {
        throw new Error(result.errors?.detail || 'Request failed');
      }
    });
  }

  // async uploadFile(file: File, fileType: 'image' | 'video'): Promise<UploadResponse> {
  //   return authenticatedRequest<UploadResponse>(async (token: string) => {
  //     const formData = new FormData();
  //     formData.append('file', file);

  //     const response = await fetch(`${this.baseUrl}/upload-media/?type=${fileType}`, {
  //       method: 'POST',
  //       headers: {
  //         'Authorization': `Bearer ${token}`,
  //       },
  //       body: formData,
  //     });

  //     if (!response.ok) {
  //       const errorData = await response.json().catch(() => ({}));
  //       throw new Error(errorData.detail || `Upload failed with status: ${response.status}`);
  //     }

  //     return await response.json();
  //   }).then(result => {
  //     if (result.success) {
  //       return result.data as UploadResponse;
  //     } else {
  //       throw new Error(result.errors?.detail || 'Upload failed');
  //     }
  //   });
  // }
}