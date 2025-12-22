import TimelinePlaybackRateControl from './TimelinePlaybackRateControl';
import TimelineProgressControl from './TimelineProgressControl';
import TimelineScaleControl from './TimelineScaleControl';

const TimelineControls = () => {
  return (
    <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
      <TimelinePlaybackRateControl />
      <TimelineProgressControl />
      <TimelineScaleControl />
    </div>
  );
};

export default TimelineControls;
