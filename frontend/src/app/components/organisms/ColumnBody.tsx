import React from "react";

type ColumnBodyProps = {
  bodyContent: React.ReactNode;
};

function ColumnBody({ bodyContent }: ColumnBodyProps) {
  return <div className="bg-[#181818] rounded-xl p-4">{bodyContent}</div>;
}

export default React.memo(ColumnBody);
