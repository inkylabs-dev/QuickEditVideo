import { useCallback } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useElements } from './useEditor';

const TimelineScaleControl = () => {
  const { appState, setAppState } = useElements();
  const scale = (appState.timelineScale as number) || 100;

  const handleScaleChange = useCallback(
    (value: number[]) => {
      setAppState({ ...appState, timelineScale: value[0] });
    },
    [appState, setAppState]
  );

  const handleZoomIn = useCallback(() => {
    const newScale = Math.min(200, scale + 10);
    setAppState({ ...appState, timelineScale: newScale });
  }, [appState, scale, setAppState]);

  const handleZoomOut = useCallback(() => {
    const newScale = Math.max(25, scale - 10);
    setAppState({ ...appState, timelineScale: newScale });
  }, [appState, scale, setAppState]);

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" onClick={handleZoomOut}>
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Slider
        value={[scale]}
        onValueChange={handleScaleChange}
        min={25}
        max={200}
        step={5}
        className="w-24"
      />
      <Button variant="ghost" size="icon" onClick={handleZoomIn}>
        <ZoomIn className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default TimelineScaleControl;
