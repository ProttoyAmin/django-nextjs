"use client";

import React from "react";
import CreateClub from "../components/CreateClub";

function CreateClubPage() {
  return (
    <div className="w-1/2 mx-auto p-4">
      <h1 className="text-2xl font-bold text-center">Create Club</h1>
      <CreateClub />
    </div>
  );
}

export default CreateClubPage;
