import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import { FFmpegContext, type FFmpegContextType } from "./FFmpegContext";

interface FfmpegProviderProps {
  children: ReactNode;
}

export function FfmpegProvider({ children }: FfmpegProviderProps) {
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  
  // Only create FFmpeg instance in browser
  const ffmpegRef = useRef<FFmpeg | null>(null);
  
  // Initialize FFmpeg instance lazily
  if (typeof window !== 'undefined' && !ffmpegRef.current) {
    ffmpegRef.current = new FFmpeg();
  }

  const load = useCallback(async () => {
    if (typeof window === 'undefined') {
      return; // Don't load during SSR
    }
    
    if (loaded || loading) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    // Add a timeout to prevent infinite loading
    const loadTimeout = setTimeout(() => {
      setError('Loading timeout - FFmpeg failed to load within 30 seconds');
      setLoading(false);
    }, 30000);
    
    try {
      // Ensure FFmpeg instance exists
      if (!ffmpegRef.current) {
        ffmpegRef.current = new FFmpeg();
      }
      
      // Use locally hosted FFmpeg core files
      const ffmpeg = ffmpegRef.current;
      
      ffmpeg.on("log", ({ message }) => {
        setMessage(message);
      });

      ffmpeg.on("progress", (event: any) => {
        if (event.progress >= 0 && event.progress <= 1) {
          const progressPercent = Math.round(event.progress * 100);
          setProgress(progressPercent);
        }
      });

      // Load FFmpeg with core files from public directory
      const baseURL = '/ffmpeg-core';
      
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });
      
      clearTimeout(loadTimeout);
      setLoaded(true);
    } catch (err) {
      clearTimeout(loadTimeout);
      setError(err instanceof Error ? err.message : "Failed to load FFmpeg");
    } finally {
      clearTimeout(loadTimeout);
      setLoading(false);
    }
  }, [loaded, loading, error]);

  // Auto-load FFmpeg when component mounts
  useEffect(() => {
    // Simplified: just call load if we're in the browser and not already loaded
    if (typeof window !== 'undefined' && !loaded) {
      load();
    }
  }, []); // Empty dependency array - only run once on mount

  const writeFile = async (name: string, data: Uint8Array) => {
    if (!loaded || !ffmpegRef.current) throw new Error("FFmpeg not loaded");
    await ffmpegRef.current.writeFile(name, data);
  };

  const readFile = async (name: string): Promise<Uint8Array> => {
    if (!loaded || !ffmpegRef.current) throw new Error("FFmpeg not loaded");
    const fileData = await ffmpegRef.current.readFile(name);
    return new Uint8Array(fileData as unknown as ArrayBuffer);
  };

  const exec = async (args: string[]) => {
    if (!loaded || !ffmpegRef.current) throw new Error("FFmpeg not loaded");
    await ffmpegRef.current.exec(args);
  };

  const contextValue: FFmpegContextType = {
    ffmpeg: ffmpegRef,
    loaded,
    loading,
    isLoaded: loaded,
    isLoading: loading,
    error,
    message,
    progress,
    load,
    writeFile,
    readFile,
    exec,
    setProgress,
  };

  return (
    <FFmpegContext.Provider value={contextValue}>
      {children}
    </FFmpegContext.Provider>
  );
}
