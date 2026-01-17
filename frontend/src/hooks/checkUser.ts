// src/hooks/useUser.ts
import { useEffect, useState } from "react";
import { getUserByUsername, getUserDetails } from "../libs/auth/actions/user.actions";
import { UserType } from "@/types";

interface UserHookReturn {
  user: UserType;
  currentUser: UserType;
  isLoading: boolean;
  errorMessage: string | null;
  isCurrentUser: boolean;
}

export function checkUser(username: string): UserHookReturn {
  const [user, setUser] = useState<UserType>({} as UserType);
  const [currentUser, setCurrentUser] = useState<UserType>({} as UserType);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const [profileResult, currentUserResult] = await Promise.all([
          getUserByUsername(username),
          getUserDetails()
        ]);

        if (profileResult.success) {
          setUser(profileResult.data);
        } else {
          if (profileResult.status === 403) {
            setErrorMessage("This profile is private.");
            setUser(profileResult.data);
          } else {
            setErrorMessage("User not found.");
          }
        }

        if (currentUserResult.success) {
          setCurrentUser(currentUserResult.data);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        setErrorMessage("Failed to load user data.");
      } finally {
        setIsLoading(false);
      }
    }

    if (username) {
      fetchData();
    }
  }, [username]);

  const isCurrentUser = currentUser && user && currentUser.username === user.username;

  return { user, currentUser, isLoading, errorMessage, isCurrentUser };
}