import Button from "@/src/app/components/atoms/Button";
import SizeAvatars from "@/src/app/components/organisms/Avatar";
import { UserType } from "@/types";
import Image from "next/image";
import Link from "next/link";
import ProfileCard from "./ProfileCard";

interface PrivateProps {
  user: UserType;
  currentUser?: UserType;
}

function PrivateProfile({ user, currentUser }: PrivateProps) {
  const isAuthenticated = !!currentUser;
  return (
    <>
      <div className="flex flex-col items-center justify-center h-screen">
        <ProfileCard
          user={user}
          isCurrentUser={currentUser?.id === user.id}
          isAuthenticated={isAuthenticated}
        />
        <p className="mb-4">{user?.detail}</p>
        {user && (
          <div className="text-center">
            {user.avatar && <SizeAvatars user={user} size={100} />}
            <p className="text-xl font-semibold">@{user?.username}</p>
            {user?.follower_count !== undefined &&
              user?.following_count !== undefined &&
              user?.user_post_count !== undefined && (
                <>
                  <p className="text-gray-600">
                    Followers: {user?.follower_count}
                  </p>
                  <p className="text-gray-600">
                    Following: {user?.following_count}
                  </p>
                  <p className="text-gray-600">
                    Posts: {user?.user_post_count}
                  </p>
                </>
              )}
          </div>
        )}
        <Link href="/" className="mt-4">
          <Button name="Go Home" variant="secondary" />
        </Link>
      </div>
    </>
  );
}

export default PrivateProfile;
