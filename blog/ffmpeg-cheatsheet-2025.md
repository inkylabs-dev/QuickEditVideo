# FFmpeg Cheatsheet 2025

FFmpeg is the gold standard for video and audio processing in 2025. Whether you're a beginner or a pro, this cheatsheet covers the most useful commands and tips for working with FFmpeg in modern workflows.

---

## Getting Started

- **Check FFmpeg Version:**
  ```sh
  ffmpeg -version
  ```
- **Basic Info About a File:**
  ```sh
  ffmpeg -i input.mp4
  ```

---

## Common Tasks

### Convert Video Format
```sh
ffmpeg -i input.mov output.mp4
```

### Extract Audio from Video
```sh
ffmpeg -i input.mp4 -vn -acodec copy output.aac
```

### Extract Images from Video
```sh
ffmpeg -i input.mp4 -vf fps=1 img%03d.png
```

### Concatenate Videos (Same Codec)
1. Create a text file `list.txt`:
   ```
   file 'part1.mp4'
   file 'part2.mp4'
   file 'part3.mp4'
   ```
2. Run:
   ```sh
   ffmpeg -f concat -safe 0 -i list.txt -c copy output.mp4
   ```

### Merge Audio and Video
```sh
ffmpeg -i video.mp4 -i audio.mp3 -c:v copy -c:a aac -shortest output.mp4
```

### Change Video Speed
- **2x Faster:**
  ```sh
  ffmpeg -i input.mp4 -filter:v "setpts=0.5*PTS" output.mp4
  ```
- **Half Speed:**
  ```sh
  ffmpeg -i input.mp4 -filter:v "setpts=2.0*PTS" output.mp4
  ```

### Change Audio Speed
- **2x Faster:**
  ```sh
  ffmpeg -i input.mp4 -filter:a "atempo=2.0" output.mp4
  ```
- **Half Speed:**
  ```sh
  ffmpeg -i input.mp4 -filter:a "atempo=0.5" output.mp4
  ```

---

## Advanced Tricks

### Loop Video to Match Audio Length
```sh
ffmpeg -stream_loop N -i video.mp4 -i audio.mp3 -shortest -c:v copy -c:a aac output.mp4
```
Replace `N` with the number of loops needed.

### Trim Video
```sh
ffmpeg -ss 00:00:10 -to 00:00:20 -i input.mp4 -c copy trimmed.mp4
```

### Resize Video
```sh
ffmpeg -i input.mp4 -vf scale=1280:720 output.mp4
```

### Add Watermark
```sh
ffmpeg -i input.mp4 -i logo.png -filter_complex "overlay=10:10" output.mp4
```

### Extract Subtitles
```sh
ffmpeg -i input.mkv -map 0:s:0 subs.srt
```

---

## Useful Tips (2025 Edition)

- **WebAssembly:** Use FFmpeg.wasm for browser-based processing.
- **GPU Acceleration:**
  ```sh
  ffmpeg -hwaccel auto -i input.mp4 ...
  ```
- **Show Progress:** Add `-progress pipe:1` for machine-readable progress.
- **Batch Processing:** Use shell loops to process many files.
- **Modern Codecs:** Try AV1 for best compression:
  ```sh
  ffmpeg -i input.mp4 -c:v libaom-av1 output.mkv
  ```

---

## Resources
- [Official FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [FFmpeg Filters Documentation](https://ffmpeg.org/ffmpeg-filters.html)
- [FFmpeg Wiki](https://trac.ffmpeg.org/)

---

Stay productive and creative with FFmpeg in 2025!
