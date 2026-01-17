"use client";

import React from "react";
import Button from "../atoms/Button";
import { PostType } from "@/src/types/post";
import { useAppSelector } from "@/src/redux-store";
import { useRouter } from "next/navigation";

interface Option {
  name?: string;
  onClick?: () => void;
  variant?: string;
  type?: string;
}

interface OptionsProps {
  items?: Option[];
  post?: PostType;
  setAction?: (action: boolean) => void;
  type?: string;
}

const Options = ({ items, post, setAction, type }: OptionsProps) => {
  const user = useAppSelector((state) => state.user.currentUser);
  const router = useRouter();

  const feedOptions = [
    {
      name: post?.author_id === user?.id ? "Info" : "Report",
      onClick: () => router.push(`/p/${post?.id}`),
      variant: "ghost",
    },
    {
      name: "Close",
      onClick: () => {
        setAction;
      },
      variant: "secondary",
    },
  ];

  if (type === "delete") {
    return (
      <>
        {items?.map((item, index) => (
          <Button
            key={index}
            name={item.name}
            onClick={item.onClick}
            variant={item.variant || "ghost"}
            size="sm"
            fullWidth
          />
        ))}
      </>
    );
  }

  if (type === "club") {
    const router = useRouter();
    const items = [
      {
        name: "Info",
        onClick: () => router.push(`/p/${post?.id}`),
        variant: "ghost",
      },
      {
        name: "Close",
        onClick: () => {
          setAction;
        },
        variant: "secondary",
      },
    ];
    return (
      <>
        {items?.map((item, index) => (
          <Button
            key={index}
            name={item.name}
            onClick={item.onClick}
            variant={item.variant || "ghost"}
            size="sm"
            fullWidth
          />
        ))}
      </>
    );
  }

  return (
    <>
      {items?.map((item, index) => (
        <Button
          key={index}
          name={item.name}
          onClick={item.onClick}
          variant={item.variant || "ghost"}
          size="sm"
          fullWidth
        />
      ))}
    </>
  );
};

export default React.memo(Options);
