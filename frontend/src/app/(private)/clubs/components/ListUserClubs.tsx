"use client";

import React, { useEffect } from "react";
import { fetchUserClubsThunk } from "@/src/redux-store/slices/club";
import { useAppDispatch, useAppSelector } from "@/src/redux-store";
import ClubCard from "./ClubCard";
import { Search, RefreshCw } from "lucide-react";
import { fetchUser } from "@/src/redux-store/slices/user";

function ListUserClubs({ type }: { type?: "profile" | "modal" }) {
  const dispatch = useAppDispatch();
  const { currentUser } = useAppSelector((state) => state.user);
  const { userClubs, isLoading, error } = useAppSelector((state) => state.club);
  console.log("userClubs: ", userClubs);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filteredClubs, setFilteredClubs] = React.useState<any[]>([]);

  useEffect(() => {
    if (currentUser) {
      dispatch(fetchUserClubsThunk({ user_id: currentUser.id }));
    }
  }, [dispatch, currentUser]);

  useEffect(() => {
    if (userClubs?.clubs) {
      const filtered = userClubs.clubs.filter(
        (club) =>
          club.club_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          club.club_slug?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredClubs(filtered);
    }
  }, [userClubs, searchTerm]);

  useEffect(() => {
    if (!currentUser) {
      dispatch(fetchUser());
    }
  }, [dispatch, currentUser]);

  const handleRefresh = () => {
    if (currentUser) {
      dispatch(fetchUserClubsThunk({ user_id: currentUser.id }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-600">Loading your clubs...</p>
      </div>
    );
  }

  if (error) {
    console.log("error: ", error);
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <h3 className="text-lg font-semibold text-red-700 mb-2">
          Error Loading Clubs
        </h3>
        <p className="text-red-600">{error}</p>
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }
  const hasClubs =
    userClubs?.clubs &&
    Array.isArray(userClubs.clubs) &&
    userClubs.clubs.length > 0;

  if (type === "profile") {
    return (
      <>
        <div className="flex flex-col justify-center items-center min-h-[400px] space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading your clubs...</p>
        </div>
      </>
    );
  }

  if (!hasClubs) {
    console.log("No clubs found. State:", {
      userClubsExists: !!userClubs,
      clubsArray: userClubs?.clubs,
      isArray: Array.isArray(userClubs?.clubs),
      length: userClubs?.clubs?.length,
    });

    // return (
    //     <div className="text-center py-12 px-4">
    //         <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
    //             <Users className="w-8 h-8 text-gray-400" />
    //         </div>
    //         <h3 className="text-xl font-semibold text-gray-700 mb-2">No Clubs Yet</h3>
    //         <p className="text-gray-500 mb-6">You haven&apos;t joined any clubs. Explore clubs to get started!</p>
    //         <div className="space-y-3">
    //             <button
    //                 onClick={() => {/* Navigate to explore clubs */ }}
    //                 className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors block w-full sm:w-auto mx-auto"
    //             >
    //                 Explore Clubs
    //             </button>
    //             <button
    //                 onClick={handleRefresh}
    //                 className="px-6 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 mx-auto"
    //             >
    //                 <RefreshCw className="w-4 h-4" />
    //                 Refresh
    //             </button>
    //         </div>
    //     </div>
    // );
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          {/* <div>
                        <h2 className="text-2xl font-bold text-gray-900">Your Clubs</h2>
                        <p className="text-gray-600 mt-1">
                            {userClubs.clubs.length} club{userClubs.clubs.length !== 1 ? 's' : ''} you&apos;re a member of
                        </p>
                    </div> */}
          <button
            onClick={handleRefresh}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            title="Refresh clubs"
          >
            <RefreshCw className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search your clubs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Debug Info (remove in production) */}
      {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <p className="font-medium text-blue-800">Debug Info:</p>
                <p className="text-blue-700">Clubs found: {userClubs.clubs.length}</p>
                <p className="text-blue-700">First club structure: {JSON.stringify(userClubs.clubs[0] || {})}</p>
            </div> */}

      {/* Clubs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClubs.map((club, index) => (
          <ClubCard
            key={club.club_id || club.id || index}
            club={{
              club_id: club.club_id || club.id,
              club_avatar:
                club.club_avatar || club.avatar || club.profile_picture_url,
              club_banner:
                club.club_banner || club.banner || club.profile_picture_url,
              club_name: club.club_name || club.name,
              club_slug: club.club_slug || club.slug,
              club_url:
                club.club_url || `/clubs/${club.club_slug || club.slug}`,
              role_name: club.role_name || club.role || "member",
              role_permissions: club.role_permissions ||
                club.permissions || {
                  can_manage_members: false,
                  can_manage_posts: false,
                  can_manage_events: false,
                  can_manage_settings: false,
                },
              joined_at: club.joined_at || club.created_at,
              is_public: club.is_public,
              is_active: club.is_active,
            }}
          />
        ))}
      </div>

      {filteredClubs.length === 0 && searchTerm && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            No clubs found
          </h3>
          <p className="text-gray-500">
            No clubs match &quot;{searchTerm}&quot;
          </p>
          <button
            onClick={() => setSearchTerm("")}
            className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
}

export default ListUserClubs;
