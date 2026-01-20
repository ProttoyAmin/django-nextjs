import { ApiClient } from './ApiClient';

const INSTITUTE_API_URL = process.env.NEXT_PUBLIC_INSTITUTES_API || '';

export class InstituteService {
    private apiClient: ApiClient;

    constructor() {
        this.apiClient = new ApiClient(INSTITUTE_API_URL);
    }

    async getInstitutes(query?: string): Promise<any> {
        return this.apiClient.request<any>(`?${query}`, 'GET');
    }
}