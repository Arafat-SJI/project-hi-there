import { PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LAUNCH_LAB_SIDEBAR_WIDTH } from "../constants";
import { LaunchLabSessionSidebar } from "./LaunchLabSessionSidebar";
import type { ComponentProps } from "react";

type SidebarProps = ComponentProps<typeof LaunchLabSessionSidebar>;

interface LaunchLabSessionsLayoutProps {
  visible: boolean;
  isMobile: boolean;
  onToggle: (open: boolean) => void;
  sidebarProps: Omit<SidebarProps, "className" | "onHide">;
  children: React.ReactNode;
}

export function LaunchLabSessionsTrigger({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      className={cn("shrink-0 gap-1.5", className)}
      aria-label="Show sessions sidebar"
      title="Show sessions"
    >
      <PanelLeft className="h-4 w-4" />
      <span className="sm:inline">Sessions</span>
    </Button>
  );
}

export function LaunchLabSessionsLayout({
  visible,
  isMobile,
  onToggle,
  sidebarProps,
  children,
}: LaunchLabSessionsLayoutProps) {
  return (
    <div className="flex w-full">
      {!isMobile && (
        <div
          className={cn(
            "hidden shrink-0 overflow-hidden transition-[width] duration-200 ease-linear md:block",
            visible ? "border-r border-border" : "border-r border-transparent",
          )}
          style={{ width: visible ? LAUNCH_LAB_SIDEBAR_WIDTH : 0 }}
          aria-hidden={!visible}
        >
          <div
            className={cn(
              "sticky top-0 flex flex-col transition-opacity duration-200 ease-linear",
              visible ? "opacity-100" : "pointer-events-none opacity-0",
            )}
            style={{ width: LAUNCH_LAB_SIDEBAR_WIDTH, height: "calc(100vh - 4rem)" }}
          >
            <LaunchLabSessionSidebar
              {...sidebarProps}
              onHide={() => onToggle(false)}
              className="flex h-full w-full border-0"
            />
          </div>
        </div>
      )}

      <div className="relative flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
