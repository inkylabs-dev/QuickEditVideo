// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

import preact from '@astrojs/preact';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
    site: 'https://quickeditvideo.com',
    integrations: [tailwind(), preact({
        compat: true,
        devtools: true,
    }), sitemap()],
    devToolbar: {
        enabled: false,
    },
    vite: {
        resolve: {
            alias: {
                'react': 'preact/compat',
                'react-dom': 'preact/compat'
            }
        },
        optimizeDeps: {
            exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util']
        },
        worker: {
            format: 'es'
        }
    },
    server: {
        headers: {
            'Cross-Origin-Embedder-Policy': 'require-corp',
            'Cross-Origin-Opener-Policy': 'same-origin'
        }
    }
});
