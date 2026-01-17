// src/hooks/useUser.ts
import { useEffect, useState, useRef } from "react";
import { getUserDetails } from "../libs/auth/actions/user.actions";
import { UserType } from "@/types";
import { useAppDispatch } from "../redux-store";
import { fetchUser } from "../redux-store/slices/user";

interface UserHookReturn {
  user: UserType | null;
  isLoading: boolean;
  errorMessage: string | null;
}

export function useUser(): UserHookReturn {
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasFetched = useRef(false);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (hasFetched.current) return;

    hasFetched.current = true;

    async function fetchData() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        // const result = await getUserDetails();
        const result = await dispatch(fetchUser()).unwrap();

        if (result) {
          setUser(result);
        } else {
          setErrorMessage("Failed to load user data.");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        setErrorMessage("Failed to load user data.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []); // Empty dependency array ensures this only runs once

  return { user, isLoading, errorMessage };
}