import { ScrollArea } from "@/components/ui/scroll-area";
import type { ReactNode } from "react";

interface TimelineScrollAreaProps {
  children: ReactNode;
}

export const TimelineScrollArea = ({ children }: TimelineScrollAreaProps) => {
  return (
    <ScrollArea className="h-full w-full">
      {children}
    </ScrollArea>
  );
};
