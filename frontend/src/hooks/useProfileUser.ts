// src/hooks/useProfileUser.ts
import { useEffect, useState } from "react";
import { getUserByUsername } from "../libs/auth/actions/user.actions";
import { UserType } from "@/types";

interface ProfileUserHookReturn {
  user: UserType | null;
  isLoading: boolean;
  errorMessage: string | null;
}

export function useProfileUser(username: string): ProfileUserHookReturn {
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!username) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await getUserByUsername(username);

        if (result.success) {
          setUser(result.data);
        } else {
          setErrorMessage("Failed to load user profile.");
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setErrorMessage("Failed to load user profile.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [username]);

  return { user, isLoading, errorMessage };
}