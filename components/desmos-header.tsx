"use client";

import { useRouter } from "next/navigation";
import { memo, useState } from "react";
import { useWindowSize } from "usehooks-ts";
import { SidebarToggle } from "@/components/sidebar-toggle";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PlusIcon } from "./icons";
import { useSidebar } from "./ui/sidebar";

function PureDesmosHeader() {
  const router = useRouter();
  const { open } = useSidebar();
  const { width: windowWidth } = useWindowSize();
  const [isHeaderVisible, setIsHeaderVisible] = useState(false);

  return (
    <div className="relative shrink-0">
      {/* Invisible hover zone at top - triggers expand when collapsed */}
      <div
        aria-hidden
        className="absolute top-0 left-0 right-0 z-10 h-4"
        onMouseEnter={() => setIsHeaderVisible(true)}
      />
      <div
        className="flex flex-col overflow-hidden bg-background transition-[height] duration-200"
        onMouseEnter={() => setIsHeaderVisible(true)}
        onMouseLeave={() => setIsHeaderVisible(false)}
        style={{ height: isHeaderVisible ? 56 : 0 }}
      >
        {/* Header - expands upward when hovered */}
        <header className="flex shrink-0 items-center gap-2 px-2 py-1.5 md:px-2">
        <SidebarToggle />

        {(!open || windowWidth < 768) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="order-2 ml-auto h-8 px-2 md:order-1 md:ml-0 md:h-fit md:px-2"
                onClick={() => {
                  router.push("/");
                  router.refresh();
                }}
                variant="outline"
                type="button"
              >
                <PlusIcon />
                <span className="md:sr-only">New Chat</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent align="start" className="hidden md:block">
              New Chat
            </TooltipContent>
          </Tooltip>
        )}
        </header>
      </div>
    </div>
  );
}

export const DesmosHeader = memo(PureDesmosHeader);
