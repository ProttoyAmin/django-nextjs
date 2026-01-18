"use client";

import { useAppDispatch } from "@/src/redux-store";
import { usePathname } from "next/navigation";
import Column from "./organisms/Column";
import ColumnBody from "./organisms/ColumnBody";
import Menu from "./molecules/Menu";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import Button from "./atoms/Button";

export default function LayoutsWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Show back button if we are in a sub-activity page
  const showGoBack = !pathname.includes("/activities");

  const renderColumn = () => {
    return (
      <Column
        headerProps={{
          goBack: showGoBack ? (
            <Link
              href="/activities"
              className="flex items-center justify-center w-10 h-10 hover:bg-gray-800 rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
          ) : null,
          title: <Menu />,
          actions: (
            <Button
              name=""
              onClick={() => console.log("New Post")}
              icon={<Plus size={20} />}
              variant="ghost"
              size="sm"
              className="w-10 h-10 p-0"
            />
          ),
        }}
        bodyContent={<ColumnBody bodyContent={children} />}
      />
    );
  };

  return <>{renderColumn()}</>;
}
