"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/src/hooks/useUser";

export default function FollowingPage() {
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    if (user?.username) {
      router.replace(`/${user.username}`);
    }
  }, [user, router]);

  return null;
}
