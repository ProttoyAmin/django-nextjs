"use client";

import { RootState, useAppDispatch, useAppSelector } from "@/src/redux-store";
import { fetchNotifications } from "@/src/redux-store/slices/notifications";
import React from "react";

function ActivitiesPage() {
  const dispatch = useAppDispatch();
  const { notifications, loading, error } = useAppSelector(
    (state: RootState) => state.notifications,
  );

  React.useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);
  return (
    <div>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div>Error: {error}</div>
      ) : (
        <div className="flex flex-col gap-4">
          {notifications?.results?.map((notification) => (
            <div key={notification.id} className="flex flex-col gap-2">
              <p>{notification.message}</p>
              <p>{notification.created_at}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ActivitiesPage;
