import React from "react";
import { usePathname } from "next/navigation";

type ColumnHeaderProps = {
  headers: {
    title: React.ReactNode;
    goBack?: React.ReactNode;
    subtitle?: string;
    actions?: React.ReactNode;
    icon?: React.ReactNode;
  };
};

function ColumnHeader({ headers }: ColumnHeaderProps) {
  const pathname = usePathname();
  return (
    <div className="flex items-center justify-between h-16">
      <div className="flex">{headers.goBack}</div>
      <div className="flex">{headers.title}</div>
      <div className="flex">{headers.actions}</div>
    </div>
  );
}

export default React.memo(ColumnHeader);
