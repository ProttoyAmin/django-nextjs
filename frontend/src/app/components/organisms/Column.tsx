import React from "react";
import ColumnHeader from "./ColumnHeader";
import ColumnBody from "./ColumnBody";

type ColumnProps = {
  headerProps: {
    title: React.ReactNode;
    goBack?: React.ReactNode;
    subtitle?: string;
    actions?: React.ReactNode;
    icon?: React.ReactNode;
  };
  bodyContent: React.ReactNode;
};

function Column({ headerProps, bodyContent }: ColumnProps) {
  return (
    <>
      <div className="min-h-screen w-full md:w-1/2 mx-auto">
        <ColumnHeader headers={headerProps} />
        <ColumnBody bodyContent={bodyContent} />
      </div>
    </>
  );
}

export default React.memo(Column);
