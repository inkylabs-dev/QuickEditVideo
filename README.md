# QuickEditVideo — Privacy-first Online Video Editing

QuickEditVideo is a browser-based video editor built with Next.js and MediaBunny. Every tool works 100% in the browser, so your recordings never leave your device.

## 🎯 Key Features

- **Client-only logic** — The entire UI runs on the client so no frames are rendered server-side.
- **MediaBunny-powered processing** — Cut, trim, crop, convert, resize, flip, merge, and extract without FFmpeg dependencies.
- **Extensive toolset** — Trimmer, format converters, audio extractor, frame grabber, cropper, flipper, resizer, watermark editor, and more.
- **Privacy & performance** — No uploads, no accounts, no telemetry, and responsive layout tuned for desktop + mobile.

## 🚀 Quick Start (PNPM)

Make sure [pnpm](https://pnpm.io/) is installed, then:

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000 to preview changes.

## 🏗️ Project Layout

```
├── pages/                  # Next.js routing entry points (_app.tsx, index.tsx, trim.tsx, etc.)
├── src/
│   ├── components/         # Shared UI, layout, and tool widgets
│   ├── constants/           # Tool metadata
│   ├── utils/               # MediaBunny helpers + formatters
│   └── workers/             # (optional) Heavy conversions
├── public/                 # Static assets (icons, analytics scripts)
├── styles/                 # Tailwind globals
├── next.config.mjs         # Next configuration
└── netlify.toml            # Netlify build/deploy hooks
```

## 🧪 Available Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start development server (`localhost:3000`). |
| `pnpm build` | Run package builds and generate production artifacts. |
| `pnpm start` | Serve the production build locally. |
| `pnpm lint` | Run Next.js linting (uses built-in rules). |
| `pnpm run build:packages` | Build local workspace packages that ship with the editor. |
| `pnpm test` | Run the Vitest suite covering formatters and renderer helpers. |

## 🧰 Technology Stack

- **Next.js 14** — React framework with file-system routing.
- **React 18 + TypeScript** — Modern UI logic with strict types.
- **Tailwind CSS** — Utility-first styling for responsive layouts.
- **MediaBunny** — WebAssembly-powered video processing stack (no FFmpeg download).
- **pnpm workspaces** — Local packages `@quickeditvideo/editor` and `@quickeditvideo/kittentts` are built with the app.

## ✅ Migration Notes

- All `FFmpeg` helpers and wasm copy scripts have been removed in favor of MediaBunny.
- Layouts, navigation, and tool pages were rewritten as React components inside `src/components`.
- Every page is forced to run on the client (`'use client'` directives).

## 📦 Deployment

The Netlify configuration now builds the Next.js app and serves from `.next/`. No extra wasm copying is required.

## 🧭 Next Steps

1. Add more blog posts (and static content) by extending `posts/` with Markdown/frontmatter and rerun `node scripts/generate-blog-posts.mjs`.
2. Keep the MediaBunny helpers fresh and documentation up to date with future tools.
3. Run `pnpm test` after adding features to catch regressions in the shared helpers.

## 📚 Blog & Info Pages

- `pages/blog/index.tsx` drives the blog listing that surfaces every entry defined in `src/constants/blogPosts.ts`.
- `pages/blog/[slug].tsx` renders the stored HTML snippets client-side whenever a reader opens a post.
- Static content lives under `pages/about.tsx`, `pages/privacy.tsx`, and `pages/tos.tsx`, which share the same layout props and breadcrumb support as the tools.
