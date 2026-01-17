import { RootState } from "../../store";

// Auth selectors
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
