import type { FC } from 'react';
import type { LayoutProps } from '../components/Layout';
import AudioExtractor from '../components/AudioExtractor';
import CropSeo from '../components/CropSeo';
import ExtractAudioSeo from '../components/ExtractAudioSeo';
import ExtractFrameSeo from '../components/ExtractFrameSeo';
import FrameExtractor from '../components/FrameExtractor';
import FlipSeo from '../components/FlipSeo';
import InfoSeo from '../components/InfoSeo';
import MergeSeo from '../components/MergeSeo';
import ResizeSeo from '../components/ResizeSeo';
import ChangeSpeedSeo from '../components/ChangeSpeedSeo';
import WatermarkSeo from '../components/WatermarkSeo';
import SrtTtsSeo from '../components/SrtTtsSeo';
import SrtTextToSpeech from '../components/SrtTextToSpeech';
import TextToSpeech from '../components/TextToSpeech';
import ToAviSeo from '../components/ToAviSeo';
import ToGifSeo from '../components/ToGifSeo';
import ToMkvSeo from '../components/ToMkvSeo';
import ToMovSeo from '../components/ToMovSeo';
import ToMp4Seo from '../components/ToMp4Seo';
import ToWebmSeo from '../components/ToWebmSeo';
import TrimSeo from '../components/TrimSeo';
import TtsSeo from '../components/TtsSeo';
import VideoCropper from '../components/VideoCropper';
import VideoFlipper from '../components/VideoFlipper';
import VideoInfo from '../components/VideoInfo';
import VideoMerger from '../components/VideoMerger';
import VideoResizer from '../components/VideoResizer';
import VideoSpeed from '../components/VideoSpeed';
import VideoTrimmer from '../components/VideoTrimmer';
import VideoWatermark from '../components/VideoWatermark';
import VideoConverter from '../components/VideoConverter';
import { getAllTools, getToolById, type Tool } from './tools';

const CANONICAL_BASE = 'https://quickeditvideo.com';

const converterRenderer =
  (format: 'mp4' | 'mov' | 'webm' | 'mkv' | 'avi' | 'gif', label: string) => () =>
    <VideoConverter targetFormat={format} targetFormatName={label} />;

const BASE_TOOL_RENDERERS: Record<string, FC> = {
  trim: VideoTrimmer,
  crop: VideoCropper,
  merge: VideoMerger,
  resize: VideoResizer,
  'extract-frame': FrameExtractor,
  'extract-audio': AudioExtractor,
  info: VideoInfo,
  flip: VideoFlipper,
  'change-speed': VideoSpeed,
  watermark: VideoWatermark,
  'tts': TextToSpeech,
  'srt-tts': SrtTextToSpeech,
  'to-mp4': converterRenderer('mp4', 'MP4'),
  'to-mov': converterRenderer('mov', 'MOV'),
  'to-webm': converterRenderer('webm', 'WebM'),
  'to-mkv': converterRenderer('mkv', 'MKV'),
  'to-gif': converterRenderer('gif', 'GIF'),
  'to-avi': converterRenderer('avi', 'AVI'),
};

const TOOL_SEO_COMPONENTS: Record<string, FC> = {
  trim: TrimSeo,
  crop: CropSeo,
  merge: MergeSeo,
  resize: ResizeSeo,
  'extract-frame': ExtractFrameSeo,
  'extract-audio': ExtractAudioSeo,
  info: InfoSeo,
  flip: FlipSeo,
  'change-speed': ChangeSpeedSeo,
  watermark: WatermarkSeo,
  'tts': TtsSeo,
  'srt-tts': SrtTtsSeo,
  'to-mp4': ToMp4Seo,
  'to-mov': ToMovSeo,
  'to-webm': ToWebmSeo,
  'to-mkv': ToMkvSeo,
  'to-gif': ToGifSeo,
  'to-avi': ToAviSeo,
};

const wrapWithSeo = (toolId: string, Renderer: FC): FC => {
  const SeoComponent = TOOL_SEO_COMPONENTS[toolId];
  if (!SeoComponent) return Renderer;
  return () => (
    <>
      <Renderer />
      <SeoComponent />
    </>
  );
};

type ToolPageMeta = {
  id: string;
  layoutProps: LayoutProps;
};

const buildLayoutPropsForTool = (tool: Tool): LayoutProps => {
  const baseUrl = `${CANONICAL_BASE}${tool.url.replace(/\/$/, '')}`;
  return {
    title: `${tool.name} | QuickEditVideo`,
    description: tool.description,
    keywords: `${tool.name.toLowerCase()}, video editor, quickeditvideo, ${tool.category}`,
    ogTitle: tool.name,
    ogDescription: tool.description,
    canonicalUrl: baseUrl,
    currentPage: tool.name,
    showBreadcrumbs: true,
  };
};

const TOOL_PAGE_META: ToolPageMeta[] = getAllTools()
  .filter((tool) => BASE_TOOL_RENDERERS[tool.id] && tool.id !== 'trim')
  .map((tool) => ({
    id: tool.id,
    layoutProps: buildLayoutPropsForTool(tool),
  }));

const TOOL_PAGE_MAP: Record<string, ToolPageMeta> = TOOL_PAGE_META.reduce(
  (acc, meta) => {
    acc[meta.id] = meta;
    return acc;
  },
  {} as Record<string, ToolPageMeta>
);

const TOOL_METADATA = getAllTools();

export const getToolPageMeta = (id: string): ToolPageMeta | undefined => TOOL_PAGE_MAP[id];

export const getAllToolPageIds = (): string[] => TOOL_PAGE_META.map((meta) => meta.id);

export const TOOL_PAGE_RENDERERS: Record<string, FC> = Object.fromEntries(
  Object.entries(BASE_TOOL_RENDERERS).map(([toolId, Renderer]) => [
    toolId,
    wrapWithSeo(toolId, Renderer),
  ]),
);
