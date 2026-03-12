import { RootState, useAppSelector } from "@/src/redux-store";
import React from "react";

function InstituteDetails() {
  const user = useAppSelector((state: RootState) => state.user.currentUser);
  return <div>InstituteDetails</div>;
}

export default React.memo(InstituteDetails);
