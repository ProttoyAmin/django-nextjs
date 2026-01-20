import { Club } from "./club";

export interface Institute {
    id: number;
    name: string;
    code: string;
    country: string;
    address: string;
    portal: string;
    phone: string;
    email_domains: { type: string; domain: string }[];
    website: string;
    clubs: Club[];
    logo: string;
    is_active: boolean;
    established_year: number;
    contact_number: string;
    created_at: string;
    updated_at: string;
}

export interface InstitutePaginatedData {
    count: number;
    next: string | null;
    previous: string | null;
    results: Institute[];
}
