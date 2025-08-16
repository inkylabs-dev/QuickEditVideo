# QuickEditVideo - Free Online Video Editor

A privacy-focused online video editor that processes videos entirely in your browser using FFmpeg and WebAssembly. No uploads, no signups required.

<https://QuickEditVideo.com>

## 🎬 Features

- **Privacy-First**: All video processing happens in your browser - no uploads
- **No Sign-up Required**: Start editing immediately
- **Multiple Formats**: Supports MP4, WebM, AVI, MOV, MKV
- **Video Trimming**: Cut and trim videos with precision
- **Format Conversion**: Convert between different video formats
- **Audio Extraction**: Extract audio from video files
- **Video Compression**: Reduce file sizes
- **Mobile Responsive**: Works on all devices

## 🚀 Quick Start

### Option 1: Using Nix (Recommended for Development)

If you have [Nix](https://nixos.org/download.html) installed:

```sh
# Clone the repository
git clone https://github.com/inkylabs-dev/QuickEditVideo.git
cd QuickEditVideo

# Enter Nix shell (installs FFmpeg and all dependencies)
nix-shell

# Dependencies are automatically installed, start development
npm run dev
```

The Nix shell provides:
- Node.js 20 and npm
- FFmpeg (required for tests)
- All development tools

### Option 2: Standard Setup

```sh
# Install dependencies
npm install

# Start development server
npm run dev
```

## 🏗️ Development Environment

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src
│   ├── assets
│   │   └── astro.svg
│   ├── components
│   │   └── Welcome.astro
│   ├── layouts
│   │   └── Layout.astro
│   └── pages
│       └── index.astro
└── package.json
```

To learn more about the folder structure of an Astro project, refer to [our guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm test`                | Run unit tests (requires FFmpeg in environment)  |
| `npm run test:unit`       | Run unit tests |
| `npm run test:e2e`        | Run end-to-end tests with Playwright            |
| `npm run copy-ffmpeg`     | Copy FFmpeg.wasm files to public directory      |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

### Testing with FFmpeg

To run tests that require FFmpeg:

```sh
# Using Nix (recommended)
nix-shell
npm test

# Or install FFmpeg manually
# macOS: brew install ffmpeg
# Ubuntu: sudo apt install ffmpeg
# Then run: npm test
```

## 🛠️ Technology Stack

- **Astro 5.12.9**: Static site generator with islands architecture
- **FFmpeg.wasm**: Client-side video processing
- **Tailwind CSS**: Utility-first CSS framework
- **Preact**: Lightweight React alternative for interactivity
- **TypeScript**: Type-safe development

## 📖 Learn More

- [Astro Documentation](https://docs.astro.build)
- [FFmpeg.wasm Documentation](https://ffmpegwasm.netlify.app/)
- [Project GitHub Repository](https://github.com/inkylabs-dev/QuickEditVideo)
