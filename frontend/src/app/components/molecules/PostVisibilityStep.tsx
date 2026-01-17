// src/app/components/molecules/PostVisibilityStep.tsx
import React, { useEffect, useState, useMemo } from "react";
import Form, { FormField } from "../organisms/Form";
import { PostFormType } from "@/src/types/post";
import { useAuth } from "@/src/context/AuthContext";
import { X, Search } from "lucide-react";
import { Modal } from "../organisms/Modal";
import { ModalHeader } from "../organisms/ModalHeader";
import { useAppDispatch, useAppSelector } from "@/src/redux-store/hooks";
import {
  selectClubs,
  selectUserClubs,
} from "@/src/redux-store/slices/club/selectors";
import {
  fetchUserClubsThunk,
  UserClubsResponse,
} from "@/src/redux-store/slices/club";

interface PostVisibilityStepProps {
  data: Partial<PostFormType>;
  onChange: (data: Partial<PostFormType>) => void;
  onSubmit: (data: PostFormType) => void;
  isSubmitting: boolean;
}

interface ClubOption {
  value: string;
  label: string;
}

export function PostVisibilityStep({
  data,
  onChange,
  onSubmit,
  isSubmitting,
}: PostVisibilityStepProps) {
  const { currentUser } = useAuth();
  const dispatch = useAppDispatch();
  const clubEntities = useAppSelector(selectUserClubs);
  const clubs = clubEntities as UserClubsResponse;
  const [selectedClubs, setSelectedClubs] = useState<string[]>(
    data.selected_clubs || []
  );
  const [watchFields, setWatchFields] = useState<any>(null);
  const [currentDestination, setCurrentDestination] = useState<string>(
    data.post_destination || "profile"
  );

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Log if no clubs found
  useEffect(() => {
    if (clubs?.clubs?.length === 0) {
      dispatch(fetchUserClubsThunk(currentUser?.id));
    }
  }, [clubs]);

  useEffect(() => {
    onChange({
      post_destination: currentDestination as any,
      selected_clubs: selectedClubs,
    });
  }, [currentDestination, selectedClubs]);

  // Filtered clubs for valid search
  const filteredClubs = useMemo(() => {
    if (!searchQuery) return clubs?.clubs;
    return clubs?.clubs.filter((club) =>
      club.club_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [clubs, searchQuery]);

  const toggleClubSelection = (clubId: string) => {
    setSelectedClubs((prev) => {
      if (prev.includes(clubId)) {
        return prev.filter((id) => id !== clubId);
      } else {
        return [...prev, clubId];
      }
    });
  };

  const visibilityFields: FormField[] = [
    {
      name: "post_destination",
      label: "Where do you want to post?",
      type: "radio",
      options: [
        { value: "profile", label: "Profile" },
        { value: "club", label: "Club" },
      ],
      default: data.post_destination || "profile",
      required: true,
      layout: {
        colSpan: 12,
      },
    },
    {
      name: "visibility",
      label: "Who can see this post?",
      type: "select",
      options: [
        { value: "public", label: "Public" },
        { value: "private", label: "Private" },
      ],
      default: "public",
      required: true,
      floatingLabel: true,
      layout: {
        colSpan: 12,
      },
    },
  ];

  const handleFormMount = (formMethods: any) => {
    setWatchFields(() => formMethods.watch);
  };

  // Watch for post_destination changes
  useEffect(() => {
    if (watchFields) {
      const subscription = watchFields((value: any) => {
        if (value.post_destination) {
          setCurrentDestination(value.post_destination);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [watchFields]);

  const handleSubmit = (formData: Partial<PostFormType>) => {
    const finalData = {
      ...data,
      ...formData,
      post_destination: currentDestination as any,
      selected_clubs: selectedClubs,
    } as PostFormType;

    onSubmit(finalData);
  };

  const removeClub = (clubId: string) => {
    setSelectedClubs((prev) => prev.filter((id) => id !== clubId));
  };

  const getClubName = (id: string) =>
    clubs?.clubs.find((c) => c.club_id === id)?.club_name || id;

  return (
    <>
      <div className="p-6">
        <Form
          fields={visibilityFields}
          onSubmit={handleSubmit}
          submitButton={{
            text: isSubmitting ? "Creating..." : "Create Post",
            disabled:
              isSubmitting ||
              (currentDestination === "club" && selectedClubs.length === 0),
          }}
          defaultValues={data}
          resetOnSubmit={false}
          onChange={onChange}
          onFormMount={handleFormMount}
        >
          {/* Custom Club Selection UI */}
          {currentDestination === "club" && (
            <div className="space-y-4 mb-6">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="w-full flex items-center justify-between px-4 py-3 bg-[#1f1f1f] border border-gray-600 rounded-lg text-left hover:border-gray-400 transition-colors"
              >
                <span className="text-gray-300">
                  {selectedClubs.length > 0
                    ? `${selectedClubs.length} Club${
                        selectedClubs.length > 1 ? "s" : ""
                      } Selected`
                    : "Select Clubs..."}
                </span>
                <Search size={18} className="text-gray-400" />
              </button>

              {/* Selected Club Chips */}
              {selectedClubs.length > 0 && (
                <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  {selectedClubs.map((clubId) => (
                    <div
                      key={clubId}
                      className="flex items-center gap-1 pl-3 pr-1 py-1 bg-amber-100 text-amber-900 rounded-full text-sm font-medium"
                    >
                      <span>{getClubName(clubId)}</span>
                      <button
                        type="button"
                        onClick={() => removeClub(clubId)}
                        className="hover:bg-amber-200 rounded-full p-1 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Form>
      </div>

      {/* Club Selection Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="md"
      >
        <ModalHeader
          title="Select Clubs"
          onClose={() => setIsModalOpen(false)}
        />
        <div className="p-4 h-[60vh] flex flex-col">
          {/* Search Input */}
          <div className="relative mb-4">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search clubs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#2a2a2a] border border-gray-600 rounded-lg focus:outline-none focus:border-amber-500 text-white"
            />
          </div>

          {/* Club List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {filteredClubs?.length > 0 ? (
              filteredClubs?.map((club) => (
                <label
                  key={club.club_id}
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedClubs?.includes(club.club_id)
                      ? "bg-amber-500/20 border border-amber-500/50"
                      : "hover:bg-[#2a2a2a] border border-transparent"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={selectedClubs?.includes(club.club_id)}
                    onChange={() => toggleClubSelection(club.club_id)}
                  />
                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors ${
                      selectedClubs?.includes(club.club_id)
                        ? "bg-amber-500 border-amber-500"
                        : "border-gray-500"
                    }`}
                  >
                    {selectedClubs?.includes(club.club_id) && (
                      <svg
                        className="w-3.5 h-3.5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-gray-200">{club.club_name}</span>
                </label>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                {searchQuery
                  ? "No clubs found matching your search"
                  : "No clubs available"}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-700 flex justify-end">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-2 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
