import React, { useEffect, useRef, useState } from "react";
import { menuItems } from "@/src/constants/Menu";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import useClickOutside from "@/src/hooks/handleClickOutside";

type MenuProps = {};

function Menu({}: MenuProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [dropMenu, setDropMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathName = usePathname();

  const isActivePath = (path: string) => {
    return pathName === path;
  };

  // Get active menu title based on current path
  const getActiveMenuTitle = () => {
    // First check for exact matches
    const exactMatch = menuItems.find((item) => pathName === item.href);
    if (exactMatch) return exactMatch.title;

    // Then check for path includes (like activities)
    const partialMatch = menuItems.find(
      (item) => item.href !== "/" && pathName.includes(item.href),
    );
    if (partialMatch) return partialMatch.title;

    // Fallback to the current active menu state
    return activeMenu || "Menu";
  };

  // Initialize active menu based on current path on mount
  useEffect(() => {
    const currentMenuItem = menuItems.find(
      (item) =>
        pathName === item.href ||
        (item.href !== "/" && pathName.includes(item.href)),
    );
    if (currentMenuItem) {
      setActiveMenu(currentMenuItem.title);
    }
  }, [pathName]);

  const handleClick = () => {
    setDropMenu(!dropMenu);
  };

  const renderMenu = () => {
    const activeTitle = getActiveMenuTitle();

    return (
      <>
        <div className="flex flex-col gap-5 items-center">
          <div className="flex gap-5 items-center">
            <h1 className="text-lg font-semibold">{activeTitle}</h1>

            <div className="relative">
              <div
                className="rounded-full border border-[#262626] w-8 h-8 cursor-pointer flex items-center justify-center"
                onClick={handleClick}
              >
                <ChevronDown size={20} />
              </div>

              {dropMenu && (
                <div
                  ref={menuRef}
                  className="bg-[#262626] absolute right-0 top-full mt-2 rounded-md shadow-lg p-2 flex flex-col gap-2 z-10 min-w-[150px] origin-top animate-in fade-in-0 zoom-in-95 duration-300"
                >
                  {menuItems.map((item, index) => (
                    <div
                      key={item.title}
                      className="animate-in fade-in-0 slide-in-from-left-2 duration-300"
                      style={{
                        animationDelay: `${index * 50}ms`,
                      }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => {
                          setActiveMenu(item.title);
                          setDropMenu(false);
                        }}
                        className={`block px-4 py-2 rounded-md transition-colors ${
                          isActivePath(item.href)
                            ? "bg-black text-white"
                            : "text-[#6d6d6d] hover:bg-gray-100"
                        }`}
                      >
                        {item.title}
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  };

  return <div className="flex gap-5">{renderMenu()}</div>;
}

export default React.memo(Menu);
