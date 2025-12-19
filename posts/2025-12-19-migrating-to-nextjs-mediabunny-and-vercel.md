---
title: "Migrating to Next.js, MediaBunny, and Vercel"
description: "QuickEditVideo now runs on Next.js, MediaBunny, and Vercel for faster loads, smaller bundles, and tighter deployments."
date: "2025-12-19"
author: "QuickEditVideo Team"
tags:
  - migration
  - nextjs
  - mediabunny
  - vercel
  - performance
readingTime: "4 min read"
---

Happy video editing! We wrapped up the year by migrating QuickEditVideo’s core stack so every visitor experiences faster loads, smaller bundles, and more reliable deployments. Here’s what changed:

## Astro → Latest Next.js
After jaren with Astro, we moved the entire site onto the most recent Next.js release. Next.js gives us:

- **Page-speed wins** thanks to improved streaming, an optimized compiler, and the latest <code>app/</code> routing primitives.
- **Experience parity** with the old Astro layout plus better DX because we now share components, styling, and data fetching directly with the rest of the Next ecosystem.
- **Future-proofing** through built-in metrics (Real Experience Monitoring) and incremental adoption of React Server Components, so we can keep iterating without reworking the page structure again.

## FFmpeg → MediaBunny
FFmpeg served us well, but we swapped it for MediaBunny to shrink the JS bundle and speed up every render.

- MediaBunny ships as a smaller, tree-shakeable bundle, so installs download faster and the browser pulls in less code.
- The MediaBunny runtime preprocesses videos in parallel, giving quicker uploads, faster job completion, and lower latency for editors.
- Every editing flow now hits the MediaBunny pipeline, so processing feels snappier while we still deliver the same formats, codecs, and quality presets.

## Netlify → Vercel
We redeployed the project on Vercel to align with the Next.js move.

- Vercel’s edge network mirrors our new Next routes automatically, trimming cold-starter time for every page, preview, and render.
- The Vercel deployment pipeline is wired into the monorepo, so merges spin up preview URLs with the latest FFmpeg → MediaBunny changes instantly.
- Rollbacks and staging deployments now live beside production for quicker troubleshooting, and every incident gets logged to the same platform.

Thanks for being part of the journey. If you spot issues, report them at https://github.com/inkylabs-dev/QuickEditVideo. Happy video editing! 🎬✨
