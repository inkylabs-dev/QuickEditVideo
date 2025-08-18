import { createContext, type RefObject } from "preact/compat";
import { FFmpeg } from "@ffmpeg/ffmpeg";

export interface FFmpegContextType {
  ffmpeg: RefObject<FFmpeg | null>;
  loaded: boolean;
  loading: boolean;
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  message: string;
  progress: number;
  load: () => Promise<void>;
  writeFile: (name: string, data: Uint8Array) => Promise<void>;
  readFile: (name: string) => Promise<Uint8Array>;
  exec: (args: string[]) => Promise<void>;
  setProgress: (progress: number) => void;
}

export const FFmpegContext = createContext<FFmpegContextType | null>(null);
