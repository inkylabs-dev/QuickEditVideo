# QuickEditVideo - Astro Web Application

QuickEditVideo is an Astro 5.12.9 web application for free online video editing. The app provides client-side video trimming using FFmpeg.wasm, ensuring user privacy by processing videos entirely in the browser without server uploads.

**Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Working Effectively

### Bootstrap, Build, and Test the Repository
- `npm install` -- installs dependencies and copies FFmpeg core files. Takes about 60 seconds. NEVER CANCEL. Set timeout to 120+ seconds.
- `npm run copy-ffmpeg` -- copies FFmpeg core files from node_modules to public/ffmpeg-core/. Runs automatically during install, dev, and build.
- `npm run build` -- builds the production application. Takes about 3 seconds. Very fast build process.
- `npm run dev` -- starts development server on http://localhost:4321. Usually ready in under 5 seconds.
- `npm run preview` -- previews the built application. Requires running `npm run build` first.
- `npm run astro` -- access Astro CLI commands. Use `npm run astro -- --help` for available commands.

### Development Workflow
- ALWAYS run `npm install` before starting development in a fresh clone.
- FFmpeg core files are automatically copied to `public/ffmpeg-core/` during install, dev, and build processes.
- ALWAYS run the development server with `npm run dev` for active development.
- ALWAYS build with `npm run build` before testing production behavior or deployment.
- The application is fully functional after these basic steps - no additional setup required.

### Validation Scenarios
- ALWAYS test the core user workflow after making changes:
  1. Navigate to http://localhost:4321/ and verify homepage loads correctly
  2. Click "Start editing" button to navigate to /trim page
  3. Verify the Video Trimmer page loads with proper navigation and interface
  4. Test the Tools dropdown in the navigation menu
- ALWAYS test both development (`npm run dev`) and production preview (`npm run preview`) builds.
- Test mobile responsiveness - the application is designed to work on all devices.

## Project Structure and Key Files

### Repository Root
- `package.json` -- project configuration with Astro 5.12.9, Tailwind CSS, FFmpeg.wasm dependencies
- `astro.config.mjs` -- Astro configuration with Tailwind integration and security headers for WebAssembly
- `tsconfig.json` -- TypeScript configuration extending Astro strict settings
- `tailwind.config.mjs` -- Tailwind CSS configuration
- `netlify.toml` -- deployment configuration with proper CORS headers for FFmpeg.wasm
- `src/` -- source code directory
- `public/` -- static assets (favicon, logo, etc.)
- `dist/` -- build output directory (created by `npm run build`)

### Source Structure (src/)
- `pages/` -- Astro pages (file-based routing)
  - `index.astro` -- homepage with tool links and SEO content
  - `trim.astro` -- video trimmer page with VideoTrimmer component
- `layouts/`
  - `Layout.astro` -- main page layout with navigation, SEO meta tags, and global styles
- `components/`
  - `VideoTrimmer.astro` -- main video editing component using FFmpeg.wasm and Preact
  - `ToolsDropdown.astro` -- navigation dropdown (currently unused)
- `assets/` -- static assets referenced in components

### Key Technologies
- **Astro 5.12.9** -- static site generator with islands architecture
- **TypeScript** -- enabled by default for type safety
- **Tailwind CSS** -- utility-first CSS framework for styling
- **FFmpeg.wasm** -- client-side video processing (loaded from CDN)
- **Preact** -- lightweight React alternative for interactive components
- **Video.js** -- video player functionality
- **MP4Box** -- video manipulation utilities

## Important Implementation Details

### Video Processing Architecture
- Uses FFmpeg.wasm loaded from unpkg.com CDN for client-side video processing
- All video processing happens in the browser - no server uploads
- Supports MP4, WebM, AVI, MOV, MKV formats
- VideoTrimmer component uses Preact for state management and timeline interactions

### Security and Performance
- Cross-Origin-Embedder-Policy and Cross-Origin-Opener-Policy headers configured for WebAssembly
- Content is cached with appropriate headers in production
- No sensitive data handling - all processing is client-side

### Build Process Details
- Static site generation - outputs to `dist/` directory
- Very fast builds (~3 seconds) due to minimal processing required
- No server-side rendering or API routes
- File-based routing: pages in `src/pages/` become routes

## Common Development Tasks

### Adding New Video Tools
- Create new page in `src/pages/` (e.g., `compress.astro`, `convert.astro`)
- Follow the same pattern as `trim.astro` with Layout component
- Update navigation links in `Layout.astro` and `index.astro`
- Implement tool-specific components in `src/components/`

### Modifying Video Processing
- Edit `VideoTrimmer.astro` component
- FFmpeg.wasm integration is in the component's JavaScript section
- Timeline drag-and-drop functionality uses pointer events for cross-device support

### Styling Changes
- Use Tailwind CSS classes throughout the application
- Global styles are in `Layout.astro` at the bottom
- Responsive design is built-in with Tailwind's responsive utilities

### SEO and Meta Tags
- Update meta tags in `Layout.astro` for site-wide changes
- Page-specific SEO is handled in individual page files via Layout props
- Structured data is included in `Layout.astro` for search engines

## Troubleshooting

### Common Issues
- **FFmpeg.wasm loading errors**: Check browser console for CORS errors. CDN dependencies may be blocked in some environments.
- **Build failures**: Usually dependency-related. Run `npm install` to refresh dependencies.
- **Development server issues**: Port 4321 may be in use. Preview server will automatically use 4322 if 4321 is occupied.

### Development Notes
- No linting or formatting scripts are configured - project focuses on core functionality
- TypeScript checking with `npm run astro check` requires additional packages (@astrojs/check, typescript)
- Hot module replacement works automatically in development mode
- Browser developer tools work normally for debugging client-side JavaScript

## Deployment

### Production Builds
- `npm run build` creates optimized static files in `dist/`
- Application is configured for Netlify deployment via `netlify.toml`
- All necessary security headers for WebAssembly are pre-configured
- No server-side dependencies required for hosting

### Environment Requirements
- Node.js environment for building (any recent version)
- Modern web browser for runtime (supports WebAssembly and ES6+ features)
- No database or backend services required

## Performance Expectations

### Build Times
- `npm install`: ~60 seconds (network dependent)
- `npm run build`: ~3 seconds (very fast)
- `npm run dev`: ~5 seconds to start (immediate hot reload after)

### Runtime Performance
- Homepage loads immediately (static content)
- Video trimmer loads quickly, FFmpeg.wasm initialization takes 5-10 seconds
- Video processing time depends on file size and complexity
- All processing is client-side, so performance scales with user's device capabilities

## Testing Strategy

### Manual Testing Scenarios
1. **Homepage Navigation**: Verify homepage loads, tools links work, dropdown functions
2. **Video Upload Flow**: Test video file selection and loading on /trim page
3. **Core Functionality**: Upload a small test video and verify trimming works (requires FFmpeg.wasm to load)
4. **Responsive Design**: Test on different screen sizes using browser dev tools
5. **Cross-browser Compatibility**: Test in Chrome, Firefox, Safari, Edge

### Validation Commands
```bash
# Full development workflow validation
npm install
npm run build
npm run preview
# Open http://localhost:4322/ and test functionality
```

NEVER CANCEL long-running operations. Build times are measured and documented - trust the process and wait for completion.