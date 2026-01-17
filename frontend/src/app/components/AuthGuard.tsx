"use client";

import { useAppSelector } from "@/src/redux-store/hooks";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthGuardProps } from "@/types";
import Loader from "./atoms/Loader";
import { PUBLIC_ROUTES } from '@/src/libs/constants';

export default function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAppSelector((state) => state.auth);
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const isPublicRoute = PUBLIC_ROUTES.some(route => route === pathname);

    if (auth.isAuthenticated) {
      if (isPublicRoute) {
        router.replace("/");
      }
      return;
    } else if (!auth.isAuthenticated && !isPublicRoute) {
      // router.replace("/login");
      return;
    }
  }, [auth.isAuthenticated, pathname, requireAuth, router]);

  // Optional: you can add a loading indicator if auth is still being hydrated
  if (isLoading) {
    return <Loader />
  }
  return <>{children}</>;
}
