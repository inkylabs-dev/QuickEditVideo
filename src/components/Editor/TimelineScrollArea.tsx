import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

interface TimelineScrollAreaProps {
  children: ReactNode;
}

export const TimelineScrollArea = ({ children }: TimelineScrollAreaProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollElement = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');

    if (!scrollElement) return;

    const handleWheel = (e: WheelEvent) => {
      // If scrolling horizontally (shift+wheel or trackpad horizontal scroll)
      if (Math.abs(e.deltaX) > 0) {
        e.preventDefault();
        scrollElement.scrollLeft += e.deltaX;
      }
    };

    scrollElement.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      scrollElement.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return (
    <div ref={scrollRef} className="h-full">
      <ScrollArea className="h-full w-full">
        {children}
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
