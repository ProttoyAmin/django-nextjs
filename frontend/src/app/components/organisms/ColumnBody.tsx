import React from "react";

type ColumnBodyProps = {
  bodyContent: React.ReactNode;
};

function ColumnBody({ bodyContent }: ColumnBodyProps) {
  return <div className="bg-[#1c1e21] rounded-xl p-4">{bodyContent}</div>;
}

export default React.memo(ColumnBody);
