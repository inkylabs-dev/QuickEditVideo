import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useElements } from './useEditor';

const PLAYBACK_RATE_OPTIONS = ['0.25x', '0.5x', '1x', '1.5x', '2x'];

const TimelinePlaybackRateControl = () => {
  const { appState, setAppState } = useElements();
  const playbackRate = (appState.timelinePlaybackRate as string) || '1x';

  const handlePlaybackRateChange = useCallback(
    (value: string) => {
      setAppState({ ...appState, timelinePlaybackRate: value });
    },
    [appState, setAppState]
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="link" size="sm">
          {playbackRate}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuRadioGroup value={playbackRate} onValueChange={handlePlaybackRateChange}>
          {PLAYBACK_RATE_OPTIONS.map((option) => (
            <DropdownMenuRadioItem key={option} value={option}>
              {option}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TimelinePlaybackRateControl;
