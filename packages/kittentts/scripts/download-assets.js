#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const packagesDir = path.join(__dirname, '..');
const assetsDir = path.join(packagesDir, 'assets');
const distDir = path.join(packagesDir, 'dist');

// Ensure directories exist
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

/**
 * Create embedded assets module
 */
function createEmbeddedAssets() {
  console.log('📦 Creating embedded assets module...');
  
  const modelPath = path.join(assetsDir, 'kitten_tts_nano_v0_1.onnx'); // Downloaded with this name from HF
  const voicesPath = path.join(assetsDir, 'voices.json');
  const outputPath = path.join(packagesDir, 'src', 'embeddedAssets.ts');
  
  let embeddedCode = `/**
 * Embedded KittenTTS assets
 * This file is auto-generated during the build process
 */

`;

  // Embed ONNX model as base64
  if (fs.existsSync(modelPath)) {
    const modelBuffer = fs.readFileSync(modelPath);
    const modelBase64 = modelBuffer.toString('base64');
    
    embeddedCode += `// ONNX Model (${(modelBuffer.length / 1024 / 1024).toFixed(1)} MB)
export const EMBEDDED_MODEL_BASE64 = '${modelBase64}';

export function getEmbeddedModel(): ArrayBuffer {
  const binaryString = atob(EMBEDDED_MODEL_BASE64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

`;
  } else {
    embeddedCode += `// ONNX Model not found during build
export const EMBEDDED_MODEL_BASE64 = '';
export function getEmbeddedModel(): ArrayBuffer {
  throw new Error('ONNX model not embedded. Run build with assets.');
}

`;
  }

  // Embed voices as JSON
  if (fs.existsSync(voicesPath)) {
    const voicesJson = fs.readFileSync(voicesPath, 'utf8');
    embeddedCode += `// Voice Embeddings
export const EMBEDDED_VOICES = ${voicesJson} as const;

`;
  } else {
    embeddedCode += `// Voice embeddings not found during build
export const EMBEDDED_VOICES = {} as const;

`;
  }

  // Add utility functions
  embeddedCode += `// Utility functions
export function hasEmbeddedAssets(): boolean {
  return EMBEDDED_MODEL_BASE64.length > 0 && Object.keys(EMBEDDED_VOICES).length > 0;
}

export function getEmbeddedVoices() {
  return EMBEDDED_VOICES;
}
`;

  fs.writeFileSync(outputPath, embeddedCode);
  console.log('✅ Created embedded assets module');
}

/**
 * Main download and setup function
 */
async function main() {
  console.log('🚀 Setting up KittenTTS embedded assets...');
  
  // Just create embedded assets from existing downloads
  createEmbeddedAssets();

  console.log(`\n🎉 Asset setup completed!`);
  console.log('📦 Embedded assets created in src/embeddedAssets.ts');
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main };