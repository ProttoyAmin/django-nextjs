import React from "react";

function Info() {
  return (
    <>
      <div className="text-center flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Info</h1>
        <p className="text-gray-400">
          You will only see the sections which you have permissions for.
        </p>
      </div>
    </>
  );
}

export default Info;
