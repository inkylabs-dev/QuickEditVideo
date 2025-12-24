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

    const handleWheel = (e: Event) => {
      // If scrolling horizontally (shift+wheel or trackpad horizontal scroll)
      const wheelEvent = e as WheelEvent;
      if (Math.abs(wheelEvent.deltaX) > 0) {
        wheelEvent.preventDefault();
        scrollElement.scrollLeft += wheelEvent.deltaX;
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
