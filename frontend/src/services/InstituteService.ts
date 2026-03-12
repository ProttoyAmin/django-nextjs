import { ApiClient } from './ApiClient';

const INSTITUTE_API_URL = process.env.NEXT_PUBLIC_INSTITUTES_API || '';
const ACCOUNTS_API_URL = process.env.NEXT_PUBLIC_ACCOUNTS_API || '';

export class InstituteService {
    private apiClient: ApiClient;

    constructor() {
        this.apiClient = new ApiClient(INSTITUTE_API_URL);
    }

    async getInstitutes(query?: string): Promise<any> {
        return this.apiClient.request<any>(`?${query}`, 'GET');
    }

    async getInstituteById(id: string): Promise<any> {
        return this.apiClient.request<any>(`${id}/`, 'GET');
    }

    async authenticateUserType(data: any): Promise<any> {
        return this.apiClient.request<any>(`validate/`, 'POST', data);
    }
}