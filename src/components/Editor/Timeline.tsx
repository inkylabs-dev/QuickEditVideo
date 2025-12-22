import { useMemo } from 'react';
import { useElements } from './useEditor';
import type { CompositionTrack } from './compositions/tracks';
import TimelineControls from './TimelineControls';
import { TimelineScrollArea } from './TimelineScrollArea';
import TimelineRuler from './TimelineRuler';

const Timeline = () => {
  const { elements } = useElements();

  const tracks = useMemo(() => {
    const trackMap = new Map<number, CompositionTrack[]>();

    elements.forEach((element) => {
      const trackNumber = element.track;
      if (!trackMap.has(trackNumber)) {
        trackMap.set(trackNumber, []);
      }
      trackMap.get(trackNumber)!.push(element);
    });

    return Array.from(trackMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([trackNumber, trackElements]) => ({
        trackNumber,
        elements: trackElements.sort((a, b) => a.startInFrames - b.startInFrames),
      }));
  }, [elements]);

  return (
    <div className="flex h-full flex-1 flex-col">
      <TimelineControls />
      <div className="flex-1 overflow-hidden">
        <TimelineScrollArea>
          <TimelineRuler />
          <div className="flex h-full flex-1 flex-col gap-4 p-5">
            <div className="flex-1 space-y-3 overflow-hidden">
              {tracks.map(({ trackNumber, elements: trackElements }) => (
                <div key={`track-${trackNumber}`} className="space-y-2">
                  <div className="flex gap-3">
                    {trackElements.map((element) => (
                      <div
                        key={element.id}
                        className="flex-1 rounded-lg border border-gray-200 bg-gradient-to-br from-white to-gray-100 p-3 text-xs font-semibold text-gray-700 shadow-sm"
                      >
                        {element.type} ({element.durationInFrames}f)
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TimelineScrollArea>
      </div>
    </div>
  );
};

export default Timeline;
