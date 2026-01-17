import { RootState } from "@/src/redux-store";

export const selectClubById = (state: RootState, clubId: string | number) => state.club.entities[clubId];
export const selectClubLoading = (state: RootState) => state.club.isLoading;
export const selectClubError = (state: RootState) => state.club.error;
export const selectClubEntities = (state: RootState) => state.club.entities;
export const selectCurrentClub = (state: RootState) =>
    state.club.currentClubId ? state.club.entities[state.club.currentClubId] : null;
export const selectCurrentClubId = (state: RootState) => state.club.currentClubId;
export const selectClubs = (state: RootState) => state.club.entities;
export const clearClub = (state: RootState) => state.club.currentClubId = null;
export const selectUserClubs = (state: RootState) => state?.club?.userClubs;