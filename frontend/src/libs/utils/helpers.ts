


export function getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30) + 1;
    const diffYears = Math.floor(diffDays / 365);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? "s" : ""}`;
    if (diffHrs < 24) return `${diffHrs} hour${diffHrs > 1 ? "s" : ""}`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""}`;
    if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? "s" : ""}`;
    if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? "s" : ""}`;
    return `${diffYears} year${diffYears > 1 ? "s" : ""}`;
}


export default getTimeAgo;


export const getChangedFields = <T extends Record<string, any>>(
    formData: T,
    initialData: T | null
): Partial<T> => {
    const changedData: Partial<T> = {};

    if (initialData) {
        for (const key in formData) {
            if (formData[key] !== initialData[key]) {
                if (formData[key] === null || formData[key] === undefined || formData[key] === '') {
                    if (initialData[key] != null && initialData[key] !== '') {
                        changedData[key] = formData[key];
                    }
                } else {
                    changedData[key] = formData[key];
                }
            }
        }
    } else {
        Object.assign(changedData, formData);
    }

    return changedData;
};

export const hasChanges = <T extends Record<string, any>>(
    formData: T,
    initialData: T | null
): boolean => {
    return Object.keys(getChangedFields(formData, initialData)).length > 0;
};