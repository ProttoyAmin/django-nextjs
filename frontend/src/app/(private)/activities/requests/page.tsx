"use client";

import { RootState, useAppDispatch, useAppSelector } from "@/src/redux-store";
import { fetchNotifications } from "@/src/redux-store/slices/notifications";
import React from "react";
import NotificationItem from "../../../components/molecules/NotificationItem";
import { Loader } from "lucide-react";

function RequestsPage() {
  const dispatch = useAppDispatch();
  const { notifications, loading, error } = useAppSelector(
    (state: RootState) => state.notifications,
  );

  React.useEffect(() => {
    // Filter only follow requests
    dispatch(fetchNotifications("follow_request"));
  }, [dispatch]);

  if (loading && !notifications) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader className="animate-spin text-gray-400 mb-2" size={32} />
        <p className="text-gray-500">Loading requests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => dispatch(fetchNotifications("follow_request"))}
          className="text-white bg-gray-800 px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const results = notifications?.results || [];

  if (results.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-8">
        <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mb-4">
          <span className="text-3xl">👤</span>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          No follow requests
        </h3>
        <p className="text-gray-500">
          Pending follow requests will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {results.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}

      {loading && (
        <div className="p-4 text-center">
          <Loader className="animate-spin mx-auto text-gray-500" size={24} />
        </div>
      )}
    </div>
  );
}

export default RequestsPage;
