"use client";
import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "../redux-store/hooks";
import { useRouter, useParams } from "next/navigation";
import Button from "./components/atoms/Button";
import Loader from "./components/atoms/Loader";
import { LogoutUser, getUserDetails } from "../libs/auth/actions/user.actions";
import { logout } from "@/src/redux-store/slices/auth";
import Link from "next/link";
import Feed from "./components/organisms/Feed";
import { setUser } from "../redux-store";
import TabbedFeed from "./components/organisms/TabbedFeed";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const router = useRouter();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);

      try {
        const result = await getUserDetails();

        if (result.success) {
          dispatch(setUser(result.data));
          setError(null);
        } else {
          setError(result.errors?.detail || "Failed to fetch user");
          if (
            result.errors?.detail === "Not authenticated" ||
            result.errors?.detail === "Session expired"
          ) {
            dispatch(logout());
            router.push("/login");
          }
        }
      } catch (err) {
        setError("Failed to fetch user details");
        console.error("Error fetching user:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [isAuthenticated, router, dispatch]);

  if (isLoading) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (error) {
    return (
      <>
        <h1>{error}</h1>
      </>
    );
  }

  return (
    // <div className="py-8">
    //   {/* <h1 className="text-4xl font-bold mb-4">Home</h1>
    //   {user && (
    //     <div className=" p-6 rounded-lg mb-6 w-1/2">
    //       <h2 className="text-2xl font-semibold mb-4">User Details</h2>
    //       <div className="space-y-2">
    //         <p><strong>Username:</strong> {user.username}</p>
    //         <p><strong>First Name:</strong> {user.first_name}</p>
    //         <p><strong>Last Name:</strong> {user.last_name}</p>
    //         <p><strong>Email:</strong> {user.email}</p>
    //         <p><strong>ID:</strong> {user.id}</p>
    //       </div>

    //       <Link
    //         href={`/${user.username}`}
    //         className="border-amber-500"
    //       >
    //         <Button
    //           name="View profile details"
    //           type="button"
    //           variant="secondary"
    //           size="squared"
    //         />
    //       </Link>
    //     </div>
    //   )} */}

    //   <Feed />
    // </div>
    <>
      <Feed />
      {/* <TabbedFeed /> */}
    </>
  );
}
