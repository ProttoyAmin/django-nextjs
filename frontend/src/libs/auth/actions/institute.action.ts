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