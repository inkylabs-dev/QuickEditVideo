#!/usr/bin/env node

import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

function copyFFmpegFiles() {
  console.log('📦 Copying FFmpeg core files...');
  
  // Ensure destination directory exists
  const destDir = join(projectRoot, 'public', 'ffmpeg-core');
  if (!existsSync(destDir)) {
    mkdirSync(destDir, { recursive: true });
    console.log('✅ Created ffmpeg-core directory');
  }
  
  // Source files
  const sourceDir = join(projectRoot, 'node_modules', '@ffmpeg', 'core', 'dist', 'esm');
  const jsSource = join(sourceDir, 'ffmpeg-core.js');
  const wasmSource = join(sourceDir, 'ffmpeg-core.wasm');
  
  // Destination files
  const jsDest = join(destDir, 'ffmpeg-core.js');
  const wasmDest = join(destDir, 'ffmpeg-core.wasm');
  
  try {
    // Check if source files exist
    if (!existsSync(jsSource)) {
      throw new Error(`FFmpeg core JS file not found at: ${jsSource}`);
    }
    if (!existsSync(wasmSource)) {
      throw new Error(`FFmpeg core WASM file not found at: ${wasmSource}`);
    }
    
    // Copy files
    copyFileSync(jsSource, jsDest);
    console.log('✅ Copied ffmpeg-core.js');
    
    copyFileSync(wasmSource, wasmDest);
    console.log('✅ Copied ffmpeg-core.wasm');
    
    console.log('🎉 FFmpeg core files copied successfully!');
  } catch (error) {
    console.error('❌ Error copying FFmpeg files:', error.message);
    process.exit(1);
  }
}

// Run the function
copyFFmpegFiles();
