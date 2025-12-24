#!/usr/bin/env node

import { downloadFile } from '@huggingface/hub';
import { mkdirSync, existsSync, writeFileSync, readFileSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';
import { load as loadNpy } from 'npyjs';
import { reshape } from 'npyjs/reshape';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MODEL_REPO_ID = 'KittenML/kitten-tts-nano-0.2';

/**
 * Download KittenTTS model files using @huggingface/hub instead of Python CLI
 */
async function downloadModel() {
  const localDir = path.join(__dirname, '..', 'assets');
  
  // Create assets directory if it doesn't exist
  if (!existsSync(localDir)) {
    mkdirSync(localDir, { recursive: true });
  }

  const filesToDownload = [
    'kitten_tts_nano_v0_2.onnx',
    'voices.npz', 
    'config.json'
  ];

  console.log(`Downloading KittenTTS model from ${MODEL_REPO_ID}...`);

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
            repo: MODEL_REPO_ID,
            path: filename,
          });
          
          if (!response) {
            throw new Error(`File ${filename} not found in ${MODEL_REPO_ID}`);
          }

          const arrayBuffer = await response.arrayBuffer();
          writeFileSync(localPath, Buffer.from(arrayBuffer));
        } catch (hubError) {
          console.log(`    @huggingface/hub download failed for ${filename}:`, hubError?.message ?? hubError);
          console.log(`    Falling back to direct fetch for ${filename}...`);
          const url = `https://huggingface.co/${MODEL_REPO_ID}/resolve/main/${filename}`;
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
    const archiveBuffer = readFileSync(npzPath);
    const archive = await JSZip.loadAsync(archiveBuffer);

    const npyEntries = Object.values(archive.files).filter((entry) => {
      return !entry.dir && entry.name.toLowerCase().endsWith('.npy');
    });
    
    if (!npyEntries.length) {
      throw new Error(`No .npy entries found inside ${npzPath}`);
    }

    const jsonData = {};
    
    for (const entry of npyEntries) {
      const arrayBuffer = await entry.async('arraybuffer');
      const { data, shape, dtype, fortranOrder } = await loadNpy(arrayBuffer);
      const nestedArray = reshape(data, shape, fortranOrder);
      const key = path.basename(entry.name, '.npy');
      
      jsonData[key] = nestedArray;
      console.log(`  Converted ${key}: shape [${shape.join(', ')}], dtype ${dtype}`);
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


  embeddedCode += `
// Repo ID
export const MODEL_REPO_ID = '${MODEL_REPO_ID}';
`;

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
