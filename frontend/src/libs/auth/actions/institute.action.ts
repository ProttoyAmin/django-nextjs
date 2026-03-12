'use server'

import { InstituteService } from "@/src/services/InstituteService";
import axios from "axios";

const NEXT_PUBLIC_INSTITUTES_API = process.env.NEXT_PUBLIC_INSTITUTES_API
const instituteService = new InstituteService();

export async function getInstituteCodesOnly() {
    try {
        const response = await axios.get(`${NEXT_PUBLIC_INSTITUTES_API}?fields=code`);
        if (response.status === 200) {
            return {
                success: true,
                data: response.data
            };
        }
        return {
            success: false,
            errors: { detail: `Unexpected status code: ${response.status}` }
        };
    } catch (error: any) {
        return {
            success: false,
            errors: { detail: error.message || "Failed to get institute" }
        };
    }
}

export async function getInstitutes(query?: string) {
    return instituteService.getInstitutes(query);
}

export async function getInstituteById(id: string) {
    try {
        const response = await instituteService.getInstituteById(id);
        if (response && response.success) {
            return {
                success: true,
                data: response.data
            };
        }
        return {
            success: false,
            errors: response?.errors || { detail: "Failed to get institute" }
        };
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

export async function authenticateUserType(data: any) {
    try {
        const response = await instituteService.authenticateUserType(data);
        if (response && response.success) {
            return {
                success: true,
                data: response.data
            };
        }
        return {
            success: false,
            errors: response?.errors || { detail: "Authentication failed" }
        };
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