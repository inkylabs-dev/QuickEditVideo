#!/usr/bin/env node

import { downloadFile } from '@huggingface/hub';
import { mkdirSync, existsSync, writeFileSync, readFileSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import '@tensorflow/tfjs-node';
import { npz } from 'tfjs-npy-node';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Download KittenTTS model files using @huggingface/hub instead of Python CLI
 */
async function downloadModel() {
  const repoId = 'KittenML/kitten-tts-nano-0.1';
  const localDir = path.join(__dirname, '..', 'assets');
  
  // Create assets directory if it doesn't exist
  if (!existsSync(localDir)) {
    mkdirSync(localDir, { recursive: true });
  }

  const filesToDownload = [
    'kitten_tts_nano_v0_1.onnx',
    'voices.npz', 
    'config.json'
  ];

  console.log(`Downloading KittenTTS model from ${repoId}...`);

  try {
    for (const filename of filesToDownload) {
      const localPath = path.join(localDir, filename);
      
      // Skip if file already exists
      if (existsSync(localPath)) {
        console.log(`✓ ${filename} already exists, skipping...`);
        continue;
      }
      
      console.log(`  Downloading ${filename}...`);
      
      try {
        // Try @huggingface/hub first, fallback to fetch if needed
        try {
          const response = await downloadFile({
            repo: repoId,
            filename: filename,
          });
          
          if (response && response.size > 0) {
            // Write the blob/response to file
            const arrayBuffer = await response.arrayBuffer();
            writeFileSync(localPath, Buffer.from(arrayBuffer));
          } else {
            throw new Error('Empty response from @huggingface/hub');
          }
        } catch (hubError) {
          // Fallback to direct fetch
          console.log(`    Falling back to direct fetch for ${filename}...`);
          const url = `https://huggingface.co/${repoId}/resolve/main/${filename}`;
          const response = await fetch(url);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const buffer = await response.arrayBuffer();
          writeFileSync(localPath, Buffer.from(buffer));
        }
        
        console.log(`  ✓ ${filename} downloaded successfully`);
      } catch (fileError) {
        console.error(`  ✗ Error downloading ${filename}:`, fileError.message);
        throw fileError;
      }
    }
    
    console.log('Model download completed successfully!');
    
    // Convert NPZ voices to JSON
    console.log('\n🔄 Converting voice embeddings...');
    await convertVoicesToJson();
    console.log('✅ Voice embeddings converted successfully!');
    
    // Create embedded assets after successful download and conversion
    console.log('\n🚀 Creating embedded assets...');
    createEmbeddedAssets();
    console.log('🎉 Embedded assets created successfully!');
    
  } catch (error) {
    console.error('Error downloading model:', error);
    process.exit(1);
  }
}

/**
 * Convert NPZ voices file to JSON format for browser use
 */
async function convertVoicesToJson() {
  const assetsDir = path.join(__dirname, '..', 'assets');
  const npzPath = path.join(assetsDir, 'voices.npz');
  const jsonPath = path.join(assetsDir, 'voices.json');
  
  if (!existsSync(npzPath)) {
    throw new Error(`NPZ file not found at ${npzPath}. Download may have failed.`);
  }
  
  if (existsSync(jsonPath)) {
    console.log('  JSON file already exists. Overwriting...');
  }
  
  try {
    // Load NPZ file using tfjs-npy-node
    const npzData = await npz.load(npzPath);
    
    // Convert to JSON-serializable format
    const jsonData = {};
    
    for (const [key, tensor] of Object.entries(npzData)) {
      // Convert tensor to nested array
      const array = await tensor.data();
      const shape = tensor.shape;
      
      // Convert to nested array structure based on shape
      let nestedArray = Array.from(array);
      if (shape.length > 1) {
        // Reshape flat array to match original dimensions
        nestedArray = reshapeArray(Array.from(array), shape);
      }
      
      jsonData[key] = nestedArray;
      console.log(`  Converted ${key}: shape [${shape.join(', ')}], dtype ${tensor.dtype}`);
    }
    
    // Write to JSON file with compact formatting
    writeFileSync(jsonPath, JSON.stringify(jsonData, null, 0));
    
    console.log(`  Successfully converted ${npzPath} to ${jsonPath}`);
    
    // Show file sizes
    const npzSize = statSync(npzPath).size;
    const jsonSize = statSync(jsonPath).size;
    console.log(`  NPZ size: ${(npzSize / 1024).toFixed(1)} KB`);
    console.log(`  JSON size: ${(jsonSize / 1024).toFixed(1)} KB`);
    
    // Print summary
    console.log('\n  Voice data summary:');
    for (const [key, value] of Object.entries(jsonData)) {
      if (Array.isArray(value)) {
        console.log(`    ${key}: ${value.length} elements`);
      } else {
        console.log(`    ${key}: ${typeof value}`);
      }
    }
    
  } catch (error) {
    console.error('Error converting NPZ to JSON:', error);
    throw error;
  }
}

/**
 * Reshape flat array to match original tensor dimensions
 */
function reshapeArray(flatArray, shape) {
  if (shape.length === 1) {
    return flatArray;
  }
  
  const result = [];
  const totalSize = shape.reduce((a, b) => a * b, 1);
  
  if (flatArray.length !== totalSize) {
    throw new Error(`Array size ${flatArray.length} doesn't match shape ${shape.join('x')} = ${totalSize}`);
  }
  
  if (shape.length === 2) {
    const [rows, cols] = shape;
    for (let i = 0; i < rows; i++) {
      result.push(flatArray.slice(i * cols, (i + 1) * cols));
    }
  } else if (shape.length === 3) {
    const [depth, rows, cols] = shape;
    for (let d = 0; d < depth; d++) {
      const plane = [];
      for (let r = 0; r < rows; r++) {
        const rowStart = d * rows * cols + r * cols;
        plane.push(flatArray.slice(rowStart, rowStart + cols));
      }
      result.push(plane);
    }
  } else {
    // For higher dimensions, just return flat array
    return flatArray;
  }
  
  return result;
}

/**
 * Create embedded assets module from downloaded files
 */
function createEmbeddedAssets() {
  console.log('📦 Creating embedded assets module...');
  
  const packagesDir = path.join(__dirname, '..');
  const assetsDir = path.join(packagesDir, 'assets');
  const modelPath = path.join(assetsDir, 'kitten_tts_nano_v0_1.onnx');
  const voicesPath = path.join(assetsDir, 'voices.json');
  const outputPath = path.join(packagesDir, 'src', 'embeddedAssets.ts');
  
  // Ensure src directory exists
  const srcDir = path.join(packagesDir, 'src');
  if (!existsSync(srcDir)) {
    mkdirSync(srcDir, { recursive: true });
  }
  
  let embeddedCode = `/**
 * Embedded KittenTTS assets
 * This file is auto-generated during the build process
 */

`;

  // Embed ONNX model as base64
  if (existsSync(modelPath)) {
    const modelBuffer = readFileSync(modelPath);
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
  if (existsSync(voicesPath)) {
    const voicesJson = readFileSync(voicesPath, 'utf8');
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
}`;

  writeFileSync(outputPath, embeddedCode);
  console.log('✅ Created embedded assets module');
}

// Run if called directly
const isMainModule = import.meta.url.startsWith('file:') && 
  process.argv[1] && 
  import.meta.url.endsWith(process.argv[1]);

if (isMainModule || process.argv[1]?.includes('download-model.js')) {
  downloadModel().catch(console.error);
}

export { downloadModel };