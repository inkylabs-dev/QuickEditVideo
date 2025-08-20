// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import wasm from 'vite-plugin-wasm';
import { resolve } from 'path';

import preact from '@astrojs/preact';

import sitemap from '@astrojs/sitemap';

import partytown from '@astrojs/partytown';

// https://astro.build/config
export default defineConfig({
    site: 'https://quickeditvideo.com',
    integrations: [tailwind(), preact({
        compat: true,
        devtools: true,
    }), sitemap(), partytown()],
    devToolbar: {
        enabled: false,
    },
    vite: {
        plugins: [wasm()],
        resolve: {
            alias: {
                'react': 'preact/compat',
                'react-dom': 'preact/compat',
                '@onnx-wasm': resolve('./node_modules/onnxruntime-web/dist')
            }
        },
        optimizeDeps: {
            exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util', 'onnxruntime-web']
        },
        worker: {
            format: 'es'
        },
        assetsInclude: ['**/*.wasm', '**/*.onnx', '**/voices.json']
    },
    server: {
        headers: {
            'Cross-Origin-Embedder-Policy': 'unsafe-none',
            'Cross-Origin-Opener-Policy': 'unsafe-none'
        }
    }
});
