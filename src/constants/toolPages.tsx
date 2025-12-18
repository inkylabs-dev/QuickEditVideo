import type { FC } from 'react';
import type { LayoutProps } from '../components/Layout';
import AudioExtractor from '../components/AudioExtractor';
import FrameExtractor from '../components/FrameExtractor';
import SrtTextToSpeech from '../components/SrtTextToSpeech';
import TextToSpeech from '../components/TextToSpeech';
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
  (format: 'mp4' | 'mov' | 'webm' | 'mkv', label: string) => () =>
    <VideoConverter targetFormat={format} targetFormatName={label} />;

const TOOL_RENDERERS: Record<string, FC> = {
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
  .filter((tool) => TOOL_RENDERERS[tool.id] && tool.id !== 'trim')
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

export const TOOL_PAGE_RENDERERS = TOOL_RENDERERS;
